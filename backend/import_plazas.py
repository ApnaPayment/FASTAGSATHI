"""
Import all 792 real NHAI toll plazas from the JSON export into MongoDB.
Also rebuilds the states collection from the actual data.

Usage:
    python3 import_plazas.py
"""

import json, re, asyncio, sys
from pathlib import Path
from collections import defaultdict
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

DATA_FILE = Path("/Users/ankitsharma/Downloads/tableConvert.com_vkuu0c.json")

# ─── State canonicalization ───────────────────────────────────────────────────

STATE_CANON = {
    "ANDHRA PRADESH":  ("andhra-pradesh",  "Andhra Pradesh"),
    "Andhra Pradesh":  ("andhra-pradesh",  "Andhra Pradesh"),
    "ASSAM":           ("assam",           "Assam"),
    "BIHAR":           ("bihar",           "Bihar"),
    "Bihar":           ("bihar",           "Bihar"),
    "CHANDIGARH":      ("chandigarh",      "Chandigarh"),
    "CHHATTISGARH":    ("chhattisgarh",    "Chhattisgarh"),
    "Chhattisgarh":    ("chhattisgarh",    "Chhattisgarh"),
    "DELHI":           ("delhi",           "Delhi"),
    "Delhi":           ("delhi",           "Delhi"),
    "GUJARAT":         ("gujarat",         "Gujarat"),
    "Gujarat":         ("gujarat",         "Gujarat"),
    "HARYANA":         ("haryana",         "Haryana"),
    "Haryana":         ("haryana",         "Haryana"),
    "HIMACHAL PRADESH":("himachal-pradesh","Himachal Pradesh"),
    "JAMMU & KASHMIR": ("jammu-kashmir",   "Jammu & Kashmir"),
    "JHARKHAND":       ("jharkhand",       "Jharkhand"),
    "Jharkhand":       ("jharkhand",       "Jharkhand"),
    "KARNATAKA":       ("karnataka",       "Karnataka"),
    "Karnataka":       ("karnataka",       "Karnataka"),
    "KERALA":          ("kerala",          "Kerala"),
    "Kerala":          ("kerala",          "Kerala"),
    "MADHYA PRADESH":  ("madhya-pradesh",  "Madhya Pradesh"),
    "Madhya Pradesh":  ("madhya-pradesh",  "Madhya Pradesh"),
    "MAHARASHTRA":     ("maharashtra",     "Maharashtra"),
    "Maharashtra":     ("maharashtra",     "Maharashtra"),
    "MEGHALAYA":       ("meghalaya",       "Meghalaya"),
    "ODISHA":          ("odisha",          "Odisha"),
    "Odisha":          ("odisha",          "Odisha"),
    "PUNJAB":          ("punjab",          "Punjab"),
    "Punjab":          ("punjab",          "Punjab"),
    "RAJASTHAN":       ("rajasthan",       "Rajasthan"),
    "Rajasthan":       ("rajasthan",       "Rajasthan"),
    "TAMIL NADU":      ("tamil-nadu",      "Tamil Nadu"),
    "Tamil Nadu":      ("tamil-nadu",      "Tamil Nadu"),
    "TELANGANA":       ("telangana",       "Telangana"),
    "Telangana":       ("telangana",       "Telangana"),
    "UTTAR PRADESH":   ("uttar-pradesh",   "Uttar Pradesh"),
    "Uttar Pradesh":   ("uttar-pradesh",   "Uttar Pradesh"),
    "UTTARAKHAND":     ("uttarakhand",     "Uttarakhand"),
    "WEST BENGAL":     ("west-bengal",     "West Bengal"),
    "West Bengal":     ("west-bengal",     "West Bengal"),
}

# Major highways per state (for state page display)
STATE_HIGHWAYS = {
    "maharashtra":     ["NH-48", "NH-160", "NH-66", "NH-752"],
    "karnataka":       ["NH-44", "NH-48", "NH-75", "NH-67"],
    "haryana":         ["NH-44", "NH-48", "NH-19", "NH-9"],
    "tamil-nadu":      ["NH-44", "NH-32", "NH-67", "NH-81"],
    "gujarat":         ["NH-48", "NH-27", "NH-64", "NH-947"],
    "rajasthan":       ["NH-48", "NH-11", "NH-25", "NH-62"],
    "uttar-pradesh":   ["NH-19", "NH-27", "NH-30", "NH-44"],
    "andhra-pradesh":  ["NH-16", "NH-44", "NH-65", "NH-167"],
    "madhya-pradesh":  ["NH-44", "NH-46", "NH-26", "NH-86"],
    "telangana":       ["NH-44", "NH-65", "NH-163", "NH-167"],
    "west-bengal":     ["NH-12", "NH-19", "NH-12A", "NH-16"],
    "punjab":          ["NH-44", "NH-54", "NH-7", "NH-5"],
    "bihar":           ["NH-19", "NH-30", "NH-28", "NH-31"],
    "odisha":          ["NH-16", "NH-55", "NH-57", "NH-200"],
    "kerala":          ["NH-66", "NH-544", "NH-183", "NH-85"],
}

# Common top issues per state (for realistic defaults)
TOP_ISSUES = [
    "Mischarge double-deduction",
    "Tag not reading",
    "Low balance failure",
    "Tag blacklisted",
    "RC mismatch",
    "KYC pending",
    "Recharge failure",
]

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[''`]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")

def title_case(text: str) -> str:
    # Better title case that handles all-caps
    return " ".join(w.capitalize() for w in text.strip().split())

def extract_highway(name: str, address: str) -> str:
    combined = f"{name} {address}"
    m = re.search(r"\b(NH[-\s]?\d+[A-Z]?|SH[-\s]?\d+)\b", combined, re.I)
    if m:
        return re.sub(r"(\w+)([-\s])(\w+)", lambda x: x.group(1).upper() + "-" + x.group(3), m.group(0).upper())
    return "NHAI"

def default_car_rate(state_slug: str) -> int:
    # Rough defaults by region
    metro = {"delhi", "chandigarh"}
    high = {"maharashtra", "karnataka", "gujarat", "haryana"}
    if state_slug in metro:   return 60
    if state_slug in high:    return 95
    return 80

def default_truck_rate(car_rate: int) -> int:
    return car_rate * 4

def top_issue_for(index: int) -> str:
    return TOP_ISSUES[index % len(TOP_ISSUES)]

# ─── Main import ─────────────────────────────────────────────────────────────

async def run():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    data = json.loads(DATA_FILE.read_text())
    print(f"Loaded {len(data)} records from {DATA_FILE.name}")

    slug_counter: dict[str, int] = {}   # deduplicate slugs
    state_stats: dict[str, dict] = defaultdict(lambda: {"plaza_count": 0, "slug": "", "name": ""})
    imported = skipped = 0

    for i, row in enumerate(data):
        name_raw   = row.get("Plaza Name", "").strip()
        address    = row.get("Address", "").strip()
        state_raw  = row.get("State", "").strip()
        city_raw   = row.get("City", "").strip()
        pin_code   = row.get("Pin Code", "").strip()

        if not name_raw or not state_raw or not city_raw:
            skipped += 1
            continue

        try:
            lat = float(row["Geo Location Latitude"])
            lng = float(row["Geo Location Longitude"])
        except (ValueError, KeyError):
            skipped += 1
            continue

        # Validate rough India bounding box
        if not (6.0 <= lat <= 37.5 and 68.0 <= lng <= 97.5):
            print(f"  Out of bounds: {name_raw} ({lat}, {lng})")
            skipped += 1
            continue

        # State
        if state_raw not in STATE_CANON:
            print(f"  Unknown state: '{state_raw}' in '{name_raw}'")
            skipped += 1
            continue

        state_slug, state_name = STATE_CANON[state_raw]
        name  = title_case(name_raw)
        city  = title_case(city_raw)

        # Generate unique slug
        base_slug = slugify(f"{name}-{city}")
        if base_slug in slug_counter:
            slug_counter[base_slug] += 1
            slug = f"{base_slug}-{slug_counter[base_slug]}"
        else:
            slug_counter[base_slug] = 0
            slug = base_slug

        car_rate = default_car_rate(state_slug)

        doc = {
            "slug":               slug,
            "name":               name,
            "address":            address,
            "state":              state_slug,
            "state_name":         state_name,
            "city":               city,
            "pin_code":           pin_code,
            "lat":                lat,
            "lng":                lng,
            "highway":            extract_highway(name, address),
            "carRate":            car_rate,
            "truckRate":          default_truck_rate(car_rate),
            "monthlyComplaints":  0,
            "avgWait":            "—",
            "topIssue":           top_issue_for(i),
        }

        await db.plazas.update_one({"slug": slug}, {"$set": doc}, upsert=True)
        imported += 1

        # Track state stats
        ss = state_stats[state_slug]
        ss["slug"]        = state_slug
        ss["name"]        = state_name
        ss["plaza_count"] = ss.get("plaza_count", 0) + 1

    # ─── Rebuild states collection ─────────────────────────────────────────
    print("\nRebuilding states collection…")
    for slug, ss in state_stats.items():
        state_doc = {
            "slug":        slug,
            "name":        ss["name"],
            "plazaCount":  ss["plaza_count"],
            "sathiCount":  0,   # populated as Sathis register
            "highways":    STATE_HIGHWAYS.get(slug, ["NHAI"]),
        }
        await db.states.update_one({"slug": slug}, {"$set": state_doc}, upsert=True)
        print(f"  {ss['name']:25s} {ss['plaza_count']:4d} plazas")

    print(f"\n✅  Imported {imported} plazas · {skipped} skipped")
    print(f"    States:  {len(state_stats)}")
    client.close()

asyncio.run(run())
