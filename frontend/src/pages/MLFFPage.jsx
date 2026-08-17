import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { faqSchema, breadcrumbSchema, howToSchema } from "@/components/seo/SEO";
import {
  Zap, Camera, Satellite, CheckCircle2, Clock, Fuel, AlertTriangle,
  ChevronDown, ArrowRight, Radio, Car, MapPin, Shield,
} from "lucide-react";

const FAQ_PAIRS = [
  { q: "What is MLFF (Multi-Lane Free Flow) in India?", a: "MLFF is a next-generation toll collection system where vehicles pass through toll plazas at full highway speed without stopping. Overhead GNSS/ANPR gantries identify the vehicle and automatically deduct the toll from the linked FASTag wallet — no booths, no queues, no slowing down." },
  { q: "Does MLFF replace FASTag?", a: "No. FASTag wallets remain the payment backbone. MLFF changes the trigger mechanism — instead of RFID readers at a booth, overhead cameras (ANPR) and/or GNSS satellites track your vehicle and deduct automatically. Your existing FASTag wallet and balance carry over." },
  { q: "Do I need a new device (OBU) for MLFF?", a: "For GNSS-based MLFF a small GPS On-Board Unit (OBU) is fitted in your vehicle to continuously report location. For ANPR-based MLFF only cameras are used — no new device is needed. Current NHAI pilots are camera-based, so most users need no hardware change." },
  { q: "Where is MLFF currently live in India?", a: "NHAI is piloting MLFF on select stretches — including the Dwarka Expressway (Delhi), Delhi–Meerut Expressway, and the Samruddhi Mahamarg (Maharashtra). Full-scale national rollout is targeted for 2026–2028 across all National Highways." },
  { q: "Will toll rates change under MLFF?", a: "MLFF can enable distance-based (per-km) tolling instead of fixed plaza-based charges. You pay only for the stretch of NH you actually use — which can save money on short trips where you currently pay for the full inter-plaza distance." },
  { q: "What if the MLFF system misidentifies my vehicle?", a: "ANPR cameras read your number plate and cross-check it with the Vahan database and linked FASTag. If there is a mismatch or wrong deduction, you can raise a dispute on the NHAI FASTag portal or through your bank's FASTag app — same as any mischarge dispute today. A Sathi at the nearest plaza can also help you file it on the spot." },
  { q: "Can a blacklisted FASTag still trigger MLFF deductions?", a: "No. A blacklisted tag will not be debited. However under MLFF, the system logs the vehicle crossing and may issue an e-Notice for the unpaid toll. Clearing the blacklist before travelling is essential." },
  { q: "Is MLFF mandatory or optional?", a: "Once MLFF is rolled out on a corridor, it applies to all vehicles using that highway. There will be no traditional toll booth lanes to fall back on. However NHAI will maintain compliance lanes for edge cases (exempted vehicles, disputes) during the transition period." },
];

const STEPS = [
  { icon: Satellite, label: "GNSS / ANPR detects vehicle", desc: "Overhead gantry cameras read your number plate (ANPR) or a GPS satellite continuously tracks your vehicle's position on the highway." },
  { icon: Radio, label: "System identifies your FASTag", desc: "Number plate is matched in real time against the Vahan vehicle database and the linked IDFC / bank FASTag account." },
  { icon: Zap, label: "Toll deducted automatically", desc: "The applicable toll (fixed plaza rate or per-km distance charge) is deducted from your FASTag wallet as you pass under the gantry — typically in under 300 ms." },
  { icon: Shield, label: "SMS confirmation sent", desc: "You receive an instant SMS from your bank confirming the deduction amount, plaza/stretch name, and remaining wallet balance." },
];

const COMPARE_ROWS = [
  { feature: "Do you stop?", fastag: "Slow to ~10–20 km/h at booth", mlff: "Full highway speed (80–120 km/h)" },
  { feature: "Toll trigger", fastag: "RFID reader at fixed booth", mlff: "ANPR camera or GNSS satellite" },
  { feature: "Payment method", fastag: "FASTag wallet", mlff: "Same FASTag wallet" },
  { feature: "Toll calculation", fastag: "Fixed amount per plaza", mlff: "Per km (distance-based) or fixed gantry rate" },
  { feature: "Queue at toll", fastag: "Yes — varies 0–30 min", mlff: "Zero — no queue, no plaza" },
  { feature: "Fuel wasted", fastag: "~150 ml per toll stop (average)", mlff: "None" },
  { feature: "Hardware needed", fastag: "FASTag RFID sticker (₹100)", mlff: "No new hardware (ANPR-based pilots)" },
  { feature: "Dispute process", fastag: "Bank app / NHAI portal", mlff: "Same — NHAI portal / bank app" },
];

const PILOTS = [
  { name: "Dwarka Expressway", state: "Delhi / Haryana", km: "29 km", status: "Pilot live" },
  { name: "Delhi–Meerut Expressway", state: "UP / Delhi", km: "82 km", status: "Pilot live" },
  { name: "Samruddhi Mahamarg", state: "Maharashtra", km: "701 km", status: "Planned 2025" },
  { name: "Mumbai–Pune Expressway (NH-48)", state: "Maharashtra", km: "95 km", status: "Planned 2025" },
  { name: "Delhi–Mumbai Expressway", state: "Multi-state", km: "1,386 km", status: "Planned 2026" },
  { name: "Bengaluru–Chennai Expressway", state: "Karnataka / TN", km: "262 km", status: "Planned 2026" },
];

function AccordionItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors"
      >
        <span className="pr-4">{q}</span>
        <ChevronDown className={`w-5 h-5 text-[#FF6B00] flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 text-[#4B5563] text-sm leading-relaxed border-t border-[#E5E7EB] pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function MLFFPage() {
  return (
    <>
      <SEO
        title="MLFF India — Multi-Lane Free Flow Tolling Explained 2025 · ApnaFastag"
        description="MLFF (Multi-Lane Free Flow) lets you pass toll plazas at full speed — no stopping, no queues. Understand how GNSS and ANPR gantries work, pilot locations, timeline, and what it means for your FASTag wallet."
        path="/mlff"
        keywords="MLFF India, multi lane free flow toll, GNSS toll India, ANPR toll plaza, free flow tolling India 2025, no stop toll India, FASTag MLFF, NHAI MLFF"
        jsonLd={[
          faqSchema(FAQ_PAIRS),
          breadcrumbSchema([{ label: "MLFF — Multi-Lane Free Flow", url: "/mlff" }]),
          howToSchema({
            name: "How MLFF toll deduction works in India",
            description: "Step-by-step guide to how Multi-Lane Free Flow (MLFF) automatically deducts toll from your FASTag wallet as you pass at highway speed.",
            steps: STEPS.map((s) => ({ name: s.label, text: s.desc })),
          }),
        ]}
      />

      <PageHero
        eyebrow="The Future of Tolling"
        title={<>Multi-Lane <span className="text-[#FF6B00]">Free Flow</span> — No Stop. No Queue.</>}
        sub="India is replacing toll booths with MLFF gantries. Your vehicle passes at full highway speed — overhead cameras read your plate and deduct toll from your FASTag wallet in milliseconds."
        breadcrumb={[{ label: "MLFF" }]}
      />

      {/* Quick explainer banner */}
      <section className="bg-[#FF6B00] py-4">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-wrap items-center justify-center gap-8 text-white text-sm font-bold">
          <span className="flex items-center gap-2"><Zap className="w-4 h-4" /> No stopping at booths</span>
          <span className="flex items-center gap-2"><Camera className="w-4 h-4" /> ANPR camera identifies you</span>
          <span className="flex items-center gap-2"><Shield className="w-4 h-4" /> Same FASTag wallet</span>
          <span className="flex items-center gap-2"><Fuel className="w-4 h-4" /> Zero fuel wasted at queues</span>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">How It Works</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">4 steps. Under 1 second. No queue.</h2>
            <p className="text-[#4B5563] mt-3 max-w-2xl mx-auto">From gantry detection to wallet deduction — here's exactly what happens as your vehicle passes an MLFF toll point.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl p-6 relative">
                <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-[#0A0A0A] text-white text-sm font-black flex items-center justify-center">{i + 1}</div>
                <div className="w-12 h-12 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] mb-2 text-sm">{s.label}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MLFF vs FASTag comparison */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Side by Side</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">FASTag booth vs MLFF gantry</h2>
          </div>
          <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl overflow-hidden shadow-[8px_8px_0_#FF6B00]">
            <div className="grid grid-cols-3 bg-[#0A0A0A] text-white">
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-white/60">Feature</div>
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-center">Current FASTag</div>
              <div className="px-4 py-3 text-xs font-bold uppercase tracking-widest text-center text-[#FF6B00]">MLFF</div>
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-t border-[#E5E7EB] ${i % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]"}`}>
                <div className="px-4 py-3 text-xs font-bold text-[#374151]">{row.feature}</div>
                <div className="px-4 py-3 text-xs text-[#6B7280] text-center">{row.fastag}</div>
                <div className="px-4 py-3 text-xs font-bold text-[#059669] text-center">{row.mlff}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is GNSS vs ANPR */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">The Technology</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">GNSS vs ANPR — two paths to MLFF</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-3xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2FF] flex items-center justify-center mb-5">
                <Satellite className="w-7 h-7 text-[#6366F1]" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#0A0A0A] mb-3">GNSS-Based (GPS Tracking)</h3>
              <p className="text-[#4B5563] text-sm leading-relaxed mb-4">An OBU (On-Board Unit) device is fitted in the vehicle. Satellites continuously track your position on the national highway. Toll is calculated by distance — you pay per km driven, not per plaza crossed.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Fairer — distance-proportional billing</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Works on stretches with no gantry infrastructure</span></li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Requires new OBU hardware in each vehicle</span></li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Longer rollout timeline due to hardware logistics</span></li>
              </ul>
            </div>
            <div className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-3xl p-8">
              <div className="w-14 h-14 rounded-2xl bg-[#FFF7ED] flex items-center justify-center mb-5">
                <Camera className="w-7 h-7 text-[#FF6B00]" />
              </div>
              <h3 className="font-display font-bold text-xl text-[#0A0A0A] mb-3">ANPR-Based (Camera + Number Plate)</h3>
              <p className="text-[#4B5563] text-sm leading-relaxed mb-4">Overhead cameras at gantries read your number plate using AI. The plate is matched to your FASTag in real time via the Vahan database. Toll deducted instantly as you pass. No new hardware needed in the vehicle.</p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">No device to buy — works with existing FASTag</span></li>
                <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-[#059669] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Faster rollout — only infrastructure upgrade needed</span></li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Number plate must match vehicle RC exactly</span></li>
                <li className="flex items-start gap-2"><AlertTriangle className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" /><span className="text-[#374151]">Dirty or defaced plates can cause read errors</span></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 bg-[#FFF7ED] border border-[#FF6B00]/30 rounded-2xl px-6 py-4 text-sm text-[#92400E]">
            <strong>India's approach:</strong> NHAI's current pilots are ANPR-based (no new device needed). GNSS-based MLFF is planned for longer highway corridors where per-km billing is more practical. Most passenger vehicle owners will only need to keep their FASTag active and number plate legible.
          </div>
        </div>
      </section>

      {/* Pilot locations */}
      <section className="py-16 bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Live & Planned</p>
            <h2 className="font-display font-black text-3xl md:text-4xl">MLFF pilot locations in India</h2>
            <p className="text-white/60 mt-3">NHAI is rolling out MLFF in phases — starting with high-traffic expressways, then expanding to all national highways by 2027–28.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PILOTS.map((p, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#FF6B00]/50 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-display font-bold text-white text-sm leading-snug">{p.name}</h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 ${p.status === "Pilot live" ? "bg-[#059669] text-white" : "bg-white/10 text-white/60"}`}>
                    {p.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.state}</span>
                  <span className="flex items-center gap-1"><Car className="w-3 h-3" />{p.km}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to do now */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Action Checklist</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">What you should do before MLFF goes live</h2>
          </div>
          <div className="space-y-4">
            {[
              { num: "01", title: "Ensure your FASTag is KYC-complete", body: "MLFF systems link your number plate to your FASTag via the Vahan database. If KYC is incomplete, the link may fail and you could receive an e-Notice for an unpaid toll. Check status in your bank's app." },
              { num: "02", title: "Verify your number plate matches your RC", body: "ANPR cameras read exactly what's on your plate. If your plate has typos vs your RC (Registration Certificate), deductions may fail or hit the wrong account. Get your RC corrected first." },
              { num: "03", title: "Keep your FASTag wallet adequately funded", body: "Under MLFF there's no lane attendant to flag low balance — deductions happen silently at speed. Keep at least ₹500–1,000 buffer. Enable auto-recharge alerts via your bank app." },
              { num: "04", title: "Link your FASTag to the right vehicle", body: "Each FASTag must be registered to exactly one vehicle. Mismatches between tag, RC, and number plate are the top cause of MLFF disputes. If you changed vehicles, update or reissue your tag." },
              { num: "05", title: "Save the dispute filing process", body: "MLFF mischarges will happen — wrong vehicle class, camera read errors, double deductions. Know how to raise a dispute: NHAI FASTag portal → Raise Grievance → MLFF/ANPR category. A Sathi at the nearest plaza can also help." },
            ].map((item) => (
              <div key={item.num} className="flex gap-5 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl p-5">
                <div className="text-3xl font-black text-[#E5E7EB] flex-shrink-0 w-10 text-right leading-none mt-0.5">{item.num}</div>
                <div>
                  <h3 className="font-display font-bold text-[#0A0A0A] mb-1">{item.title}</h3>
                  <p className="text-sm text-[#4B5563] leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">FAQ</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">Every MLFF question, answered</h2>
          </div>
          <div className="space-y-3">
            {FAQ_PAIRS.map((item, i) => <AccordionItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="py-10 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <p className="text-xs font-black uppercase tracking-widest text-[#9CA3AF] mb-5 text-center">Related guides</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/fastag-e-notice" className="flex items-center gap-2 text-sm font-bold text-[#FF6B00] bg-[#FFF7ED] border border-[#FF6B00]/30 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-colors">
              FASTag e-Notice guide <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/tools/fastag-status" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Check FASTag status <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/tools/dispute-tracker" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Track dispute <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/help?category=Disputes" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              FASTag disputes help <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/find" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Find a Sathi near me <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <PageCTA note="FASTag disputes resolved on-spot at the plaza — usually in under 8 minutes." />
    </>
  );
}
