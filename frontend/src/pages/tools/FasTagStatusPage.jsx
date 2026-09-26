import React, { useEffect, useState } from "react";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { webAppSchema, faqSchema } from "@/components/seo/SEO";
import { track } from "@/lib/analytics";
import { toolsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, CheckCircle2, XCircle, AlertTriangle, Car, RefreshCw,
  CreditCard, Building2, CalendarDays, Tag, ArrowRight,
} from "lucide-react";

const STATUS_MEANINGS = [
  ["Active", "The tag works at every toll plaza on the FASTag network."],
  ["Low balance", "The wallet balance is too low, so tolls fail. Recharge the tag and it works again within minutes."],
  ["Blacklisted", "The issuing bank has blocked the tag, most often for pending KYC or vehicle details that don't match the RC. The bank can tell you the exact reason and what to submit."],
  ["Hotlisted", "The tag has been flagged by the bank, for example after a complaint or a dispute. Call the issuing bank to reactivate it."],
  ["Closed / replaced", "The tag was closed or replaced with a new one. It no longer works; only the vehicle's current tag can be used."],
  ["More than one active tag", "NHAI's One Vehicle One FASTag rule allows a single active tag per vehicle. Ask the bank of the older tag to close it."],
];

const FAQS = [
  { q: "How do I check if my FASTag is active or blacklisted?", a: "Enter your vehicle number above. The result lists every FASTag linked to the vehicle, with its bank, vehicle class, issue date and current status: active, low balance, blacklisted, hotlisted or closed." },
  { q: "Why is my FASTag blacklisted?", a: "The usual reasons are incomplete KYC, a negative balance, or vehicle details that don't match the RC. The issuing bank can confirm the exact reason." },
  { q: "Why does my vehicle show two FASTags?", a: "Usually a new tag was bought without closing the old one. Only one tag should be active per vehicle, so ask the bank of the older tag to close it." },
  { q: "Can a blacklisted FASTag be reactivated?", a: "Yes. Clear the reason first, for example complete KYC with the issuing bank or recharge a negative balance, and the bank lifts the block." },
];

export default function FasTagStatusPage() {
  const [vehicle, setVehicle] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { track("page_view", { page: "tool_fastag_status" }); }, []);

  const check = async (e) => {
    e.preventDefault();
    const v = vehicle.trim().replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(v)) {
      setError("Enter a valid vehicle number — e.g. RJ14SK1234 or MH12AB4521");
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    track("fastag_status_check", { vehicle_len: v.length });
    try {
      const res = await toolsApi.fastagStatus(v);
      setResult(res.data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not fetch status. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="FASTag status check by vehicle number — free tool"
        description="Check your FASTag status instantly by vehicle number. See if your tag is active, blacklisted, low balance, or KYC pending. Works for all banks."
        path="/tools/fastag-status"
        keywords="fastag status check, fastag vehicle number check, fastag blacklist check, fastag active status"
        jsonLd={[
          webAppSchema({ name: "FASTag Status Checker", description: "Free FASTag status lookup by vehicle number.", url: "https://apnafastag.com/tools/fastag-status" }),
          faqSchema(FAQS),
        ]}
      />

      <section className="pt-28 pb-10 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="mb-5">
            <span className="inline-block bg-[#FF6B00] text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-3">Free tool</span>
            <h1 className="font-display font-black text-3xl sm:text-4xl mb-1">
              FASTag <span className="text-[#FF6B00]">status check</span>
            </h1>
            <p className="text-sm text-[#4B5563]">Instantly see if your FASTag is active, blacklisted, or has a KYC issue. Live data — no app or login needed.</p>
          </div>

          {/* Input card */}
          <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0_#FF6B00]">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
              <Car className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <h2 className="font-display font-black text-2xl">Check FASTag status</h2>
            <p className="text-sm text-[#4B5563] mt-1">Live lookup — works for all NHAI-linked banks.</p>

            <form onSubmit={check} className="mt-5 flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                <Car className="w-4 h-4 text-[#4B5563] flex-shrink-0" />
                <input
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase().slice(0, 13))}
                  placeholder="MH 12 AB 4521"
                  className="bg-transparent flex-1 outline-none font-mono text-lg uppercase tracking-wider"
                  autoComplete="off"
                  data-testid="status-vehicle-input"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !vehicle.trim()}
                data-testid="status-check-btn"
                className="bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:translate-y-1 active:shadow-none w-full sm:w-auto"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {loading ? "Checking…" : "Check"}
              </button>
            </form>

            {error && (
              <p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626] rounded-xl px-4 py-2">{error}</p>
            )}

            <p className="mt-4 text-xs text-[#9CA3AF]">Format: State code + RTO + Series + Number · e.g. RJ14SK1234</p>
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 space-y-4"
              >
                {result.tags.length === 0 ? (
                  <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-8 text-center">
                    <XCircle className="w-12 h-12 text-[#9CA3AF] mx-auto mb-3" />
                    <h3 className="font-display font-black text-xl">No FASTag found</h3>
                    <p className="text-sm text-[#4B5563] mt-2">No FASTag is linked to <strong>{result.vehicle}</strong>. Check the number or apply for a new tag.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-bold text-[#4B5563] uppercase tracking-widest px-1">
                      {result.tags.length} tag{result.tags.length > 1 ? "s" : ""} found for {result.vehicle}
                    </p>
                    {(result.warnings || []).map((w) => (
                      <div key={w} className="flex items-start gap-2 bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl px-4 py-3 text-sm text-[#92400E]">
                        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {result.tags.map((tag, i) => (
                        <TagCard key={i} tag={tag} />
                      ))}
                    </div>
                  </>
                )}

                {/* Low balance: recharge fixes it */}
                {result.tags.some((t) => t.status === "Low balance") && (
                  <a href="/tools/fastag-recharge" className="flex items-center justify-between gap-2 bg-[#FF6B00] text-white font-bold px-5 py-4 rounded-3xl hover:bg-[#E66000] transition-colors">
                    Recharge this FASTag now <ArrowRight className="w-4 h-4" />
                  </a>
                )}

                {/* CTA for problem tags */}
                {result.tags.some((t) => !t.is_active && t.status !== "Closed / replaced") && (
                  <div className="bg-[#0A0A0A] text-white rounded-3xl p-6">
                    <h3 className="font-display font-bold text-lg mb-3">Need help resolving this?</h3>
                    <div className="space-y-2 mb-4">
                      <Action text="A Sathi can assist with blacklisting & KYC at the plaza" highlight />
                      <Action text="Contact your issuing bank's helpline for tag disputes" />
                      <Action text="Carry cash for tolls until the tag is reactivated" />
                    </div>
                    <a href="/find" className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-5 py-3 rounded-full text-sm hover:bg-[#E66000] transition-colors">
                      Find a Sathi near you <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                )}

                <button
                  onClick={() => { setResult(null); setVehicle(""); }}
                  className="w-full text-center text-sm font-bold text-[#4B5563] hover:text-[#FF6B00] py-2 transition-colors"
                >
                  ← Check another vehicle
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="font-display font-black text-2xl mb-4">What each FASTag status means</h2>
          <dl className="space-y-3">
            {STATUS_MEANINGS.map(([term, text]) => (
              <div key={term} className="border-2 border-[#E5E7EB] rounded-2xl px-4 py-3">
                <dt className="font-bold text-[#0A0A0A]">{term}</dt>
                <dd className="text-sm text-[#4B5563] mt-1">{text}</dd>
              </div>
            ))}
          </dl>
          <h2 className="font-display font-black text-2xl mt-10 mb-4">Frequently asked questions</h2>
          <div className="space-y-4">
            {FAQS.map((f) => (
              <div key={f.q}>
                <h3 className="font-bold text-[#0A0A0A]">{f.q}</h3>
                <p className="text-sm text-[#4B5563] mt-1">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCTA
        primary="Find a Sathi near you"
        secondary="Check FASTag balance"
        primaryTo="/find"
        secondaryTo="/tools/fastag-balance-check"
        note="A Sathi can resolve blacklisting, KYC issues, and mischarged tolls on the spot."
      />
    </>
  );
}

function TagCard({ tag }) {
  const active = tag.is_active;
  return (
    <div className={`border-2 rounded-3xl overflow-hidden ${active ? "border-[#059669]" : "border-[#DC2626]"}`}>
      {/* Status banner */}
      <div className={`px-4 py-3 flex items-center gap-2 ${active ? "bg-[#F0FDF4]" : "bg-[#FEF2F2]"}`}>
        {active
          ? <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0" />
          : <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
        }
        <div className={`font-display font-black text-lg ${active ? "text-[#059669]" : "text-[#DC2626]"}`}>
          {tag.status}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white px-4 py-4 grid grid-cols-2 gap-3">
        <Detail icon={Building2} label="Issuing Bank" value={tag.bank} />
        <Detail icon={Tag} label="Tag ID" value={tag.tag_id} mono truncate />
        <Detail icon={Car} label="Vehicle Class" value={tag.vehicle_type ? `${tag.vehicle_class} · ${tag.vehicle_type}` : tag.vehicle_class} truncate />
        <Detail icon={CalendarDays} label="Issue Date" value={tag.issue_date || "—"} />
      </div>
      {tag.advice && (
        <div className="bg-white px-4 pb-4 -mt-1 text-sm text-[#4B5563]">
          <span className="font-bold text-[#0A0A0A]">What to do: </span>{tag.advice}
        </div>
      )}
    </div>
  );
}

function Detail({ icon: Icon, label, value, mono, truncate }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1">
        <Icon className="w-3 h-3" />{label}
      </div>
      <div className={`font-bold text-sm text-[#0A0A0A] ${mono ? "font-mono" : ""} ${truncate ? "truncate" : ""}`} title={value}>
        {value}
      </div>
    </div>
  );
}

function Action({ text, highlight }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <ArrowRight className={`w-4 h-4 flex-shrink-0 mt-0.5 ${highlight ? "text-[#FF6B00]" : "text-white/30"}`} />
      <span className={highlight ? "text-[#FF6B00] font-bold" : "text-white/70"}>{text}</span>
    </div>
  );
}
