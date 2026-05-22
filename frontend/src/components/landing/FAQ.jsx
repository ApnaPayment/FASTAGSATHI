import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { track } from "@/lib/analytics";

const FAQS = [
  {
    q: "Is ApnaFastag affiliated with NHAI or any bank?",
    a: "No. ApnaFastag is an independent peer-to-peer assistance platform. We help you escalate to NHAI / your FASTag issuing bank but are not affiliated with them. Our value is speed and ground-level human help.",
  },
  {
    q: "How much does it cost for commuters?",
    a: "Free to sign up. You only pay a small resolution fee (₹49–₹199 depending on issue type) when your Sathi successfully resolves your case. No resolution, no fee.",
  },
  {
    q: "How are Sathis verified?",
    a: "Every Sathi goes through Aadhaar + selfie KYC, a video onboarding interview, and a 2-week shadowing period at a partner toll before going live. We also run continuous rating-based deactivation.",
  },
  {
    q: "What kinds of issues can a Sathi solve on the spot?",
    a: "Mischarges and double-deductions, FASTag tag-not-reading at lanes, low-balance recharge failures, KYC re-verification, blacklist removal initiations, lane jam routing, and emergency SOS for breakdowns near toll.",
  },
  {
    q: "Is my phone number shared with the Sathi?",
    a: "Never. All voice calls are bridged through a virtual masked number (Twilio / Exotel). Numbers are revealed only if you explicitly opt in. Chat stays in-app and is end-to-end logged for safety.",
  },
  {
    q: "Which cities and toll plazas are you live in?",
    a: "Currently active across 60+ toll plazas on NH-48 (Mumbai–Pune–Bengaluru), NH-44 (Delhi–Chandigarh) and NH-19 (Delhi–Agra). We're expanding to 200+ plazas by Q2.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);

  return (
    <section id="faq" data-testid="faq-section" className="relative py-24 md:py-32 bg-white">
      <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#FFD60A] text-[#0A0A0A] px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5 border-2 border-[#0A0A0A]">
            FAQ
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-[#0A0A0A] leading-[0.95]">
            Asked at every toll.
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <div
              key={i}
              data-testid={`faq-${i}`}
              className={`border-2 rounded-2xl overflow-hidden transition-colors ${
                open === i ? "border-[#0A0A0A] bg-[#F8F9FA]" : "border-[#E5E7EB] bg-white"
              }`}
            >
              <button
                onClick={() => {
                  const next = open === i ? -1 : i;
                  setOpen(next);
                  if (next === i) {
                    track(`faq_open_${i}`, { question: f.q });
                  }
                }}
                data-testid={`faq-toggle-${i}`}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="font-display font-bold text-base md:text-lg text-[#0A0A0A]">
                  {f.q}
                </span>
                <span className="w-9 h-9 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center flex-shrink-0">
                  {open === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <div className="px-6 pb-5 text-[#4B5563] leading-relaxed">{f.a}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
