import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Check, X } from "lucide-react";
import { track } from "@/lib/analytics";

const TIERS = [
  { name: "Commuter — Free Forever", price: "₹0", sub: "Sign up free. Pay only per resolved case.",
    features: [
      { ok: true, t: "Unlimited Sathi searches" }, { ok: true, t: "Real-time chat + masked calls" },
      { ok: true, t: "AI receipt scanner" }, { ok: true, t: "Journey Radar" }, { ok: true, t: "Emergency SOS" },
      { ok: true, t: "Pay only on resolution (₹49–₹199)" }, { ok: false, t: "Priority dispatch (Premium)" }, { ok: false, t: "Insurance coverage (Premium)" },
    ], cta: "Sign up free", to: "/app/signup?role=commuter", highlight: false },
  { name: "Commuter Premium", price: "₹99", sub: "Per month. Cancel anytime.",
    features: [
      { ok: true, t: "Everything in Free" }, { ok: true, t: "Priority Sathi dispatch (~45s)" }, { ok: true, t: "20% off all resolution fees" },
      { ok: true, t: "Roadside breakdown insurance ₹5k" }, { ok: true, t: "Family plan (up to 4 vehicles)" }, { ok: true, t: "Toll-history dashboard" },
      { ok: true, t: "WhatsApp support 24×7" }, { ok: false, t: "Fleet API access" },
    ], cta: "Try free for 14 days", to: "/app/signup?role=commuter&tier=premium", highlight: true },
  { name: "Fleet", price: "₹999", sub: "Per vehicle per month. 5+ vehicles.",
    features: [
      { ok: true, t: "Everything in Premium" }, { ok: true, t: "Bulk dispute filing via API" }, { ok: true, t: "Trip-level toll analytics" },
      { ok: true, t: "Dedicated success manager" }, { ok: true, t: "Custom GST invoicing" }, { ok: true, t: "Sathi network at fleet-priority queue" },
      { ok: true, t: "Custom SLA (~30s response)" }, { ok: true, t: "On-premise data export" },
    ], cta: "Talk to sales", to: "/contact?topic=fleet", highlight: false },
];

const SATHI_TIERS = [
  { name: "Sathi Basic", payout: "80%", terms: "₹0 joining fee. Take 80% of every resolution. Payouts T+2 working days." },
  { name: "Sathi Pro · ₹199/mo", payout: "90%", terms: "Priority dispatch + 90% take + analytics dashboard + premium badge." },
];

export default function PricingPage() {
  useEffect(() => { track("page_view", { page: "pricing" }); }, []);
  return (
    <>
      <SEO
        title="Pricing — Pay only when your FASTag issue is fixed"
        description="Free to sign up. Pay ₹49–₹199 per resolved case. Premium ₹99/mo with priority Sathi dispatch. Fleet plan ₹999/vehicle/mo. No subscriptions, no hidden fees."
        path="/pricing"
        keywords="apnafastag pricing, fastag help cost, fastag dispute fee, fleet fastag plan"
      />
      <PageHero
        eyebrow="Pricing"
        title={<>Pay only when an <span className="text-[#FF6B00]">issue is fixed.</span></>}
        sub="No subscriptions, no surprises, no upfront charges. Most commuters pay ₹0 in their first 3 months."
        breadcrumb={[{ label: "Pricing" }]}
      />

      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid md:grid-cols-3 gap-6">
            {TIERS.map((t) => (
              <div key={t.name} data-testid={`pricing-${t.name.split(" ")[0].toLowerCase()}`} className={`relative border-2 rounded-3xl p-7 ${t.highlight ? "bg-[#0A0A0A] text-white border-[#FF6B00] shadow-[8px_8px_0_#FF6B00]" : "bg-white text-[#0A0A0A] border-[#0A0A0A] shadow-[5px_5px_0_#0A0A0A]"}`}>
                {t.highlight && <div className="absolute -top-3 left-7 bg-[#FF6B00] text-white text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded">Most popular</div>}
                <h3 className="font-display font-bold text-2xl">{t.name}</h3>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-display font-black text-5xl">{t.price}</span>
                  {t.price !== "₹0" && <span className={`text-sm ${t.highlight ? "text-white/60" : "text-[#4B5563]"}`}>/mo</span>}
                </div>
                <p className={`text-sm mt-2 ${t.highlight ? "text-white/70" : "text-[#4B5563]"}`}>{t.sub}</p>

                <ul className="mt-6 space-y-3">
                  {t.features.map((f, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      {f.ok ? <Check className="w-5 h-5 text-[#059669] flex-shrink-0" /> : <X className={`w-5 h-5 flex-shrink-0 ${t.highlight ? "text-white/30" : "text-[#0A0A0A]/20"}`} />}
                      <span className={f.ok ? "" : t.highlight ? "text-white/40 line-through" : "text-[#0A0A0A]/40 line-through"}>{f.t}</span>
                    </li>
                  ))}
                </ul>

                <a href={t.to} onClick={() => track("pricing_cta_click", { tier: t.name })} className={`mt-7 inline-flex w-full justify-center font-bold px-5 py-3.5 rounded-full transition-all ${t.highlight ? "bg-[#FF6B00] text-white hover:bg-[#E66000]" : "bg-[#0A0A0A] text-white hover:bg-gray-800"}`}>{t.cta}</a>
              </div>
            ))}
          </div>

          {/* Resolution fee breakdown */}
          <div className="mt-16 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-7 md:p-10">
            <h3 className="font-display font-black text-2xl md:text-3xl">Per-resolution fees (Free tier)</h3>
            <p className="text-[#4B5563] mt-2">Transparent. You see the fee before the Sathi starts. If unresolved, you pay nothing.</p>
            <div className="mt-6 grid md:grid-cols-4 gap-4">
              {[
                { what: "Recharge / low balance", fee: "₹49" },
                { what: "Tag not reading", fee: "₹99" },
                { what: "Mischarge dispute", fee: "₹149" },
                { what: "KYC / blacklist fix", fee: "₹199" },
              ].map((f) => (
                <div key={f.what} className="bg-white border border-[#E5E7EB] rounded-2xl p-5">
                  <div className="text-sm text-[#4B5563]">{f.what}</div>
                  <div className="font-display font-black text-3xl text-[#FF6B00] mt-2">{f.fee}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Sathi side */}
          <div className="mt-16">
            <h3 className="font-display font-black text-2xl md:text-3xl">If you're a Sathi</h3>
            <p className="text-[#4B5563] mt-2 max-w-2xl">You keep the lion's share. No joining fee, weekly payouts, Pro tier for power earners.</p>
            <div className="mt-6 grid md:grid-cols-2 gap-5">
              {SATHI_TIERS.map((s) => (
                <div key={s.name} className="bg-[#0A0A0A] text-white rounded-2xl p-6">
                  <h4 className="font-display font-bold text-xl">{s.name}</h4>
                  <div className="font-display font-black text-5xl text-[#FFD60A] mt-2">{s.payout}</div>
                  <div className="text-xs text-white/60 uppercase tracking-widest font-bold">Take rate</div>
                  <p className="text-sm text-white/80 mt-4">{s.terms}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
