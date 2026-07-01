import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import { leadApi } from "@/lib/api";
import {
  MapPin, Phone, ChevronDown, CheckCircle2, TrendingUp,
  Shield, Globe2, Smartphone, ArrowRight, Loader2, BadgeCheck,
  IndianRupee, Star, Users, Zap, X, Gift,
} from "lucide-react";

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: { flag: "🇮🇳", name: "English",     headline: "Earn ₹15,000–₹50,000 Per Month", sub: "Become an Official FASTag Sathi — Zero Investment Needed", cta: "Apply Now — It's Free", lang_title: "Choose Your Language", form_name: "Full Name", form_mobile: "Mobile Number", form_city: "City / Town", form_bank: "Preferred Bank Partner", form_exp: "Your Experience", form_estimate: "Monthly FASTag Target", submit: "Submit Application", success_title: "Application Submitted!", success_sub: "Our team will contact you within 24 hours. Call the dedicated manager for your bank:", call_now: "Call Now", or_apply: "Already submitted? Call directly:" },
  hi: { flag: "🇮🇳", name: "हिंदी",       headline: "₹15,000–₹50,000/माह कमाएं",      sub: "आधिकारिक FASTag सथी बनें — कोई निवेश नहीं", cta: "अभी आवेदन करें — मुफ्त",       lang_title: "अपनी भाषा चुनें",              form_name: "पूरा नाम",     form_mobile: "मोबाइल नंबर",    form_city: "शहर/कस्बा",      form_bank: "बैंक पार्टनर",           form_exp: "आपका अनुभव",       form_estimate: "मासिक FASTag लक्ष्य", submit: "आवेदन जमा करें",      success_title: "आवेदन प्राप्त हो गया!", success_sub: "24 घंटे में टीम संपर्क करेगी। अपने बैंक के मैनेजर को कॉल करें:", call_now: "अभी कॉल करें",        or_apply: "पहले से आवेदन? सीधे कॉल करें:" },
  mr: { flag: "🇮🇳", name: "मराठी",       headline: "₹15,000–₹50,000/महिना कमवा",    sub: "अधिकृत FASTag सथी व्हा — कोणतीही गुंतवणूक नाही", cta: "आत्ता अर्ज करा — मोफत",      lang_title: "आपली भाषा निवडा",           form_name: "पूर्ण नाव",   form_mobile: "मोबाईल नंबर",  form_city: "शहर/गाव",        form_bank: "बँक निवडा",              form_exp: "तुमचा अनुभव",     form_estimate: "मासिक FASTag लक्ष्य", submit: "अर्ज सादर करा",      success_title: "अर्ज प्राप्त झाला!",   success_sub: "24 तासात टीम संपर्क करेल। बँकेच्या मॅनेजरला कॉल करा:", call_now: "आता कॉल करा",         or_apply: "अर्ज केलाय? थेट कॉल करा:"  },
  ta: { flag: "🇮🇳", name: "தமிழ்",       headline: "மாதம் ₹15,000–₹50,000 சம்பாதியுங்கள்", sub: "உத்தியோகபூர்வ FASTag சாதி ஆகுங்கள் — முதலீடு தேவையில்லை", cta: "இப்போது விண்ணப்பிக்கவும்", lang_title: "உங்கள் மொழியை தேர்வு செய்யவும்", form_name: "முழு பெயர்", form_mobile: "மொபைல் எண்", form_city: "நகரம்", form_bank: "வங்கி", form_exp: "அனுபவம்", form_estimate: "மாதாந்திர இலக்கு", submit: "சமர்ப்பிக்கவும்", success_title: "விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!", success_sub: "24 மணி நேரத்தில் தொடர்பு கொள்ளும். மேலாளரை அழைக்கவும்:", call_now: "இப்போது அழைக்கவும்", or_apply: "ஏற்கனவே விண்ணப்பித்தீர்களா?" },
  te: { flag: "🇮🇳", name: "తెలుగు",      headline: "నెలకు ₹15,000–₹50,000 సంపాదించండి", sub: "అధికారిక FASTag సాధి అవ్వండి — పెట్టుబడి అవసరం లేదు", cta: "ఇప్పుడే దరఖాస్తు చేయండి", lang_title: "మీ భాషను ఎంచుకోండి", form_name: "పూర్తి పేరు", form_mobile: "మొబైల్ నంబర్", form_city: "నగరం", form_bank: "బ్యాంక్", form_exp: "అనుభవం", form_estimate: "నెలవారీ లక్ష్యం", submit: "దరఖాస్తు సమర్పించండి", success_title: "దరఖాస్తు సమర్పించబడింది!", success_sub: "24 గంటల్లో మా బృందం సంప్రదిస్తుంది:", call_now: "ఇప్పుడే కాల్ చేయండి", or_apply: "ఇప్పటికే దరఖాస్తు చేశారా?" },
  kn: { flag: "🇮🇳", name: "ಕನ್ನಡ",       headline: "ತಿಂಗಳಿಗೆ ₹15,000–₹50,000 ಸಂಪಾದಿಸಿ", sub: "ಅಧಿಕೃತ FASTag ಸಾಥಿ ಆಗಿ — ಯಾವುದೇ ಹೂಡಿಕೆ ಬೇಡ", cta: "ಈಗಲೇ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", lang_title: "ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಿ", form_name: "ಪೂರ್ಣ ಹೆಸರು", form_mobile: "ಮೊಬೈಲ್ ನಂಬರ್", form_city: "ನಗರ", form_bank: "ಬ್ಯಾಂಕ್", form_exp: "ಅನುಭವ", form_estimate: "ಮಾಸಿಕ ಗುರಿ", submit: "ಅರ್ಜಿ ಸಲ್ಲಿಸಿ", success_title: "ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!", success_sub: "24 ಗಂಟೆಗಳಲ್ಲಿ ತಂಡ ಸಂಪರ್ಕಿಸುತ್ತದೆ:", call_now: "ಈಗ ಕರೆ ಮಾಡಿ", or_apply: "ಈಗಾಗಲೇ ಅರ್ಜಿ ಮಾಡಿದ್ದೀರಾ?" },
  bn: { flag: "🇮🇳", name: "বাংলা",        headline: "মাসে ₹15,000–₹50,000 উপার্জন করুন", sub: "অফিসিয়াল FASTag সাথী হন — কোনো বিনিয়োগ নেই", cta: "এখনই আবেদন করুন — বিনামূল্যে", lang_title: "আপনার ভাষা বেছে নিন", form_name: "পুরো নাম", form_mobile: "মোবাইল নম্বর", form_city: "শহর/শহরতলী", form_bank: "ব্যাংক", form_exp: "অভিজ্ঞতা", form_estimate: "মাসিক লক্ষ্যমাত্রা", submit: "আবেদন জমা দিন", success_title: "আবেদন জমা হয়েছে!", success_sub: "২৪ ঘণ্টার মধ্যে যোগাযোগ করব। ব্যাংক ম্যানেজারকে কল করুন:", call_now: "এখনই কল করুন", or_apply: "আগে আবেদন করেছেন?" },
  gu: { flag: "🇮🇳", name: "ગુજરાતી",     headline: "મહિને ₹15,000–₹50,000 કમાઓ",    sub: "સત્તાવાર FASTag સાથી બનો — કોઈ રોકાણ નહીં", cta: "અત્યારે અરજી કરો — મફત",     lang_title: "તમારી ભાષા પસંદ કરો",       form_name: "પૂરું નામ",   form_mobile: "મોબાઈલ નંબર",  form_city: "શહેર/નગર",      form_bank: "પ્રિય બેંક",             form_exp: "અનુભવ",          form_estimate: "માસિક FASTag લક્ષ્ય",  submit: "અરજી સબમિટ કરો",   success_title: "અરજી સ્વીકારી!",       success_sub: "24 કલાકમાં ટીમ સંપર્ક કરશે. બેંક મેનેજરને કૉલ કરો:",  call_now: "અત્યારે કૉલ કરો",    or_apply: "પહેલેથી અરજી? સીધો કૉલ:" },
};

// ── Bank Plans ─────────────────────────────────────────────────────────────────
const BANK_PLANS = {
  sbi: {
    key: "sbi",
    name: "SBI FASTag",
    badgeText: "Largest Network",
    badgeCls: "bg-blue-100 text-blue-700",
    headerCls: "from-blue-700 to-blue-500",
    borderCls: "border-blue-200",
    icon: "🏦",
    commissions: [
      { label: "Issuance Commission", value: "₹50–₹100/tag" },
      { label: "Recharge Commission", value: "0.25% per txn" },
      { label: "Monthly Target",      value: "50 tags/month" },
      { label: "Performance Bonus",   value: "₹2,000 on target" },
      { label: "Payout Date",         value: "25th every month" },
      { label: "Training",            value: "Online · 2 days" },
    ],
    estimate: "₹8,000–₹20,000/mo",
    highlight: "Best for high-volume locations near busy toll plazas",
    staff: { name: "Priya Sharma", phone: "9876543210", role: "SBI Partner Manager" },
  },
  idfc: {
    key: "idfc",
    name: "IDFC First Bank",
    badgeText: "Best Commission",
    badgeCls: "bg-purple-100 text-purple-700",
    headerCls: "from-purple-700 to-purple-500",
    borderCls: "border-purple-200",
    icon: "💜",
    commissions: [
      { label: "Issuance Commission", value: "₹100–₹200/tag" },
      { label: "Recharge Commission", value: "0.5% per txn" },
      { label: "Monthly Target",      value: "40 tags/month" },
      { label: "Performance Bonus",   value: "₹3,000 on target" },
      { label: "Payout Date",         value: "20th every month" },
      { label: "Training",            value: "Online + field · 3 days" },
    ],
    estimate: "₹12,000–₹35,000/mo",
    highlight: "Highest per-tag payout — ideal for premium service areas",
    staff: { name: "Rahul Verma", phone: "8765432109", role: "IDFC First Bank Channel Manager" },
  },
  bajaj: {
    key: "bajaj",
    name: "Bajaj Finance FASTag",
    badgeText: "Fastest Activation",
    badgeCls: "bg-orange-100 text-orange-700",
    headerCls: "from-[#FF6B00] to-orange-400",
    borderCls: "border-orange-200",
    icon: "⚡",
    commissions: [
      { label: "Issuance Commission", value: "₹100–₹150/tag" },
      { label: "Recharge Commission", value: "0.3% per txn" },
      { label: "Monthly Target",      value: "30 tags/month" },
      { label: "Performance Bonus",   value: "₹2,500 on target" },
      { label: "Payout Date",         value: "28th every month" },
      { label: "Training",            value: "Online only · 1 day" },
    ],
    estimate: "₹8,000–₹25,000/mo",
    highlight: "Start earning within 48 hours of approval — fastest activation",
    staff: { name: "Amit Kumar", phone: "7654321098", role: "Bajaj Finance FASTag Manager" },
  },
};

const EXPERIENCE_OPTIONS = [
  { value: "new",   label: "No experience (I'm new)" },
  { value: "0-1yr", label: "0–1 year (Basic knowledge)" },
  { value: "1-3yr", label: "1–3 years" },
  { value: "3yr+",  label: "3+ years (Experienced)" },
];

const ESTIMATE_OPTIONS = [
  { value: "1-20",  label: "1–20 tags/month" },
  { value: "20-50", label: "20–50 tags/month" },
  { value: "50-100",label: "50–100 tags/month" },
  { value: "100+",  label: "100+ tags/month" },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function JoinPage() {
  const [lang, setLang]               = useState("en");
  const [showLang, setShowLang]       = useState(true);
  const [activeBank, setActiveBank]   = useState("sbi");
  const [step, setStep]               = useState("form");  // "form"|"success"
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState("");
  const [form, setForm] = useState({
    name: "", mobile: "", city: "",
    bank_preference: "sbi",
    experience: "new",
    monthly_estimate: "20-50",
    lat: null, lng: null,
    language: "en",
  });
  const formRef = useRef(null);
  const t = T[lang];

  // Capture ref from URL + location silently on mount
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    if (ref) setForm((f) => ({ ...f, ref }));
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const chooseLanguage = (code) => {
    setLang(code);
    setForm((f) => ({ ...f, language: code }));
    setShowLang(false);
  };

  const scrollToForm = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const selectBank = (key) => {
    setActiveBank(key);
    setForm((f) => ({ ...f, bank_preference: key }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim())         return setError("Please enter your full name.");
    if (!/^\d{10}$/.test(form.mobile.trim())) return setError("Enter a valid 10-digit mobile number.");
    if (!form.city.trim())         return setError("Please enter your city.");
    setSubmitting(true);
    try {
      await leadApi.submitJoin({ ...form, source: "website" });
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally {
      setSubmitting(false);
    }
  };

  const activePlan = BANK_PLANS[activeBank];

  return (
    <>
      <SEO
        title="Join as FASTag Sathi — Earn ₹15,000–₹50,000/Month · ApnaFastag"
        description="Become an authorised ApnaFastag Sathi partner. Earn commission on every FASTag you issue or recharge — SBI, IDFC First Bank, Bajaj. No investment. Apply free today."
        keywords="FASTag sathi partner, FASTag agent commission, become FASTag dealer, earn money FASTag, SBI FASTag agent, IDFC FASTag partner, Bajaj FASTag distributor"
        schema={breadcrumbSchema([
          { name: "Home", url: "https://apnafastag.com/" },
          { name: "Join as Sathi", url: "https://apnafastag.com/join" },
        ])}
      />

      {/* ── Language Modal ── */}
      {showLang && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-[#FF6B00]" />
                <h2 className="text-lg font-bold text-gray-900">Choose Your Language</h2>
              </div>
              <button onClick={() => setShowLang(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(T).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => chooseLanguage(code)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all hover:border-[#FF6B00] hover:bg-orange-50 ${lang === code ? "border-[#FF6B00] bg-orange-50" : "border-gray-200"}`}
                >
                  <span className="text-xl">{info.flag}</span>
                  <span className="font-medium text-gray-800 text-sm">{info.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Success Screen ── */}
      {step === "success" ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
          <div className="w-full max-w-lg text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white mb-3">{t.success_title}</h1>
            <p className="text-gray-300 mb-8 text-lg">{t.success_sub}</p>

            <div className="grid gap-4">
              {Object.values(BANK_PLANS).map((plan) => (
                <div key={plan.key} className="bg-white rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div className="text-left">
                    <p className="font-bold text-gray-900">{plan.staff.name}</p>
                    <p className="text-sm text-gray-500">{plan.staff.role}</p>
                    <p className="text-sm font-medium text-[#FF6B00]">{plan.name}</p>
                  </div>
                  <a
                    href={`tel:+91${plan.staff.phone}`}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r ${plan.headerCls} whitespace-nowrap text-sm`}
                  >
                    <Phone className="w-4 h-4" />
                    {t.call_now}
                  </a>
                </div>
              ))}
            </div>

            <p className="text-gray-400 text-sm mt-6">Lead ID: {form.lead_id}</p>
            <Link to="/" className="inline-block mt-4 text-[#FF6B00] hover:underline text-sm">
              ← Back to ApnaFastag
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <section className="relative bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-gray-900 overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-20 left-10 w-72 h-72 bg-[#FF6B00] rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-600 rounded-full blur-3xl" />
            </div>

            <div className="relative max-w-5xl mx-auto px-4 py-16 md:py-24">
              {/* WhatsApp badge */}
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1.5 mb-6">
                <Smartphone className="w-4 h-4 text-green-400" />
                <span className="text-green-400 text-sm font-medium">Official ApnaFastag Partner Program</span>
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
                {t.headline}
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-xl">
                {t.sub}
              </p>

              {/* Trust stats */}
              <div className="flex flex-wrap gap-4 mb-10">
                {[
                  { icon: Users, val: "2,400+", label: "Active Sathis" },
                  { icon: Shield, val: "3 Banks", label: "SBI · IDFC · Bajaj" },
                  { icon: TrendingUp, val: "₹28,000", label: "Avg Monthly Earn" },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/10 rounded-xl px-4 py-2.5">
                    <Icon className="w-4 h-4 text-[#FF6B00]" />
                    <div>
                      <p className="text-white font-bold text-sm leading-none">{val}</p>
                      <p className="text-gray-400 text-xs">{label}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 bg-[#FF6B00] hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-orange-500/30"
                >
                  {t.cta} <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowLang(true)}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-4 rounded-xl border border-white/20 transition-all"
                >
                  <Globe2 className="w-4 h-4" />
                  {T[lang].name}
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* ── How it works ── */}
          <section className="bg-gray-50 py-14">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-black text-gray-900 text-center mb-10">
                3 Simple Steps to Start Earning
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  { step: "01", icon: Gift, title: "Apply Free", desc: "Fill the form below — takes 2 minutes. No documents needed at this stage." },
                  { step: "02", icon: BadgeCheck, title: "Get Trained", desc: "Online training provided by the bank. Complete in 1–3 days from home." },
                  { step: "03", icon: IndianRupee, title: "Start Earning", desc: "Issue FASTag to customers. Earn commission credited monthly to your account." },
                ].map(({ step: s, icon: Icon, title, desc }) => (
                  <div key={s} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative">
                    <span className="absolute top-4 right-4 text-4xl font-black text-gray-100">{s}</span>
                    <div className="w-12 h-12 bg-[#FF6B00]/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-[#FF6B00]" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Bank Plans ── */}
          <section className="py-14 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-2xl font-black text-gray-900 text-center mb-2">Choose Your Bank Partner</h2>
              <p className="text-gray-500 text-center mb-8">Compare commissions and pick what works best for you</p>

              {/* Bank tabs */}
              <div className="flex gap-3 mb-6 overflow-x-auto pb-1">
                {Object.values(BANK_PLANS).map((plan) => (
                  <button
                    key={plan.key}
                    onClick={() => selectBank(plan.key)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border-2 ${
                      activeBank === plan.key
                        ? `border-transparent bg-gradient-to-r ${plan.headerCls} text-white shadow-lg`
                        : "border-gray-200 text-gray-600 hover:border-gray-300 bg-white"
                    }`}
                  >
                    <span>{plan.icon}</span> {plan.name}
                    {activeBank === plan.key && (
                      <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">{plan.badgeText}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Active plan card */}
              <div className={`border-2 ${activePlan.borderCls} rounded-2xl overflow-hidden`}>
                <div className={`bg-gradient-to-r ${activePlan.headerCls} px-6 py-4 flex items-center justify-between`}>
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${activePlan.badgeCls}`}>
                      {activePlan.badgeText}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">{activePlan.name}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-white/70 text-xs">Estimated monthly earn</p>
                    <p className="text-white font-black text-xl">{activePlan.estimate}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {activePlan.commissions.map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                        <span className="text-gray-500 text-sm">{label}</span>
                        <span className="font-bold text-gray-900 text-sm">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <Star className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-green-700 text-sm font-medium">{activePlan.highlight}</p>
                  </div>
                </div>
              </div>

              {/* All banks comparison mini */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {Object.values(BANK_PLANS).map((p) => (
                  <button
                    key={p.key}
                    onClick={() => selectBank(p.key)}
                    className={`text-center p-4 rounded-xl border-2 transition-all ${
                      activeBank === p.key ? `${p.borderCls} bg-gray-50` : "border-gray-100 hover:border-gray-200"
                    }`}
                  >
                    <div className="text-2xl mb-1">{p.icon}</div>
                    <p className="text-xs font-bold text-gray-800 leading-tight">{p.name}</p>
                    <p className="text-xs text-[#FF6B00] font-semibold mt-1">{p.estimate.split("/")[0]}/mo</p>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* ── Application Form ── */}
          <section ref={formRef} className="py-14 bg-gray-50">
            <div className="max-w-xl mx-auto px-4">
              <div className="text-center mb-8">
                <span className="inline-block bg-[#FF6B00]/10 text-[#FF6B00] text-sm font-bold px-4 py-1.5 rounded-full mb-3">
                  Free Application
                </span>
                <h2 className="text-2xl font-black text-gray-900">Apply as a Sathi</h2>
                <p className="text-gray-500 mt-1">Fill in your details — our team will call you within 24 hours</p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_name} *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_mobile} *</label>
                  <div className="flex">
                    <span className="flex items-center px-4 border border-r-0 border-gray-200 rounded-l-xl bg-gray-50 text-gray-500 text-sm font-medium">
                      +91
                    </span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={form.mobile}
                      onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))}
                      placeholder="9876543210"
                      className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition"
                    />
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_city} *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="e.g. Pune, Maharashtra"
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition"
                    />
                  </div>
                  {form.lat && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Location captured automatically
                    </p>
                  )}
                </div>

                {/* Bank Preference */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_bank}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(BANK_PLANS).map((plan) => (
                      <button
                        key={plan.key}
                        type="button"
                        onClick={() => selectBank(plan.key)}
                        className={`flex flex-col items-center p-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                          form.bank_preference === plan.key
                            ? `border-transparent bg-gradient-to-br ${plan.headerCls} text-white`
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <span className="text-xl mb-1">{plan.icon}</span>
                        {plan.name.split(" ")[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_exp}</label>
                  <select
                    value={form.experience}
                    onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition bg-white"
                  >
                    {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* Monthly estimate */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t.form_estimate}</label>
                  <select
                    value={form.monthly_estimate}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_estimate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00] transition bg-white"
                  >
                    {ESTIMATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-[#FF6B00] hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {submitting ? "Submitting…" : t.submit}
                </button>

                <p className="text-center text-xs text-gray-400">
                  By submitting you agree to our{" "}
                  <Link to="/terms" className="text-[#FF6B00] hover:underline">Terms</Link> and{" "}
                  <Link to="/privacy" className="text-[#FF6B00] hover:underline">Privacy Policy</Link>.
                </p>
              </form>

              {/* Staff contact below form */}
              <div className="mt-6">
                <p className="text-center text-sm text-gray-500 mb-3">{t.or_apply}</p>
                <div className="grid gap-2">
                  {Object.values(BANK_PLANS).map((plan) => (
                    <a
                      key={plan.key}
                      href={`tel:+91${plan.staff.phone}`}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition group"
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{plan.staff.name}</p>
                        <p className="text-xs text-gray-500">{plan.staff.role}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[#FF6B00] group-hover:gap-3 transition-all">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm font-bold">+91 {plan.staff.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick FAQ ── */}
          <section className="py-12 bg-white border-t border-gray-100">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-xl font-black text-gray-900 text-center mb-6">Common Questions</h2>
              <div className="space-y-3">
                {[
                  { q: "Do I need any investment or fees?", a: "Zero investment required. Becoming a Sathi is completely free. The bank provides the FASTag kits and tools at no cost to you." },
                  { q: "How soon will I get paid?", a: "Commission is credited monthly on the bank's payout date (20th–28th). No delay — directly to your registered bank account." },
                  { q: "Can I work from home or do I need an office?", a: "You can work from anywhere — home, shop, or near a toll plaza. Most Sathis operate from their existing premises." },
                  { q: "Can I work with more than one bank?", a: "Yes. Many Sathis are empanelled with 2–3 banks to maximize earnings. Our team will guide you on multi-bank enrollment." },
                ].map(({ q, a }) => (
                  <details key={q} className="bg-gray-50 rounded-xl p-4 group">
                    <summary className="font-semibold text-gray-900 text-sm cursor-pointer flex items-center justify-between">
                      {q}
                      <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <p className="text-gray-600 text-sm mt-3 leading-relaxed">{a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
