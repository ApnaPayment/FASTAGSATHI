from fastapi import FastAPI, APIRouter, Depends, HTTPException, UploadFile, File, Query, Request, Body
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from jose import jwt, JWTError
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timedelta, timezone
from pathlib import Path
import asyncio, os, uuid, logging, random, shutil, httpx, re, json, hmac, hashlib, base64
from bs4 import BeautifulSoup
from sse_starlette.sse import EventSourceResponse

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
(UPLOAD_DIR / "avatars").mkdir(exist_ok=True)
(UPLOAD_DIR / "gallery").mkdir(exist_ok=True)

# ─── Config ──────────────────────────────────────────────────────────────────

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "apnafastag")
JWT_SECRET = os.environ.get("JWT_SECRET", "sathi-dev-secret-change-in-prod")
ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "sathi-admin-2026")
JWT_ALGORITHM = "HS256"
# When True any 4-digit OTP is accepted (dev / demo mode)
OTP_BYPASS = os.environ.get("OTP_BYPASS", "true").lower() == "true"

# ─── Cashfree config ──────────────────────────────────────────────────────────
CF_APP_ID = os.environ.get("CASHFREE_APP_ID", "")
CF_SECRET_KEY = os.environ.get("CASHFREE_SECRET_KEY", "")
CF_ENV = os.environ.get("CASHFREE_ENV", "sandbox")
CF_BASE = "https://sandbox.cashfree.com/pg" if CF_ENV == "sandbox" else "https://api.cashfree.com/pg"
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8000")

# Use TLS with relaxed cert validation for Atlas on Railway (avoids SSL handshake errors)
_is_atlas = "mongodb+srv://" in MONGO_URL or "mongodb.net" in MONGO_URL
client = AsyncIOMotorClient(
    MONGO_URL,
    tls=True,
    tlsAllowInvalidCertificates=True,
) if _is_atlas else AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Sathi API")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

# ─── SSE subscriber registry ──────────────────────────────────────────────────
# Maps sathi_slug -> list of asyncio.Queue (one per open connection)
sathi_subscribers: dict[str, list[asyncio.Queue]] = {}


async def notify_sathi(slug: str, event_type: str, data: dict):
    """Push a JSON event to all open SSE connections for the given sathi slug."""
    queues = sathi_subscribers.get(slug, [])
    if not queues:
        return
    payload = json.dumps({"type": event_type, "data": data})
    for q in queues:
        await q.put(payload)

# ─── Auth helpers ─────────────────────────────────────────────────────────────

def _make_token(user_id: str, phone: str) -> str:
    exp = datetime.now(timezone.utc) + timedelta(days=30)
    return jwt.encode({"sub": phone, "user_id": user_id, "exp": exp}, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def _optional_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> Optional[dict]:
    if not creds:
        return None
    try:
        return jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

async def _require_user(creds: Optional[HTTPAuthorizationCredentials] = Depends(bearer)) -> dict:
    user = await _optional_user(creds)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user

# ─── Models ───────────────────────────────────────────────────────────────────

class OTPRequestIn(BaseModel):
    phone: str

class OTPVerifyIn(BaseModel):
    phone: str
    otp: str

class UserOut(BaseModel):
    id: str
    phone: str
    name: Optional[str] = None
    email: Optional[str] = None
    created_at: str

class TokenOut(BaseModel):
    token: str
    user: UserOut
    is_new_user: bool = False

class JobCreateIn(BaseModel):
    sathi_slug: str
    issue: str
    vehicle_number: str
    note: Optional[str] = ""

class JobStatusUpdateIn(BaseModel):
    status: Literal["accepted", "in_progress", "resolved", "cancelled"]

class ReviewIn(BaseModel):
    stars: int
    text: str
    speed: Optional[int] = None          # 1–5, optional
    communication: Optional[int] = None  # 1–5, optional
    resolution: Optional[int] = None     # 1–5, optional

class ApplicationStatusIn(BaseModel):
    status: Literal["pending", "reviewing", "approved", "rejected"]
    note: Optional[str] = ""

class ArticleIn(BaseModel):
    slug: str
    title: str
    excerpt: str
    body: str
    category: str = "General"           # Disputes|Balance|KYC|Blacklist|Installation|General
    tags: List[str] = []
    related_bank: Optional[str] = None
    related_state: Optional[str] = None
    meta_description: Optional[str] = None
    meta_keywords: Optional[str] = None
    faq_pairs: List[dict] = []          # [{q: str, a: str}, …]
    cover: Optional[str] = None
    is_published: bool = True
    read_min: int = 4

class SathiApplicationIn(BaseModel):
    phone: str
    name: str
    state: str
    plaza_slug: str
    hours_per_week: int
    languages: List[str]
    bio: Optional[str] = ""
    experience: Optional[str] = ""
    vehicle_types: Optional[List[str]] = []
    services: Optional[List[str]] = ["dispute", "recharge"]
    banks: Optional[List[str]] = []
    active_hours: Optional[dict] = {}
    whatsapp: Optional[str] = ""

class StatusCheckCreate(BaseModel):
    client_name: str

class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ─── Auth routes ──────────────────────────────────────────────────────────────

auth_router = APIRouter(prefix="/auth", tags=["auth"])

@auth_router.post("/request-otp")
async def request_otp(body: OTPRequestIn):
    phone = body.phone.strip()
    if not phone.isdigit() or len(phone) != 10:
        raise HTTPException(status_code=400, detail="Enter a 10-digit Indian mobile number")
    otp = str(random.randint(1000, 9999))
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat()
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"otp": otp, "expires_at": expires_at}},
        upsert=True,
    )
    logger.info(f"[OTP] +91-XXXXXX{phone[-4:]}: {otp}")
    return {"ok": True, "masked": phone[-4:]}

@auth_router.post("/verify-otp", response_model=TokenOut)
async def verify_otp(body: OTPVerifyIn):
    phone = body.phone.strip()
    otp = body.otp.strip()
    if not otp or len(otp) != 4 or not otp.isdigit():
        raise HTTPException(status_code=400, detail="Enter a 4-digit code")

    if not OTP_BYPASS:
        record = await db.otps.find_one({"phone": phone})
        if not record or record["otp"] != otp:
            raise HTTPException(status_code=401, detail="Invalid OTP")
        exp = datetime.fromisoformat(record["expires_at"])
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(status_code=401, detail="OTP expired — request a new one")

    is_new_user = False
    user_doc = await db.users.find_one({"phone": phone}, {"_id": 0})
    if not user_doc:
        is_new_user = True
        user_doc = {
            "id": str(uuid.uuid4()),
            "phone": phone,
            "name": None,
            "email": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one({**user_doc})

    token = _make_token(user_doc["id"], phone)
    return TokenOut(
        token=token,
        user=UserOut(id=user_doc["id"], phone=phone, name=user_doc.get("name"), email=user_doc.get("email"), created_at=user_doc["created_at"]),
        is_new_user=is_new_user or not user_doc.get("name"),
    )

# ─── User routes ──────────────────────────────────────────────────────────────

users_router = APIRouter(prefix="/users", tags=["users"])

@users_router.get("/me", response_model=UserOut)
async def get_me(current: dict = Depends(_require_user)):
    doc = await db.users.find_one({"phone": current["sub"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserOut(id=doc["id"], phone=doc["phone"], name=doc.get("name"), email=doc.get("email"), created_at=doc["created_at"])

@users_router.patch("/me")
async def update_me(body: dict, current: dict = Depends(_require_user)):
    """Update name and/or email for the logged-in user."""
    allowed = {}
    if "name" in body and isinstance(body["name"], str):
        name = body["name"].strip()
        if name:
            allowed["name"] = name
    if "email" in body:
        email = (body["email"] or "").strip().lower()
        allowed["email"] = email if email else None
    if not allowed:
        raise HTTPException(status_code=400, detail="Nothing to update")
    allowed["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.users.update_one({"id": current["user_id"]}, {"$set": allowed})
    doc = await db.users.find_one({"id": current["user_id"]}, {"_id": 0})
    return UserOut(id=doc["id"], phone=doc["phone"], name=doc.get("name"), email=doc.get("email"), created_at=doc["created_at"])

# Google OAuth
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")

@auth_router.post("/google")
async def google_auth(body: dict):
    """Verify Google ID token and return JWT. Creates user if first time."""
    credential = body.get("credential", "")
    if not credential:
        raise HTTPException(status_code=400, detail="Missing Google credential")
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=503, detail="Google login not configured")
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        idinfo = google_id_token.verify_oauth2_token(credential, google_requests.Request(), GOOGLE_CLIENT_ID)
        email = idinfo.get("email", "")
        name  = idinfo.get("name", "")
        if not email:
            raise HTTPException(status_code=400, detail="Google account has no email")
    except Exception as e:
        logger.warning(f"Google token verify failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid Google token")

    is_new_user = False
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        is_new_user = True
        user_doc = {
            "id": str(uuid.uuid4()),
            "phone": "",          # no phone for Google users initially
            "name": name,
            "email": email,
            "google_sub": idinfo.get("sub"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.users.insert_one({**user_doc})
    else:
        # Update name/google_sub if missing
        upd = {}
        if not user_doc.get("name") and name: upd["name"] = name
        if not user_doc.get("google_sub"):    upd["google_sub"] = idinfo.get("sub")
        if upd: await db.users.update_one({"email": email}, {"$set": upd})

    token = _make_token(user_doc["id"], user_doc.get("phone") or email)
    return TokenOut(
        token=token,
        user=UserOut(id=user_doc["id"], phone=user_doc.get("phone",""), name=user_doc.get("name"), email=email, created_at=user_doc["created_at"]),
        is_new_user=is_new_user,
    )

# ─── Sathi routes ─────────────────────────────────────────────────────────────

# ─── FASTag purchase defaults ─────────────────────────────────────────────────

FASTAG_DEFAULT_PRICES: dict = {
    "paytm-fastag": {"price": 499, "security_info": "₹100 refundable security deposit included"},
    "sbi-fastag":   {"price": 599, "security_info": "₹200 refundable security deposit included"},
    "hdfc-fastag":  {"price": 599, "security_info": "₹200 refundable security deposit included"},
    "icici-fastag": {"price": 549, "security_info": "₹200 refundable security deposit included"},
    "axis-fastag":  {"price": 549, "security_info": "₹200 refundable security deposit included"},
    "kotak-fastag": {"price": 549, "security_info": "₹200 refundable security deposit included"},
    "yes-fastag":   {"price": 499, "security_info": "₹100 refundable security deposit included"},
    "idfc-fastag":  {"price": 499, "security_info": "₹100 refundable security deposit included"},
}

FASTAG_VEHICLE_TYPES = ["Car / Jeep / Van", "SUV / MUV", "LCV (Mini-truck)", "Bus", "Truck / HCV", "MAV / Earth Mover", "3-Wheeler", "2-Wheeler"]
FASTAG_STATUSES = ["pending_payment", "paid", "confirmed", "sathi_assigned", "out_for_delivery", "delivered", "activated", "cancelled"]

class FasTagOrderIn(BaseModel):
    bank_slug: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    vehicle_type: str
    vehicle_number: str
    chassis_last6: str
    delivery_address: str
    delivery_city: str
    delivery_state: str
    delivery_pincode: str
    notes: Optional[str] = ""

fastag_router = APIRouter(prefix="/fastag", tags=["fastag"])

@fastag_router.get("/prices")
async def get_fastag_prices():
    """Return per-bank prices (DB overrides default, fallback to hardcoded)."""
    rows = await db.fastag_pricing.find({}, {"_id": 0}).to_list(20)
    db_map = {r["bank_slug"]: r for r in rows}
    result = []
    for slug, defaults in FASTAG_DEFAULT_PRICES.items():
        row = db_map.get(slug, {})
        result.append({
            "bank_slug":     slug,
            "price":         row.get("price",         defaults["price"]),
            "security_info": row.get("security_info", defaults["security_info"]),
            "is_available":  row.get("is_available",  True),
        })
    return result

@fastag_router.post("/orders")
async def create_fastag_order(body: FasTagOrderIn):
    # Validate bank
    if body.bank_slug not in FASTAG_DEFAULT_PRICES:
        raise HTTPException(status_code=400, detail="Invalid bank")

    # Get price
    pricing = await db.fastag_pricing.find_one({"bank_slug": body.bank_slug}, {"_id": 0}) or {}
    price = pricing.get("price", FASTAG_DEFAULT_PRICES[body.bank_slug]["price"])
    if not pricing.get("is_available", True):
        raise HTTPException(status_code=400, detail="This bank FASTag is temporarily unavailable")

    order_id = f"FTO-{str(uuid.uuid4())[:10].upper()}"
    now = datetime.now(timezone.utc).isoformat()

    order = {
        "order_id":         order_id,
        "bank_slug":        body.bank_slug,
        "customer_name":    body.customer_name.strip(),
        "customer_phone":   body.customer_phone.strip(),
        "customer_email":   (body.customer_email or "").strip(),
        "vehicle_type":     body.vehicle_type,
        "vehicle_number":   body.vehicle_number.strip().upper(),
        "chassis_last6":    body.chassis_last6.strip().upper(),
        "delivery_address": body.delivery_address.strip(),
        "delivery_city":    body.delivery_city.strip(),
        "delivery_state":   body.delivery_state.strip(),
        "delivery_pincode": body.delivery_pincode.strip(),
        "notes":            (body.notes or "").strip(),
        "amount":           price,
        "status":           "pending_payment",
        "payment_status":   "pending",
        "sathi_slug":       None,
        "sathi_name":       None,
        "tracking_notes":   "",
        "cashfree_order_id": None,
        "paid_at":          None,
        "created_at":       now,
        "updated_at":       now,
    }
    await db.fastag_orders.insert_one({**order})

    # Create Cashfree payment
    cf_data = await _cf_create_order(
        order_id, price,
        f"ft-{body.customer_phone}",
        body.customer_phone,
        f"/buy-fastag/track?payment_id={order_id}&phone={body.customer_phone}",
    )
    await db.fastag_orders.update_one(
        {"order_id": order_id},
        {"$set": {"cashfree_order_id": cf_data.get("order_id", order_id)}},
    )
    logger.info(f"[FTO] FASTag order {order_id} created for {body.customer_phone}")
    return {
        "order_id":          order_id,
        "payment_session_id": cf_data["payment_session_id"],
        "amount":            price,
    }

@fastag_router.get("/orders/track")
async def track_fastag_order(order_id: str, phone: str):
    doc = await db.fastag_orders.find_one(
        {"order_id": order_id, "customer_phone": phone},
        {"_id": 0, "chassis_last6": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found. Check order ID and phone number.")
    return doc

@fastag_router.get("/orders/verify/{order_id}")
async def verify_fastag_payment(order_id: str, phone: str):
    doc = await db.fastag_orders.find_one(
        {"order_id": order_id, "customer_phone": phone},
        {"_id": 0},
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": doc.get("status"), "payment_status": doc.get("payment_status")}

# ─────────────────────────────────────────────────────────────────────────────
states_router = APIRouter(prefix="/states", tags=["states"])

@states_router.get("")
async def list_states():
    return await db.states.find({}, {"_id": 0}).sort("name", 1).to_list(100)

@states_router.get("/{slug}")
async def get_state(slug: str):
    doc = await db.states.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="State not found")
    return doc

sathis_router = APIRouter(prefix="/sathis", tags=["sathis"])

@sathis_router.get("")
async def list_sathis():
    return await db.sathis.find({}, {"_id": 0}).to_list(1000)

@sathis_router.get("/{slug}")
async def get_sathi(slug: str):
    doc = await db.sathis.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Sathi not found")
    return doc

# ─── Help / Content public routes ────────────────────────────────────────────

help_router = APIRouter(prefix="/help", tags=["help"])

# ─── Public branding endpoint ─────────────────────────────────────────────────

SITE_DEFAULTS: dict = {
    "site_name":        "ApnaFastag",
    "tagline":          "अपना फास्टैग साथी",
    "description":      "India's first real-time, peer-to-peer rescue network for FASTag chaos.",
    "legal_name":       "ApnaFastag Technologies Pvt. Ltd.",
    "founded_year":     "2024",
    "support_email":    "help@apnafastag.com",
    "hiring_email":     "hiring@apnafastag.com",
    "press_email":      "press@apnafastag.com",
    "legal_email":      "legal@apnafastag.com",
    "helpline":         "1800-XXX-XXXX",
    "whatsapp":         "+91 80000 00000",
    "address_line1":    "",
    "address_city":     "Pune",
    "address_state":    "Maharashtra",
    "address_pincode":  "",
    "address_country":  "India",
    "social_instagram": "",
    "social_twitter":   "",
    "social_youtube":   "",
    "social_facebook":  "",
    "social_linkedin":  "",
    "footer_tagline":   "Made with chai on NH-48.",
    "logo_url":         None,
    "favicon_url":      None,
}

@app.get("/api/banks", tags=["banks"])
async def get_public_banks():
    """Return all active banks with their logos — public, no auth required."""
    docs = await db.banks.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return {"banks": docs}

@app.get("/api/branding", tags=["branding"])
async def get_branding():
    """Return all public site settings — logo, contact, social, company info."""
    doc = await db.site_settings.find_one({"key": "branding"}, {"_id": 0, "key": 0, "updated_at": 0})
    result = dict(SITE_DEFAULTS)
    if doc:
        result.update({k: v for k, v in doc.items() if k in SITE_DEFAULTS})
    # Replace base64 data-URLs with proper cacheable HTTP image URLs.
    # The browser caches these like any <img> — they don't bloat API payloads
    # and they can be preloaded in HTML <head> for instant logo rendering.
    # The ?t= timestamp param busts the cache whenever admin re-uploads.
    logo_ts = doc.get("logo_ts", 0) if doc else 0
    fav_ts  = doc.get("favicon_ts", 0) if doc else 0
    result["logo_url"]    = f"{BACKEND_SITE}/api/branding/logo-image?t={logo_ts}"    if result.get("logo_url")    else None
    result["favicon_url"] = f"{BACKEND_SITE}/api/branding/favicon-image?t={fav_ts}" if result.get("favicon_url") else None
    return result

def _serve_branding_image(data_url: str):
    """Decode a stored base64 data-URL and return a FastAPI binary Response."""
    from fastapi.responses import Response as FResponse
    try:
        header, b64data = data_url.split(",", 1)
        content_type = header.split(";")[0].replace("data:", "") or "image/png"
        return FResponse(
            content=base64.b64decode(b64data),
            media_type=content_type,
            headers={
                # Cache 1 hour at the CDN / browser; allow 24h stale-while-revalidate
                "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            },
        )
    except Exception:
        from fastapi.responses import Response as FResponse
        raise HTTPException(status_code=500, detail="Malformed image data")

@app.get("/api/branding/logo-image", tags=["branding"], include_in_schema=False)
async def get_branding_logo():
    """Serve the company logo as a binary image (cached, no base64 bloat)."""
    doc = await db.site_settings.find_one({"key": "branding"}, {"_id": 0, "logo_url": 1})
    if not doc or not doc.get("logo_url"):
        raise HTTPException(status_code=404, detail="No logo uploaded")
    return _serve_branding_image(doc["logo_url"])

@app.get("/api/branding/favicon-image", tags=["branding"], include_in_schema=False)
async def get_branding_favicon():
    """Serve the favicon as a binary image (cached)."""
    doc = await db.site_settings.find_one({"key": "branding"}, {"_id": 0, "favicon_url": 1})
    if not doc or not doc.get("favicon_url"):
        raise HTTPException(status_code=404, detail="No favicon uploaded")
    return _serve_branding_image(doc["favicon_url"])

@help_router.get("")
async def list_help(
    category: Optional[str] = None,
    search:   Optional[str] = None,
    page:     int = 1,
    limit:    int = 20,
):
    query: dict = {"is_published": True}
    if category and category != "all":
        query["category"] = category
    if search:
        import re as _re
        query["$or"] = [
            {"title":   {"$regex": _re.escape(search), "$options": "i"}},
            {"excerpt": {"$regex": _re.escape(search), "$options": "i"}},
        ]
    skip = (max(page, 1) - 1) * limit
    total = await db.articles.count_documents(query)
    docs  = await db.articles.find(query, {"_id": 0, "body": 0}).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "page": page, "limit": limit, "articles": docs}

@help_router.get("/{slug}")
async def get_help_article(slug: str):
    doc = await db.articles.find_one({"slug": slug, "is_published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Article not found")
    return doc

# ─── Plaza routes ─────────────────────────────────────────────────────────────

plazas_router = APIRouter(prefix="/plazas", tags=["plazas"])

@plazas_router.get("")
async def list_plazas(state: Optional[str] = None):
    query = {"state": state} if state else {}
    return await db.plazas.find(query, {"_id": 0}).to_list(1000)

@plazas_router.get("/{slug}")
async def get_plaza(slug: str):
    doc = await db.plazas.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Plaza not found")
    return doc

# ─── Job routes ───────────────────────────────────────────────────────────────

jobs_router = APIRouter(prefix="/jobs", tags=["jobs"])

def _gen_ref(state: str) -> str:
    code = (state or "IN")[:2].upper()
    year = datetime.now().year
    uid = str(uuid.uuid4())[:6].upper()
    return f"DSP-{code}-{year}-{uid}"

@jobs_router.post("")
async def create_job(body: JobCreateIn, current: dict = Depends(_require_user)):
    sathi = await db.sathis.find_one({"slug": body.sathi_slug}, {"_id": 0})
    if not sathi:
        raise HTTPException(status_code=404, detail="Sathi not found")
    now = datetime.now(timezone.utc).isoformat()
    job = {
        "id": str(uuid.uuid4()),
        "ref_code": _gen_ref(sathi.get("state", "IN")),
        "user_id": current["user_id"],
        "user_phone": current["sub"],
        "sathi_slug": body.sathi_slug,
        "sathi_name": sathi["name"],
        "sathi_city": sathi.get("city", ""),
        "sathi_avatar": sathi.get("avatar", ""),
        "issue": body.issue,
        "vehicle_number": body.vehicle_number,
        "note": body.note or "",
        "platform_fee": ISSUE_RATES.get(body.issue, 99),
        "status": "pending",
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "review": None,
    }
    await db.jobs.insert_one({**job})
    # Notify the Sathi in real-time via SSE
    await notify_sathi(body.sathi_slug, "new_job", job)
    return job

# /me must come before /{job_id} so FastAPI doesn't treat "me" as an id
@jobs_router.get("/me")
async def my_jobs(current: dict = Depends(_require_user)):
    return await db.jobs.find(
        {"user_id": current["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)

@jobs_router.get("/ref/{ref_code}")
async def job_by_ref(ref_code: str):
    doc = await db.jobs.find_one({"ref_code": ref_code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No dispute found with this reference number")
    return doc

@jobs_router.get("/{job_id}")
async def get_job(job_id: str, current: dict = Depends(_require_user)):
    doc = await db.jobs.find_one({"id": job_id, "user_id": current["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    return doc

@jobs_router.patch("/{job_id}/status")
async def update_job_status(job_id: str, body: JobStatusUpdateIn, current: dict = Depends(_require_user)):
    doc = await db.jobs.find_one({"id": job_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    now = datetime.now(timezone.utc).isoformat()
    update: dict = {"status": body.status, "updated_at": now}
    if body.status == "resolved":
        update["resolved_at"] = now
    await db.jobs.update_one({"id": job_id}, {"$set": update})
    return {**doc, **update}

@jobs_router.post("/{job_id}/review")
async def submit_review(job_id: str, body: ReviewIn, current: dict = Depends(_require_user)):
    doc = await db.jobs.find_one({"id": job_id, "user_id": current["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Job not found")
    if doc["status"] != "resolved":
        raise HTTPException(status_code=400, detail="Can only review a resolved job")
    stars = max(1, min(5, body.stars))
    def _clamp_sub(val):
        return max(1, min(5, val)) if val is not None else None
    speed         = _clamp_sub(body.speed)
    communication = _clamp_sub(body.communication)
    resolution    = _clamp_sub(body.resolution)

    review = {
        "stars": stars,
        "text": body.text,
        "date": datetime.now().strftime("%b %d · %Y"),
    }
    if speed is not None:         review["speed"] = speed
    if communication is not None: review["communication"] = communication
    if resolution is not None:    review["resolution"] = resolution

    await db.jobs.update_one({"id": job_id}, {"$set": {"review": review}})

    # Propagate review to the Sathi document so it appears on their public profile
    user = await db.users.find_one({"user_id": current["user_id"]}, {"_id": 0, "phone": 1, "name": 1})
    phone = (user or {}).get("phone", "")
    author = (user or {}).get("name") or (f"User ••{phone[-4:]}" if len(phone) >= 4 else "Anonymous")
    review_pub = {**review, "author": author}
    await db.sathis.update_one(
        {"slug": doc["sathi_slug"]},
        {"$push": {"reviews": {"$each": [review_pub], "$position": 0, "$slice": 50}}}
    )
    # Recompute aggregate rating and sub-scores from all reviewed jobs for this Sathi
    agg = await db.jobs.aggregate([
        {"$match": {"sathi_slug": doc["sathi_slug"], "review": {"$ne": None}}},
        {"$group": {
            "_id":       None,
            "avg":       {"$avg": "$review.stars"},
            "count":     {"$sum": 1},
            "avg_speed": {"$avg": "$review.speed"},
            "avg_comm":  {"$avg": "$review.communication"},
            "avg_res":   {"$avg": "$review.resolution"},
        }},
    ]).to_list(1)
    if agg:
        row = agg[0]
        upd = {"rating": round(row["avg"], 1), "reviewCount": row["count"]}
        if row["avg_speed"] is not None: upd["avg_speed"] = round(row["avg_speed"], 1)
        if row["avg_comm"]  is not None: upd["avg_communication"] = round(row["avg_comm"], 1)
        if row["avg_res"]   is not None: upd["avg_resolution"] = round(row["avg_res"], 1)
        await db.sathis.update_one({"slug": doc["sathi_slug"]}, {"$set": upd})

    return {"ok": True}


class PublicReviewIn(BaseModel):
    stars: int
    text: str
    speed: Optional[int] = None
    communication: Optional[int] = None
    resolution: Optional[int] = None

@sathis_router.post("/{slug}/review", dependencies=[Depends(_require_user)])
async def submit_public_review(slug: str, body: PublicReviewIn, current: dict = Depends(_require_user)):
    """Any logged-in customer can leave one review per Sathi from their profile page."""
    sathi = await db.sathis.find_one({"slug": slug}, {"_id": 0, "reviews": 1})
    if not sathi:
        raise HTTPException(status_code=404, detail="Sathi not found")

    # One review per user per Sathi
    existing = await db.sathis.find_one(
        {"slug": slug, "reviews.user_id": current["user_id"]}, {"_id": 1}
    )
    if existing:
        raise HTTPException(status_code=409, detail="You have already reviewed this Sathi")

    stars = max(1, min(5, body.stars))
    def _clamp(v): return max(1, min(5, v)) if v is not None else None

    review = {
        "user_id": current["user_id"],
        "stars": stars,
        "text": body.text.strip(),
        "date": datetime.now().strftime("%b %d · %Y"),
    }
    if body.speed         is not None: review["speed"]         = _clamp(body.speed)
    if body.communication is not None: review["communication"] = _clamp(body.communication)
    if body.resolution    is not None: review["resolution"]    = _clamp(body.resolution)

    # Resolve author name
    user = await db.users.find_one({"user_id": current["user_id"]}, {"_id": 0, "phone": 1, "name": 1})
    phone = (user or {}).get("phone", "")
    author = (user or {}).get("name") or (f"User ••{phone[-4:]}" if len(phone) >= 4 else "Anonymous")
    review_pub = {**review, "author": author}

    await db.sathis.update_one(
        {"slug": slug},
        {"$push": {"reviews": {"$each": [review_pub], "$position": 0, "$slice": 50}}}
    )

    # Recompute rating from all reviews stored on the sathi doc
    agg = await db.sathis.aggregate([
        {"$match": {"slug": slug}},
        {"$unwind": "$reviews"},
        {"$group": {
            "_id": None,
            "avg":       {"$avg": "$reviews.stars"},
            "count":     {"$sum": 1},
            "avg_speed": {"$avg": "$reviews.speed"},
            "avg_comm":  {"$avg": "$reviews.communication"},
            "avg_res":   {"$avg": "$reviews.resolution"},
        }},
    ]).to_list(1)
    if agg:
        row = agg[0]
        upd = {"rating": round(row["avg"], 1), "reviewCount": row["count"]}
        if row.get("avg_speed") is not None: upd["avg_speed"]         = round(row["avg_speed"], 1)
        if row.get("avg_comm")  is not None: upd["avg_communication"] = round(row["avg_comm"],  1)
        if row.get("avg_res")   is not None: upd["avg_resolution"]    = round(row["avg_res"],   1)
        await db.sathis.update_one({"slug": slug}, {"$set": upd})

    return {"ok": True}

# ─── Admin / seed ─────────────────────────────────────────────────────────────

from fastapi import Header as FHeader

async def _check_admin(x_admin_secret: Optional[str] = FHeader(default=None)) -> None:
    if x_admin_secret != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")

AdminDep = Depends(_check_admin)

admin_router = APIRouter(prefix="/admin", tags=["admin"])

SATHI_SEED = [
    {
        "slug": "ravi-shinde-khalapur", "name": "Ravi Shinde", "city": "Khalapur", "state": "maharashtra",
        "homePlaza": "khalapur-nh48", "lat": 18.812, "lng": 73.274,
        "avatar": "https://images.unsplash.com/photo-1632999863880-034c5f73c779?w=400&q=70",
        "verified": True, "premium": True, "rating": 4.9, "reviewCount": 412, "jobsResolved": 1180,
        "avg_speed": 4.8, "avg_communication": 4.7, "avg_resolution": 4.9,
        "avgResponseSec": 78, "languages": ["Marathi", "Hindi", "English"],
        "services": ["dispute", "kyc", "recharge", "sos"],
        "banks": ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
        "bio": "Born and raised next to NH-48. Spent 6 years as a toll lane supervisor at Khalapur before going independent. Specialises in mischarge reversal and night-time SOS.",
        "activeHours": {"mon": "5am-11pm", "tue": "5am-11pm", "wed": "5am-11pm", "thu": "5am-11pm", "fri": "5am-12am", "sat": "5am-12am", "sun": "6am-10pm"},
        "contact": {"phone": "+91 98XXX XX012", "whatsapp": "+91 98XXX XX012"},
        "reviews": [
            {"author": "Suresh K.", "date": "Jan 11 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 5, "text": "₹450 mischarge reversed in 4 minutes. Ravi bhai literally walked into the plaza office with me."},
            {"author": "Anjali T.", "date": "Jan 02 · 2026", "stars": 5, "text": "Was stuck at 11pm with tag not reading. Sathi reached in 90 seconds, swapped me to manual lane, handled bank later."},
            {"author": "Trucker AS Logistics", "date": "Dec 28 · 2025", "stars": 4, "text": "Helped with KYC re-verification. Took 2 days but resolved. Honest about timeline."},
        ],
    },
    {
        "slug": "anil-bhau-lonavla", "name": "Anil Bhau", "city": "Lonavla", "state": "maharashtra",
        "homePlaza": "lonavla-nh48", "lat": 18.752, "lng": 73.413,
        "avatar": "https://images.unsplash.com/photo-1695395860103-38d172403a46?w=400&q=70",
        "verified": True, "premium": False, "rating": 4.8, "reviewCount": 287, "jobsResolved": 690,
        "avg_speed": 4.6, "avg_communication": 4.9, "avg_resolution": 4.7,
        "avgResponseSec": 102, "languages": ["Marathi", "Hindi"],
        "services": ["dispute", "recharge", "sos"],
        "banks": ["sbi-fastag", "paytm-fastag", "hdfc-fastag"],
        "bio": "Tea-stall owner outside Lonavla Plaza for 12 years. Knows every plaza supervisor on first-name basis. Best for stuck trucks and lane reroutes.",
        "activeHours": {"mon": "6am-10pm", "tue": "6am-10pm", "wed": "6am-10pm", "thu": "6am-10pm", "fri": "6am-10pm", "sat": "6am-11pm", "sun": "Off"},
        "contact": {"phone": "+91 99XXX XX341", "whatsapp": "+91 99XXX XX341"},
        "reviews": [
            {"author": "Priya N.", "date": "Jan 08 · 2026", "stars": 5, "speed": 4, "communication": 5, "resolution": 5, "text": "Truck driver husband had FASTag fail on Saturday night. Anil bhau was the only one who picked up and fixed it."},
            {"author": "Sandeep G.", "date": "Dec 19 · 2025", "stars": 5, "text": "Recharge was failing at the plaza. Sathi did UPI on the spot and got us moving."},
        ],
    },
    {
        "slug": "priya-pawar-vashi", "name": "Priya Pawar", "city": "Vashi", "state": "maharashtra",
        "homePlaza": "vashi-mmrda", "lat": 19.072, "lng": 73.002,
        "avatar": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=70",
        "verified": True, "premium": True, "rating": 5.0, "reviewCount": 156, "jobsResolved": 412,
        "avg_speed": 4.9, "avg_communication": 5.0, "avg_resolution": 5.0,
        "avgResponseSec": 64, "languages": ["Marathi", "Hindi", "English"],
        "services": ["dispute", "kyc", "recharge"],
        "banks": ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag"],
        "bio": "Ex-bank operations executive who switched to Sathi work to be closer to home. Goes deep on bank-side escalations and class-mismatch disputes.",
        "activeHours": {"mon": "9am-7pm", "tue": "9am-7pm", "wed": "9am-7pm", "thu": "9am-7pm", "fri": "9am-7pm", "sat": "10am-4pm", "sun": "Off"},
        "contact": {"phone": "+91 97XXX XX204", "whatsapp": "+91 97XXX XX204"},
        "reviews": [
            {"author": "Rohan M.", "date": "Jan 05 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 5, "text": "Car was being charged as LCV — Priya got the class-correction approved in 2 visits. Saved me ₹3,200/month on commute."},
            {"author": "Fleet Op", "date": "Dec 22 · 2025", "stars": 5, "text": "Handled 18 disputes for our fleet in one week. Professional, fast."},
        ],
    },
    {
        "slug": "vikram-sharma-manesar", "name": "Vikram Sharma", "city": "Manesar", "state": "haryana",
        "homePlaza": "manesar-nh48", "lat": 28.362, "lng": 76.942,
        "avatar": "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=70",
        "verified": True, "premium": True, "rating": 4.7, "reviewCount": 340, "jobsResolved": 980,
        "avg_speed": 4.5, "avg_communication": 4.8, "avg_resolution": 4.7,
        "avgResponseSec": 88, "languages": ["Hindi", "English", "Haryanvi"],
        "services": ["dispute", "kyc", "recharge", "sos"],
        "banks": ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
        "bio": "Was an Uber driver on NH-48 corridor for 5 years. Knows where every bank office is between Manesar and Jaipur. SOS specialist.",
        "activeHours": {"mon": "5am-12am", "tue": "5am-12am", "wed": "5am-12am", "thu": "5am-12am", "fri": "5am-12am", "sat": "5am-12am", "sun": "5am-12am"},
        "contact": {"phone": "+91 98XXX XX771", "whatsapp": "+91 98XXX XX771"},
        "reviews": [
            {"author": "Manmeet K.", "date": "Jan 10 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 4, "text": "Was stranded at 2am with FASTag blacklisted. Vikram bhai came within 8 minutes."},
            {"author": "Aman G.", "date": "Dec 30 · 2025", "stars": 4, "text": "Solid. Took longer than expected for NHAI escalation but kept me updated."},
        ],
    },
    {
        "slug": "lakshmi-iyer-bengaluru", "name": "Lakshmi Iyer", "city": "Bengaluru", "state": "karnataka",
        "homePlaza": "electronic-city-nh44", "lat": 12.842, "lng": 77.663,
        "avatar": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=70",
        "verified": True, "premium": False, "rating": 4.8, "reviewCount": 198, "jobsResolved": 521,
        "avg_speed": 4.7, "avg_communication": 5.0, "avg_resolution": 4.8,
        "avgResponseSec": 92, "languages": ["Kannada", "Tamil", "English", "Hindi"],
        "services": ["dispute", "kyc", "recharge"],
        "banks": ["sbi-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
        "bio": "Bilingual tech-graduate who runs Sathi services part-time. Best for digital-first commuters who want WhatsApp updates throughout.",
        "activeHours": {"mon": "7am-9pm", "tue": "7am-9pm", "wed": "7am-9pm", "thu": "7am-9pm", "fri": "7am-9pm", "sat": "8am-2pm", "sun": "Off"},
        "contact": {"phone": "+91 99XXX XX842", "whatsapp": "+91 99XXX XX842"},
        "reviews": [{"author": "Karthik R.", "date": "Jan 12 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 5, "text": "Resolved the mischarge over WhatsApp without me even leaving the car."}],
    },
    {
        "slug": "rajesh-kumar-zirakpur", "name": "Rajesh Kumar", "city": "Zirakpur", "state": "haryana",
        "homePlaza": "zirakpur-nh44", "lat": 30.642, "lng": 76.823,
        "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70",
        "verified": True, "premium": False, "rating": 4.6, "reviewCount": 121, "jobsResolved": 290,
        "avg_speed": 4.3, "avg_communication": 4.6, "avg_resolution": 4.9,
        "avgResponseSec": 134, "languages": ["Punjabi", "Hindi", "English"],
        "services": ["dispute", "recharge", "sos"],
        "banks": ["sbi-fastag", "paytm-fastag", "icici-fastag"],
        "bio": "Truck mechanic by day, Sathi at night. Best for vehicle-related FASTag issues (RC mismatch, class disputes).",
        "activeHours": {"mon": "10am-9pm", "tue": "10am-9pm", "wed": "10am-9pm", "thu": "10am-9pm", "fri": "10am-9pm", "sat": "10am-9pm", "sun": "11am-6pm"},
        "contact": {"phone": "+91 98XXX XX509", "whatsapp": "+91 98XXX XX509"},
        "reviews": [{"author": "Jaspreet S.", "date": "Dec 27 · 2025", "stars": 5, "speed": 4, "communication": 5, "resolution": 5, "text": "Helped reverse RC mismatch which two other Sathis had given up on."}],
    },
    {
        "slug": "sanjana-rao-athur", "name": "Sanjana Rao", "city": "Athur", "state": "tamil-nadu",
        "homePlaza": "athur-nh44", "lat": 12.592, "lng": 77.943,
        "avatar": "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=70",
        "verified": True, "premium": False, "rating": 4.9, "reviewCount": 87, "jobsResolved": 198,
        "avg_speed": 4.8, "avg_communication": 4.9, "avg_resolution": 4.9,
        "avgResponseSec": 78, "languages": ["Tamil", "English", "Kannada"],
        "services": ["dispute", "kyc"],
        "banks": ["sbi-fastag", "icici-fastag", "hdfc-fastag"],
        "bio": "College senior who works Sathi shifts to fund engineering. Detail-oriented; ideal for KYC paperwork that needs a steady hand.",
        "activeHours": {"mon": "4pm-10pm", "tue": "4pm-10pm", "wed": "4pm-10pm", "thu": "4pm-10pm", "fri": "4pm-11pm", "sat": "10am-10pm", "sun": "11am-8pm"},
        "contact": {"phone": "+91 99XXX XX330", "whatsapp": "+91 99XXX XX330"},
        "reviews": [{"author": "Murugan S.", "date": "Jan 04 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 5, "text": "Patient. Explained the process in Tamil, paperwork was correct first try."}],
    },
    {
        "slug": "deepak-patel-vadodara", "name": "Deepak Patel", "city": "Vadodara", "state": "gujarat",
        "homePlaza": "vadodara-nh48", "lat": 22.302, "lng": 73.203,
        "avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=70",
        "verified": True, "premium": True, "rating": 4.8, "reviewCount": 264, "jobsResolved": 712,
        "avg_speed": 4.8, "avg_communication": 4.9, "avg_resolution": 4.8,
        "avgResponseSec": 71, "languages": ["Gujarati", "Hindi", "English"],
        "services": ["dispute", "kyc", "recharge", "sos"],
        "banks": ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
        "bio": "Senior Sathi covering Vadodara-Bharuch corridor. Trained 18 other Sathis. Goes hard on fleet-grade disputes.",
        "activeHours": {"mon": "6am-10pm", "tue": "6am-10pm", "wed": "6am-10pm", "thu": "6am-10pm", "fri": "6am-10pm", "sat": "6am-10pm", "sun": "7am-6pm"},
        "contact": {"phone": "+91 98XXX XX918", "whatsapp": "+91 98XXX XX918"},
        "reviews": [{"author": "Bharat T.", "date": "Jan 07 · 2026", "stars": 5, "speed": 5, "communication": 5, "resolution": 5, "text": "Fleet of 22 trucks. Deepak ji handles all our disputes. Reliable."}],
    },
]

PLAZA_SEED = [
    {"slug": "khalapur-nh48",        "name": "Khalapur Plaza",        "highway": "NH-48", "state": "maharashtra", "city": "Khalapur",  "lat": 18.81, "lng": 73.27, "carRate": 95,  "truckRate": 410, "monthlyComplaints": 1240, "avgWait": "4 min", "topIssue": "Mischarge double-deduction"},
    {"slug": "vashi-mmrda",           "name": "Vashi MMRDA Plaza",     "highway": "MMRDA", "state": "maharashtra", "city": "Vashi",     "lat": 19.07, "lng": 73.00, "carRate": 45,  "truckRate": 175, "monthlyComplaints": 890,  "avgWait": "3 min", "topIssue": "Tag not reading"},
    {"slug": "lonavla-nh48",          "name": "Lonavla Plaza",         "highway": "NH-48", "state": "maharashtra", "city": "Lonavla",   "lat": 18.75, "lng": 73.41, "carRate": 95,  "truckRate": 410, "monthlyComplaints": 760,  "avgWait": "5 min", "topIssue": "Low balance failure"},
    {"slug": "manesar-nh48",          "name": "Manesar Plaza",         "highway": "NH-48", "state": "haryana",     "city": "Manesar",   "lat": 28.36, "lng": 76.94, "carRate": 85,  "truckRate": 380, "monthlyComplaints": 1430, "avgWait": "6 min", "topIssue": "Tag blacklisted"},
    {"slug": "kherki-daula-nh48",     "name": "Kherki Daula Plaza",    "highway": "NH-48", "state": "haryana",     "city": "Gurugram",  "lat": 28.39, "lng": 76.93, "carRate": 27,  "truckRate": 145, "monthlyComplaints": 1180, "avgWait": "5 min", "topIssue": "Mischarge"},
    {"slug": "zirakpur-nh44",         "name": "Zirakpur Plaza",        "highway": "NH-44", "state": "haryana",     "city": "Zirakpur",  "lat": 30.64, "lng": 76.82, "carRate": 110, "truckRate": 480, "monthlyComplaints": 540,  "avgWait": "4 min", "topIssue": "Recharge failure"},
    {"slug": "athur-nh44",            "name": "Athur Plaza",           "highway": "NH-44", "state": "tamil-nadu",  "city": "Athur",     "lat": 12.59, "lng": 77.94, "carRate": 75,  "truckRate": 320, "monthlyComplaints": 410,  "avgWait": "3 min", "topIssue": "Tag not reading"},
    {"slug": "electronic-city-nh44",  "name": "Electronic City Plaza", "highway": "NH-44", "state": "karnataka",   "city": "Bengaluru", "lat": 12.84, "lng": 77.66, "carRate": 40,  "truckRate": 165, "monthlyComplaints": 680,  "avgWait": "4 min", "topIssue": "Mischarge"},
    {"slug": "vadodara-nh48",         "name": "Vadodara Plaza",        "highway": "NH-48", "state": "gujarat",     "city": "Vadodara",  "lat": 22.30, "lng": 73.20, "carRate": 95,  "truckRate": 410, "monthlyComplaints": 380,  "avgWait": "3 min", "topIssue": "KYC pending"},
    {"slug": "palwal-nh19",           "name": "Palwal Plaza",          "highway": "NH-19", "state": "haryana",     "city": "Palwal",    "lat": 28.14, "lng": 77.33, "carRate": 85,  "truckRate": 380, "monthlyComplaints": 510,  "avgWait": "5 min", "topIssue": "Tag blacklisted"},
]

@admin_router.post("/login")
async def admin_login(body: dict):
    if body.get("secret") != ADMIN_SECRET:
        raise HTTPException(status_code=403, detail="Invalid admin secret")
    return {"ok": True, "secret": ADMIN_SECRET}

@admin_router.get("/stats", dependencies=[Depends(_check_admin)])
async def admin_stats():
    users_count = await db.users.count_documents({})
    sathis_count = await db.sathis.count_documents({})
    jobs_count = await db.jobs.count_documents({})
    apps_count = await db.sathi_applications.count_documents({})
    pending_apps = await db.sathi_applications.count_documents({"status": "pending"})
    pending_jobs = await db.jobs.count_documents({"status": "pending"})
    active_jobs = await db.jobs.count_documents({"status": {"$in": ["accepted", "in_progress"]}})
    resolved_jobs = await db.jobs.count_documents({"status": "resolved"})
    plazas_count = await db.plazas.count_documents({})
    states_count = await db.states.count_documents({})
    return {
        "users": users_count,
        "sathis": sathis_count,
        "jobs": jobs_count,
        "applications": apps_count,
        "pending_applications": pending_apps,
        "pending_jobs": pending_jobs,
        "active_jobs": active_jobs,
        "resolved_jobs": resolved_jobs,
        "plazas": plazas_count,
        "states": states_count,
    }

@admin_router.get("/applications", dependencies=[Depends(_check_admin)])
async def admin_list_applications(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 25,
):
    limit = min(limit, 100)
    skip = (max(page, 1) - 1) * limit

    query: dict = {}
    if status:
        query["status"] = status
    if search:
        pattern = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [{"name": pattern}, {"phone": pattern}, {"ref": pattern}]

    total = await db.sathi_applications.count_documents(query)
    apps = await db.sathi_applications.find(query, {"_id": 0}).sort("submitted_at", -1).skip(skip).limit(limit).to_list(limit)

    for a in apps:
        if "admin_note" in a:
            a["note"] = a.pop("admin_note")
        if a.get("status") == "approved":
            sathi = await db.sathis.find_one({"application_ref": a["ref"]}, {"_id": 0, "slug": 1})
            if sathi:
                a["sathi_slug"] = sathi["slug"]

    return {"items": apps, "total": total, "page": page, "pages": max(1, -(-total // limit))}

@admin_router.patch("/applications/{ref}/status", dependencies=[Depends(_check_admin)])
async def admin_update_application(ref: str, body: ApplicationStatusIn):
    app = await db.sathi_applications.find_one({"ref": ref}, {"_id": 0})
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    await db.sathi_applications.update_one(
        {"ref": ref},
        {"$set": {"status": body.status, "admin_note": body.note, "reviewed_at": datetime.now(timezone.utc).isoformat()}},
    )

    if body.status == "approved":
        import re as _re
        name = app["name"]
        slug_base = _re.sub(r"[^a-z0-9]+", "-", name.lower().strip()).strip("-")
        slug = f"{slug_base}-{app['state'][:3]}"
        # Ensure slug is unique
        existing = await db.sathis.find_one({"slug": slug})
        if existing and existing.get("registered_phone") != app["phone"]:
            slug = f"{slug}-{str(uuid.uuid4())[:4]}"

        whatsapp = app.get("whatsapp") or app["phone"]
        plaza = await db.plazas.find_one({"slug": app["plaza_slug"]}, {"_id": 0, "lat": 1, "lng": 1, "name": 1})
        sathi_lat = plaza["lat"] if plaza and plaza.get("lat") else 0.0
        sathi_lng = plaza["lng"] if plaza and plaza.get("lng") else 0.0
        sathi_doc = {
            "slug":             slug,
            "name":             name,
            "city":             (plaza and plaza.get("name")) or app.get("plaza_name", app["state"]),
            "state":            app["state"],
            "homePlaza":        app["plaza_slug"],
            "languages":        app.get("languages", []),
            "services":         app.get("services") or ["dispute", "recharge"],
            "banks":            app.get("banks") or [],
            "bio":              app.get("bio") or app.get("experience") or f"Sathi covering {app.get('plaza_name', app['state'])}.",
            "verified":         False,
            "premium":          False,
            "is_available":     False,
            "rating":           0.0,
            "reviewCount":      0,
            "jobsResolved":     0,
            "avgResponseSec":   0,
            "registered_phone": app["phone"],
            "avatar":           "",
            "lat":              sathi_lat,
            "lng":              sathi_lng,
            "activeHours":      app.get("active_hours") or {},
            "contact":          {"phone": app["phone"], "whatsapp": whatsapp},
            "reviews":          [],
            "vehicle_types":    app.get("vehicle_types") or [],
            "hours_per_week":   app.get("hours_per_week", 0),
            "application_ref":  ref,
            "joined_at":        datetime.now(timezone.utc).isoformat(),
        }
        await db.sathis.update_one(
            {"registered_phone": app["phone"]},
            {"$set": sathi_doc},
            upsert=True,
        )
        logger.info(f"Created Sathi profile for {name} ({slug}) from application {ref}")

    return {"ok": True}

@admin_router.get("/jobs", dependencies=[Depends(_check_admin)])
async def admin_list_jobs(status: Optional[str] = None):
    query = {"status": status} if status else {}
    jobs = await db.jobs.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return jobs

@admin_router.get("/sathis", dependencies=[Depends(_check_admin)])
async def admin_list_sathis():
    sathis = await db.sathis.find({}, {"_id": 0}).sort("name", 1).to_list(500)
    return sathis

@admin_router.get("/sathis/{slug}/stats", dependencies=[Depends(_check_admin)])
async def admin_sathi_stats(slug: str):
    sathi = await db.sathis.find_one({"slug": slug}, {"_id": 0})
    if not sathi:
        raise HTTPException(status_code=404, detail="Sathi not found")
    return await _build_sathi_stats(slug, sathi)

@admin_router.patch("/sathis/{slug}/verified", dependencies=[Depends(_check_admin)])
async def admin_toggle_verified(slug: str, body: dict):
    await db.sathis.update_one({"slug": slug}, {"$set": {"verified": body.get("verified", True)}})
    return {"ok": True}

@admin_router.post("/sathis/backfill-coords", dependencies=[Depends(_check_admin)])
async def admin_backfill_coords():
    sathis = await db.sathis.find({"$or": [{"lat": 0}, {"lat": 0.0}, {"lat": {"$exists": False}}]}, {"_id": 0, "slug": 1, "homePlaza": 1}).to_list(500)
    updated = 0
    for s in sathis:
        plaza = await db.plazas.find_one({"slug": s.get("homePlaza")}, {"_id": 0, "lat": 1, "lng": 1})
        if plaza and plaza.get("lat"):
            await db.sathis.update_one({"slug": s["slug"]}, {"$set": {"lat": plaza["lat"], "lng": plaza["lng"]}})
            updated += 1
    return {"ok": True, "updated": updated}

# ─── Promo code admin ─────────────────────────────────────────────────────────

class PromoCodeIn(BaseModel):
    code: str
    label: str = ""
    discount_type: Literal["flat", "percent"]
    discount_value: float
    applicable_services: List[str] = []
    applicable_user_phones: List[str] = []
    max_uses: int = 0
    valid_until: Optional[str] = None

@admin_router.get("/promo-codes", dependencies=[Depends(_check_admin)])
async def list_promo_codes():
    return await db.promo_codes.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)

@admin_router.post("/promo-codes", dependencies=[Depends(_check_admin)])
async def create_promo_code(body: PromoCodeIn):
    code = body.code.strip().upper()
    if not code:
        raise HTTPException(status_code=400, detail="Code is required")
    existing = await db.promo_codes.find_one({"code": code})
    if existing:
        raise HTTPException(status_code=409, detail="Promo code already exists")
    doc = {
        "code": code,
        "label": body.label.strip(),
        "discount_type": body.discount_type,
        "discount_value": body.discount_value,
        "applicable_services": body.applicable_services,
        "applicable_user_phones": [p.strip() for p in body.applicable_user_phones if p.strip()],
        "max_uses": body.max_uses,
        "used_count": 0,
        "valid_until": body.valid_until,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.promo_codes.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@admin_router.patch("/promo-codes/{code}/toggle", dependencies=[Depends(_check_admin)])
async def toggle_promo_code(code: str):
    doc = await db.promo_codes.find_one({"code": code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Promo code not found")
    new_state = not doc["is_active"]
    await db.promo_codes.update_one({"code": code.upper()}, {"$set": {"is_active": new_state}})
    return {"code": code.upper(), "is_active": new_state}

@admin_router.delete("/promo-codes/{code}", dependencies=[Depends(_check_admin)])
async def delete_promo_code(code: str):
    result = await db.promo_codes.delete_one({"code": code.upper()})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Promo code not found")
    return {"ok": True}

@admin_router.get("/settlements", dependencies=[Depends(_check_admin)])
async def admin_settlements():
    pipeline = [
        {"$match": {"status": "resolved"}},
        {"$group": {
            "_id": "$sathi_slug",
            "resolved_jobs":      {"$sum": 1},
            "gross_earnings":     {"$sum": "$platform_fee"},
            "platform_commission":{"$sum": "$sathi_platform_fee"},
            "net_earnings":       {"$sum": {"$subtract": ["$platform_fee", "$sathi_platform_fee"]}},
            "last_job_at":        {"$max": "$updated_at"},
        }},
        {"$sort": {"net_earnings": -1}},
    ]
    rows = await db.jobs.aggregate(pipeline).to_list(500)
    slugs = [r["_id"] for r in rows if r["_id"]]
    sathis = {s["slug"]: s for s in await db.sathis.find(
        {"slug": {"$in": slugs}}, {"_id": 0, "slug": 1, "name": 1, "registered_phone": 1}
    ).to_list(500)}
    result = []
    for r in rows:
        s = sathis.get(r["_id"], {})
        result.append({
            "sathi_slug":         r["_id"],
            "sathi_name":         s.get("name", r["_id"] or "—"),
            "phone":              s.get("registered_phone") or "—",
            "resolved_jobs":      r["resolved_jobs"],
            "gross_earnings":     round(r["gross_earnings"] or 0, 2),
            "platform_commission":round(r["platform_commission"] or 0, 2),
            "net_earnings":       round(r["net_earnings"] or 0, 2),
            "last_job_at":        r["last_job_at"],
        })
    return result

# ─── Admin: Plaza Management ─────────────────────────────────────────────────

class PlazaIn(BaseModel):
    slug: Optional[str] = None
    name: str
    highway: str
    state: str
    city: str
    lat: float
    lng: float
    carRate: Optional[int] = None
    truckRate: Optional[int] = None
    monthlyComplaints: Optional[int] = 0
    avgWait: Optional[str] = None
    topIssue: Optional[str] = None

@admin_router.get("/plazas", dependencies=[Depends(_check_admin)])
async def admin_list_plazas(q: Optional[str] = None, state: Optional[str] = None, skip: int = 0, limit: int = 100):
    filt = {}
    if state:
        filt["state"] = state
    if q:
        filt["$or"] = [
            {"name":    {"$regex": q, "$options": "i"}},
            {"city":    {"$regex": q, "$options": "i"}},
            {"highway": {"$regex": q, "$options": "i"}},
        ]
    total = await db.plazas.count_documents(filt)
    docs = await db.plazas.find(filt, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "plazas": docs}

@admin_router.post("/plazas", dependencies=[Depends(_check_admin)])
async def admin_create_plaza(body: PlazaIn):
    slug = body.slug or re.sub(r"[^a-z0-9]+", "-", body.name.lower()).strip("-")
    doc = body.model_dump()
    doc["slug"] = slug
    existing = await db.plazas.find_one({"slug": slug})
    if existing:
        raise HTTPException(400, "Plaza with this slug already exists")
    await db.plazas.insert_one({**doc, "_id": str(uuid.uuid4())})
    await db.plazas.update_one({"slug": slug}, {"$unset": {"_id": ""}})
    return {"ok": True, "slug": slug}

@admin_router.patch("/plazas/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_plaza(slug: str, body: dict):
    body.pop("slug", None); body.pop("_id", None)
    res = await db.plazas.update_one({"slug": slug}, {"$set": body})
    if res.matched_count == 0:
        raise HTTPException(404, "Plaza not found")
    return {"ok": True}

@admin_router.delete("/plazas/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_plaza(slug: str):
    res = await db.plazas.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "Plaza not found")
    return {"ok": True}

@admin_router.post("/plazas/import", dependencies=[Depends(_check_admin)])
async def admin_import_plazas(plazas: List[dict]):
    """Bulk upsert plaza list. Each item must have at least name, state, city, lat, lng."""
    imported = skipped = 0
    for p in plazas:
        if not p.get("name") or p.get("lat") is None or p.get("lng") is None:
            skipped += 1
            continue
        slug = p.get("slug") or re.sub(r"[^a-z0-9]+", "-", p["name"].lower()).strip("-")
        p["slug"] = slug
        await db.plazas.update_one({"slug": slug}, {"$set": p}, upsert=True)
        imported += 1
    return {"ok": True, "imported": imported, "skipped": skipped}

@admin_router.get("/plazas/stats", dependencies=[Depends(_check_admin)])
async def admin_plaza_stats():
    total = await db.plazas.count_documents({})
    by_state = await db.plazas.aggregate([
        {"$group": {"_id": "$state", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
    ]).to_list(50)
    by_highway = await db.plazas.aggregate([
        {"$group": {"_id": "$highway", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]).to_list(10)
    return {"total": total, "by_state": by_state, "by_highway": by_highway}

# ─── Admin: State Management ──────────────────────────────────────────────────

class StateIn(BaseModel):
    slug: str
    name: str
    plazaCount: int = 0
    sathiCount: int = 0
    highways: List[str] = []

@admin_router.get("/states", dependencies=[Depends(_check_admin)])
async def admin_list_states(q: Optional[str] = None, skip: int = 0, limit: int = 100):
    filt: dict = {}
    if q:
        filt["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"slug": {"$regex": q, "$options": "i"}}]
    total = await db.states.count_documents(filt)
    docs = await db.states.find(filt, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "states": docs}

@admin_router.post("/states", dependencies=[Depends(_check_admin)])
async def admin_create_state(body: StateIn):
    if await db.states.find_one({"slug": body.slug}):
        raise HTTPException(400, "Slug already exists")
    doc = body.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.states.insert_one({**doc, "_id": str(uuid.uuid4())})
    return {"ok": True, "slug": body.slug}

@admin_router.patch("/states/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_state(slug: str, body: dict):
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.states.update_one({"slug": slug}, {"$set": body})
    return {"ok": True}

@admin_router.delete("/states/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_state(slug: str):
    res = await db.states.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "State not found")
    return {"ok": True}

@admin_router.post("/states/import", dependencies=[Depends(_check_admin)])
async def admin_import_states(states: List[dict]):
    imported = skipped = 0
    for s in states:
        if not s.get("name") or not s.get("slug"):
            slug = re.sub(r"[^a-z0-9]+", "-", (s.get("name") or "").lower()).strip("-")
            if not slug:
                skipped += 1
                continue
            s["slug"] = slug
        s["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.states.update_one({"slug": s["slug"]}, {"$set": s}, upsert=True)
        imported += 1
    return {"ok": True, "imported": imported, "skipped": skipped}

# ─── Admin: Highway Management ────────────────────────────────────────────────

class HighwayIn(BaseModel):
    slug: str
    name: str
    fullName: str
    length: Optional[str] = None
    states: List[str] = []
    plazaCount: int = 0
    desc: Optional[str] = None
    is_active: bool = True

@admin_router.get("/highways", dependencies=[Depends(_check_admin)])
async def admin_list_highways(q: Optional[str] = None, skip: int = 0, limit: int = 100):
    filt: dict = {}
    if q:
        filt["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"fullName": {"$regex": q, "$options": "i"}}]
    total = await db.highways.count_documents(filt)
    docs = await db.highways.find(filt, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "highways": docs}

@admin_router.post("/highways", dependencies=[Depends(_check_admin)])
async def admin_create_highway(body: HighwayIn):
    if await db.highways.find_one({"slug": body.slug}):
        raise HTTPException(400, "Slug already exists")
    doc = body.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.highways.insert_one({**doc, "_id": str(uuid.uuid4())})
    return {"ok": True, "slug": body.slug}

@admin_router.patch("/highways/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_highway(slug: str, body: dict):
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.highways.update_one({"slug": slug}, {"$set": body})
    return {"ok": True}

@admin_router.delete("/highways/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_highway(slug: str):
    res = await db.highways.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "Highway not found")
    return {"ok": True}

@admin_router.post("/highways/import", dependencies=[Depends(_check_admin)])
async def admin_import_highways(highways: List[dict]):
    imported = skipped = 0
    for h in highways:
        if not h.get("name"):
            skipped += 1
            continue
        if not h.get("slug"):
            h["slug"] = re.sub(r"[^a-z0-9]+", "-", h["name"].lower()).strip("-")
        h["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.highways.update_one({"slug": h["slug"]}, {"$set": h}, upsert=True)
        imported += 1
    return {"ok": True, "imported": imported, "skipped": skipped}

# ─── Admin: City Management ───────────────────────────────────────────────────

class CityIn(BaseModel):
    slug: str
    name: str
    state: str
    plazaCount: int = 0
    sathiCount: int = 0

@admin_router.get("/cities", dependencies=[Depends(_check_admin)])
async def admin_list_cities(q: Optional[str] = None, state: Optional[str] = None, skip: int = 0, limit: int = 100):
    filt: dict = {}
    if q:
        filt["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"state": {"$regex": q, "$options": "i"}}]
    if state:
        filt["state"] = {"$regex": state, "$options": "i"}
    total = await db.cities.count_documents(filt)
    docs = await db.cities.find(filt, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "cities": docs}

@admin_router.post("/cities", dependencies=[Depends(_check_admin)])
async def admin_create_city(body: CityIn):
    if await db.cities.find_one({"slug": body.slug}):
        raise HTTPException(400, "Slug already exists")
    doc = body.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.cities.insert_one({**doc, "_id": str(uuid.uuid4())})
    return {"ok": True, "slug": body.slug}

@admin_router.patch("/cities/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_city(slug: str, body: dict):
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.cities.update_one({"slug": slug}, {"$set": body})
    return {"ok": True}

@admin_router.delete("/cities/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_city(slug: str):
    res = await db.cities.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "City not found")
    return {"ok": True}

@admin_router.post("/cities/import", dependencies=[Depends(_check_admin)])
async def admin_import_cities(cities: List[dict]):
    imported = skipped = 0
    for c in cities:
        if not c.get("name") or not c.get("state"):
            skipped += 1
            continue
        if not c.get("slug"):
            c["slug"] = re.sub(r"[^a-z0-9]+", "-", c["name"].lower()).strip("-")
        c["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.cities.update_one({"slug": c["slug"]}, {"$set": c}, upsert=True)
        imported += 1
    return {"ok": True, "imported": imported, "skipped": skipped}

# ─── Admin: Bank Management ───────────────────────────────────────────────────

class BankIn(BaseModel):
    slug: str
    name: str
    shortName: str
    color: Optional[str] = None
    logo: Optional[str] = None
    smsCode: Optional[str] = None
    helpline: Optional[str] = None
    marketShare: Optional[int] = None
    is_active: bool = True

@admin_router.get("/banks", dependencies=[Depends(_check_admin)])
async def admin_list_banks(q: Optional[str] = None, skip: int = 0, limit: int = 100):
    filt: dict = {}
    if q:
        filt["$or"] = [{"name": {"$regex": q, "$options": "i"}}, {"shortName": {"$regex": q, "$options": "i"}}]
    total = await db.banks.count_documents(filt)
    docs = await db.banks.find(filt, {"_id": 0}).sort("name", 1).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "banks": docs}

@admin_router.post("/banks", dependencies=[Depends(_check_admin)])
async def admin_create_bank(body: BankIn):
    if await db.banks.find_one({"slug": body.slug}):
        raise HTTPException(400, "Slug already exists")
    doc = body.dict()
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.banks.insert_one({**doc, "_id": str(uuid.uuid4())})
    return {"ok": True, "slug": body.slug}

@admin_router.patch("/banks/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_bank(slug: str, body: dict):
    body.pop("_id", None)
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.banks.update_one({"slug": slug}, {"$set": body})
    return {"ok": True}

@admin_router.delete("/banks/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_bank(slug: str):
    res = await db.banks.delete_one({"slug": slug})
    if res.deleted_count == 0:
        raise HTTPException(404, "Bank not found")
    return {"ok": True}

@admin_router.post("/banks/{slug}/upload-logo", dependencies=[Depends(_check_admin)])
async def admin_upload_bank_logo(slug: str, file: UploadFile = File(...)):
    """Upload a logo image for a bank. Stored as base64 data URL in db.banks."""
    bank = await db.banks.find_one({"slug": slug})
    if not bank:
        raise HTTPException(404, "Bank not found")

    ext = Path(file.filename).suffix.lower() if file.filename else ""
    ALLOWED = {".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg"}
    if ext not in ALLOWED:
        raise HTTPException(400, "Only SVG, PNG, or JPG allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(400, "Empty file")
    if len(contents) > 1 * 1024 * 1024:
        raise HTTPException(400, "Logo must be under 1 MB")

    content_type = ALLOWED[ext]

    if ext != ".svg":
        try:
            from PIL import Image
            import io as _io
            img = Image.open(_io.BytesIO(contents))
            img.thumbnail((200, 200), Image.LANCZOS)
            buf = _io.BytesIO()
            pil_fmt = "JPEG" if ext in {".jpg", ".jpeg"} else "PNG"
            save_kw = {"optimize": True, "quality": 90} if pil_fmt == "JPEG" else {"optimize": True}
            img.save(buf, format=pil_fmt, **save_kw)
            final_bytes = buf.getvalue()
        except Exception as e:
            logger.warning(f"Bank logo resize failed ({e}), storing as-is")
            final_bytes = contents
    else:
        final_bytes = contents

    data_url = f"data:{content_type};base64," + base64.b64encode(final_bytes).decode()
    await db.banks.update_one(
        {"slug": slug},
        {"$set": {"logo": data_url, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    logger.info(f"Bank logo uploaded for {slug} — {ext}, {len(final_bytes):,} bytes")
    return {"ok": True, "logo": data_url}

@admin_router.delete("/banks/{slug}/logo", dependencies=[Depends(_check_admin)])
async def admin_delete_bank_logo(slug: str):
    """Remove a bank's uploaded logo (reverts to colored badge)."""
    await db.banks.update_one({"slug": slug}, {"$unset": {"logo": ""}})
    return {"ok": True}

@admin_router.post("/banks/import", dependencies=[Depends(_check_admin)])
async def admin_import_banks(banks: List[dict]):
    imported = skipped = 0
    for b in banks:
        if not b.get("name") or not b.get("shortName"):
            skipped += 1
            continue
        if not b.get("slug"):
            b["slug"] = re.sub(r"[^a-z0-9]+", "-", b["name"].lower()).strip("-") + "-fastag"
        b["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.banks.update_one({"slug": b["slug"]}, {"$set": b}, upsert=True)
        imported += 1
    return {"ok": True, "imported": imported, "skipped": skipped}

# ─── Admin: Sitemap Stats ─────────────────────────────────────────────────────

@admin_router.get("/sitemap-stats", dependencies=[Depends(_check_admin)])
async def admin_sitemap_stats():
    """Return URL counts per sitemap category for the admin sitemap overview."""
    plazas_count     = await db.plazas.count_documents({})
    states_count     = await db.states.count_documents({})
    highways_count   = await db.highways.count_documents({})
    cities_count     = await db.cities.count_documents({})
    banks_count      = await db.banks.count_documents({})
    sathis_count     = await db.sathis.count_documents({})
    articles_count   = await db.articles.count_documents({"is_published": True})
    static_count     = 16
    return {
        "categories": [
            {"key": "static",   "label": "Static pages",   "count": static_count,   "url": "/sitemap-static.xml",   "priority": "0.8–1.0", "changefreq": "daily/monthly"},
            {"key": "plazas",   "label": "Toll plazas",    "count": plazas_count,   "url": "/sitemap-plazas.xml",   "priority": "0.85",    "changefreq": "weekly"},
            {"key": "states",   "label": "States",         "count": states_count,   "url": "/sitemap-states.xml",   "priority": "0.70",    "changefreq": "monthly"},
            {"key": "banks",    "label": "Banks",          "count": banks_count,    "url": "/sitemap-banks.xml",    "priority": "0.80",    "changefreq": "monthly"},
            {"key": "highways", "label": "Highways",       "count": highways_count, "url": "/sitemap-highways.xml", "priority": "0.75",    "changefreq": "monthly"},
            {"key": "cities",   "label": "Cities",         "count": cities_count,   "url": "/sitemap-cities.xml",   "priority": "0.75",    "changefreq": "monthly"},
            {"key": "help",     "label": "Help articles",  "count": articles_count, "url": "/sitemap-help.xml",     "priority": "0.70",    "changefreq": "monthly"},
            {"key": "sathis",   "label": "Sathi profiles", "count": sathis_count,   "url": "/sitemap-sathis.xml",   "priority": "0.80",    "changefreq": "weekly"},
        ],
        "total": plazas_count + states_count + highways_count + cities_count + banks_count + sathis_count + articles_count + static_count,
        "index_url": "/sitemap.xml",
    }

# ─── Public: Highways / Cities / Banks ────────────────────────────────────────

@api.get("/highways")
async def list_highways():
    docs = await db.highways.find({"is_active": {"$ne": False}}, {"_id": 0}).sort("name", 1).to_list(100)
    return docs

@api.get("/highways/{slug}")
async def get_highway(slug: str):
    doc = await db.highways.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Highway not found")
    return doc

@api.get("/cities")
async def list_cities():
    docs = await db.cities.find({}, {"_id": 0}).sort("name", 1).to_list(200)
    return docs

@api.get("/cities/{slug}")
async def get_city(slug: str):
    doc = await db.cities.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "City not found")
    return doc

@api.get("/banks")
async def list_banks():
    docs = await db.banks.find({"is_active": {"$ne": False}}, {"_id": 0}).sort("name", 1).to_list(50)
    return docs

@api.get("/banks/{slug}")
async def get_bank(slug: str):
    doc = await db.banks.find_one({"slug": slug}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Bank not found")
    return doc

@admin_router.post("/cleanup-uploads", dependencies=[Depends(_check_admin)])
async def cleanup_stale_uploads():
    """Remove file-path avatars and gallery URLs left over from the old filesystem-based storage."""
    import re
    pattern = re.compile(r"^/uploads/|^https?://[^/]+/uploads/")
    # Clear stale avatars (file-path → empty string)
    avatar_result = await db.sathis.update_many(
        {"avatar": {"$regex": "(^/uploads/|/uploads/)"}},
        {"$set": {"avatar": ""}}
    )
    # Pull stale gallery entries (file-path URLs) from every sathi
    sathis = await db.sathis.find({}, {"_id": 0, "slug": 1, "gallery": 1}).to_list(None)
    gallery_cleaned = 0
    for s in sathis:
        stale = [u for u in (s.get("gallery") or []) if u and pattern.search(u)]
        if stale:
            await db.sathis.update_one(
                {"slug": s["slug"]},
                {"$pull": {"gallery": {"$in": stale}}}
            )
            gallery_cleaned += len(stale)
    logger.info(f"cleanup-uploads: {avatar_result.modified_count} avatars cleared, {gallery_cleaned} gallery items removed")
    return {
        "ok": True,
        "avatars_cleared": avatar_result.modified_count,
        "gallery_items_removed": gallery_cleaned,
    }

# ─── Admin: Article CRUD ──────────────────────────────────────────────────────

@admin_router.get("/articles", dependencies=[Depends(_check_admin)])
async def admin_list_articles(
    category: Optional[str] = None,
    search:   Optional[str] = None,
    page:     int = 1,
    limit:    int = 50,
):
    query: dict = {}
    if category and category != "all":
        query["category"] = category
    if search:
        import re as _re
        query["$or"] = [
            {"title":   {"$regex": _re.escape(search), "$options": "i"}},
            {"excerpt": {"$regex": _re.escape(search), "$options": "i"}},
        ]
    skip = (max(page, 1) - 1) * limit
    total = await db.articles.count_documents(query)
    docs  = await db.articles.find(query, {"_id": 0, "body": 0}).sort(
        "created_at", -1
    ).skip(skip).limit(limit).to_list(limit)
    return {"total": total, "page": page, "limit": limit, "articles": docs}

@admin_router.post("/articles", dependencies=[Depends(_check_admin)])
async def admin_create_article(body: ArticleIn):
    slug = body.slug.strip().lower()
    if not slug:
        raise HTTPException(status_code=400, detail="Slug is required")
    existing = await db.articles.find_one({"slug": slug})
    if existing:
        raise HTTPException(status_code=409, detail="Article with this slug already exists")
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        **body.dict(),
        "slug": slug,
        "meta_description": body.meta_description or body.excerpt[:155],
        "created_at": now,
        "updated_at": now,
    }
    await db.articles.insert_one(doc)
    doc.pop("_id", None)
    return doc

@admin_router.patch("/articles/{slug}", dependencies=[Depends(_check_admin)])
async def admin_update_article(slug: str, body: dict):
    body.pop("_id", None)
    body.pop("slug", None)           # slug is immutable after creation
    body["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.articles.update_one({"slug": slug}, {"$set": body})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"ok": True}

@admin_router.delete("/articles/{slug}", dependencies=[Depends(_check_admin)])
async def admin_delete_article(slug: str):
    result = await db.articles.delete_one({"slug": slug})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Article not found")
    return {"ok": True}

@admin_router.post("/seed-articles", dependencies=[Depends(_check_admin)])
async def seed_articles_endpoint():
    count = await _seed_articles()
    return {"ok": True, "upserted": count}

# ─── Admin: FASTag orders ─────────────────────────────────────────────────────

@admin_router.get("/fastag-orders", dependencies=[Depends(_check_admin)])
async def admin_list_fastag_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
):
    query: dict = {}
    if status and status != "all":
        query["status"] = status
    if search:
        r = re.compile(search, re.IGNORECASE)
        query["$or"] = [{"order_id": r}, {"customer_phone": r}, {"customer_name": r}, {"vehicle_number": r}]
    skip = (page - 1) * limit
    total = await db.fastag_orders.count_documents(query)
    rows = await db.fastag_orders.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return {"orders": rows, "total": total, "page": page, "pages": max(1, -(-total // limit))}

@admin_router.patch("/fastag-orders/{order_id}", dependencies=[Depends(_check_admin)])
async def admin_update_fastag_order(order_id: str, data: dict = Body(...)):
    allowed = {"status", "sathi_slug", "sathi_name", "tracking_notes"}
    update = {k: v for k, v in data.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.fastag_orders.update_one({"order_id": order_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"ok": True}

@admin_router.get("/fastag-orders/stats", dependencies=[Depends(_check_admin)])
async def admin_fastag_order_stats():
    pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}, "revenue": {"$sum": "$amount"}}},
    ]
    rows = await db.fastag_orders.aggregate(pipeline).to_list(20)
    total_orders = sum(r["count"] for r in rows)
    total_revenue = sum(r["revenue"] for r in rows if r["_id"] not in ("pending_payment", "cancelled"))
    by_status = {r["_id"]: r["count"] for r in rows}
    return {"total_orders": total_orders, "total_revenue": total_revenue, "by_status": by_status}

# ─── Admin: FASTag pricing ────────────────────────────────────────────────────

@admin_router.get("/fastag-prices", dependencies=[Depends(_check_admin)])
async def admin_get_fastag_prices():
    rows = await db.fastag_pricing.find({}, {"_id": 0}).to_list(20)
    db_map = {r["bank_slug"]: r for r in rows}
    result = []
    for slug, defaults in FASTAG_DEFAULT_PRICES.items():
        row = db_map.get(slug, {})
        result.append({
            "bank_slug":     slug,
            "price":         row.get("price",         defaults["price"]),
            "security_info": row.get("security_info", defaults["security_info"]),
            "is_available":  row.get("is_available",  True),
        })
    return result

@admin_router.patch("/fastag-prices/{bank_slug}", dependencies=[Depends(_check_admin)])
async def admin_update_fastag_price(bank_slug: str, data: dict = Body(...)):
    if bank_slug not in FASTAG_DEFAULT_PRICES:
        raise HTTPException(status_code=404, detail="Unknown bank slug")
    allowed = {"price", "security_info", "is_available"}
    update = {k: v for k, v in data.items() if k in allowed}
    update["bank_slug"] = bank_slug
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.fastag_pricing.update_one({"bank_slug": bank_slug}, {"$set": update}, upsert=True)
    return {"ok": True}

# ─── Admin branding endpoints ─────────────────────────────────────────────────

@admin_router.get("/branding", dependencies=[Depends(_check_admin)])
async def admin_get_branding():
    doc = await db.site_settings.find_one({"key": "branding"}, {"_id": 0, "key": 0})
    result = dict(SITE_DEFAULTS)
    if doc:
        result.update({k: v for k, v in doc.items() if k in SITE_DEFAULTS or k == "updated_at"})
    return result

@admin_router.patch("/branding", dependencies=[Depends(_check_admin)])
async def admin_update_branding(data: dict = Body(...)):
    # Allow all text fields in SITE_DEFAULTS (but not logo/favicon — those have dedicated upload endpoints)
    text_fields = {k for k in SITE_DEFAULTS if k not in ("logo_url", "favicon_url")}
    update = {k: v for k, v in data.items() if k in text_fields}
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields")
    update["updated_at"] = datetime.utcnow().isoformat()
    await db.site_settings.update_one(
        {"key": "branding"}, {"$set": update}, upsert=True
    )
    return {"ok": True}

@admin_router.post("/branding/upload-logo", dependencies=[Depends(_check_admin)])
async def admin_upload_logo(file: UploadFile = File(...)):
    """Accept SVG, PNG, or JPG. Format is preserved exactly — no conversion."""
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    ALLOWED = {".svg": "image/svg+xml", ".png": "image/png",
               ".jpg": "image/jpeg",    ".jpeg": "image/jpeg"}
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only SVG, PNG, or JPG allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Logo must be under 2 MB")

    content_type = ALLOWED[ext]

    if ext == ".svg":
        # SVG is already optimally scalable — store as-is
        final_bytes = contents
    else:
        # Resize raster images to max 800×300 while keeping original format
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(contents))
            img.thumbnail((800, 300), Image.LANCZOS)
            buf = io.BytesIO()
            pil_fmt = "JPEG" if ext in {".jpg", ".jpeg"} else "PNG"
            save_kw = {"optimize": True, "quality": 92} if pil_fmt == "JPEG" else {"optimize": True}
            img.save(buf, format=pil_fmt, **save_kw)
            final_bytes = buf.getvalue()
        except Exception as e:
            logger.warning(f"Logo resize failed ({e}), storing as-is")
            final_bytes = contents

    import time as _time
    logo_ts = int(_time.time())
    data_url = f"data:{content_type};base64," + base64.b64encode(final_bytes).decode()
    await db.site_settings.update_one(
        {"key": "branding"},
        {"$set": {"logo_url": data_url, "logo_ts": logo_ts, "updated_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    logger.info(f"Logo uploaded — {ext}, {len(final_bytes):,} bytes")
    return {"ok": True, "logo_url": f"{BACKEND_SITE}/api/branding/logo-image?t={logo_ts}"}


@admin_router.post("/branding/upload-favicon", dependencies=[Depends(_check_admin)])
async def admin_upload_favicon(file: UploadFile = File(...)):
    """Accept SVG, PNG, or JPG for favicon. Format is preserved — no conversion."""
    ext = Path(file.filename).suffix.lower() if file.filename else ""
    ALLOWED = {".svg": "image/svg+xml", ".png": "image/png",
               ".jpg": "image/jpeg",    ".jpeg": "image/jpeg"}
    if ext not in ALLOWED:
        raise HTTPException(status_code=400, detail="Only SVG, PNG, or JPG allowed")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")
    if len(contents) > 512 * 1024:
        raise HTTPException(status_code=400, detail="Favicon must be under 512 KB")

    content_type = ALLOWED[ext]

    if ext == ".svg":
        final_bytes = contents
    else:
        # Keep original format, resize to max 64×64
        try:
            from PIL import Image
            import io
            img = Image.open(io.BytesIO(contents))
            img.thumbnail((64, 64), Image.LANCZOS)
            buf = io.BytesIO()
            pil_fmt = "JPEG" if ext in {".jpg", ".jpeg"} else "PNG"
            save_kw = {"optimize": True, "quality": 92} if pil_fmt == "JPEG" else {"optimize": True}
            img.save(buf, format=pil_fmt, **save_kw)
            final_bytes = buf.getvalue()
        except Exception as e:
            logger.warning(f"Favicon resize failed ({e}), storing as-is")
            final_bytes = contents

    import time as _time
    fav_ts = int(_time.time())
    data_url = f"data:{content_type};base64," + base64.b64encode(final_bytes).decode()
    await db.site_settings.update_one(
        {"key": "branding"},
        {"$set": {"favicon_url": data_url, "favicon_ts": fav_ts, "updated_at": datetime.utcnow().isoformat()}},
        upsert=True,
    )
    logger.info(f"Favicon uploaded — {ext}, {len(final_bytes):,} bytes")
    return {"ok": True, "favicon_url": f"{BACKEND_SITE}/api/branding/favicon-image?t={fav_ts}"}

@admin_router.delete("/branding/logo", dependencies=[Depends(_check_admin)])
async def admin_delete_logo():
    await db.site_settings.update_one({"key": "branding"}, {"$unset": {"logo_url": ""}})
    return {"ok": True}

@admin_router.delete("/branding/favicon", dependencies=[Depends(_check_admin)])
async def admin_delete_favicon():
    await db.site_settings.update_one({"key": "branding"}, {"$unset": {"favicon_url": ""}})
    return {"ok": True}

# ─── Article seed data ────────────────────────────────────────────────────────

def _make_article(slug, title, excerpt, body_html, category, faq_pairs,
                  related_bank=None, related_state=None, tags=None, read_min=4):
    now = datetime.now(timezone.utc).isoformat()
    kw_parts = [category, "FASTag"]
    if related_bank:
        kw_parts.append(related_bank.replace("-fastag","").upper())
    if related_state:
        kw_parts.append(related_state.replace("-"," ").title())
    return {
        "slug": slug,
        "title": title,
        "excerpt": excerpt,
        "body": body_html,
        "category": category,
        "tags": tags or [],
        "related_bank": related_bank,
        "related_state": related_state,
        "meta_description": excerpt[:155],
        "meta_keywords": ", ".join(kw_parts + ["FASTag guide", "toll plaza", "Sathi"]),
        "faq_pairs": faq_pairs,
        "cover": None,
        "is_published": True,
        "read_min": read_min,
        "created_at": now,
        "updated_at": now,
    }

def _body(sections):
    """Build a basic HTML body from list of (heading, paragraphs) tuples."""
    html = ""
    for heading, paras in sections:
        html += f"<h2>{heading}</h2>"
        for p in paras:
            html += f"<p>{p}</p>"
    return html

async def _seed_articles():
    BANKS_DATA = [
        ("sbi-fastag",   "SBI",       "SBI FASTag"),
        ("paytm-fastag", "Paytm",     "Paytm FASTag"),
        ("icici-fastag", "ICICI",     "ICICI FASTag"),
        ("hdfc-fastag",  "HDFC",      "HDFC FASTag"),
        ("axis-fastag",  "Axis",      "Axis FASTag"),
        ("kotak-fastag", "Kotak",     "Kotak FASTag"),
        ("yes-fastag",   "Yes Bank",  "Yes Bank FASTag"),
        ("idfc-fastag",  "IDFC First","IDFC First FASTag"),
    ]

    ISSUES_A = [
        ("balance-check",    "check balance on",            "Balance",      "how-to check balance"),
        ("recharge",         "recharge",                    "Balance",      "recharge top-up"),
        ("dispute",          "file a dispute for",          "Disputes",     "dispute mischarge refund"),
        ("blacklist-fix",    "fix a blacklisted",           "Blacklist",    "blacklist blocked fix"),
        ("kyc-update",       "complete KYC update for",     "KYC",          "KYC update documents"),
        ("name-change",      "change the name on",          "KYC",          "name change correction"),
        ("vehicle-class",    "update vehicle class for",    "KYC",          "vehicle class update"),
        ("double-deduction", "get a refund for double deduction on", "Disputes", "double charge deduction"),
        ("refund",           "claim a refund from",         "Disputes",     "refund process claim"),
        ("statement",        "download a statement for",    "Balance",      "statement download"),
        ("lost-fastag",      "replace a lost",              "Installation", "lost replacement"),
        ("damaged-sticker",  "replace a damaged",           "Installation", "sticker damaged replace"),
        ("rc-mismatch",      "fix RC mismatch for",         "KYC",          "RC mismatch wrong"),
        ("low-balance-alert","set up low balance alerts for","Balance",      "alert notification"),
        ("helpline",         "contact customer support for", "General",      "helpline support contact"),
    ]

    STATES_DATA = [
        ("maharashtra","Maharashtra"), ("uttar-pradesh","Uttar Pradesh"),
        ("rajasthan","Rajasthan"), ("gujarat","Gujarat"), ("karnataka","Karnataka"),
        ("tamil-nadu","Tamil Nadu"), ("telangana","Telangana"), ("andhra-pradesh","Andhra Pradesh"),
        ("west-bengal","West Bengal"), ("madhya-pradesh","Madhya Pradesh"),
        ("kerala","Kerala"), ("punjab","Punjab"), ("haryana","Haryana"),
        ("bihar","Bihar"), ("odisha","Odisha"), ("jharkhand","Jharkhand"),
        ("assam","Assam"), ("himachal-pradesh","Himachal Pradesh"), ("uttarakhand","Uttarakhand"),
        ("chhattisgarh","Chhattisgarh"), ("goa","Goa"), ("tripura","Tripura"),
        ("meghalaya","Meghalaya"), ("manipur","Manipur"), ("nagaland","Nagaland"),
        ("arunachal-pradesh","Arunachal Pradesh"), ("sikkim","Sikkim"),
        ("delhi","Delhi"), ("jammu-kashmir","Jammu & Kashmir"),
    ]

    STATE_ISSUES = [
        ("fastag-dispute",       "FASTag Dispute & Refund Guide",          "Disputes"),
        ("fastag-blacklist",     "FASTag Blacklist Fix Guide",              "Blacklist"),
        ("fastag-balance-check", "FASTag Balance Check Methods",           "Balance"),
        ("fastag-kyc-guide",     "FASTag KYC Update Process",              "KYC"),
        ("fastag-recharge",      "FASTag Recharge Options",                "Balance"),
        ("toll-help",            "Toll Plaza Help & Sathi Network",         "General"),
        ("fastag-replacement",   "FASTag Replacement After Loss or Damage","Installation"),
        ("fastag-new-vehicle",   "FASTag for New Vehicle Owners",          "Installation"),
    ]

    VEHICLES = [
        ("car","car"), ("truck","commercial truck"), ("bus","bus"),
        ("motorcycle","motorcycle"), ("tractor","tractor"),
        ("suv","SUV"), ("minibus","minibus"), ("pickup","pickup truck"),
        ("auto-rickshaw","auto-rickshaw"), ("lcv","light commercial vehicle"),
    ]

    VEHICLE_ISSUES = [
        ("installation",     "FASTag Installation Guide",        "Installation"),
        ("not-working",      "FASTag Not Working at Toll Fix",   "Blacklist"),
        ("transfer",         "FASTag Transfer to New Owner",     "KYC"),
        ("balance-guide",    "FASTag Balance & Recharge Guide",  "Balance"),
        ("dispute-guide",    "FASTag Dispute Filing Guide",      "Disputes"),
    ]

    GENERAL_FAQS = [
        ("what-is-fastag",             "What is FASTag and how does it work?",                    "General"),
        ("fastag-mandatory",           "Is FASTag mandatory for all vehicles in India?",           "General"),
        ("fastag-validity",            "What is the validity period of a FASTag?",                 "General"),
        ("fastag-multiple-tolls",      "Can one FASTag be used at all toll plazas in India?",      "General"),
        ("fastag-wallet-balance",      "Minimum wallet balance required for FASTag",               "Balance"),
        ("fastag-negative-balance",    "FASTag went negative — what happens next?",                "Balance"),
        ("fastag-not-scanned",         "FASTag not scanned at the toll — what to do",             "Blacklist"),
        ("fastag-deactivated",         "FASTag deactivated or suspended — reasons and fix",        "Blacklist"),
        ("fastag-linked-bank-change",  "How to change the bank linked to your FASTag",            "KYC"),
        ("fastag-pan-aadhaar-link",    "Link PAN and Aadhaar to your FASTag account",             "KYC"),
        ("fastag-for-old-vehicle",     "Getting FASTag for an old or second-hand vehicle",        "Installation"),
        ("fastag-sticker-position",    "Correct position to stick a FASTag on windshield",        "Installation"),
        ("fastag-two-tags-vehicle",    "Two FASTag stickers on one vehicle — what to do",         "Installation"),
        ("nhai-helpline-number",       "NHAI FASTag helpline number and how to use it",           "General"),
        ("fastag-reissue-process",     "How to reissue or reactivate a blocked FASTag",           "Blacklist"),
        ("fastag-exemption-vehicles",  "Which vehicles are exempt from FASTag rules?",            "General"),
        ("fastag-commercial-vehicles", "FASTag rules for commercial vehicles and fleet",          "General"),
        ("fastag-international-travel","FASTag for vehicles crossing state or border tolls",      "General"),
        ("fastag-mobile-number-update","How to update mobile number linked to FASTag",            "KYC"),
        ("fastag-insurance-link",      "Link vehicle insurance to FASTag account",                "KYC"),
        ("fastag-sms-alerts-setup",    "Set up SMS alerts for every FASTag transaction",          "Balance"),
        ("fastag-toll-app",            "Using the FASTag or NHAI ONE app for management",         "General"),
        ("fastag-mischarge-timeline",  "Timeline to claim a FASTag mischarge refund",             "Disputes"),
        ("fastag-refund-status-check", "How to check FASTag refund status",                       "Disputes"),
        ("fastag-rc-linkage",          "Why RC details must match FASTag exactly",                "KYC"),
        ("fastag-hotlisted",           "FASTag hotlisted — meaning and how to resolve",           "Blacklist"),
        ("fastag-cashback-offers",     "FASTag cashback and discount offers in 2026",             "Balance"),
        ("fastag-balance-transfer",    "Can you transfer FASTag balance to another account?",     "Balance"),
        ("fastag-vehicle-sold",        "What to do with FASTag when you sell your vehicle",       "KYC"),
        ("fastag-class-4-vehicles",    "FASTag for Class 4 commercial vehicles — special rules",  "General"),
        ("fastag-truck-overweight",    "Overweight penalty at toll and FASTag balance",           "Disputes"),
        ("fastag-holiday-traffic",     "FASTag tips for high-traffic holidays and long weekends", "General"),
        ("fastag-autopay-setup",       "Set up autopay or auto-recharge for FASTag",              "Balance"),
        ("fastag-customer-care-chat",  "FASTag customer care chat and email support options",     "General"),
        ("fastag-atm-recharge",        "Recharge FASTag at ATM or bank branch",                  "Balance"),
        ("fastag-upi-recharge",        "Recharge FASTag using UPI in 2 minutes",                 "Balance"),
        ("fastag-net-banking-recharge","Recharge FASTag via net banking — all banks",            "Balance"),
        ("fastag-class-fee-dispute",   "Disputing wrong vehicle class fee at toll",              "Disputes"),
        ("fastag-non-nhai-toll",       "FASTag at state highway tolls vs NHAI tolls",            "General"),
        ("fastag-sos-at-toll",         "Emergency SOS at toll — who to call and what to do",     "General"),
        ("fastag-transaction-history", "How to download complete FASTag transaction history",     "Balance"),
        ("fastag-fleet-management",    "Managing FASTag for a fleet of 5 or more vehicles",      "General"),
        ("fastag-gstin-invoice",       "Getting GST invoice for FASTag toll payments",           "General"),
        ("fastag-monthly-pass",        "FASTag monthly pass for daily commuters",                "Balance"),
        ("fastag-blocked-at-one-plaza","FASTag blocked only at one plaza — how to resolve",      "Blacklist"),
        ("fastag-wrong-vehicle-type",  "FASTag tagged to wrong vehicle type — correction",       "KYC"),
        ("fastag-expiry-renewal",      "FASTag expiry and renewal process — step by step",       "Installation"),
        ("fastag-bank-account-closed", "Your FASTag bank account was closed — next steps",       "KYC"),
        ("fastag-police-seized-vehicle","FASTag on a police-seized vehicle — what happens",      "General"),
    ]

    def _bank_body(action, bank_name, slug_key):
        return _body([
            (f"How to {action} {bank_name} — overview",
             [f"This guide covers how to {action} your {bank_name} step by step.",
              f"{bank_name} customers face this issue frequently at toll plazas across India.",
              "Follow the steps below or contact a Sathi at your nearest toll for on-spot help."]),
            ("Step-by-step process",
             [f"1. Open the {bank_name.split()[0]} app or visit the official website.",
              "2. Navigate to 'FASTag' or 'My FASTag' section.",
              f"3. Select the option for {action.split()[-1]} and follow the on-screen prompts.",
              "4. Keep your vehicle RC, registered mobile number, and FASTag ID ready.",
              "5. Complete any OTP verification required by the bank."]),
            ("Common errors and how to fix them",
             ["Error: 'Account not found' — ensure you are using the phone number registered with the bank.",
              "Error: 'Tag inactive' — your FASTag may be blacklisted. Use our blacklist fix guide.",
              "Error: 'KYC pending' — complete eKYC through the bank's app before proceeding."]),
            ("When to ping a Sathi instead",
             [f"If the above steps don't resolve your {bank_name} issue, a verified Sathi at your toll can help in minutes.",
              "Sathis have direct escalation paths with bank FASTag desks and NHAI.",
              "Use the ApnaFastag app to connect with a Sathi at your nearest plaza."])
        ])

    def _state_body(state_name, issue_name):
        return _body([
            (f"{issue_name} in {state_name} — complete guide",
             [f"This guide covers {issue_name.lower()} for FASTag users at toll plazas across {state_name}.",
              f"{state_name} has a large network of NHAI and state highway toll plazas.",
              "Verified Sathis are available at major plazas across the state for on-spot help."]),
            ("How to resolve this issue",
             ["1. Identify whether your toll plaza is NHAI or state-operated.",
              "2. Note the toll plaza name, transaction ID, and deduction amount.",
              "3. Contact your FASTag bank's helpline with these details.",
              "4. If unresolved in 24 hours, file an NHAI complaint using the toll-free number 1033.",
              "5. A verified Sathi can handle this process for you in under 10 minutes."]),
            ("Sathi network coverage",
             [f"ApnaFastag has verified Sathis at major toll plazas throughout {state_name}.",
              "Find your nearest Sathi using the map on the ApnaFastag website or app.",
              "Sathis are available 7 days a week and can resolve most issues on-spot."]),
        ])

    def _vehicle_body(vtype, issue_name):
        return _body([
            (f"{issue_name} for {vtype.title()}s — guide",
             [f"This guide is specifically for {vtype} owners dealing with FASTag {issue_name.lower()}.",
              "Rules and processes can vary slightly for different vehicle categories.",
              "Follow the steps below or get help from a Sathi at your toll plaza."]),
            ("What you need",
             ["1. Vehicle registration certificate (RC)",
              "2. Registered mobile number linked to FASTag",
              "3. FASTag ID (printed on the sticker)",
              "4. Valid photo ID (Aadhaar, PAN, or driving licence)"]),
            ("Step-by-step",
             [f"1. Contact your FASTag issuing bank for {issue_name.lower()} specific to {vtype}s.",
              "2. Provide vehicle class details matching your RC.",
              "3. Complete any KYC or documentation required.",
              "4. Allow 2–5 business days for the process to complete."]),
        ])

    def _plaza_body(plaza_name, issue):
        return _body([
            (f"FASTag {issue} at {plaza_name}",
             [f"This guide covers how to resolve FASTag {issue.lower()} specifically at {plaza_name}.",
              "If you are stranded at this plaza, contact a local Sathi immediately.",
              "Most issues can be resolved within 10 minutes with Sathi assistance."]),
            ("Immediate steps",
             ["1. Pull over to the designated waiting area — do not block the lane.",
              "2. Note your transaction ID from the receipt or FASTag app.",
              "3. Contact your bank's helpline or ping a Sathi via ApnaFastag.",
              "4. For mischarges, file within 7 days for a full refund."]),
            ("Contact Sathi",
             [f"A verified Sathi is available at or near {plaza_name}.",
              "They can resolve disputes, recharge issues, and blacklist problems on-spot.",
              "Use the ApnaFastag app to connect with the nearest Sathi."]),
        ])

    def _faq_body(title, category):
        return _body([
            (title,
             [f"This is a comprehensive guide answering: {title}",
              "FASTag-related questions are among the most searched queries for Indian motorists.",
              "Our verified Sathis handle hundreds of such cases every week at toll plazas."]),
            ("The short answer",
             ["FASTag is India's electronic toll collection system mandated by NHAI.",
              "All four-wheelers and heavy vehicles are required to have a valid, active FASTag.",
              "For the specific question above, refer to the FAQ section below or contact a Sathi."]),
            ("Need on-spot help?",
             ["If you are at a toll plaza right now, use ApnaFastag to find a nearby Sathi.",
              "Sathis are verified experts who resolve FASTag issues in minutes.",
              "The service costs as low as ₹49 for a recharge fix."]),
        ])

    def _bank_faqs(action, bank_name):
        return [
            {"q": f"How long does {action} take for {bank_name}?", "a": "Most requests are processed within 2–5 business days. Urgent cases can be escalated via your bank's helpline."},
            {"q": f"Can I {action} offline at a bank branch?",      "a": f"Yes, most {bank_name.split()[0]} branches support FASTag services. Carry your RC and a photo ID."},
            {"q": f"Is there a fee for {action} {bank_name}?",      "a": "Most banks do not charge for standard FASTag services. Check your bank's fee schedule for premium requests."},
            {"q": "What if my request is rejected?",                "a": "Re-submit with all documents correct. If rejected twice, contact NHAI at 1033 or ping a Sathi for escalation."},
            {"q": "How do I verify it was successful?",             "a": f"You will receive an SMS confirmation on your registered mobile. Also check the {bank_name.split()[0]} app or website."},
        ]

    articles = []

    # Group A: Bank × Issue
    for bank_slug, bank_short, bank_name in BANKS_DATA:
        for issue_key, action, category, kw in ISSUES_A:
            slug = f"{bank_slug}-{issue_key}"
            title = f"How to {action} your {bank_name} — complete 2026 guide"
            excerpt = f"Step-by-step guide to {action} your {bank_name} online, via app, or at a toll plaza. Includes common errors and Sathi escalation tips."
            articles.append(_make_article(
                slug=slug, title=title, excerpt=excerpt,
                body_html=_bank_body(action, bank_name, issue_key),
                category=category,
                faq_pairs=_bank_faqs(action, bank_name),
                related_bank=bank_slug,
                tags=[bank_short, "FASTag", kw],
                read_min=5,
            ))

    # Group B: General FAQs
    for slug, title, category in GENERAL_FAQS:
        excerpt = f"{title} — detailed guide for Indian motorists. Covers process, documents, timeline, and when to contact a Sathi for faster resolution."
        faqs = [
            {"q": f"What is the official process for: {title}?", "a": "Please refer to the step-by-step guide above. For urgent help, contact a Sathi at your nearest toll plaza."},
            {"q": "How long does this take?",                    "a": "Most FASTag processes take 1–5 business days. On-spot Sathi help is available within minutes at toll plazas."},
            {"q": "Do I need to visit a bank branch?",          "a": "Most processes can be done online via the bank app. Some KYC updates require a branch visit."},
            {"q": "Is there a helpline for this?",              "a": "Yes. NHAI helpline: 1033. For bank-specific issues, call your FASTag issuing bank's toll-free number."},
            {"q": "Can a Sathi help with this?",                "a": "Yes. Verified Sathis at toll plazas are trained to handle this and most other FASTag issues on-spot."},
        ]
        articles.append(_make_article(
            slug=slug, title=title, excerpt=excerpt,
            body_html=_faq_body(title, category),
            category=category, faq_pairs=faqs, read_min=4,
        ))

    # Group C: State × Issue
    for state_slug, state_name in STATES_DATA:
        for issue_key, issue_name, category in STATE_ISSUES:
            slug = f"{state_slug}-{issue_key}"
            title = f"{issue_name} in {state_name} — FASTag guide 2026"
            excerpt = f"Complete guide for {issue_name.lower()} at {state_name} toll plazas. Covers NHAI and state highways, with local Sathi contact options."
            faqs = [
                {"q": f"Which toll plazas in {state_name} have Sathi coverage?", "a": f"ApnaFastag has verified Sathis at major NHAI toll plazas in {state_name}. Use the map to find the nearest one."},
                {"q": f"Is the {issue_name.lower()} process different in {state_name}?", "a": "The bank-side process is the same across India. State highway tolls may have different escalation paths than NHAI."},
                {"q": "How do I file a complaint at a state highway toll?", "a": f"Contact the State Road Transport Corporation or the state PWD for {state_name} state highways."},
                {"q": "What is the NHAI helpline?", "a": "Dial 1033 for NHAI helpline, available 24x7 for toll-related complaints."},
                {"q": "How fast can a Sathi resolve this?", "a": "Most issues are resolved within 10–30 minutes when a Sathi is physically present at the toll."},
            ]
            articles.append(_make_article(
                slug=slug, title=title, excerpt=excerpt,
                body_html=_state_body(state_name, issue_name),
                category=category, faq_pairs=faqs,
                related_state=state_slug, read_min=4,
            ))

    # Group D: Vehicle × Issue
    for v_slug, v_name in VEHICLES:
        for issue_key, issue_name, category in VEHICLE_ISSUES:
            slug = f"fastag-{v_slug}-{issue_key}"
            title = f"FASTag {issue_name} for {v_name.title()}s — 2026 guide"
            excerpt = f"Complete {issue_name.lower()} guide for {v_name} owners. Covers vehicle class rules, documents needed, and on-spot Sathi assistance."
            faqs = [
                {"q": f"What vehicle class is a {v_name} for FASTag purposes?", "a": f"Vehicle class depends on the number of axles. A {v_name} is typically classified by NHAI standards. Check your RC for the official category."},
                {"q": f"Can I get FASTag for a {v_name} at the toll plaza?", "a": "Yes, NHAI FASTag is available at designated toll plaza counters. Carry your RC, Aadhaar, and a passport-size photo."},
                {"q": f"Is FASTag mandatory for {v_name}s?", "a": "FASTag is mandatory for all four-wheelers and above on NHAI highways. Check state-specific rules for smaller vehicles."},
                {"q": "What if my vehicle class is wrong on FASTag?", "a": "Contact your FASTag issuing bank to update the vehicle class. You will need to submit corrected RC documents."},
                {"q": "Can a Sathi help with FASTag for my vehicle?", "a": f"Yes. Sathis at toll plazas are trained to assist {v_name} owners with installation, disputes, and class corrections."},
            ]
            articles.append(_make_article(
                slug=slug, title=title, excerpt=excerpt,
                body_html=_vehicle_body(v_slug, issue_name),
                category=category, faq_pairs=faqs, read_min=4,
            ))

    # Group E: Plaza × Issue (from DB)
    plaza_issues = [
        ("fastag-dispute",    "FASTag Dispute",         "Disputes"),
        ("fastag-not-working","FASTag Not Working",     "Blacklist"),
        ("fastag-recharge",   "FASTag Recharge Help",   "Balance"),
    ]
    plazas = await db.plazas.find({}, {"_id": 0, "slug": 1, "name": 1}).to_list(None)
    for plaza in plazas:
        for issue_key, issue_name, category in plaza_issues:
            slug = f"{plaza['slug']}-{issue_key}"
            plaza_name = plaza.get("name", plaza["slug"].replace("-", " ").title()  )
            title = f"{issue_name} at {plaza_name} Toll Plaza — local guide"
            excerpt = f"On-spot help for {issue_name.lower()} at {plaza_name}. Verified Sathis available. Covers refund process, escalation steps, and emergency contacts."
            faqs = [
                {"q": f"Is there a Sathi available at {plaza_name}?", "a": f"Yes, ApnaFastag has verified Sathis at or near {plaza_name}. Use the map to find and connect."},
                {"q": f"What are the operating hours at {plaza_name}?", "a": "NHAI toll plazas operate 24x7. Sathi availability may vary — check the app for current online Sathis."},
                {"q": "How do I report a FASTag issue at this plaza?", "a": "Note the plaza name, lane number, transaction ID, and date. File a complaint with your FASTag bank within 7 days."},
                {"q": "What if no Sathi is available right now?", "a": "Call NHAI helpline 1033. For bank issues, call your FASTag bank helpline. A Sathi can also follow up remotely."},
                {"q": "How long does dispute resolution take?", "a": "Bank disputes are resolved within 7–30 days. Sathi-assisted disputes are typically resolved faster with proper escalation."},
            ]
            articles.append(_make_article(
                slug=slug, title=title, excerpt=excerpt,
                body_html=_plaza_body(plaza_name, issue_name),
                category=category, faq_pairs=faqs, read_min=3,
            ))

    # Upsert all articles
    upserted = 0
    for art in articles:
        await db.articles.update_one(
            {"slug": art["slug"]},
            {"$setOnInsert": art},
            upsert=True,
        )
        upserted += 1

    # Add indexes for articles collection
    await db.articles.create_index([("slug", 1)], unique=True)
    await db.articles.create_index([("is_published", 1), ("category", 1)])
    await db.articles.create_index([("is_published", 1), ("created_at", -1)])

    logger.info(f"Seeded {upserted} articles into db.articles")
    return upserted

@admin_router.post("/seed", dependencies=[Depends(_check_admin)])
async def seed_db():
    for s in SATHI_SEED:
        doc = {**s, "is_available": True}
        await db.sathis.update_one(
            {"slug": s["slug"]},
            {"$set": doc, "$setOnInsert": {"registered_phone": None}},
            upsert=True,
        )
    for p in PLAZA_SEED:
        await db.plazas.update_one({"slug": p["slug"]}, {"$set": p}, upsert=True)
    logger.info(f"Seeded {len(SATHI_SEED)} sathis + {len(PLAZA_SEED)} plazas")
    return {"ok": True, "sathis": len(SATHI_SEED), "plazas": len(PLAZA_SEED)}

@admin_router.post("/seed-geo-data", dependencies=[Depends(_check_admin)])
async def seed_geo_data():
    """Seed states, highways, cities, and banks collections from built-in defaults.
    Idempotent — safe to re-run. Does NOT overwrite existing custom data."""
    now = datetime.now(timezone.utc).isoformat()

    GEO_STATES = [
        {"slug":"maharashtra","name":"Maharashtra","plazaCount":142,"sathiCount":386,"highways":["NH-48","NH-160","NH-66"]},
        {"slug":"uttar-pradesh","name":"Uttar Pradesh","plazaCount":168,"sathiCount":421,"highways":["NH-19","NH-27","NH-44"]},
        {"slug":"rajasthan","name":"Rajasthan","plazaCount":89,"sathiCount":201,"highways":["NH-48","NH-58","NH-27"]},
        {"slug":"gujarat","name":"Gujarat","plazaCount":74,"sathiCount":156,"highways":["NH-48","NH-27"]},
        {"slug":"karnataka","name":"Karnataka","plazaCount":98,"sathiCount":221,"highways":["NH-48","NH-44","NH-75"]},
        {"slug":"tamil-nadu","name":"Tamil Nadu","plazaCount":89,"sathiCount":198,"highways":["NH-44","NH-32"]},
        {"slug":"telangana","name":"Telangana","plazaCount":67,"sathiCount":143,"highways":["NH-44","NH-65"]},
        {"slug":"andhra-pradesh","name":"Andhra Pradesh","plazaCount":78,"sathiCount":167,"highways":["NH-16","NH-44"]},
        {"slug":"west-bengal","name":"West Bengal","plazaCount":56,"sathiCount":123,"highways":["NH-12","NH-16"]},
        {"slug":"madhya-pradesh","name":"Madhya Pradesh","plazaCount":93,"sathiCount":187,"highways":["NH-44","NH-46","NH-30"]},
        {"slug":"kerala","name":"Kerala","plazaCount":48,"sathiCount":109,"highways":["NH-66","NH-183"]},
        {"slug":"punjab","name":"Punjab","plazaCount":52,"sathiCount":134,"highways":["NH-44","NH-7"]},
        {"slug":"haryana","name":"Haryana","plazaCount":67,"sathiCount":174,"highways":["NH-44","NH-48","NH-19"]},
        {"slug":"bihar","name":"Bihar","plazaCount":61,"sathiCount":132,"highways":["NH-19","NH-28","NH-31"]},
        {"slug":"odisha","name":"Odisha","plazaCount":54,"sathiCount":118,"highways":["NH-16","NH-57"]},
        {"slug":"jharkhand","name":"Jharkhand","plazaCount":43,"sathiCount":96,"highways":["NH-33","NH-75"]},
        {"slug":"assam","name":"Assam","plazaCount":38,"sathiCount":84,"highways":["NH-15","NH-37"]},
        {"slug":"himachal-pradesh","name":"Himachal Pradesh","plazaCount":29,"sathiCount":63,"highways":["NH-21","NH-22"]},
        {"slug":"uttarakhand","name":"Uttarakhand","plazaCount":34,"sathiCount":72,"highways":["NH-58","NH-74"]},
        {"slug":"chhattisgarh","name":"Chhattisgarh","plazaCount":47,"sathiCount":98,"highways":["NH-30","NH-43"]},
        {"slug":"goa","name":"Goa","plazaCount":12,"sathiCount":34,"highways":["NH-66","NH-748"]},
        {"slug":"delhi","name":"Delhi","plazaCount":24,"sathiCount":89,"highways":["NH-48","NH-44","NH-19"]},
        {"slug":"jammu-kashmir","name":"Jammu & Kashmir","plazaCount":21,"sathiCount":47,"highways":["NH-44","NH-1"]},
        {"slug":"tripura","name":"Tripura","plazaCount":14,"sathiCount":31,"highways":["NH-8"]},
        {"slug":"meghalaya","name":"Meghalaya","plazaCount":11,"sathiCount":24,"highways":["NH-6"]},
        {"slug":"manipur","name":"Manipur","plazaCount":9,"sathiCount":19,"highways":["NH-2"]},
        {"slug":"nagaland","name":"Nagaland","plazaCount":8,"sathiCount":17,"highways":["NH-29"]},
        {"slug":"arunachal-pradesh","name":"Arunachal Pradesh","plazaCount":7,"sathiCount":14,"highways":["NH-13"]},
        {"slug":"sikkim","name":"Sikkim","plazaCount":5,"sathiCount":11,"highways":["NH-10"]},
    ]

    GEO_HIGHWAYS = [
        {"slug":"nh-48","name":"NH-48","fullName":"National Highway 48 (Delhi–Mumbai)","length":"1428 km","states":["Delhi","Haryana","Rajasthan","Gujarat","Maharashtra"],"plazaCount":67,"desc":"India's busiest highway connecting Delhi to Mumbai via Gurugram, Jaipur, Vadodara, and Surat.","is_active":True},
        {"slug":"nh-44","name":"NH-44","fullName":"National Highway 44 (Srinagar–Kanyakumari)","length":"3745 km","states":["J&K","Punjab","Haryana","Delhi","UP","MP","Maharashtra","Telangana","AP","Tamil Nadu"],"plazaCount":112,"desc":"India's longest highway, connecting Srinagar in the north to Kanyakumari in the south.","is_active":True},
        {"slug":"nh-19","name":"NH-19","fullName":"National Highway 19 (Delhi–Kolkata)","length":"1435 km","states":["Delhi","UP","Bihar","Jharkhand","West Bengal"],"plazaCount":58,"desc":"Connects Delhi to Kolkata via Agra, Kanpur, Varanasi, and Patna.","is_active":True},
        {"slug":"nh-27","name":"NH-27","fullName":"National Highway 27 (Porbandar–Silchar)","length":"3187 km","states":["Gujarat","Rajasthan","MP","UP","Bihar","West Bengal","Assam"],"plazaCount":89,"desc":"One of India's longest east-west highways, connecting Porbandar to Silchar.","is_active":True},
        {"slug":"nh-66","name":"NH-66","fullName":"National Highway 66 (Panvel–Kanyakumari)","length":"1622 km","states":["Maharashtra","Goa","Karnataka","Kerala","Tamil Nadu"],"plazaCount":74,"desc":"Runs along India's western coast, passing through Mumbai, Goa, Mangalore, and Calicut.","is_active":True},
        {"slug":"nh-16","name":"NH-16","fullName":"National Highway 16 (Kolkata–Chennai)","length":"1711 km","states":["West Bengal","Odisha","Andhra Pradesh","Tamil Nadu"],"plazaCount":64,"desc":"Connects Kolkata to Chennai along the eastern coast.","is_active":True},
        {"slug":"nh-8","name":"NH-8","fullName":"National Highway 8 (Mumbai–Pune Expressway)","length":"94 km","states":["Maharashtra"],"plazaCount":8,"desc":"Mumbai-Pune Expressway — one of India's busiest expressways.","is_active":True},
    ]

    GEO_CITIES = [
        {"slug":"mumbai","name":"Mumbai","state":"Maharashtra","plazaCount":8,"sathiCount":42},
        {"slug":"delhi","name":"Delhi","state":"Delhi","plazaCount":12,"sathiCount":67},
        {"slug":"bengaluru","name":"Bengaluru","state":"Karnataka","plazaCount":6,"sathiCount":38},
        {"slug":"pune","name":"Pune","state":"Maharashtra","plazaCount":5,"sathiCount":29},
        {"slug":"hyderabad","name":"Hyderabad","state":"Telangana","plazaCount":7,"sathiCount":35},
        {"slug":"chennai","name":"Chennai","state":"Tamil Nadu","plazaCount":5,"sathiCount":27},
        {"slug":"ahmedabad","name":"Ahmedabad","state":"Gujarat","plazaCount":4,"sathiCount":22},
        {"slug":"kolkata","name":"Kolkata","state":"West Bengal","plazaCount":4,"sathiCount":19},
        {"slug":"jaipur","name":"Jaipur","state":"Rajasthan","plazaCount":3,"sathiCount":17},
        {"slug":"lucknow","name":"Lucknow","state":"UP","plazaCount":3,"sathiCount":16},
        {"slug":"surat","name":"Surat","state":"Gujarat","plazaCount":3,"sathiCount":14},
        {"slug":"nagpur","name":"Nagpur","state":"Maharashtra","plazaCount":3,"sathiCount":13},
        {"slug":"gurugram","name":"Gurugram","state":"Haryana","plazaCount":4,"sathiCount":24},
        {"slug":"noida","name":"Noida","state":"UP","plazaCount":3,"sathiCount":18},
        {"slug":"chandigarh","name":"Chandigarh","state":"Punjab","plazaCount":3,"sathiCount":15},
        {"slug":"indore","name":"Indore","state":"MP","plazaCount":2,"sathiCount":11},
        {"slug":"bhopal","name":"Bhopal","state":"MP","plazaCount":2,"sathiCount":10},
        {"slug":"vadodara","name":"Vadodara","state":"Gujarat","plazaCount":2,"sathiCount":10},
        {"slug":"nashik","name":"Nashik","state":"Maharashtra","plazaCount":2,"sathiCount":9},
        {"slug":"agra","name":"Agra","state":"UP","plazaCount":2,"sathiCount":9},
    ]

    GEO_BANKS = [
        {"slug":"sbi-fastag","name":"SBI FASTag","shortName":"SBI","color":"#22409A","logo":"/banks/sbi.svg","smsCode":"FTBAL","helpline":"1800-11-0018","marketShare":18,"is_active":True},
        {"slug":"paytm-fastag","name":"Paytm FASTag","shortName":"Paytm","color":"#00BAF2","logo":"/banks/paytm.svg","smsCode":"FT BAL","helpline":"1800-120-4210","marketShare":28,"is_active":True},
        {"slug":"icici-fastag","name":"ICICI FASTag","shortName":"ICICI","color":"#F58220","logo":"/banks/icici.svg","smsCode":"FASTAG","helpline":"1800-2100-104","marketShare":14,"is_active":True},
        {"slug":"hdfc-fastag","name":"HDFC FASTag","shortName":"HDFC","color":"#004C8F","logo":"/banks/hdfc.svg","smsCode":"FASTAG","helpline":"1800-120-1243","marketShare":12,"is_active":True},
        {"slug":"axis-fastag","name":"Axis FASTag","shortName":"Axis","color":"#97144D","logo":"/banks/axis.svg","smsCode":"FASTAG","helpline":"1860-419-8585","marketShare":9,"is_active":True},
        {"slug":"kotak-fastag","name":"Kotak FASTag","shortName":"Kotak","color":"#ED1C24","logo":"/banks/kotak.svg","smsCode":"FASTAG","helpline":"1800-209-0000","marketShare":6,"is_active":True},
        {"slug":"yes-fastag","name":"Yes Bank FASTag","shortName":"Yes","color":"#003087","logo":"/banks/yes.svg","smsCode":"FASTAG","helpline":"1800-1200","marketShare":5,"is_active":True},
        {"slug":"idfc-fastag","name":"IDFC First FASTag","shortName":"IDFC","color":"#6B2D8B","logo":"/banks/idfc.svg","smsCode":"FASTAG","helpline":"1800-10-888","marketShare":4,"is_active":True},
    ]

    counts = {"states": 0, "highways": 0, "cities": 0, "banks": 0}
    for s in GEO_STATES:
        await db.states.update_one({"slug": s["slug"]}, {"$set": {**s, "updated_at": now}}, upsert=True)
        counts["states"] += 1
    for h in GEO_HIGHWAYS:
        await db.highways.update_one({"slug": h["slug"]}, {"$set": {**h, "updated_at": now}}, upsert=True)
        counts["highways"] += 1
    for c in GEO_CITIES:
        await db.cities.update_one({"slug": c["slug"]}, {"$set": {**c, "updated_at": now}}, upsert=True)
        counts["cities"] += 1
    for b in GEO_BANKS:
        await db.banks.update_one({"slug": b["slug"]}, {"$set": {**b, "updated_at": now}}, upsert=True)
        counts["banks"] += 1

    logger.info(f"Seeded geo data: {counts}")
    return {"ok": True, **counts}

# ─── Legacy status check (keep for compatibility) ─────────────────────────────

legacy_router = APIRouter(tags=["legacy"])

@legacy_router.get("/")
async def root():
    return {"message": "Sathi API v2"}

@legacy_router.post("/status", response_model=StatusCheck)
async def create_status_check(body: StatusCheckCreate):
    obj = StatusCheck(client_name=body.client_name)
    doc = obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return obj

@legacy_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for c in checks:
        if isinstance(c["timestamp"], str):
            c["timestamp"] = datetime.fromisoformat(c["timestamp"])
    return checks

# ─── Sathi dashboard routes ───────────────────────────────────────────────────

ISSUE_RATES = {"dispute": 99, "kyc": 149, "recharge": 49, "sos": 199}
SATHI_PLATFORM_FEE = 199  # platform commission charged to Sathi per resolved job

class ClaimSathiIn(BaseModel):
    sathi_slug: str

class AvailabilityIn(BaseModel):
    is_available: bool

async def _decode_token(token: str) -> Optional[dict]:
    """Decode a raw JWT string; returns payload or None."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError:
        return None

async def _require_sathi_ctx(current: dict = Depends(_require_user)) -> dict:
    doc = await db.sathis.find_one({"registered_phone": current["sub"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=403, detail="No Sathi profile linked to this account")
    return {"user": current, "sathi": doc}

sathi_dash = APIRouter(prefix="/sathi-dashboard", tags=["sathi-dashboard"])

@sathi_dash.get("/check")
async def check_sathi_status(current: dict = Depends(_require_user)):
    doc = await db.sathis.find_one(
        {"registered_phone": current["sub"]}, {"_id": 0, "name": 1, "slug": 1, "is_available": 1}
    )
    if doc:
        return {"is_sathi": True, "name": doc["name"], "slug": doc["slug"]}
    app = await db.sathi_applications.find_one(
        {"phone": current["sub"]}, {"_id": 0, "status": 1, "name": 1, "ref": 1}
    )
    return {
        "is_sathi": False,
        "application_status": app["status"] if app else None,
        "application_ref": app["ref"] if app else None,
        "name": app["name"] if app else None,
    }

@sathi_dash.post("/claim")
async def claim_sathi(body: ClaimSathiIn, current: dict = Depends(_require_user)):
    sathi = await db.sathis.find_one({"slug": body.sathi_slug}, {"_id": 0})
    if not sathi:
        raise HTTPException(status_code=404, detail="Sathi profile not found — check the slug")
    existing_phone = sathi.get("registered_phone")
    if existing_phone and existing_phone != current["sub"]:
        raise HTTPException(status_code=409, detail="This Sathi profile is already claimed by another account")
    await db.sathis.update_one(
        {"slug": body.sathi_slug},
        {"$set": {"registered_phone": current["sub"]}},
    )
    return {"ok": True, "sathi_slug": body.sathi_slug, "sathi_name": sathi["name"]}

@sathi_dash.get("/profile")
async def my_sathi_profile(ctx: dict = Depends(_require_sathi_ctx)):
    return ctx["sathi"]

@sathi_dash.get("/jobs")
async def sathi_job_queue(ctx: dict = Depends(_require_sathi_ctx)):
    return await db.jobs.find(
        {"sathi_slug": ctx["sathi"]["slug"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(200)

@sathi_dash.patch("/jobs/{job_id}/accept")
async def accept_job(job_id: str, ctx: dict = Depends(_require_sathi_ctx)):
    job = await db.jobs.find_one({"id": job_id, "sathi_slug": ctx["sathi"]["slug"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "accepted", "updated_at": now}})
    updated = {**job, "status": "accepted", "updated_at": now}
    await notify_sathi(ctx["sathi"]["slug"], "job_status", updated)
    return updated

@sathi_dash.patch("/jobs/{job_id}/start")
async def start_job(job_id: str, ctx: dict = Depends(_require_sathi_ctx)):
    job = await db.jobs.find_one({"id": job_id, "sathi_slug": ctx["sathi"]["slug"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "in_progress", "updated_at": now}})
    updated = {**job, "status": "in_progress", "updated_at": now}
    await notify_sathi(ctx["sathi"]["slug"], "job_status", updated)
    return updated

@sathi_dash.patch("/jobs/{job_id}/resolve")
async def resolve_job(job_id: str, ctx: dict = Depends(_require_sathi_ctx)):
    job = await db.jobs.find_one({"id": job_id, "sathi_slug": ctx["sathi"]["slug"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.jobs.update_one(
        {"id": job_id},
        {"$set": {"status": "resolved", "updated_at": now, "resolved_at": now}},
    )
    updated = {**job, "status": "resolved", "updated_at": now, "resolved_at": now}
    await notify_sathi(ctx["sathi"]["slug"], "job_status", updated)
    return updated

@sathi_dash.patch("/jobs/{job_id}/cancel")
async def cancel_job_sathi(job_id: str, ctx: dict = Depends(_require_sathi_ctx)):
    job = await db.jobs.find_one({"id": job_id, "sathi_slug": ctx["sathi"]["slug"]}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    now = datetime.now(timezone.utc).isoformat()
    await db.jobs.update_one({"id": job_id}, {"$set": {"status": "cancelled", "updated_at": now}})
    updated = {**job, "status": "cancelled", "updated_at": now}
    await notify_sathi(ctx["sathi"]["slug"], "job_status", updated)
    return updated

@sathi_dash.patch("/availability")
async def toggle_availability(body: AvailabilityIn, ctx: dict = Depends(_require_sathi_ctx)):
    await db.sathis.update_one(
        {"slug": ctx["sathi"]["slug"]},
        {"$set": {"is_available": body.is_available}},
    )
    return {"ok": True, "is_available": body.is_available}

@sathi_dash.get("/earnings")
async def sathi_earnings(ctx: dict = Depends(_require_sathi_ctx)):
    resolved = await db.jobs.find(
        {"sathi_slug": ctx["sathi"]["slug"], "status": "resolved"},
        {"_id": 0, "platform_fee": 1, "sathi_platform_fee": 1, "issue": 1, "created_at": 1, "vehicle_number": 1, "ref_code": 1},
    ).sort("created_at", -1).to_list(1000)

    def net(j):
        return j.get("platform_fee", 99) - j.get("sathi_platform_fee", SATHI_PLATFORM_FEE)

    total = sum(net(j) for j in resolved)
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    this_month_jobs = [
        j for j in resolved
        if datetime.fromisoformat(j["created_at"]).replace(tzinfo=timezone.utc) >= month_start
    ]
    month_total = sum(net(j) for j in this_month_jobs)

    return {
        "total_earnings": total,
        "this_month": month_total,
        "resolved_count": len(resolved),
        "sathi_platform_fee": SATHI_PLATFORM_FEE,
        "recent": resolved[:10],
    }

@sathi_dash.get("/events")
async def sathi_events(request: Request, token: Optional[str] = Query(default=None)):
    """SSE stream — Sathi receives real-time job notifications."""
    # Accept token from query param (EventSource can't set custom headers)
    user = None
    if token:
        user = await _decode_token(token)
    if not user:
        # Fallback: try Authorization header
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            user = await _decode_token(auth[7:])
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")

    sathi = await db.sathis.find_one({"registered_phone": user["sub"]}, {"_id": 0, "slug": 1})
    if not sathi:
        raise HTTPException(status_code=403, detail="No Sathi profile linked to this account")

    slug = sathi["slug"]
    queue: asyncio.Queue = asyncio.Queue()

    # Register
    if slug not in sathi_subscribers:
        sathi_subscribers[slug] = []
    sathi_subscribers[slug].append(queue)

    async def event_generator():
        try:
            # Send an initial ping so the client knows the connection is live
            yield {"data": json.dumps({"type": "connected", "slug": slug})}
            while True:
                if await request.is_disconnected():
                    break
                try:
                    # Poll with a timeout so we can check disconnect periodically
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield {"data": payload}
                except asyncio.TimeoutError:
                    # Send a keepalive comment so proxies don't close the connection
                    yield {"comment": "keepalive"}
        finally:
            # Cleanup on disconnect
            try:
                sathi_subscribers[slug].remove(queue)
                if not sathi_subscribers[slug]:
                    del sathi_subscribers[slug]
            except (ValueError, KeyError):
                pass

    return EventSourceResponse(event_generator())


class SathiProfileUpdateIn(BaseModel):
    bio: Optional[str] = None
    languages: Optional[List[str]] = None
    services: Optional[List[str]] = None
    banks: Optional[List[str]] = None
    active_hours: Optional[dict] = None
    whatsapp: Optional[str] = None

class SathiCenterIn(BaseModel):
    active: bool = False
    name: Optional[str] = None       # e.g. "Rakesh FASTag Help Center"
    address: Optional[str] = None    # human-readable address
    lat: Optional[float] = None
    lng: Optional[float] = None
    hours: Optional[str] = None      # e.g. "Mon–Sat, 9am–6pm"

@sathi_dash.patch("/profile")
async def update_sathi_profile(body: SathiProfileUpdateIn, ctx: dict = Depends(_require_sathi_ctx)):
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if "whatsapp" in updates:
        sathi = ctx["sathi"]
        contact = sathi.get("contact", {})
        contact["whatsapp"] = updates.pop("whatsapp")
        updates["contact"] = contact
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    await db.sathis.update_one({"slug": ctx["sathi"]["slug"]}, {"$set": updates})
    return {"ok": True}

@sathi_dash.patch("/center")
async def update_sathi_center(body: SathiCenterIn, ctx: dict = Depends(_require_sathi_ctx)):
    slug = ctx["sathi"]["slug"]
    center = body.model_dump()
    await db.sathis.update_one({"slug": slug}, {"$set": {"center": center}})
    return {"ok": True, "center": center}

@sathi_dash.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...), ctx: dict = Depends(_require_sathi_ctx)):
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Only jpg/png/webp allowed")
    contents = await file.read()
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")

    # Resize + compress with Pillow → store as base64 data URL in MongoDB
    # (no filesystem needed — survives Railway redeploys and any hosting)
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(contents))
        img = img.convert("RGB")  # strip alpha / EXIF modes
        img.thumbnail((400, 400), Image.LANCZOS)  # max 400×400, preserve ratio
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=82, optimize=True)
        buf.seek(0)
        data_url = "data:image/jpeg;base64," + base64.b64encode(buf.read()).decode()
    except Exception as e:
        logger.warning(f"Pillow resize failed ({e}), storing original as-is")
        mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
        data_url = f"data:{mime};base64," + base64.b64encode(contents).decode()

    slug = ctx["sathi"]["slug"]
    await db.sathis.update_one({"slug": slug}, {"$set": {"avatar": data_url}})
    logger.info(f"Avatar stored as base64 for {slug} ({len(data_url)} chars)")
    return {"ok": True, "url": data_url}

@sathi_dash.post("/upload-gallery")
async def upload_gallery(file: UploadFile = File(...), ctx: dict = Depends(_require_sathi_ctx)):
    ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    if ext not in {".jpg", ".jpeg", ".png", ".webp"}:
        raise HTTPException(status_code=400, detail="Only jpg/png/webp allowed")
    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 10 MB")
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file received")
    slug = ctx["sathi"]["slug"]
    # Resize and encode as base64 data URL — no filesystem, survives Railway redeploys
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(contents))
        img = img.convert("RGB")
        img.thumbnail((800, 800), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=82, optimize=True)
        buf.seek(0)
        data_url = "data:image/jpeg;base64," + base64.b64encode(buf.read()).decode()
    except Exception as e:
        logger.warning(f"Pillow resize failed for gallery ({e}), storing original")
        mime = "image/png" if ext == ".png" else "image/webp" if ext == ".webp" else "image/jpeg"
        data_url = f"data:{mime};base64," + base64.b64encode(contents).decode()
    # Cap gallery at 10 images
    sathi = ctx["sathi"]
    if len(sathi.get("gallery", [])) >= 10:
        raise HTTPException(status_code=400, detail="Gallery limit is 10 images")
    await db.sathis.update_one({"slug": slug}, {"$push": {"gallery": data_url}})
    logger.info(f"Gallery image stored as base64 for {slug} ({len(data_url)} chars)")
    return {"ok": True, "url": data_url}

def _compute_tier(resolved: int) -> tuple[str, float]:
    """Return (tier_name, progress_to_next_tier_pct)."""
    if resolved < 10:
        return "Rising", round(resolved / 10 * 100, 1)
    elif resolved < 50:
        return "Verified", round((resolved - 10) / 40 * 100, 1)
    elif resolved < 200:
        return "Pro", round((resolved - 50) / 150 * 100, 1)
    else:
        return "Elite", 100.0

async def _build_sathi_stats(sathi_slug: str, sathi_doc: dict) -> dict:
    all_jobs = await db.jobs.find({"sathi_slug": sathi_slug}, {"_id": 0}).to_list(10000)

    total_jobs     = len(all_jobs)
    resolved_jobs  = sum(1 for j in all_jobs if j.get("status") == "resolved")
    cancelled_jobs = sum(1 for j in all_jobs if j.get("status") == "cancelled")

    # acceptance_rate: (accepted+resolved) / total that were ever pending
    accepted_count = sum(1 for j in all_jobs if j.get("status") in ("accepted", "in_progress", "resolved"))
    acceptance_rate = round(accepted_count / total_jobs * 100, 1) if total_jobs else 0.0

    # avg_response_sec: seconds from created_at to updated_at for accepted/in_progress/resolved jobs
    response_deltas = []
    for j in all_jobs:
        if j.get("status") in ("accepted", "in_progress", "resolved"):
            try:
                created  = datetime.fromisoformat(j["created_at"]).replace(tzinfo=timezone.utc)
                accepted = datetime.fromisoformat(j["updated_at"]).replace(tzinfo=timezone.utc)
                delta = (accepted - created).total_seconds()
                if 0 < delta < 86400:  # sanity: ignore negatives or >1 day
                    response_deltas.append(delta)
            except Exception:
                pass
    avg_response_sec = round(sum(response_deltas) / len(response_deltas), 1) if response_deltas else 0.0

    # resolution_rate: resolved / (resolved + cancelled)
    closed = resolved_jobs + cancelled_jobs
    resolution_rate = round(resolved_jobs / closed * 100, 1) if closed else 0.0

    # ratings from sathi doc
    avg_rating   = sathi_doc.get("rating", 0.0)
    total_reviews = sathi_doc.get("reviewCount", 0)

    tier, tier_progress = _compute_tier(resolved_jobs)

    return {
        "total_jobs":       total_jobs,
        "resolved_jobs":    resolved_jobs,
        "cancelled_jobs":   cancelled_jobs,
        "acceptance_rate":  acceptance_rate,
        "avg_response_sec": avg_response_sec,
        "resolution_rate":  resolution_rate,
        "avg_rating":       avg_rating,
        "total_reviews":    total_reviews,
        "tier":             tier,
        "tier_progress":    tier_progress,
    }

@sathi_dash.get("/stats")
async def sathi_stats(ctx: dict = Depends(_require_sathi_ctx)):
    return await _build_sathi_stats(ctx["sathi"]["slug"], ctx["sathi"])

@sathi_dash.delete("/gallery")
async def delete_gallery_image(body: dict, ctx: dict = Depends(_require_sathi_ctx)):
    url = body.get("url", "")
    await db.sathis.update_one({"slug": ctx["sathi"]["slug"]}, {"$pull": {"gallery": url}})
    # Remove file
    rel = url.lstrip("/")
    path = ROOT_DIR / rel
    if path.exists():
        path.unlink()
    return {"ok": True}

# ─── Sathi Applications ───────────────────────────────────────────────────────

applications_router = APIRouter(prefix="/sathi-applications", tags=["applications"])

@applications_router.post("")
async def submit_sathi_application(body: SathiApplicationIn):
    plaza = await db.plazas.find_one({"slug": body.plaza_slug}, {"_id": 0, "name": 1, "state_name": 1})
    if not plaza:
        raise HTTPException(status_code=404, detail="Plaza not found")

    existing = await db.sathi_applications.find_one({"phone": body.phone})
    if existing:
        raise HTTPException(status_code=409, detail="Application already submitted for this phone number")

    ref = f"APP-{body.state.upper()[:2]}-{datetime.now().year}-{str(uuid.uuid4())[:6].upper()}"
    doc = {
        "ref": ref,
        "phone": body.phone,
        "name": body.name,
        "state": body.state,
        "plaza_slug": body.plaza_slug,
        "plaza_name": plaza["name"],
        "hours_per_week": body.hours_per_week,
        "languages": body.languages,
        "experience": body.experience,
        "vehicle_types": body.vehicle_types,
        "status": "pending",
        "submitted_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sathi_applications.insert_one(doc)
    logger.info(f"New Sathi application: {ref} from {body.phone}")
    return {"ref": ref, "message": "Application submitted successfully"}

@applications_router.get("/check/{phone}")
async def check_application(phone: str):
    doc = await db.sathi_applications.find_one({"phone": phone}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="No application found")
    return doc

# ─── FASTag status proxy ──────────────────────────────────────────────────────

tools_router = APIRouter(prefix="/tools", tags=["tools"])

APNA_BASE = "https://www.apnapayment.com"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36"

@tools_router.get("/fastag-status")
async def fastag_status(vehicle: str):
    vehicle = vehicle.strip().upper().replace(" ", "")
    if not re.match(r"^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$", vehicle):
        raise HTTPException(status_code=400, detail="Invalid vehicle number format")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15) as client:
            # Step 1: GET the page to obtain CSRF token + session cookies
            r1 = await client.get(f"{APNA_BASE}/fastagstatus", headers={"User-Agent": UA, "Accept-Language": "en-US,en;q=0.9"})
            soup1 = BeautifulSoup(r1.text, "html.parser")
            token_input = soup1.find("input", {"name": "_token"})
            if not token_input:
                raise HTTPException(status_code=502, detail="Could not fetch CSRF token from upstream")
            csrf = token_input["value"]
            cookies = dict(r1.cookies)

            # Step 2: POST with vehicle number
            r2 = await client.post(
                f"{APNA_BASE}/fetchDataFromAPI",
                data={"_token": csrf, "vehicle_number": vehicle},
                cookies=cookies,
                headers={"User-Agent": UA, "Referer": f"{APNA_BASE}/fastagstatus", "Accept-Language": "en-US,en;q=0.9"},
            )
            soup2 = BeautifulSoup(r2.text, "html.parser")
            rows = soup2.select("tbody tr")
            results = []
            for row in rows:
                cells = row.find_all(["th", "td"])
                if len(cells) < 6:
                    continue
                status_cell = cells[5]
                status_text = status_cell.get_text(strip=True)
                status_bg = ""
                div = status_cell.find("div")
                if div and div.get("style"):
                    m = re.search(r"background:\s*([^;]+)", div["style"])
                    if m: status_bg = m.group(1).strip()
                is_active = "active" in status_text.lower() or status_bg == "#b7edc5"
                results.append({
                    "bank":       cells[1].get_text(strip=True),
                    "tag_id":     cells[2].get_text(strip=True),
                    "vehicle_class": cells[3].get_text(strip=True),
                    "issue_date": cells[4].get_text(strip=True),
                    "status":     "Active" if is_active else status_text or "Inactive",
                    "is_active":  is_active,
                })
            return {"vehicle": vehicle, "tags": results}
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"Upstream error: {str(e)}")

# ─── Payments ─────────────────────────────────────────────────────────────────

payments_router = APIRouter(prefix="/payments", tags=["payments"])

class BookingIntentIn(BaseModel):
    sathi_slug: str
    issue: str
    vehicle_number: str
    note: Optional[str] = ""
    promo_code: Optional[str] = None


async def _cf_create_order(order_id: str, amount: float, user_id: str, phone: str, return_path: str) -> dict:
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{CF_BASE}/orders",
            headers={
                "x-client-id": CF_APP_ID,
                "x-client-secret": CF_SECRET_KEY,
                "x-api-version": "2023-08-01",
                "Content-Type": "application/json",
            },
            json={
                "order_id": order_id,
                "order_amount": amount,
                "order_currency": "INR",
                "customer_details": {
                    "customer_id": user_id,
                    "customer_phone": phone,
                    "customer_name": "Customer",
                    "customer_email": f"customer{phone[-4:]}@apnafastag.com",
                },
                "order_meta": {
                    "return_url": f"{FRONTEND_URL}{return_path}",
                    "notify_url": f"{BACKEND_URL}/api/payments/webhook",
                },
            },
        )
    if r.status_code not in (200, 201):
        logger.error(f"Cashfree create order failed: {r.status_code} {r.text}")
        raise HTTPException(status_code=502, detail="Payment gateway error. Please try again.")
    return r.json()


async def _create_job_from_intent(intent: dict) -> Optional[dict]:
    """Idempotent: creates job from a paid booking intent. Returns existing job if already created."""
    existing = await db.jobs.find_one({"cashfree_order_id": intent["order_id"]}, {"_id": 0})
    if existing:
        return existing

    sathi = await db.sathis.find_one({"slug": intent["sathi_slug"]}, {"_id": 0})
    if not sathi:
        return None

    now = datetime.now(timezone.utc).isoformat()
    job = {
        "id": str(uuid.uuid4()),
        "ref_code": _gen_ref(sathi.get("state", "IN")),
        "user_id": intent["user_id"],
        "user_phone": intent["user_phone"],
        "sathi_slug": intent["sathi_slug"],
        "sathi_name": sathi["name"],
        "sathi_city": sathi.get("city", ""),
        "sathi_avatar": sathi.get("avatar", ""),
        "issue": intent["issue"],
        "vehicle_number": intent["vehicle_number"],
        "note": intent.get("note", ""),
        "platform_fee": intent["amount"],
        "original_fee": intent.get("original_amount", intent["amount"]),
        "discount_amount": intent.get("discount_amount", 0),
        "promo_code": intent.get("promo_code"),
        "sathi_platform_fee": SATHI_PLATFORM_FEE,
        "status": "pending",
        "payment_status": "paid",
        "cashfree_order_id": intent["order_id"],
        "paid_at": now,
        "created_at": now,
        "updated_at": now,
        "resolved_at": None,
        "review": None,
    }
    await db.jobs.insert_one({**job})
    await db.payment_intents.update_one(
        {"order_id": intent["order_id"]},
        {"$set": {"status": "completed", "job_id": job["id"]}},
    )
    await notify_sathi(intent["sathi_slug"], "new_job", job)
    logger.info(f"[BOOKING] {job['ref_code']} created from intent {intent['order_id']}")
    return job


async def _apply_promo(code: str, issue: str, user_phone: str, base_amount: float) -> dict:
    """Validate a promo code and compute discount. Returns dict with valid, discount_amount, final_amount, message."""
    doc = await db.promo_codes.find_one({"code": code.upper()}, {"_id": 0})
    if not doc or not doc.get("is_active"):
        return {"valid": False, "message": "Invalid or inactive promo code"}
    if doc.get("applicable_services") and issue not in doc["applicable_services"]:
        return {"valid": False, "message": f"This code is not valid for {issue} service"}
    if doc.get("applicable_user_phones") and user_phone not in doc["applicable_user_phones"]:
        return {"valid": False, "message": "This code is not valid for your account"}
    if doc.get("max_uses") and doc["used_count"] >= doc["max_uses"]:
        return {"valid": False, "message": "This promo code has reached its usage limit"}
    if doc.get("valid_until"):
        try:
            expiry = datetime.fromisoformat(doc["valid_until"])
            if expiry.tzinfo is None:
                expiry = expiry.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) > expiry:
                return {"valid": False, "message": "This promo code has expired"}
        except Exception:
            pass
    if doc["discount_type"] == "flat":
        discount = min(doc["discount_value"], base_amount - 1)
    else:
        discount = round(base_amount * doc["discount_value"] / 100, 2)
        discount = min(discount, base_amount - 1)
    final = max(1.0, base_amount - discount)
    return {"valid": True, "discount_amount": round(discount, 2), "final_amount": round(final, 2),
            "message": f"{'₹' + str(int(discount)) if doc['discount_type'] == 'flat' else str(int(doc['discount_value'])) + '%'} off applied!"}


@payments_router.get("/validate-promo")
async def validate_promo(code: str, issue: str, current: dict = Depends(_require_user)):
    amount = float(ISSUE_RATES.get(issue, 99))
    result = await _apply_promo(code, issue, current["sub"], amount)
    return {**result, "base_amount": amount}


@payments_router.post("/initiate-booking")
async def initiate_booking(body: BookingIntentIn, current: dict = Depends(_require_user)):
    if not CF_APP_ID or not CF_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    sathi = await db.sathis.find_one({"slug": body.sathi_slug}, {"_id": 0})
    if not sathi:
        raise HTTPException(status_code=404, detail="Sathi not found")

    base_amount = float(ISSUE_RATES.get(body.issue, 99))
    final_amount = base_amount
    discount_amount = 0.0
    promo_applied = None

    if body.promo_code:
        promo_result = await _apply_promo(body.promo_code, body.issue, current["sub"], base_amount)
        if not promo_result["valid"]:
            raise HTTPException(status_code=400, detail=promo_result["message"])
        final_amount = promo_result["final_amount"]
        discount_amount = promo_result["discount_amount"]
        promo_applied = body.promo_code.upper()
        await db.promo_codes.update_one({"code": promo_applied}, {"$inc": {"used_count": 1}})

    order_id = f"BK-{str(uuid.uuid4())[:12].upper()}"

    intent = {
        "order_id": order_id,
        "user_id": current["user_id"],
        "user_phone": current["sub"],
        "sathi_slug": body.sathi_slug,
        "issue": body.issue,
        "vehicle_number": body.vehicle_number.strip().upper(),
        "note": body.note or "",
        "amount": final_amount,
        "original_amount": base_amount,
        "discount_amount": discount_amount,
        "promo_code": promo_applied,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.payment_intents.insert_one({**intent})

    cf_data = await _cf_create_order(
        order_id, final_amount, current["user_id"], current["sub"],
        f"/my-jobs?payment_id={order_id}",
    )
    return {
        "order_id": order_id,
        "payment_session_id": cf_data["payment_session_id"],
        "amount": final_amount,
        "original_amount": base_amount,
        "discount_amount": discount_amount,
        "promo_code": promo_applied,
    }


@payments_router.post("/webhook")
async def payment_webhook(request: Request):
    body_bytes = await request.body()
    sig = request.headers.get("x-webhook-signature", "")
    ts = request.headers.get("x-webhook-timestamp", "")

    if CF_SECRET_KEY and sig:
        message = ts + body_bytes.decode()
        expected = base64.b64encode(
            hmac.new(CF_SECRET_KEY.encode(), message.encode(), hashlib.sha256).digest()
        ).decode()
        if not hmac.compare_digest(sig, expected):
            raise HTTPException(status_code=403, detail="Invalid webhook signature")

    try:
        payload = json.loads(body_bytes)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    order_id = payload.get("data", {}).get("order", {}).get("order_id", "")
    payment_status = payload.get("data", {}).get("payment", {}).get("payment_status", "")

    if order_id and payment_status == "SUCCESS":
        if order_id.startswith("FTO-"):
            # FASTag purchase order
            now = datetime.now(timezone.utc).isoformat()
            result = await db.fastag_orders.update_one(
                {"order_id": order_id, "payment_status": {"$ne": "paid"}},
                {"$set": {"payment_status": "paid", "status": "paid", "paid_at": now, "updated_at": now}},
            )
            if result.modified_count:
                logger.info(f"[WEBHOOK] FASTag order {order_id} marked paid")
        else:
            # Sathi booking intent
            intent = await db.payment_intents.find_one({"order_id": order_id}, {"_id": 0})
            if intent:
                await _create_job_from_intent(intent)
        logger.info(f"[WEBHOOK] {order_id} payment SUCCESS")

    return {"ok": True}


@payments_router.get("/verify/{order_id}")
async def verify_payment(order_id: str, current: dict = Depends(_require_user)):
    intent = await db.payment_intents.find_one(
        {"order_id": order_id, "user_id": current["user_id"]}, {"_id": 0}
    )
    if not intent:
        raise HTTPException(status_code=404, detail="Order not found")

    # Already completed — return existing job info
    if intent.get("status") == "completed":
        job = await db.jobs.find_one({"cashfree_order_id": order_id}, {"_id": 0})
        return {"payment_status": "paid", "job_ref": job["ref_code"] if job else None, "job_id": job["id"] if job else None}

    if not CF_APP_ID or not CF_SECRET_KEY:
        return {"payment_status": "pending", "job_ref": None, "job_id": None}

    async with httpx.AsyncClient(timeout=10.0) as client:
        r = await client.get(
            f"{CF_BASE}/orders/{order_id}/payments",
            headers={
                "x-client-id": CF_APP_ID,
                "x-client-secret": CF_SECRET_KEY,
                "x-api-version": "2023-08-01",
            },
        )

    if r.status_code == 200:
        payments_list = r.json()
        if isinstance(payments_list, list) and payments_list:
            if payments_list[0].get("payment_status") == "SUCCESS":
                job = await _create_job_from_intent(intent)
                return {
                    "payment_status": "paid",
                    "job_ref": job["ref_code"] if job else None,
                    "job_id": job["id"] if job else None,
                }

    return {"payment_status": "pending", "job_ref": None, "job_id": None}

# ─── Wire up ──────────────────────────────────────────────────────────────────

api.include_router(auth_router)
api.include_router(users_router)
api.include_router(fastag_router)
api.include_router(states_router)
api.include_router(sathis_router)
api.include_router(help_router)
api.include_router(plazas_router)
api.include_router(jobs_router)
api.include_router(admin_router)
api.include_router(applications_router)
api.include_router(sathi_dash)
api.include_router(tools_router)
api.include_router(payments_router)
api.include_router(legacy_router)
app.include_router(api)

# ─── Dynamic sitemap ──────────────────────────────────────────────────────────

SITE         = "https://apnafastag.com"
# Backend's own public URL — used so the sitemapindex <loc> entries for sub-sitemaps
# resolve to actual XML endpoints (not the frontend SPA which returns HTML).
BACKEND_SITE = "https://fastagsathi-production.up.railway.app"

# ─── Sitemap helpers ──────────────────────────────────────────────────────────

def _urlset(rows: list[str]) -> str:
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(rows)
    xml += "\n</urlset>"
    return xml

def _url(loc: str, priority: str = "0.7", freq: str = "monthly", lastmod: str = "") -> str:
    lm = f"<lastmod>{lastmod}</lastmod>" if lastmod else ""
    return f"  <url><loc>{loc}</loc>{lm}<priority>{priority}</priority><changefreq>{freq}</changefreq></url>"

def _today() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")

# ─── Sitemap index ────────────────────────────────────────────────────────────

@app.get("/sitemap.xml", include_in_schema=False)
async def sitemap_index():
    from fastapi.responses import Response as FResponse
    today = _today()
    subs = [
        "sitemap-static.xml",
        "sitemap-plazas.xml",
        "sitemap-states.xml",
        "sitemap-banks.xml",
        "sitemap-highways.xml",
        "sitemap-cities.xml",
        "sitemap-help.xml",
        "sitemap-sathis.xml",
    ]
    rows = [f'  <sitemap><loc>{BACKEND_SITE}/{s}</loc><lastmod>{today}</lastmod></sitemap>' for s in subs]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(rows)
    xml += "\n</sitemapindex>"
    return FResponse(content=xml, media_type="application/xml")

# ─── Category sitemaps ────────────────────────────────────────────────────────

@app.get("/sitemap-static.xml", include_in_schema=False)
async def sitemap_static():
    from fastapi.responses import Response as FResponse
    today = _today()
    entries = [
        ("/",                    "1.0",  "daily"),
        ("/find",                "0.95", "hourly"),
        ("/become-a-sathi",      "0.90", "weekly"),
        ("/help",                "0.90", "daily"),
        ("/tools/fastag-balance-check", "0.95", "weekly"),
        ("/tools/fastag-status", "0.90", "weekly"),
        ("/tools/toll-calculator","0.90", "weekly"),
        ("/tools/dispute-tracker","0.85", "weekly"),
        ("/blog",                "0.80", "weekly"),
        ("/coverage",            "0.75", "weekly"),
        ("/how-it-works",        "0.80", "monthly"),
        ("/features",            "0.70", "monthly"),
        ("/pricing",             "0.70", "monthly"),
        ("/about",               "0.50", "monthly"),
        ("/contact",             "0.40", "monthly"),
        ("/privacy",             "0.20", "yearly"),
        ("/terms",               "0.20", "yearly"),
    ]
    rows = [_url(SITE + path, pri, freq, today if freq in ("daily","hourly","weekly") else "") for path, pri, freq in entries]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-plazas.xml", include_in_schema=False)
async def sitemap_plazas():
    from fastapi.responses import Response as FResponse
    plazas = await db.plazas.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/toll/{p['slug']}", "0.85", "weekly", (p.get("updated_at") or "")[:10]) for p in plazas]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-states.xml", include_in_schema=False)
async def sitemap_states():
    from fastapi.responses import Response as FResponse
    states = await db.states.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/state/{s['slug']}", "0.70", "monthly", (s.get("updated_at") or "")[:10]) for s in states]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-banks.xml", include_in_schema=False)
async def sitemap_banks():
    from fastapi.responses import Response as FResponse
    banks = await db.banks.find({"is_active": {"$ne": False}}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/bank/{b['slug']}", "0.80", "monthly", (b.get("updated_at") or "")[:10]) for b in banks]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-highways.xml", include_in_schema=False)
async def sitemap_highways():
    from fastapi.responses import Response as FResponse
    highways = await db.highways.find({"is_active": {"$ne": False}}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/highway/{h['slug']}", "0.75", "monthly", (h.get("updated_at") or "")[:10]) for h in highways]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-cities.xml", include_in_schema=False)
async def sitemap_cities():
    from fastapi.responses import Response as FResponse
    cities = await db.cities.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/city/{c['slug']}", "0.75", "monthly", (c.get("updated_at") or "")[:10]) for c in cities]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-help.xml", include_in_schema=False)
async def sitemap_help():
    from fastapi.responses import Response as FResponse
    articles = await db.articles.find({"is_published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/help/{a['slug']}", "0.70", "monthly", (a.get("updated_at") or "")[:10]) for a in articles]
    return FResponse(content=_urlset(rows), media_type="application/xml")

@app.get("/sitemap-sathis.xml", include_in_schema=False)
async def sitemap_sathis():
    from fastapi.responses import Response as FResponse
    sathis = await db.sathis.find({}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(None)
    rows = [_url(f"{SITE}/sathi/{s['slug']}", "0.80", "weekly", (s.get("updated_at") or "")[:10]) for s in sathis]
    return FResponse(content=_urlset(rows), media_type="application/xml")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

async def create_indexes():
    """Create MongoDB indexes on startup for query performance at scale."""
    # jobs
    await db.jobs.create_index([("sathi_slug", 1), ("status", 1)])
    await db.jobs.create_index([("user_id", 1), ("created_at", -1)])
    await db.jobs.create_index([("cashfree_order_id", 1)], sparse=True)
    await db.jobs.create_index([("ref", 1)], unique=True, sparse=True)
    # sathis
    await db.sathis.create_index([("state", 1), ("is_available", 1)])
    await db.sathis.create_index([("slug", 1)], unique=True)
    # applications
    await db.sathi_applications.create_index([("phone", 1)], unique=True)
    await db.sathi_applications.create_index([("status", 1), ("submitted_at", -1)])
    await db.sathi_applications.create_index([("name", 1)])
    # payment_intents
    await db.payment_intents.create_index([("cashfree_order_id", 1)], unique=True, sparse=True)
    # promo_codes
    await db.promo_codes.create_index([("code", 1)], unique=True)
    # plazas / states / highways / cities / banks
    await db.plazas.create_index([("slug", 1)], unique=True, sparse=True)
    await db.plazas.create_index([("state", 1), ("highway", 1)])
    await db.states.create_index([("slug", 1)], unique=True, sparse=True)
    await db.highways.create_index([("slug", 1)], unique=True, sparse=True)
    await db.cities.create_index([("slug", 1)], unique=True, sparse=True)
    await db.banks.create_index([("slug", 1)], unique=True, sparse=True)
    # articles
    await db.articles.create_index([("slug", 1)], unique=True, sparse=True)
    await db.articles.create_index([("is_published", 1), ("category", 1)])
    # fastag orders
    await db.fastag_orders.create_index([("order_id", 1)], unique=True)
    await db.fastag_orders.create_index([("customer_phone", 1), ("created_at", -1)])
    await db.fastag_orders.create_index([("status", 1), ("created_at", -1)])
    logger.info("MongoDB indexes ensured")

@app.on_event("startup")
async def startup_db():
    try:
        await create_indexes()
    except Exception as e:
        logger.warning(f"MongoDB not reachable on startup (indexes skipped): {e}")
        logger.warning("Set MONGO_URL env var to a valid MongoDB connection string.")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
