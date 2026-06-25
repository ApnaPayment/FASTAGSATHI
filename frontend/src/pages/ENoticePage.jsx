import React, { useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { faqSchema, breadcrumbSchema, howToSchema } from "@/components/seo/SEO";
import {
  AlertTriangle, CheckCircle2, XCircle, ChevronDown, ArrowRight,
  FileText, CreditCard, Clock, Phone, Shield, Zap, Ban,
} from "lucide-react";

const FAQ_PAIRS = [
  { q: "What is a FASTag e-Notice?", a: "A FASTag e-Notice is an electronic penalty notice issued by NHAI or a toll operator when a vehicle passes through a FASTag toll lane without a valid, functional FASTag or with insufficient wallet balance. The notice is sent via SMS and/or email to the registered mobile number linked to the vehicle's Vahan record." },
  { q: "How much is the FASTag e-Notice penalty?", a: "The penalty is 2× the applicable toll amount for that plaza and vehicle class. For example, if the standard car toll is ₹95, the penalty is ₹190. This is mandated under the National Highways Fee (Determination of Rates and Collection) Rules, 2008 as amended in 2021 under the FASTag mandate." },
  { q: "How do I check if I have received an e-Notice?", a: "Check your registered mobile number for an SMS from NHAI or the toll operator. You can also log in to the NHAI FASTag portal (ihmcl.com) or your bank's FASTag app. Under 'My Account' or 'Notices / Penalties', you will see any pending e-Notices with transaction reference and amount." },
  { q: "What happens if I ignore the e-Notice?", a: "Ignoring an e-Notice can result in: (1) your FASTag being blacklisted, blocking all future toll crossings, (2) the vehicle being flagged in the Vahan database which can affect RC renewal and PUC certificate, and (3) the penalty amount accumulating interest or additional penalties. It is strongly advised to pay or dispute within 30 days." },
  { q: "Can I dispute a wrong e-Notice?", a: "Yes. If the e-Notice was issued by mistake — such as ANPR misread your number plate, balance was sufficient but the system failed, or you were not in the FASTag lane — you can raise a dispute on the NHAI FASTag portal within 30 days. Attach supporting documents: bank statement showing balance, toll receipt, or dashcam footage if available." },
  { q: "My FASTag had sufficient balance — why did I get an e-Notice?", a: "Common reasons: (1) tag was blacklisted due to low minimum balance at time of crossing even if funds were added later, (2) FASTag not linked to this vehicle (linked to a different vehicle), (3) RFID or ANPR could not read the tag — dirty windshield, sticker peeling, or blocked by sun film. Contact your bank's FASTag helpline immediately with the TRAN_REF from the notice." },
  { q: "Will the e-Notice affect my FASTag blacklist status?", a: "An unpaid e-Notice can trigger automatic blacklisting of your FASTag by the issuer bank once NHAI flags the vehicle. Once blacklisted, every toll crossing fails and you are charged 2× toll at every subsequent plaza until the blacklist is removed. Pay or dispute e-Notices promptly to avoid this cascade." },
  { q: "How long does dispute resolution take?", a: "NHAI's standard SLA for e-Notice disputes is 7–30 working days. If the dispute is upheld, the penalty is waived and no blacklisting occurs. If rejected, you receive a reason and can appeal. A Sathi at the toll plaza can file the dispute on your behalf and often get faster resolution through the plaza's internal escalation channel." },
];

const VIOLATION_TYPES = [
  {
    icon: Ban,
    color: "bg-red-100 text-red-600 border-red-200",
    title: "No FASTag in FASTag lane",
    desc: "Driving through a dedicated FASTag lane with no tag fitted or with a tag that is not NETC-registered.",
    penalty: "2× toll + immediate cash demand at booth",
  },
  {
    icon: CreditCard,
    color: "bg-orange-100 text-orange-600 border-orange-200",
    title: "Insufficient wallet balance",
    desc: "Tag is read, bank declines the debit because wallet balance is below the toll amount or minimum balance threshold.",
    penalty: "2× toll via e-Notice to registered mobile",
  },
  {
    icon: XCircle,
    color: "bg-red-100 text-red-600 border-red-200",
    title: "Blacklisted FASTag",
    desc: "Tag has been blacklisted (minimum balance not maintained, KYC incomplete, reported lost/stolen) — debit is rejected by the bank.",
    penalty: "2× toll via e-Notice + blacklist remains active",
  },
  {
    icon: FileText,
    color: "bg-yellow-100 text-yellow-700 border-yellow-200",
    title: "Vehicle–tag mismatch",
    desc: "FASTag is linked to a different vehicle than the one crossing. ANPR reads your plate but finds a different tag linked — debit fails.",
    penalty: "2× toll via e-Notice; vehicle flagged in Vahan",
  },
  {
    icon: AlertTriangle,
    color: "bg-purple-100 text-purple-700 border-purple-200",
    title: "Tag unreadable (RFID/ANPR failure)",
    desc: "Tag is physically present but cannot be read — sticker peeled, sun film blocking RFID, dirty number plate, camera read failure.",
    penalty: "2× toll via e-Notice; treat as no FASTag",
  },
  {
    icon: FileText,
    color: "bg-blue-100 text-blue-700 border-blue-200",
    title: "Wrong vehicle class",
    desc: "FASTag registered as 'Car' but vehicle is a van or SUV charged at higher rate. Underpayment triggers an e-Notice for the difference × 2.",
    penalty: "2× the differential toll amount",
  },
];

const PAY_STEPS = [
  { title: "Find your Notice Reference", body: "Locate the e-Notice SMS — note the Transaction Reference (TRAN_REF), plaza name, crossing date/time, and penalty amount." },
  { title: "Log in to NHAI FASTag portal", body: "Visit ihmcl.com → My Account → FASTag Notices. Or open your bank's FASTag app (IDFC FASTag, SBI FASTag, etc.) → Notices / Penalties section." },
  { title: "Select the notice and click Pay", body: "Choose the specific e-Notice. Verify the amount (2× toll). Click 'Pay Now'. Payment can be made via UPI, net banking, debit card, or directly debited from your FASTag wallet." },
  { title: "Save the payment receipt", body: "Download or screenshot the payment confirmation. The NHAI portal issues a receipt with a settlement reference. Store this for 90 days in case of follow-up queries." },
  { title: "Confirm blacklist removal", body: "If your tag was blacklisted due to this notice, check status in your bank app 24–48 hours after payment. If still blacklisted, call your bank's FASTag helpline with the payment receipt." },
];

const DISPUTE_STEPS = [
  { title: "Gather evidence first", body: "Collect: bank statement showing sufficient balance at crossing time, FASTag transaction history, dashcam footage if available, or any toll receipt. The stronger your evidence, the faster the resolution." },
  { title: "Go to NHAI Grievance portal", body: "Visit ihmcl.com → Raise Grievance → Category: 'e-Notice / Penalty Dispute'. Enter the TRAN_REF from the SMS and your vehicle number." },
  { title: "Fill dispute details", body: "Select the dispute reason (e.g., 'Sufficient balance existed', 'Not in FASTag lane', 'ANPR error'). Describe what happened. Attach your evidence documents (JPG/PDF, max 2 MB)." },
  { title: "Note your Grievance ID", body: "On submission you receive a Grievance Reference Number. Track status at ihmcl.com → Track Grievance. NHAI's SLA is 7–30 working days." },
  { title: "Escalate if needed", body: "If no response after 30 days, escalate via the Ministry of Road Transport & Highways (MoRTH) portal at helpdesk.nhai.gov.in, or contact your bank's FASTag dispute team directly with the Grievance ID." },
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

function StepList({ steps }) {
  return (
    <div className="space-y-4">
      {steps.map((s, i) => (
        <div key={i} className="flex gap-4 items-start">
          <div className="w-8 h-8 rounded-full bg-[#0A0A0A] text-white text-sm font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</div>
          <div className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl px-5 py-4 flex-1">
            <p className="font-bold text-[#0A0A0A] text-sm mb-1">{s.title}</p>
            <p className="text-sm text-[#4B5563] leading-relaxed">{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ENoticePage() {
  const [activeTab, setActiveTab] = useState("pay");

  return (
    <>
      <SEO
        title="FASTag e-Notice — How to Pay, Dispute & Avoid Penalties 2025 · ApnaFastag"
        description="Received a FASTag e-Notice? Learn why NHAI issues e-notices, how the 2× penalty works, step-by-step payment and dispute process, and how to prevent future notices."
        path="/fastag-e-notice"
        keywords="FASTag e-notice, FASTag penalty notice, NHAI e-notice FASTag, how to pay FASTag e-notice, FASTag e-notice dispute, FASTag penalty 2x toll, FASTag blacklist notice"
        jsonLd={[
          faqSchema(FAQ_PAIRS),
          breadcrumbSchema([{ label: "FASTag e-Notice Guide", url: "/fastag-e-notice" }]),
          howToSchema({
            name: "How to pay a FASTag e-Notice penalty",
            description: "Step-by-step process to pay a FASTag e-Notice issued by NHAI for toll lane violations.",
            steps: PAY_STEPS.map((s) => ({ name: s.title, text: s.body })),
          }),
        ]}
      />

      <PageHero
        eyebrow="Penalty Notice Guide"
        title={<>FASTag <span className="text-[#FF6B00]">e-Notice</span> — Pay, Dispute or Prevent</>}
        sub="NHAI issues electronic penalty notices when your FASTag fails at a toll. Here's exactly what it means, how much you owe, and how to resolve it — in minutes, not weeks."
        breadcrumb={[{ label: "FASTag e-Notice" }]}
      />

      {/* Alert banner */}
      <section className="bg-[#FEF2F2] border-b border-red-200 py-4">
        <div className="max-w-6xl mx-auto px-6 md:px-10 flex flex-col sm:flex-row items-center justify-center gap-3 text-center sm:text-left">
          <AlertTriangle className="w-5 h-5 text-[#DC2626] flex-shrink-0" />
          <p className="text-sm text-[#991B1B] font-semibold">
            Ignoring an e-Notice can get your FASTag <strong>blacklisted</strong> and your vehicle flagged in the Vahan database.
            Pay or dispute within <strong>30 days</strong>.
          </p>
        </div>
      </section>

      {/* What is an e-Notice */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-3">What is it?</p>
              <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A] leading-tight mb-5">
                An automated fine for a failed FASTag transaction
              </h2>
              <p className="text-[#4B5563] leading-relaxed mb-4">
                Every time a vehicle uses a FASTag lane, the RFID reader or ANPR camera attempts to debit the toll. If the deduction fails for any reason — no tag, low balance, blacklisted tag, or technical error — NHAI's system automatically generates an <strong className="text-[#0A0A0A]">e-Notice</strong> (Electronic Penalty Notice).
              </p>
              <p className="text-[#4B5563] leading-relaxed mb-6">
                The notice is sent to your <strong className="text-[#0A0A0A]">registered mobile number</strong> (linked in Vahan) via SMS, and may also appear in your bank's FASTag portal under "Penalties". The penalty is always <strong className="text-[#DC2626]">2× the applicable toll</strong>.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Penalty rate", value: "2× toll" },
                  { label: "Pay by", value: "30 days" },
                  { label: "Dispute window", value: "30 days" },
                ].map((s) => (
                  <div key={s.label} className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl p-4 text-center">
                    <div className="font-display font-black text-xl text-[#FF6B00]">{s.value}</div>
                    <div className="text-xs text-[#6B7280] mt-1">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#0A0A0A] rounded-3xl p-7 font-mono text-sm">
              <p className="text-[#9CA3AF] text-xs mb-4 uppercase tracking-widest font-sans font-bold">Sample e-Notice SMS</p>
              <div className="bg-white/5 rounded-xl p-5 leading-7 text-white/80">
                <span className="text-[#FF6B00] font-bold">NHAI-IHMCL:</span><br />
                Dear Vehicle Owner,<br />
                An e-Notice has been generated for vehicle <span className="text-[#FFD60A]">MH12AB1234</span> at <span className="text-[#FFD60A]">Khalapur Plaza</span> on <span className="text-[#FFD60A]">24-Jun-2026 14:32</span>.<br /><br />
                Toll: ₹95 | <span className="text-[#FC8181]">Penalty: ₹190</span><br />
                Reason: Insufficient balance<br />
                TRAN_REF: <span className="text-[#FFD60A]">NHAI2026XXXXX</span><br /><br />
                Pay at <span className="text-[#60A5FA]">ihmcl.com</span> within 30 days to avoid blacklisting.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 violation types */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Why it's issued</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">6 reasons you receive an e-Notice</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {VIOLATION_TYPES.map((v, i) => (
              <div key={i} className={`border-2 rounded-2xl p-5 bg-white ${v.color.split(" ").find(c => c.startsWith("border")) || "border-[#E5E7EB]"}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 border ${v.color}`}>
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-display font-bold text-[#0A0A0A] mb-2 text-sm">{v.title}</h3>
                <p className="text-xs text-[#4B5563] leading-relaxed mb-3">{v.desc}</p>
                <div className="text-[10px] font-black uppercase tracking-widest text-[#6B7280] mb-1">Penalty</div>
                <p className="text-xs font-semibold text-[#DC2626]">{v.penalty}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pay + Dispute tabs */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Resolution</p>
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">Pay the notice — or dispute it</h2>
            <p className="text-[#4B5563] mt-3">If the e-Notice is correct, pay it. If it was issued by mistake, dispute it. Both processes take under 10 minutes.</p>
          </div>

          <div className="flex gap-3 mb-8 bg-[#F8F9FA] p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("pay")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === "pay" ? "bg-white shadow text-[#0A0A0A] border-2 border-[#0A0A0A]" : "text-[#6B7280]"}`}
            >
              💳 How to Pay
            </button>
            <button
              onClick={() => setActiveTab("dispute")}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === "dispute" ? "bg-white shadow text-[#0A0A0A] border-2 border-[#0A0A0A]" : "text-[#6B7280]"}`}
            >
              ⚖️ How to Dispute
            </button>
          </div>

          {activeTab === "pay" && (
            <div>
              <div className="bg-[#ECFDF5] border border-[#059669]/30 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#059669] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#065F46]">Pay within 30 days to clear the notice, avoid blacklisting, and protect your Vahan record. Payment is accepted 24×7 online.</p>
              </div>
              <StepList steps={PAY_STEPS} />
            </div>
          )}

          {activeTab === "dispute" && (
            <div>
              <div className="bg-[#EFF6FF] border border-[#3B82F6]/30 rounded-2xl px-5 py-3 mb-6 flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#3B82F6] mt-0.5 flex-shrink-0" />
                <p className="text-sm text-[#1E40AF]">Dispute only if the e-Notice is wrong. Filing a dispute does not pause the 30-day window — pay under protest if you are close to the deadline, then dispute.</p>
              </div>
              <StepList steps={DISPUTE_STEPS} />
            </div>
          )}
        </div>
      </section>

      {/* How to prevent */}
      <section className="py-16 bg-[#0A0A0A] text-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="text-center mb-12">
            <p className="text-xs font-black uppercase tracking-widest text-[#FF6B00] mb-2">Prevention</p>
            <h2 className="font-display font-black text-3xl md:text-4xl">How to never get an e-Notice again</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: CreditCard, title: "Keep ₹500+ buffer in wallet", body: "Most e-notices are for insufficient balance. Set a low-balance alert at ₹300 and auto-recharge via your bank app. Never let the wallet hit zero." },
              { icon: Shield, title: "Complete KYC before travel", body: "Banks can blacklist FASTags with incomplete KYC. Check your KYC status in the bank's app — full KYC (Aadhaar + PAN + RC) prevents automatic blocks." },
              { icon: FileText, title: "Link tag to the right vehicle", body: "Each FASTag must match the vehicle's RC exactly. If you changed cars or have multiple vehicles, ensure each has its own correctly linked tag." },
              { icon: Zap, title: "Keep windshield and plate clean", body: "RFID readers and ANPR cameras fail on dirty/foggy windshields and mud-covered plates. Clean both before long highway trips." },
              { icon: Clock, title: "Check blacklist status monthly", body: "Open your bank's FASTag app → Tag Status. A blacklisted tag triggers e-notices at every plaza you cross. Remove blacklists immediately when they appear." },
              { icon: Phone, title: "Use a Sathi for instant help", body: "If you are stopped at a plaza for a failed deduction, don't argue at the counter. Find a Sathi on ApnaFastag — they can resolve balance, blacklist, and KYC issues on-spot in under 8 minutes." },
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-[#FF6B00]/40 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-[#FF6B00]" />
                </div>
                <h3 className="font-display font-bold text-white mb-2 text-sm">{item.title}</h3>
                <p className="text-xs text-white/60 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick reference */}
      <section className="py-12 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <h2 className="font-display font-black text-2xl text-[#0A0A0A] mb-6 text-center">Quick reference — e-Notice at a glance</h2>
          <div className="bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
            {[
              ["Penalty amount", "2× applicable toll for your vehicle class"],
              ["Who issues it", "NHAI / IHMCL via the toll operator's system"],
              ["How you receive it", "SMS to Vahan-registered mobile + NHAI portal + bank FASTag app"],
              ["Payment deadline", "30 days from notice date"],
              ["Dispute deadline", "30 days from notice date"],
              ["NHAI dispute portal", "ihmcl.com → My Account → Grievance"],
              ["Dispute resolution SLA", "7–30 working days"],
              ["Consequence of non-payment", "FASTag blacklisted + Vahan flag + escalating penalties"],
              ["Can Sathi help?", "Yes — Sathis at plazas can file disputes and resolve blacklists on-spot"],
            ].map(([k, v], i) => (
              <div key={i} className={`grid grid-cols-2 px-5 py-3 text-sm border-t border-[#E5E7EB] ${i === 0 ? "border-t-0" : ""} ${i % 2 === 0 ? "bg-white" : "bg-[#F8F9FA]"}`}>
                <span className="font-bold text-[#0A0A0A]">{k}</span>
                <span className="text-[#4B5563]">{v}</span>
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
            <h2 className="font-display font-black text-3xl md:text-4xl text-[#0A0A0A]">FASTag e-Notice — all questions answered</h2>
          </div>
          <div className="space-y-3">
            {FAQ_PAIRS.map((item, i) => <AccordionItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* Related links */}
      <section className="py-10 bg-white border-t border-[#E5E7EB]">
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <p className="text-xs font-black uppercase tracking-widest text-[#9CA3AF] mb-5 text-center">Related guides</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/mlff" className="flex items-center gap-2 text-sm font-bold text-[#FF6B00] bg-[#FFF7ED] border border-[#FF6B00]/30 px-4 py-2 rounded-full hover:bg-[#FF6B00] hover:text-white transition-colors">
              MLFF — Free Flow Tolling <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/tools/dispute-tracker" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Track your dispute <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/tools/fastag-status" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Check FASTag status <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/help?category=Disputes" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Dispute help articles <ArrowRight className="w-3 h-3" />
            </Link>
            <Link to="/find" className="flex items-center gap-2 text-sm font-bold text-[#374151] bg-[#F8F9FA] border border-[#E5E7EB] px-4 py-2 rounded-full hover:border-[#0A0A0A] transition-colors">
              Find a Sathi near me <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </section>

      <PageCTA note="A Sathi at your plaza can dispute an e-Notice and remove a blacklist on the spot — usually in under 8 minutes." />
    </>
  );
}
