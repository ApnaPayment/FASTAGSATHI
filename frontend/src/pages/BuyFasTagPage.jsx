import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, ChevronRight, Truck, ShieldCheck, Clock, Star,
  CreditCard, MapPin, Phone, Zap, BadgeCheck, ChevronDown,
} from "lucide-react";
import SEO from "@/components/seo/SEO";
import { fastagOrderApi } from "@/lib/api";
import { BANKS as SEED_BANKS } from "@/data/seed";
import { track } from "@/lib/analytics";

const VEHICLE_BENEFITS = [
  "Skip the bank queue — order from home",
  "Sathi visits your doorstep for activation",
  "Works at all 850+ toll plazas across India",
  "Free RC-linking + KYC assistance included",
  "Pan-India coverage: 29 states & UTs",
];

const HOW_STEPS = [
  { n: "01", icon: CreditCard, title: "Choose & Pay", body: "Pick your preferred bank, fill a 2-minute form, and pay securely online via UPI, card, or netbanking." },
  { n: "02", icon: MapPin,     title: "We Confirm",   body: "Your order is confirmed instantly. A nearby Sathi is assigned within 2 hours of payment." },
  { n: "03", icon: Truck,      title: "Sathi Visits",  body: "Your Sathi arrives at your address with the FASTag, collects your vehicle RC and documents." },
  { n: "04", icon: Zap,        title: "Live in 15 min",body: "FASTag is affixed, linked to your RC, KYC completed — your tag is active before the Sathi leaves." },
];

const WHY_US = [
  { icon: Clock,       title: "Same-day activation", body: "Most orders activated the same day. No waiting 3–5 business days for delivery." },
  { icon: ShieldCheck, title: "Verified Sathis only", body: "Every Sathi is Aadhaar-verified, background-checked, and trained in FASTag activation." },
  { icon: BadgeCheck,  title: "Bank-certified process", body: "We follow NHAI & bank guidelines. Your FASTag is registered the official way." },
  { icon: Star,        title: "4.8★ rated service", body: "Over 12,000 FASTag activations. 98% customers rate us 4+ stars." },
];

const FAQ = [
  { q: "Which documents do I need?", a: "Just your vehicle's RC (Registration Certificate). Our Sathi will help with everything else." },
  { q: "How soon will my FASTag be activated?", a: "For most cities: same day or next morning. After payment, a Sathi contacts you within 2 hours to schedule a visit." },
  { q: "Can I choose my bank?", a: "Yes — all 8 major banks: SBI, HDFC, ICICI, Axis, Kotak, Yes Bank, Paytm, and IDFC First." },
  { q: "Is the security deposit refundable?", a: "Yes. The security deposit is fully refundable when you close/surrender your FASTag account." },
  { q: "What if the Sathi can't activate it?", a: "Full refund guaranteed if activation fails for any reason within 48 hours of your order." },
  { q: "Do you cover my city?", a: "We serve 20+ major cities and expanding fast. Enter your pincode during order — we'll confirm coverage before payment." },
];

export default function BuyFasTagPage() {
  const [prices, setPrices] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    track("page_view", { page: "buy_fastag" });
    fastagOrderApi.prices()
      .then((r) => setPrices(r.data.filter((p) => p.is_available !== false)))
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, []);

  const getBankMeta = (slug) => SEED_BANKS.find((b) => b.slug === slug) || {};

  return (
    <>
      <SEO
        title="Buy FASTag Online — Doorstep Delivery & Activation | ApnaFastag"
        description="Order FASTag online from SBI, HDFC, ICICI, Axis & more. A verified Sathi delivers and activates it at your door. Same-day activation in 20+ cities."
        path="/buy-fastag"
        keywords="buy fastag online, fastag doorstep delivery, fastag activation at home, new fastag apply, fastag sathi activation"
      />

      {/* ── Hero ── */}
      <section className="relative bg-[#0A0A0A] overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        {/* background accent */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-[#FF6B00]/10 blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[#FF6B00]/5 blur-2xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="max-w-3xl">
            <span className="inline-block bg-[#FF6B00]/20 text-[#FF6B00] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6">
              New Service
            </span>
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
              Get FASTag delivered &{" "}
              <span className="text-[#FF6B00]">activated</span>{" "}
              at your door
            </h1>
            <p className="text-lg text-[#9CA3AF] mb-4 max-w-xl">
              Skip the bank. A verified Sathi comes to you — delivers your FASTag, links your RC, completes KYC — all in 15 minutes.
            </p>
            <ul className="space-y-2 mb-10">
              {VEHICLE_BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2.5 text-sm text-[#D1D5DB]">
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B00] flex-shrink-0" /> {b}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/buy-fastag/order"
                onClick={() => track("cta_buy_fastag_click", { src: "hero" })}
                className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-8 py-4 rounded-full hover:bg-[#E66000] transition-all shadow-[0_6px_0_#FFD60A] hover:-translate-y-0.5"
              >
                Order FASTag Now <ChevronRight className="w-5 h-5" />
              </Link>
              <Link
                to="/buy-fastag/track"
                className="inline-flex items-center gap-2 border-2 border-white/20 text-white font-bold px-8 py-4 rounded-full hover:border-white/40 transition-all"
              >
                <Phone className="w-4 h-4" /> Track My Order
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it Works ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B00] mb-2">How it works</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0A0A0A]">From order to active in 4 steps</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {HOW_STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative bg-[#F8F9FA] rounded-2xl p-6 border-2 border-[#E5E7EB]"
              >
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center mb-4">
                  <s.icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold text-[#9CA3AF] mb-1">{s.n}</p>
                <h3 className="font-black text-[#0A0A0A] text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-[#4B5563]">{s.body}</p>
                {i < 3 && (
                  <ChevronRight className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 w-7 h-7 text-[#E5E7EB] z-10" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bank Pricing Cards ── */}
      <section className="py-20 bg-[#F8F9FA]" id="banks">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B00] mb-2">Pricing</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0A0A0A]">Pick your bank</h2>
            <p className="text-[#6B7280] mt-3 max-w-lg mx-auto">All prices include the FASTag card, security deposit, Sathi activation service, and RC-linking assistance.</p>
          </div>

          {loadingPrices ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {prices.map((p) => {
                const bank = getBankMeta(p.bank_slug);
                return (
                  <motion.div
                    key={p.bank_slug}
                    initial={{ opacity: 0, scale: 0.97 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-white rounded-2xl border-2 border-[#E5E7EB] hover:border-[#FF6B00] transition-all p-6 flex flex-col"
                  >
                    {/* Bank logo / color chip */}
                    <div className="flex items-center gap-3 mb-5">
                      {bank.logo ? (
                        <img src={bank.logo} alt={bank.name} className="h-10 w-14 object-contain" />
                      ) : (
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                          style={{ background: bank.color || "#6B7280" }}
                        >
                          {bank.shortName?.slice(0, 2) || "??"}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-[#0A0A0A] text-sm">{bank.shortName || p.bank_slug}</p>
                        <p className="text-xs text-[#9CA3AF]">FASTag</p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <p className="text-3xl font-black text-[#0A0A0A]">₹{p.price}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">{p.security_info}</p>
                      <ul className="mt-4 space-y-1.5">
                        {["FASTag card", "Doorstep delivery", "RC linking", "KYC assistance"].map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-[#374151]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Link
                      to={`/buy-fastag/order?bank=${p.bank_slug}`}
                      onClick={() => track("cta_buy_fastag_bank", { bank: p.bank_slug })}
                      className="mt-5 inline-flex justify-center items-center gap-1.5 bg-[#0A0A0A] text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#FF6B00] transition-colors"
                    >
                      Buy {bank.shortName || ""} FASTag
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}

          <p className="text-center text-xs text-[#9CA3AF] mt-8">
            Prices inclusive of all fees. Security deposit is refundable by the bank when you surrender the tag.
          </p>
        </div>
      </section>

      {/* ── Why Us ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-[#FF6B00] mb-2">Why ApnaFastag</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#0A0A0A]">Better than going to the bank</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w, i) => (
              <motion.div
                key={w.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="text-center p-6"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
                  <w.icon className="w-7 h-7 text-[#FF6B00]" />
                </div>
                <h3 className="font-black text-[#0A0A0A] mb-2">{w.title}</h3>
                <p className="text-sm text-[#4B5563]">{w.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-[#0A0A0A]">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f, i) => (
              <div key={i} className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-bold text-[#0A0A0A]">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-[#9CA3AF] flex-shrink-0 transition-transform ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 text-sm text-[#4B5563] border-t border-[#F3F4F6] pt-4">
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 bg-[#0A0A0A]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 text-center">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-4">
            Ready? Takes 2 minutes to order.
          </h2>
          <p className="text-[#9CA3AF] mb-8 max-w-lg mx-auto">
            Pay securely, a Sathi confirms within 2 hours, and your FASTag is active same day.
          </p>
          <Link
            to="/buy-fastag/order"
            onClick={() => track("cta_buy_fastag_click", { src: "bottom_cta" })}
            className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-10 py-5 rounded-full text-lg hover:bg-[#E66000] transition-all shadow-[0_6px_0_#FFD60A]"
          >
            Order FASTag Now <ChevronRight className="w-6 h-6" />
          </Link>
        </div>
      </section>
    </>
  );
}
