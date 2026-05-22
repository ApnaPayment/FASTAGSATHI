import React, { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, IndianRupee, Clock, Award, Shield,
  ChevronRight, Phone, User, MapPin, Calendar, CheckCircle2,
  Loader2, ArrowLeft, Briefcase, Building2,
} from "lucide-react";
import { track } from "@/lib/analytics";
import BecomeSathi from "@/components/landing/BecomeSathi";
import { authApi, stateApi, plazaApi, applicationApi } from "@/lib/api";

const PERKS = [
  { Icon: IndianRupee, t: "₹25k–₹60k monthly", s: "Top Sathis at NH-48 plazas clear ₹60k+. Median Sathi ₹32k." },
  { Icon: Clock, t: "Your hours, your toll", s: "Work 2 hours or 12. Toggle online/offline anytime in the Partner Portal." },
  { Icon: Shield, t: "Zero joining fee", s: "No deposit, no kit cost. Free Aadhaar KYC + selfie verification." },
  { Icon: Award, t: "Pro tier unlocked at 100 jobs", s: "Priority dispatch, 90% take rate, dedicated success manager, premium badge." },
];

const STEPS = [
  { n: "01", t: "Apply", b: "10-minute online form. Aadhaar OTP + selfie + phone verification." },
  { n: "02", t: "Interview", b: "15-min video call with a regional Sathi lead. Language, plaza familiarity, work ethic." },
  { n: "03", t: "Shadow", b: "2 weeks shadowing an experienced Sathi at your home plaza. Paid stipend ₹500/day." },
  { n: "04", t: "Go Live", b: "Receive verified badge, partner portal access, first job ping within 48 hours." },
];

const LANGUAGES = ["Hindi", "English", "Marathi", "Tamil", "Kannada", "Telugu", "Bengali", "Gujarati", "Punjabi", "Malayalam", "Odia", "Urdu"];
const VEHICLE_TYPES = ["Car / Jeep / Van", "LCV (Mini-truck)", "Bus / Truck", "MAV / Heavy Vehicle", "Motorcycle"];
const SERVICES = [
  { id: "dispute",  label: "Mischarge / Dispute filing",      desc: "Reverse double-deductions, wrong charges" },
  { id: "kyc",      label: "KYC & Re-KYC paperwork",          desc: "New tag setup, re-verification, RC mismatch" },
  { id: "recharge", label: "Recharge & low-balance fixes",     desc: "UPI recharge, failed top-ups, balance issues" },
  { id: "sos",      label: "Emergency / SOS dispatch",         desc: "Stuck at lane, vehicle breakdown, urgent help" },
];
const BANKS = [
  { id: "sbi-fastag",    label: "SBI FASTag",    color: "#2563EB" },
  { id: "paytm-fastag",  label: "Paytm FASTag",  color: "#00BAF2" },
  { id: "icici-fastag",  label: "ICICI FASTag",  color: "#F97316" },
  { id: "hdfc-fastag",   label: "HDFC FASTag",   color: "#1E3A8A" },
  { id: "axis-fastag",   label: "Axis FASTag",   color: "#9333EA" },
  { id: "kotak-fastag",  label: "Kotak FASTag",  color: "#EF4444" },
  { id: "yes-fastag",    label: "Yes Bank FASTag",color: "#059669" },
  { id: "idfc-fastag",   label: "IDFC FASTag",   color: "#6B7280" },
];
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

const WIZARD_STEPS = [
  { id: "phone",        label: "Phone",     Icon: Phone },
  { id: "personal",     label: "About You", Icon: User },
  { id: "plaza",        label: "Plaza",     Icon: MapPin },
  { id: "services",     label: "Services",  Icon: Briefcase },
  { id: "schedule",     label: "Schedule",  Icon: Calendar },
];

export default function BecomeSathiPage() {
  useEffect(() => { track("page_view", { page: "become_sathi" }); }, []);
  return (
    <>
      <SEO
        title="Become a Fastag Sathi — earn ₹25k–₹60k/month at your local toll"
        description="Already at the toll? Get paid to help. Zero joining fee, flexible hours, ₹25k–₹60k monthly earnings. Apply in 10 minutes, go live in 21 days."
        path="/become-a-sathi"
        keywords="fastag sathi, toll plaza job, gig work india, fastag helper earning, sathi onboarding"
      />
      <PageHero
        variant="dark"
        eyebrow="For Partners"
        title={<>Already at the toll? <br /><span className="text-[#FFD60A]">Get paid to help.</span></>}
        hindi="हर साथी, अपना boss।"
        sub="Tea vendors, mechanics, agents, off-duty toll staff, college students near plazas — turn your ground knowledge into ₹25k–₹60k/month with zero capital."
        breadcrumb={[{ label: "Become a Sathi" }]}
        cta={
          <a
            href="#apply"
            onClick={() => track("cta_become_sathi_click", { src: "page_hero" })}
            className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-7 py-4 rounded-full hover:bg-[#E66000] transition-all shadow-[0_5px_0_#FFD60A]"
          >
            Apply to be a Sathi <ChevronRight className="w-5 h-5" />
          </a>
        }
      />

      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="grid md:grid-cols-4 gap-5">
            {PERKS.map((p) => (
              <div key={p.t} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center mb-4"><p.Icon className="w-6 h-6 text-[#FF6B00]" /></div>
                <h3 className="font-display font-bold text-lg text-[#0A0A0A]">{p.t}</h3>
                <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">{p.s}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <BecomeSathi />

      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-3xl md:text-5xl text-[#0A0A0A] tracking-tight mb-3">From apply to first payout in <span className="text-[#FF6B00]">21 days.</span></h2>
          <p className="text-[#4B5563] text-lg max-w-2xl mb-12">Most Sathis complete onboarding in under 3 weeks. We pay stipend during the 2-week shadow phase.</p>
          <div className="grid md:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-[#0A0A0A] text-white rounded-2xl p-6">
                <div className="font-display font-black text-4xl text-[#FFD60A]">{s.n}</div>
                <h3 className="font-display font-bold text-xl mt-3">{s.t}</h3>
                <p className="text-sm text-white/70 mt-2 leading-relaxed">{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="apply" data-testid="sathi-apply-form" className="py-20 md:py-24 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-6 md:px-10">
          <ApplicationWizard />
        </div>
      </section>

      <PageCTA primary="Apply now" secondary="Talk to recruiter" primaryTo="/become-a-sathi#apply" secondaryTo="/contact?topic=sathi" />
    </>
  );
}

/* ─── Wizard shell ────────────────────────────────────────────────────────── */

function ApplicationWizard() {
  const [step, setStep] = useState(0);
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState({
    name: "", bio: "", languages: [],
    state: "", plaza_slug: "",
    services: ["dispute", "recharge"], banks: [],
    vehicle_types: [],
    active_hours: { mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "" },
    hours_per_week: 20,
    whatsapp: "",
  });
  const [appRef, setAppRef] = useState(null);

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => s - 1);

  const handleSubmit = async (extraData) => {
    const payload = { phone, ...form, ...extraData };
    const res = await applicationApi.submit(payload);
    setAppRef(res.data.ref);
    setStep(5);
    track("sathi_application_submit", { ref: res.data.ref, state: form.state });
  };

  if (step === 5) return <SuccessScreen ref_code={appRef} phone={phone} />;

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[8px_8px_0_#FF6B00] overflow-hidden">
      {/* Progress header */}
      <div className="bg-[#0A0A0A] px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-white/60 text-xs font-bold uppercase tracking-widest">Sathi Application</span>
          <span className="text-[#FFD60A] text-xs font-bold">{step + 1} / {WIZARD_STEPS.length}</span>
        </div>
        <div className="flex gap-1.5">
          {WIZARD_STEPS.map((s, i) => (
            <div key={s.id} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? "bg-[#FF6B00]" : "bg-white/20"}`} />
          ))}
        </div>
        <div className="mt-3 flex gap-4 flex-wrap">
          {WIZARD_STEPS.map((s, i) => (
            <span key={s.id} className={`text-xs font-semibold transition-colors flex items-center gap-1 ${i === step ? "text-white" : i < step ? "text-[#FF6B00]" : "text-white/30"}`}>
              {i < step ? <CheckCircle2 className="w-3 h-3" /> : <s.Icon className="w-3 h-3" />}
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.2 }}
          className="p-8 md:p-10"
        >
          {step === 0 && <PhoneStep phone={phone} setPhone={setPhone} onNext={next} />}
          {step === 1 && <PersonalStep form={form} setForm={setForm} onNext={next} onBack={back} />}
          {step === 2 && <PlazaStep form={form} setForm={setForm} onNext={next} onBack={back} />}
          {step === 3 && <ServicesStep form={form} setForm={setForm} onNext={next} onBack={back} />}
          {step === 4 && <ScheduleStep form={form} setForm={setForm} onSubmit={handleSubmit} onBack={back} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Step 1: Phone OTP ───────────────────────────────────────────────────── */

function PhoneStep({ phone, setPhone, onNext }) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) { setError("Enter a valid 10-digit phone number"); return; }
    setError(""); setLoading(true);
    try { await authApi.requestOtp(phone); setOtpSent(true); }
    catch { setError("Failed to send OTP. Try again."); }
    finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length < 4) { setError("Enter the 4-digit OTP"); return; }
    setError(""); setLoading(true);
    try { await authApi.verifyOtp(phone, otp); onNext(); }
    catch { setError("Invalid OTP. Please try again."); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <StepHeader Icon={Phone} title="Verify your phone" sub="We'll send an OTP to confirm your number. This becomes your Sathi login." />
      {!otpSent ? (
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-[#0A0A0A]">
            Phone number
            <div className="flex mt-1 gap-2">
              <span className="flex items-center px-4 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl text-[#4B5563] font-bold text-sm">+91</span>
              <input type="tel" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210" data-testid="sathi-input-phone"
                className="flex-1 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors text-lg tracking-widest" />
            </div>
          </label>
          {error && <p className="text-[#DC2626] text-sm">{error}</p>}
          <WizardBtn onClick={sendOtp} loading={loading} disabled={phone.length !== 10}>Send OTP <ChevronRight className="w-4 h-4" /></WizardBtn>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-[#4B5563]">OTP sent to <strong>+91 {phone}</strong>. <button onClick={() => setOtpSent(false)} className="text-[#FF6B00] font-semibold underline">Change</button></p>
          <label className="block text-sm font-semibold text-[#0A0A0A]">
            Enter OTP
            <input type="tel" maxLength={4} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="• • • •" data-testid="sathi-input-otp"
              className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors text-2xl tracking-[1rem] text-center" />
          </label>
          {error && <p className="text-[#DC2626] text-sm">{error}</p>}
          <WizardBtn onClick={verifyOtp} loading={loading} disabled={otp.length < 4}>Verify & Continue <ChevronRight className="w-4 h-4" /></WizardBtn>
        </div>
      )}
    </div>
  );
}

/* ─── Step 2: Personal Details ────────────────────────────────────────────── */

function PersonalStep({ form, setForm, onNext, onBack }) {
  const [error, setError] = useState("");
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const next = () => {
    if (!form.name.trim()) { setError("Please enter your full name"); return; }
    if (form.languages.length === 0) { setError("Select at least one language"); return; }
    onNext();
  };

  const toggleLang = (lang) => setForm((f) => ({
    ...f, languages: f.languages.includes(lang) ? f.languages.filter((l) => l !== lang) : [...f.languages, lang],
  }));

  return (
    <div>
      <StepHeader Icon={User} title="About you" sub="Tell commuters who you are — this appears on your public Sathi profile." />
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-[#0A0A0A]">
          Full name (as on Aadhaar)
          <input type="text" value={form.name} onChange={(e) => set("name")(e.target.value)}
            placeholder="e.g. Ramesh Kumar Sharma" data-testid="sathi-input-name"
            className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors" />
        </label>

        <label className="block text-sm font-semibold text-[#0A0A0A]">
          Bio <span className="font-normal text-[#4B5563]">(shown on your profile)</span>
          <textarea rows={3} value={form.bio} onChange={(e) => set("bio")(e.target.value)}
            placeholder="e.g. I run a tea stall outside Khalapur plaza since 2019. I know every lane supervisor and can get mischarges reversed in under 10 minutes."
            className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors resize-none text-sm" />
        </label>

        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] mb-2">Languages you speak</p>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button key={lang} type="button" onClick={() => toggleLang(lang)}
                className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all ${form.languages.includes(lang) ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-[#FF6B00]"}`}>
                {lang}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <BackBtn onClick={onBack} />
          <WizardBtn onClick={next} className="flex-1">Continue <ChevronRight className="w-4 h-4" /></WizardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 3: Plaza Selection ─────────────────────────────────────────────── */

function PlazaStep({ form, setForm, onNext, onBack }) {
  const [states, setStates] = useState([]);
  const [plazas, setPlazas] = useState([]);
  const [loadingPlazas, setLoadingPlazas] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { stateApi.list().then((r) => setStates(r.data)).catch(() => {}); }, []);

  useEffect(() => {
    if (!form.state) { setPlazas([]); return; }
    setLoadingPlazas(true);
    setForm((f) => ({ ...f, plaza_slug: "" }));
    plazaApi.byState(form.state).then((r) => setPlazas(r.data)).catch(() => setPlazas([])).finally(() => setLoadingPlazas(false));
  }, [form.state]); // eslint-disable-line

  const next = () => {
    if (!form.state) { setError("Please select your state"); return; }
    if (!form.plaza_slug) { setError("Please select your home plaza"); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader Icon={MapPin} title="Your home plaza" sub="Select the toll plaza where you'll primarily work. You can add more later." />
      <div className="space-y-5">
        <label className="block text-sm font-semibold text-[#0A0A0A]">
          State
          <select value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
            className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors appearance-none">
            <option value="">Select state…</option>
            {states.map((s) => <option key={s.slug} value={s.slug}>{s.name} ({s.plazaCount} plazas)</option>)}
          </select>
        </label>

        <label className="block text-sm font-semibold text-[#0A0A0A]">
          Nearest toll plaza
          <div className="relative mt-1">
            <select value={form.plaza_slug} onChange={(e) => setForm((f) => ({ ...f, plaza_slug: e.target.value }))}
              disabled={!form.state || loadingPlazas}
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors appearance-none disabled:opacity-50">
              <option value="">{loadingPlazas ? "Loading…" : form.state ? "Select plaza…" : "Select state first"}</option>
              {plazas.map((p) => <option key={p.slug} value={p.slug}>{p.name} — {p.city} ({p.highway})</option>)}
            </select>
            {loadingPlazas && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#4B5563]" />}
          </div>
          {form.state && !loadingPlazas && plazas.length > 0 && <p className="text-xs text-[#4B5563] mt-1">{plazas.length} plazas in this state</p>}
        </label>

        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <BackBtn onClick={onBack} />
          <WizardBtn onClick={next} className="flex-1">Continue <ChevronRight className="w-4 h-4" /></WizardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 4: Services & Banks ────────────────────────────────────────────── */

function ServicesStep({ form, setForm, onNext, onBack }) {
  const [error, setError] = useState("");

  const toggleService = (id) => setForm((f) => ({
    ...f, services: f.services.includes(id) ? f.services.filter((s) => s !== id) : [...f.services, id],
  }));
  const toggleBank = (id) => setForm((f) => ({
    ...f, banks: f.banks.includes(id) ? f.banks.filter((b) => b !== id) : [...f.banks, id],
  }));
  const toggleVehicle = (v) => setForm((f) => ({
    ...f, vehicle_types: f.vehicle_types.includes(v) ? f.vehicle_types.filter((x) => x !== v) : [...f.vehicle_types, v],
  }));

  const next = () => {
    if (form.services.length === 0) { setError("Select at least one service"); return; }
    onNext();
  };

  return (
    <div>
      <StepHeader Icon={Briefcase} title="Your services & expertise" sub="Tell commuters what you can help with. This appears on your profile." />
      <div className="space-y-7">
        {/* Services */}
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] mb-3">Services you offer</p>
          <div className="space-y-2">
            {SERVICES.map((s) => (
              <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${form.services.includes(s.id) ? "border-[#FF6B00] bg-[#FF6B00]/5" : "border-[#E5E7EB] bg-white hover:border-[#FF6B00]/50"}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${form.services.includes(s.id) ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#D1D5DB]"}`}>
                  {form.services.includes(s.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                </div>
                <div>
                  <div className="font-semibold text-sm text-[#0A0A0A]">{s.label}</div>
                  <div className="text-xs text-[#4B5563]">{s.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Banks */}
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] mb-2">Banks you support <span className="font-normal text-[#4B5563]">(select all you know)</span></p>
          <div className="flex flex-wrap gap-2">
            {BANKS.map((b) => (
              <button key={b.id} type="button" onClick={() => toggleBank(b.id)}
                className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${form.banks.includes(b.id) ? "text-white" : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-current"}`}
                style={form.banks.includes(b.id) ? { backgroundColor: b.color, borderColor: b.color } : { color: b.color }}>
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Vehicle types */}
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] mb-2">Vehicle types you handle <span className="font-normal text-[#4B5563]">(optional)</span></p>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((v) => (
              <button key={v} type="button" onClick={() => toggleVehicle(v)}
                className={`px-3 py-2 rounded-full text-xs font-semibold border-2 transition-all ${form.vehicle_types.includes(v) ? "bg-[#0A0A0A] border-[#0A0A0A] text-white" : "bg-white border-[#E5E7EB] text-[#4B5563] hover:border-[#0A0A0A]"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <BackBtn onClick={onBack} />
          <WizardBtn onClick={next} className="flex-1">Continue <ChevronRight className="w-4 h-4" /></WizardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── Step 5: Schedule & Submit ───────────────────────────────────────────── */

function ScheduleStep({ form, setForm, onSubmit, onBack }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeDays, setActiveDays] = useState(
    Object.entries(form.active_hours).filter(([, v]) => v && v !== "Off").map(([k]) => k)
  );

  const toggleDay = (day) => {
    setActiveDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day];
      setForm((f) => ({
        ...f,
        active_hours: Object.fromEntries(DAYS.map((d) => [d, next.includes(d) ? (f.active_hours[d] || "6am–10pm") : "Off"])),
      }));
      return next;
    });
  };

  const setHours = (day, val) => setForm((f) => ({ ...f, active_hours: { ...f.active_hours, [day]: val } }));

  const submit = async () => {
    setError(""); setLoading(true);
    try {
      await onSubmit({ hours_per_week: form.hours_per_week, active_hours: form.active_hours, whatsapp: form.whatsapp });
    } catch (e) {
      const msg = e?.response?.data?.detail;
      setError(msg?.includes("already submitted") ? "An application already exists for this phone. Our team will contact you." : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div>
      <StepHeader Icon={Calendar} title="Your working hours" sub="Set your typical schedule so commuters know when you're available." />
      <div className="space-y-6">
        {/* Hours slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-semibold text-[#0A0A0A]">Hours available per week</span>
            <span className="font-display font-black text-[#FF6B00] text-xl">{form.hours_per_week}h</span>
          </div>
          <input type="range" min={5} max={60} step={5} value={form.hours_per_week}
            onChange={(e) => setForm((f) => ({ ...f, hours_per_week: Number(e.target.value) }))}
            className="w-full accent-[#FF6B00]" />
          <div className="flex justify-between text-xs text-[#4B5563] mt-1"><span>5h</span><span>60h</span></div>
        </div>

        {/* Day schedule */}
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A] mb-3">Active days & hours</p>
          <div className="space-y-2">
            {DAYS.map((day) => (
              <div key={day} className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${activeDays.includes(day) ? "border-[#FF6B00]/30 bg-[#FF6B00]/5" : "border-[#E5E7EB] bg-[#F8F9FA] opacity-60"}`}>
                <button type="button" onClick={() => toggleDay(day)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${activeDays.includes(day) ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#D1D5DB]"}`}>
                  {activeDays.includes(day) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </button>
                <span className="text-sm font-semibold text-[#0A0A0A] w-8">{DAY_LABELS[day]}</span>
                {activeDays.includes(day) && (
                  <input type="text" value={form.active_hours[day] || ""} onChange={(e) => setHours(day, e.target.value)}
                    placeholder="e.g. 6am–10pm"
                    className="flex-1 bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-lg px-3 py-1.5 text-sm outline-none transition-colors" />
                )}
                {!activeDays.includes(day) && <span className="text-sm text-[#9CA3AF]">Off</span>}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp */}
        <label className="block text-sm font-semibold text-[#0A0A0A]">
          WhatsApp number <span className="font-normal text-[#4B5563]">(if different from phone)</span>
          <div className="flex mt-1 gap-2">
            <span className="flex items-center px-4 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl text-[#4B5563] font-bold text-sm">+91</span>
            <input type="tel" maxLength={10} value={form.whatsapp} onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value.replace(/\D/g, "") }))}
              placeholder="Leave blank to use same number"
              className="flex-1 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors" />
          </div>
        </label>

        {error && <p className="text-[#DC2626] text-sm">{error}</p>}
        <div className="flex gap-3 pt-2">
          <BackBtn onClick={onBack} />
          <WizardBtn onClick={submit} loading={loading} className="flex-1" data-testid="sathi-submit-btn">
            Submit Application →
          </WizardBtn>
        </div>
      </div>
    </div>
  );
}

/* ─── Success ─────────────────────────────────────────────────────────────── */

function SuccessScreen({ ref_code, phone }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      className="bg-white border-2 border-[#0A0A0A] rounded-3xl shadow-[8px_8px_0_#059669] p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-[#059669]/10 flex items-center justify-center mx-auto mb-6">
        <BadgeCheck className="w-10 h-10 text-[#059669]" />
      </div>
      <h2 className="font-display font-black text-3xl text-[#0A0A0A]">Application submitted!</h2>
      <p className="text-[#4B5563] mt-3 max-w-sm mx-auto">
        A regional Sathi lead will call you on <strong>+91 {phone}</strong> within 48 hours to schedule your 15-min interview.
      </p>
      <div className="mt-6 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl p-5 inline-block">
        <p className="text-xs uppercase font-bold tracking-widest text-[#4B5563]">Your application reference</p>
        <p className="font-display font-black text-2xl text-[#FF6B00] mt-1 tracking-widest">{ref_code}</p>
        <p className="text-xs text-[#4B5563] mt-1">Save this for tracking your onboarding status</p>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-4 text-left">
        {[
          { n: "48h", l: "First callback from your regional lead" },
          { n: "7d",  l: "Video interview + background check" },
          { n: "21d", l: "Shadow phase complete, go live" },
        ].map((s) => (
          <div key={s.n} className="bg-[#0A0A0A] text-white rounded-2xl p-4">
            <div className="font-display font-black text-2xl text-[#FFD60A]">{s.n}</div>
            <p className="text-xs text-white/70 mt-1 leading-snug">{s.l}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Shared UI ───────────────────────────────────────────────────────────── */

function StepHeader({ Icon, title, sub }) {
  return (
    <div className="mb-7">
      <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-5">
        <Icon className="w-6 h-6 text-[#FF6B00]" />
      </div>
      <h2 className="font-display font-black text-2xl md:text-3xl text-[#0A0A0A]">{title}</h2>
      <p className="text-[#4B5563] mt-2">{sub}</p>
    </div>
  );
}

function WizardBtn({ onClick, loading, disabled, children, className = "", ...props }) {
  return (
    <button type="button" onClick={onClick} disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 bg-[#FF6B00] text-white font-bold py-4 px-6 rounded-full hover:bg-[#E66000] transition-colors shadow-[0_5px_0_#0A0A0A] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : children}
    </button>
  );
}

function BackBtn({ onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1 text-sm font-semibold text-[#4B5563] hover:text-[#0A0A0A] transition-colors px-4">
      <ArrowLeft className="w-4 h-4" /> Back
    </button>
  );
}
