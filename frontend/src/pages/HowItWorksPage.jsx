import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { howToSchema, faqSchema } from "@/components/seo/SEO";
import { AlertCircle, Radar, CheckCircle2, MapPin, Phone, FileText, BadgeCheck } from "lucide-react";
import { track } from "@/lib/analytics";

const FULL_STEPS = [
  { num: "01", icon: AlertCircle, color: "#DC2626", title: "Spot the Issue", hindi: "समस्या पहचानें",
    body: "Mischarge? Tag not reading? KYC blocked? Open ApnaFastag, choose your issue type — or tap the red SOS button if you're stuck in the lane right now.",
    detail: ["6 issue templates covering 92% of toll problems", "Multi-language input (English/Hindi/Marathi/Tamil)", "Voice note option for non-typists", "Auto-attached GPS & vehicle context"] },
  { num: "02", icon: Radar, color: "#FF6B00", title: "Ping a Sathi", hindi: "साथी को बुलाएँ",
    body: "The Journey Radar finds the 3 nearest verified Sathis. First to accept becomes your dedicated helper. Privacy-masked calling + in-app chat open instantly.",
    detail: ["~90 second average accept time", "Twilio/Exotel masked calling — no number leaks", "Real-time chat with image sharing", "Live ETA + arrival notifications"] },
  { num: "03", icon: CheckCircle2, color: "#059669", title: "Resolved on the Spot", hindi: "तुरंत हल",
    body: "Sathi handles bank escalation, NHAI dispute filing, recharge, or KYC paperwork live. Receipt OCR auto-files evidence. You pay ₹49–₹199 only on success.",
    detail: ["AI receipt scanner extracts plaza, amount, time", "Razorpay escrow — no resolution, no charge", "Auto-generated dispute reference to NHAI/bank", "Post-resolution rating + receipt SMS"] },
];

const USE_CASES = [
  { title: "Mischarge / Double-deduction", desc: "₹420 charged where it should be ₹95? Sathi files NHAI Form 21 + bank dispute live.", color: "#DC2626" },
  { title: "FASTag not reading", desc: "Stuck in the lane with horns behind you? Sathi walks over, swaps lane, talks to plaza staff.", color: "#FF6B00" },
  { title: "Low balance failure", desc: "Recharge stuck or below threshold? Sathi recharges via Paytm/UPI on-spot.", color: "#059669" },
  { title: "KYC / blacklist", desc: "Tag blacklisted for KYC? Sathi initiates re-KYC paperwork + escalation while you wait.", color: "#F59E0B" },
  { title: "Vehicle class mismatch", desc: "Car charged as truck? Sathi gets the class-correction approved at the plaza office.", color: "#059669" },
  { title: "Emergency SOS", desc: "Breakdown, accident, or harassment near toll? GPS broadcast to 3 nearest Sathis with priority dispatch.", color: "#DC2626" },
];

export default function HowItWorksPage() {
  useEffect(() => { track("page_view", { page: "how_it_works" }); }, []);
  return (
    <>
      <SEO
        title="How ApnaFastag works — from stuck to sorted in 8 minutes"
        description="Three steps: spot the issue, ping a verified Sathi, get resolved on the spot. The full playbook for FASTag rescue at any toll plaza in India."
        path="/how-it-works"
        keywords="how apnafastag works, fastag help, toll plaza rescue, fastag dispute process"
        jsonLd={[
          howToSchema({
            name: "How to resolve a FASTag issue at a toll plaza",
            description: "Get your FASTag problem resolved on-spot by a verified Sathi in under 8 minutes.",
            steps: FULL_STEPS.map(s => ({ name: s.title, text: s.body })),
          }),
          faqSchema([
            { q: "How long does it take to resolve a FASTag issue?", a: "The average resolution time is under 8 minutes. A Sathi accepts your request within 90 seconds and resolves most issues on the spot." },
            { q: "How does a Sathi reach me at a toll plaza?", a: "Sathis are stationed at or near major toll plazas. Once you ping, the nearest Sathi accepts and walks over or drives to your lane within 90 seconds." },
            { q: "What issues can a Sathi resolve?", a: "Mischarges, double deductions, blacklisted tags, KYC pending, recharge failures, RC mismatch, and FASTag not scanning — covering 92% of all toll problems." },
            { q: "Do I pay even if my issue isn't resolved?", a: "No. ApnaFastag operates on a success-only fee model. You pay ₹49–₹199 only after your issue is confirmed resolved." },
          ]),
        ]}
      />
      <PageHero
        eyebrow="The full playbook"
        title={<>From <span className="text-[#FF6B00]">stuck</span> to <span className="text-[#FF6B00]">sorted</span> — every step.</>}
        hindi="हर step में एक साथी।"
        sub="Average commuter goes from opening the app to issue closure in under 8 minutes. Here's exactly what happens behind the radar."
        breadcrumb={[{ label: "How it Works" }]}
      />

      {/* Full steps */}
      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12 space-y-16">
          {FULL_STEPS.map((s, i) => (
            <div key={s.num} className="grid md:grid-cols-12 gap-8 items-start">
              <div className="md:col-span-1">
                <div className="font-display font-black text-6xl text-[#0A0A0A]/15 leading-none">{s.num}</div>
              </div>
              <div className="md:col-span-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: `${s.color}15` }}>
                  <s.icon className="w-7 h-7" style={{ color: s.color }} />
                </div>
                <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">{s.title}</h2>
                <p className="font-hindi text-base font-semibold text-[#FF6B00] mb-3">{s.hindi}</p>
                <p className="text-[#4B5563] leading-relaxed text-lg">{s.body}</p>
              </div>
              <div className="md:col-span-6 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-7 shadow-[6px_6px_0_#0A0A0A]">
                <div className="text-[11px] uppercase tracking-widest font-bold mb-3" style={{ color: s.color }}>What you get</div>
                <ul className="space-y-3">
                  {s.detail.map((d, k) => (
                    <li key={k} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                      <span className="text-[#0A0A0A] font-medium">{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 md:py-24 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A0A] tracking-tight mb-3">Six scenarios. One Sathi.</h2>
          <p className="text-[#4B5563] text-lg max-w-2xl mb-12">Real situations we've resolved at NH-48, NH-44 and NH-19 plazas this month.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {USE_CASES.map((u) => (
              <div key={u.title} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-6 hover:-translate-y-1 transition-transform" style={{ boxShadow: `5px 5px 0 ${u.color}` }}>
                <div className="w-10 h-10 rounded-full mb-4" style={{ backgroundColor: u.color }} />
                <h3 className="font-display font-bold text-lg text-[#0A0A0A]">{u.title}</h3>
                <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">{u.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCTA note="Free to sign up. Pay only when an issue is resolved." />
    </>
  );
}
