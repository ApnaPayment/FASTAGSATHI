import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import ProtectedAction from "@/components/auth/ProtectedAction";
import MapView from "@/components/map/MapView";
import { motion } from "framer-motion";
import {
  BadgeCheck, Star, Clock, MapPin, Phone, MessageSquare, Languages,
  Shield, Calendar, Send, CheckCircle2, ArrowRight, Loader2, Images, Building2,
} from "lucide-react";
import { getSathiBySlug } from "@/data/sathis";
import { PLAZAS, STATES } from "@/data/seed";
import { track } from "@/lib/analytics";
import { sathiApi, paymentsApi } from "@/lib/api";
import { Tag } from "lucide-react";

const CF_MODE = process.env.REACT_APP_CASHFREE_MODE || "sandbox";
const ISSUE_FEES = { dispute: 99, kyc: 149, recharge: 49, sos: 199 };

async function loadCashfree() {
  if (window.Cashfree) return window.Cashfree;
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    s.onload = () => resolve(window.Cashfree);
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
function fullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return "";
  return `${BACKEND}${url}`;
}

const ALL_BANKS = [
  { slug: "sbi-fastag",    name: "SBI FASTag",    color: "#22409A" },
  { slug: "paytm-fastag",  name: "Paytm FASTag",  color: "#00BAF2" },
  { slug: "icici-fastag",  name: "ICICI FASTag",  color: "#F58220" },
  { slug: "hdfc-fastag",   name: "HDFC FASTag",   color: "#004C8F" },
  { slug: "axis-fastag",   name: "Axis FASTag",   color: "#97144D" },
  { slug: "kotak-fastag",  name: "Kotak FASTag",  color: "#ED1C24" },
  { slug: "yes-fastag",    name: "Yes Bank",      color: "#003087" },
  { slug: "idfc-fastag",   name: "IDFC FASTag",   color: "#6B2D8B" },
];

const SERVICE_LABELS = {
  dispute: "Mischarge / Dispute filing",
  kyc: "KYC & Re-KYC paperwork",
  recharge: "Recharge & low-balance fixes",
  sos: "Emergency / SOS dispatch",
};

const DAYS = [["mon","Mon"],["tue","Tue"],["wed","Wed"],["thu","Thu"],["fri","Fri"],["sat","Sat"],["sun","Sun"]];

export default function SathiProfilePage() {
  const { slug } = useParams();
  const [s, setS] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sathiApi.get(slug)
      .then((r) => setS(r.data))
      .catch(() => setS(getSathiBySlug(slug) || null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => { if (s) track("sathi_profile_view", { slug: s.slug }); }, [s]);

  if (loading) {
    return (
      <section className="pt-40 pb-32 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
      </section>
    );
  }

  if (!s) {
    return (
      <section className="pt-40 pb-32 text-center">
        <h1 className="font-display font-black text-4xl">Sathi not found</h1>
        <Link to="/find" className="text-[#FF6B00] font-bold mt-4 inline-block">Find a Sathi near you →</Link>
      </section>
    );
  }

  const state = STATES.find((x) => x.slug === s.state);
  const plaza = PLAZAS.find((p) => p.slug === s.homePlaza);
  const supportedBanks = ALL_BANKS.filter((b) => (s.banks || []).includes(b.slug));

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: s.name,
    description: s.bio,
    image: s.avatar,
    knowsLanguage: s.languages,
    workLocation: { "@type": "Place", name: plaza?.name, address: { "@type": "PostalAddress", addressLocality: s.city, addressRegion: state?.name } },
    aggregateRating: { "@type": "AggregateRating", ratingValue: s.rating, reviewCount: s.reviewCount, bestRating: 5 },
    url: `https://apnafastag.in/sathi/${s.slug}`,
  };

  return (
    <>
      <SEO
        title={`${s.name} · Verified Fastag Sathi at ${plaza?.name || s.city}`}
        description={`${s.name} — verified Fastag Sathi at ${plaza?.name || s.city} (${state?.name}). ★${s.rating} from ${s.reviewCount} reviews · ${s.jobsResolved} jobs resolved · responds in ~${s.avgResponseSec}s. Speaks ${s.languages?.join(", ")}.`}
        path={`/sathi/${s.slug}`}
        image={s.avatar}
        keywords={`${s.name} sathi, ${s.city} fastag, ${plaza?.name} sathi, ${s.languages?.join(", ")} fastag help`}
        jsonLd={[personSchema, breadcrumbSchema([
          { label: "Find a Sathi", url: "/find" },
          { label: s.name, url: `/sathi/${s.slug}` },
        ])]}
      />

      {/* Hero */}
      <section className="relative bg-[#0A0A0A] text-white pt-32 pb-12 overflow-hidden">
        <div className="absolute inset-0 dot-grid-dark opacity-30" />
        <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#FF6B00]/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <nav className="text-xs text-white/60 mb-5 flex items-center gap-1.5">
            <Link to="/find" className="hover:text-[#FF6B00]">Find a Sathi</Link>
            <span>›</span>
            <Link to={`/state/${s.state}`} className="hover:text-[#FF6B00]">{state?.name}</Link>
            <span>›</span>
            <span className="text-white">{s.name}</span>
          </nav>

          <div className="grid md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8">
              <div className="flex items-start gap-5">
                {fullUrl(s.avatar)
                  ? <img
                      src={fullUrl(s.avatar)}
                      alt={s.name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-[#FF6B00] flex-shrink-0"
                      onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
                    />
                  : null}
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 border-[#FF6B00] flex-shrink-0 bg-[#FF6B00]/20 items-center justify-center font-display font-black text-5xl text-[#FF6B00]"
                  style={{ display: fullUrl(s.avatar) ? "none" : "flex" }}
                >
                  {(s.name || "S")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {s.verified && <span className="inline-flex items-center gap-1 bg-[#059669] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded"><BadgeCheck className="w-3 h-3" /> Verified Sathi</span>}
                    {s.premium && <span className="bg-[#FF6B00] text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">★ Pro</span>}
                  </div>
                  <h1 className="font-display font-black text-3xl md:text-5xl mt-2 tracking-tight">{s.name}</h1>
                  <p className="text-white/70 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#FF6B00]" />
                    Operating from <Link to={`/toll/${s.homePlaza}`} className="text-[#FFD60A] underline">{plaza?.name}</Link>
                  </p>
                  {s.center?.active && (
                    <div className="mt-2 inline-flex items-center gap-2 bg-[#FF6B00]/20 border border-[#FF6B00]/40 rounded-xl px-3 py-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#FF6B00] flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#FF6B00]">Apnafastag Center</span>
                        {s.center.name && <span className="text-white/80 text-xs ml-1.5">· {s.center.name}</span>}
                        {s.center.address && <p className="text-white/60 text-[11px] mt-0.5">{s.center.address}</p>}
                        {s.center.hours && <p className="text-white/50 text-[11px]">{s.center.hours}</p>}
                      </div>
                      <span className="ml-1 w-2 h-2 rounded-full bg-[#059669] animate-pulse flex-shrink-0" />
                    </div>
                  )}
                </div>
              </div>

              <p className="mt-5 text-white/80 leading-relaxed max-w-3xl">{s.bio}</p>

              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Rating" value={`★ ${s.rating}`} sub={`${s.reviewCount} reviews`} accent="#FFD60A" />
                <Stat label="Jobs done" value={(s.jobsResolved || 0).toLocaleString("en-IN")} sub="all time" accent="#FF6B00" />
                <Stat label="Avg response" value={`${s.avgResponseSec}s`} sub="on weekdays" accent="#059669" />
                <Stat label="Languages" value={String(s.languages?.length || 0)} sub={s.languages?.join(" · ")} accent="#FF6B00" />
              </div>

              {(s.avg_speed || s.avg_communication || s.avg_resolution) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {s.avg_speed && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-bold text-white">
                      <Clock className="w-3 h-3 text-[#FFD60A]" /> Speed · {s.avg_speed.toFixed(1)}
                    </span>
                  )}
                  {s.avg_communication && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-bold text-white">
                      <MessageSquare className="w-3 h-3 text-[#FFD60A]" /> Communication · {s.avg_communication.toFixed(1)}
                    </span>
                  )}
                  {s.avg_resolution && (
                    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-xs font-bold text-white">
                      <CheckCircle2 className="w-3 h-3 text-[#FFD60A]" /> Resolution · {s.avg_resolution.toFixed(1)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="md:col-span-4">
              <ProtectedAction label="contact this Sathi" noun="contact details">
                <div className="bg-white text-[#0A0A0A] rounded-3xl p-6 shadow-2xl">
                  <h3 className="font-display font-bold text-xl">Contact {s.name.split(" ")[0]}</h3>
                  <p className="text-xs text-[#4B5563] mt-1">Privacy-masked call/chat. Real number stays hidden.</p>
                  <div className="mt-4 space-y-2">
                    <a
                      href={`tel:${s.contact?.phone?.replace(/\s+/g, "")}`}
                      data-testid="sathi-call-btn"
                      onClick={() => track("sathi_call", { slug: s.slug })}
                      className="flex items-center justify-between bg-[#F8F9FA] border-2 border-[#E5E7EB] hover:border-[#0A0A0A] rounded-2xl p-3"
                    >
                      <span className="flex items-center gap-2 font-bold"><Phone className="w-4 h-4 text-[#FF6B00]" />Call (masked)</span>
                      <span className="font-mono text-sm text-[#4B5563]">{s.contact?.phone}</span>
                    </a>
                    <a
                      href={`https://wa.me/${s.contact?.whatsapp?.replace(/\D/g, "")}`}
                      data-testid="sathi-whatsapp-btn"
                      onClick={() => track("sathi_whatsapp", { slug: s.slug })}
                      className="flex items-center justify-between bg-[#F8F9FA] border-2 border-[#E5E7EB] hover:border-[#0A0A0A] rounded-2xl p-3"
                    >
                      <span className="flex items-center gap-2 font-bold"><MessageSquare className="w-4 h-4 text-[#059669]" />WhatsApp</span>
                      <span className="font-mono text-sm text-[#4B5563]">{s.contact?.whatsapp}</span>
                    </a>
                  </div>
                </div>
              </ProtectedAction>
            </div>
          </div>
        </div>
      </section>

      {/* Services + Banks + Active Hours */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-12 gap-6">
          <div className="md:col-span-4 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
            <Shield className="w-7 h-7 text-[#FF6B00] mb-3" />
            <h3 className="font-display font-bold text-xl">Services</h3>
            <ul className="mt-3 space-y-2">
              {(s.services || []).map((svc) => (
                <li key={svc} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" />
                  {SERVICE_LABELS[svc] || svc}
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
            <BadgeCheck className="w-7 h-7 text-[#059669] mb-3" />
            <h3 className="font-display font-bold text-xl">Supported banks</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {supportedBanks.map((b) => (
                <span key={b.slug} className="inline-flex items-center gap-1.5 bg-white border-2 border-[#E5E7EB] rounded-full px-3 py-1.5 text-xs font-bold">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: b.color }} />{b.name}
                </span>
              ))}
            </div>
            <div className="mt-3 text-xs text-[#4B5563]">Speaks: <strong className="text-[#0A0A0A]">{s.languages?.join(", ")}</strong></div>
          </div>

          <div className="md:col-span-4 bg-[#0A0A0A] text-white rounded-2xl p-6">
            <Clock className="w-7 h-7 text-[#FFD60A] mb-3" />
            <h3 className="font-display font-bold text-xl">Active hours</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {DAYS.map(([k, lbl]) => (
                <li key={k} className="flex justify-between border-b border-white/10 pb-1.5">
                  <span className="text-white/60 font-bold">{lbl}</span>
                  <span className={s.activeHours?.[k] === "Off" ? "text-white/40" : "text-[#FFD60A] font-mono"}>{s.activeHours?.[k]}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Map + booking */}
      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 min-w-0">
            <h2 className="font-display font-black text-3xl md:text-4xl mb-4 flex items-center gap-2">
              <MapPin className="w-7 h-7 text-[#FF6B00]" />Live location
            </h2>
            <p className="text-[#4B5563] mb-4">{s.name} is currently active at <strong className="text-[#0A0A0A]">{plaza?.name}</strong> on {plaza?.highway}.</p>
            <MapView
              center={{ lat: s.lat, lng: s.lng }}
              sathis={[{ ...s }]}
              plazas={plaza ? [plaza] : []}
              height={460}
            />
          </div>

          <div className="lg:col-span-5 min-w-0 lg:sticky lg:top-24 self-start">
            <BookingPanel sathi={s} />
          </div>
        </div>
      </section>

      {/* Gallery */}
      {(s.gallery || []).length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
            <h2 className="font-display font-black text-3xl md:text-4xl mb-6 flex items-center gap-3">
              <Images className="w-7 h-7 text-[#FF6B00]" />Business photos
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {(s.gallery || []).map((img, i) => (
                <div key={i} className="aspect-square rounded-2xl overflow-hidden border-2 border-[#E5E7EB] hover:border-[#FF6B00] transition-colors">
                  <img
                    src={fullUrl(img)}
                    alt={`${s.name} photo ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.parentElement.style.display = "none"; }}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Reviews */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-3xl md:text-4xl mb-2 flex items-center gap-3">
            <Star className="w-7 h-7 fill-[#F59E0B] text-[#F59E0B]" />{s.rating} · {s.reviewCount} reviews
          </h2>
          <p className="text-[#4B5563] mb-6">Verified after on-platform resolutions. No paid reviews.</p>
          <div className="space-y-4">
            {(s.reviews || []).map((r, i) => (
              <div key={i} data-testid={`review-${i}`} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold">{r.author}</span>
                  <span className="text-xs text-[#4B5563]">{r.date}</span>
                </div>
                <div className="flex mt-1">{Array.from({ length: r.stars }).map((_, k) => <Star key={k} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />)}</div>
                {(r.speed || r.communication || r.resolution) && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {r.speed        && <span className="text-[10px] font-bold text-[#4B5563] bg-[#F3F4F6] rounded-full px-2 py-0.5">Speed {r.speed}/5</span>}
                    {r.communication && <span className="text-[10px] font-bold text-[#4B5563] bg-[#F3F4F6] rounded-full px-2 py-0.5">Comm {r.communication}/5</span>}
                    {r.resolution   && <span className="text-[10px] font-bold text-[#4B5563] bg-[#F3F4F6] rounded-full px-2 py-0.5">Resolution {r.resolution}/5</span>}
                  </div>
                )}
                <p className="text-[#0A0A0A] mt-3 leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCTA primary="Back to map" secondary="Find another Sathi" primaryTo="/find" secondaryTo="/find" note="Need a different language or city? Search again with one click." />
    </>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
      <div className="text-[10px] uppercase tracking-widest font-bold text-white/50">{label}</div>
      <div className="font-display font-black text-2xl mt-1" style={{ color: accent }}>{value}</div>
      <div className="text-[10px] text-white/60 mt-0.5">{sub}</div>
    </div>
  );
}

function BookingPanel({ sathi }) {
  const [issue, setIssue] = useState((sathi.services || [])[0] || "dispute");
  const [vehicle, setVehicle] = useState("");
  const [note, setNote] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoResult, setPromoResult] = useState(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const baseFee = ISSUE_FEES[issue] || 99;
  const finalFee = promoResult?.valid ? promoResult.final_amount : baseFee;

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoResult(null);
    try {
      const r = await paymentsApi.validatePromo(code, issue);
      setPromoResult(r.data);
    } catch {
      setPromoResult({ valid: false, message: "Could not validate code. Try again." });
    } finally {
      setPromoChecking(false);
    }
  };

  const clearPromo = () => { setPromoInput(""); setPromoResult(null); };

  const submit = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await paymentsApi.initiateBooking({
        sathi_slug: sathi.slug,
        issue,
        vehicle_number: vehicle,
        note,
        promo_code: promoResult?.valid ? promoInput.trim().toUpperCase() : null,
      });
      track("sathi_booking_pay_initiated", { slug: sathi.slug, issue, amount: res.data.amount });
      const CF = await loadCashfree();
      const cashfree = CF({ mode: CF_MODE });
      cashfree.checkout({ paymentSessionId: res.data.payment_session_id, redirectTarget: "_self" });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Could not initiate payment. Please try again.";
      setErr(msg);
      setLoading(false);
    }
  };

  return (
    <ProtectedAction label="book this Sathi" noun="booking">
      <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-6 md:p-7 shadow-[6px_6px_0_#FF6B00]">
        <h3 className="font-display font-bold text-2xl">Book this Sathi</h3>
        <p className="text-sm text-[#4B5563] mt-1">Pay now to confirm your booking. {sathi.name.split(" ")[0]} gets notified instantly.</p>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">
            What's the issue?
            <select
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              data-testid="booking-issue"
              className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none font-medium"
            >
              {(sathi.services || []).map((sv) => (
                <option key={sv} value={sv}>
                  {`${SERVICE_LABELS[sv] || sv} — ₹${ISSUE_FEES[sv] || 99}`}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">
            Vehicle number
            <input
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value.toUpperCase())}
              placeholder="MH 12 AB 4521"
              data-testid="booking-vehicle"
              className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none uppercase font-mono"
            />
          </label>

          <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">
            Anything {sathi.name.split(" ")[0]} should know?
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              placeholder="e.g. mischarged ₹420 instead of ₹95, screenshot attached…"
              data-testid="booking-note"
              className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none"
            />
          </label>

          {err && (
            <p className="text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626] rounded-xl px-4 py-3">{err}</p>
          )}

          {/* Promo code */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#0A0A0A] mb-1">Promo code <span className="text-[#9CA3AF] font-normal normal-case tracking-normal">(optional)</span></p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-3 py-2.5 transition-colors">
                <Tag className="w-3.5 h-3.5 text-[#9CA3AF] flex-shrink-0" />
                <input
                  value={promoInput}
                  onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoResult(null); }}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyPromo())}
                  placeholder="WELCOME50"
                  aria-label="Promo code"
                  className="bg-transparent flex-1 outline-none text-sm font-mono uppercase tracking-wider"
                />
                {promoResult?.valid && (
                  <button type="button" onClick={clearPromo} className="text-[#9CA3AF] hover:text-[#DC2626] text-xs font-bold">✕</button>
                )}
              </div>
              <button
                type="button"
                onClick={applyPromo}
                disabled={promoChecking || !promoInput.trim() || promoResult?.valid}
                className="px-4 py-2.5 border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold text-sm rounded-xl hover:bg-[#0A0A0A] hover:text-white transition-colors disabled:opacity-40"
              >
                {promoChecking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
              </button>
            </div>
            {promoResult && (
              <p className={`mt-1.5 text-xs font-semibold ${promoResult.valid ? "text-[#059669]" : "text-[#DC2626]"}`}>
                {promoResult.valid ? "✓ " : "✗ "}{promoResult.message}
              </p>
            )}
          </div>

          {/* Fee summary */}
          <div className="flex items-center justify-between bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl px-4 py-3">
            <div>
              <span className="text-sm font-semibold text-[#4B5563]">Booking fee</span>
              {promoResult?.valid && (
                <span className="ml-2 text-xs line-through text-[#9CA3AF]">₹{baseFee}</span>
              )}
            </div>
            <span className={`font-display font-black text-xl ${promoResult?.valid ? "text-[#059669]" : "text-[#0A0A0A]"}`}>
              ₹{finalFee}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !vehicle.trim()}
            data-testid="booking-submit"
            className="w-full bg-[#FF6B00] text-white font-bold py-4 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] inline-flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_#0A0A0A]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Opening payment…" : `Pay ₹${finalFee} & Book`}
          </button>
          <p className="text-xs text-[#9CA3AF] text-center">Secure payment via Cashfree · Refundable if Sathi can't resolve</p>
        </form>
      </div>
    </ProtectedAction>
  );
}
