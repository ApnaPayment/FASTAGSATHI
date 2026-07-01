import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import { leadApi } from "@/lib/api";
import {
  MapPin, Phone, ChevronDown, CheckCircle2, TrendingUp,
  Shield, Globe2, Smartphone, ArrowRight, Loader2, BadgeCheck,
  IndianRupee, Star, Users, X, Gift,
} from "lucide-react";

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: {
    flag:"🇮🇳", name:"English",
    headline:"Earn ₹15,000–₹50,000/Month", sub:"Become an Official FASTag Sathi — Zero Investment", cta:"Apply Free",
    lang_title:"Choose Your Language",
    stat_sathis:"Active Sathis", stat_earn:"Avg Monthly Earn",
    steps_title:"3 Steps to Start Earning",
    step1_title:"Apply Free",   step1_desc:"Fill the form — 2 minutes. No documents needed.",
    step2_title:"Get Trained",  step2_desc:"Online training by bank. Done from home in 1–3 days.",
    step3_title:"Start Earning",step3_desc:"Issue FASTag, earn monthly commission to your account.",
    bank_title:"Choose Your Bank Partner", bank_sub:"Compare commissions — pick what works for you",
    form_title:"Apply as a Sathi", form_sub:"We call you within 24 hours",
    form_name:"Full Name", form_mobile:"Mobile Number", form_city:"City / Town",
    form_bank:"Preferred Bank", form_exp:"Experience", form_estimate:"Monthly Target",
    submit:"Submit Application",
    success_title:"Application Submitted!", success_sub:"Our team will call you within 24 hours. You can also call the bank manager directly:",
    call_now:"Call Now", or_apply:"Call directly:",
    faq_title:"Quick Answers",
  },
  hi: {
    flag:"🇮🇳", name:"हिंदी",
    headline:"₹15,000–₹50,000/माह कमाएं", sub:"FASTag सथी बनें — कोई निवेश नहीं", cta:"मुफ्त आवेदन करें",
    lang_title:"अपनी भाषा चुनें",
    stat_sathis:"सक्रिय सथी", stat_earn:"औसत मासिक कमाई",
    steps_title:"3 आसान कदम",
    step1_title:"मुफ्त आवेदन", step1_desc:"फॉर्म भरें — 2 मिनट। कोई दस्तावेज़ नहीं।",
    step2_title:"प्रशिक्षण लें", step2_desc:"बैंक का ऑनलाइन प्रशिक्षण। घर से 1–3 दिनों में।",
    step3_title:"कमाना शुरू करें", step3_desc:"FASTag जारी करें, मासिक कमीशन बैंक खाते में।",
    bank_title:"बैंक पार्टनर चुनें", bank_sub:"कमीशन तुलना करें",
    form_title:"सथी आवेदन", form_sub:"24 घंटे में हमारी टीम कॉल करेगी",
    form_name:"पूरा नाम", form_mobile:"मोबाइल नंबर", form_city:"शहर/कस्बा",
    form_bank:"बैंक पार्टनर", form_exp:"अनुभव", form_estimate:"मासिक लक्ष्य",
    submit:"आवेदन जमा करें",
    success_title:"आवेदन प्राप्त हुआ!", success_sub:"24 घंटे में टीम कॉल करेगी। या बैंक मैनेजर को अभी कॉल करें:",
    call_now:"अभी कॉल करें", or_apply:"सीधे कॉल करें:",
    faq_title:"सामान्य प्रश्न",
  },
  mr: {
    flag:"🇮🇳", name:"मराठी",
    headline:"₹15,000–₹50,000/महिना कमवा", sub:"FASTag सथी व्हा — कोणतीही गुंतवणूक नाही", cta:"मोफत अर्ज करा",
    lang_title:"आपली भाषा निवडा",
    stat_sathis:"सक्रिय सथी", stat_earn:"सरासरी मासिक कमाई",
    steps_title:"3 सोपे टप्पे",
    step1_title:"मोफत अर्ज", step1_desc:"फॉर्म भरा — 2 मिनिटे. कागदपत्रे नाहीत.",
    step2_title:"प्रशिक्षण घ्या", step2_desc:"बँकेचे ऑनलाइन प्रशिक्षण. घरून 1–3 दिवसांत.",
    step3_title:"कमाई सुरू करा", step3_desc:"FASTag द्या, मासिक कमिशन खात्यात जमा.",
    bank_title:"बँक पार्टनर निवडा", bank_sub:"कमिशन तुलना करा",
    form_title:"सथी अर्ज", form_sub:"24 तासांत आमची टीम कॉल करेल",
    form_name:"पूर्ण नाव", form_mobile:"मोबाईल नंबर", form_city:"शहर/गाव",
    form_bank:"बँक", form_exp:"अनुभव", form_estimate:"मासिक लक्ष्य",
    submit:"अर्ज सादर करा",
    success_title:"अर्ज प्राप्त झाला!", success_sub:"24 तासात टीम कॉल करेल. किंवा बँक मॅनेजरला कॉल करा:",
    call_now:"आता कॉल करा", or_apply:"थेट कॉल करा:",
    faq_title:"सामान्य प्रश्न",
  },
  ta: {
    flag:"🇮🇳", name:"தமிழ்",
    headline:"மாதம் ₹15,000–₹50,000 சம்பாதியுங்கள்", sub:"FASTag சாதி ஆகுங்கள் — முதலீடு தேவையில்லை", cta:"இலவசமாக விண்ணப்பிக்கவும்",
    lang_title:"உங்கள் மொழியை தேர்வு செய்யவும்",
    stat_sathis:"செயலில் உள்ள சாதிகள்", stat_earn:"சராசரி மாத வருமானம்",
    steps_title:"3 எளிய படிகள்",
    step1_title:"இலவச விண்ணப்பம்", step1_desc:"படிவத்தை நிரப்பவும் — 2 நிமிடம்.",
    step2_title:"பயிற்சி பெறுங்கள்", step2_desc:"வங்கி ஆன்லைன் பயிற்சி. 1–3 நாட்கள்.",
    step3_title:"சம்பாதிக்க தொடங்குங்கள்", step3_desc:"FASTag வழங்குங்கள், மாதாந்திர கமிஷன்.",
    bank_title:"வங்கி பங்காளரை தேர்வு செய்யவும்", bank_sub:"கமிஷன்களை ஒப்பிடுங்கள்",
    form_title:"சாதி விண்ணப்பம்", form_sub:"24 மணி நேரத்தில் அழைப்போம்",
    form_name:"முழு பெயர்", form_mobile:"மொபைல் எண்", form_city:"நகரம்",
    form_bank:"வங்கி", form_exp:"அனுபவம்", form_estimate:"மாதாந்திர இலக்கு",
    submit:"சமர்ப்பிக்கவும்",
    success_title:"விண்ணப்பம் சமர்ப்பிக்கப்பட்டது!", success_sub:"24 மணி நேரத்தில் தொடர்பு கொள்ளும்:",
    call_now:"இப்போது அழைக்கவும்", or_apply:"நேரடியாக அழைக்கவும்:",
    faq_title:"பொதுவான கேள்விகள்",
  },
  te: {
    flag:"🇮🇳", name:"తెలుగు",
    headline:"నెలకు ₹15,000–₹50,000 సంపాదించండి", sub:"FASTag సాధి అవ్వండి — పెట్టుబడి అవసరం లేదు", cta:"ఉచితంగా దరఖాస్తు చేయండి",
    lang_title:"మీ భాషను ఎంచుకోండి",
    stat_sathis:"క్రియాశీల సాధులు", stat_earn:"సగటు నెలవారీ ఆదాయం",
    steps_title:"3 సరళమైన దశలు",
    step1_title:"ఉచిత దరఖాస్తు", step1_desc:"ఫారమ్ నింపండి — 2 నిమిషాలు.",
    step2_title:"శిక్షణ పొందండి", step2_desc:"బ్యాంక్ ఆన్‌లైన్ శిక్షణ. 1–3 రోజులు.",
    step3_title:"సంపాదించడం ప్రారంభించండి", step3_desc:"FASTag ఇవ్వండి, నెలవారీ కమిషన్.",
    bank_title:"బ్యాంక్ పార్టనర్ ఎంచుకోండి", bank_sub:"కమీషన్‌లను పోల్చండి",
    form_title:"సాధి దరఖాస్తు", form_sub:"24 గంటల్లో కాల్ చేస్తాం",
    form_name:"పూర్తి పేరు", form_mobile:"మొబైల్ నంబర్", form_city:"నగరం",
    form_bank:"బ్యాంక్", form_exp:"అనుభవం", form_estimate:"నెలవారీ లక్ష్యం",
    submit:"దరఖాస్తు సమర్పించండి",
    success_title:"దరఖాస్తు సమర్పించబడింది!", success_sub:"24 గంటల్లో సంప్రదిస్తాం:",
    call_now:"ఇప్పుడే కాల్ చేయండి", or_apply:"నేరుగా కాల్ చేయండి:",
    faq_title:"సాధారణ ప్రశ్నలు",
  },
  kn: {
    flag:"🇮🇳", name:"ಕನ್ನಡ",
    headline:"ತಿಂಗಳಿಗೆ ₹15,000–₹50,000 ಸಂಪಾದಿಸಿ", sub:"FASTag ಸಾಥಿ ಆಗಿ — ಯಾವುದೇ ಹೂಡಿಕೆ ಬೇಡ", cta:"ಉಚಿತ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    lang_title:"ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ",
    stat_sathis:"ಸಕ್ರಿಯ ಸಾಥಿಗಳು", stat_earn:"ಸರಾಸರಿ ಮಾಸಿಕ ಆದಾಯ",
    steps_title:"3 ಸರಳ ಹಂತಗಳು",
    step1_title:"ಉಚಿತ ಅರ್ಜಿ", step1_desc:"ಫಾರ್ಮ್ ತುಂಬಿ — 2 ನಿಮಿಷ.",
    step2_title:"ತರಬೇತಿ ಪಡೆಯಿರಿ", step2_desc:"ಬ್ಯಾಂಕ್ ಆನ್‌ಲೈನ್ ತರಬೇತಿ. 1–3 ದಿನ.",
    step3_title:"ಗಳಿಸಲು ಪ್ರಾರಂಭಿಸಿ", step3_desc:"FASTag ನೀಡಿ, ಮಾಸಿಕ ಕಮಿಷನ್.",
    bank_title:"ಬ್ಯಾಂಕ್ ಪಾಲುದಾರ ಆಯ್ಕೆ ಮಾಡಿ", bank_sub:"ಕಮಿಷನ್ ಹೋಲಿಸಿ",
    form_title:"ಸಾಥಿ ಅರ್ಜಿ", form_sub:"24 ಗಂಟೆಯಲ್ಲಿ ಕರೆ ಮಾಡುತ್ತೇವೆ",
    form_name:"ಪೂರ್ಣ ಹೆಸರು", form_mobile:"ಮೊಬೈಲ್ ನಂಬರ್", form_city:"ನಗರ",
    form_bank:"ಬ್ಯಾಂಕ್", form_exp:"ಅನುಭವ", form_estimate:"ಮಾಸಿಕ ಗುರಿ",
    submit:"ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",
    success_title:"ಅರ್ಜಿ ಸಲ್ಲಿಸಲಾಗಿದೆ!", success_sub:"24 ಗಂಟೆಗಳಲ್ಲಿ ಸಂಪರ್ಕಿಸುತ್ತೇವೆ:",
    call_now:"ಈಗ ಕರೆ ಮಾಡಿ", or_apply:"ನೇರ ಕರೆ:",
    faq_title:"ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು",
  },
  bn: {
    flag:"🇮🇳", name:"বাংলা",
    headline:"মাসে ₹15,000–₹50,000 উপার্জন করুন", sub:"FASTag সাথী হন — কোনো বিনিয়োগ নেই", cta:"বিনামূল্যে আবেদন করুন",
    lang_title:"আপনার ভাষা বেছে নিন",
    stat_sathis:"সক্রিয় সাথী", stat_earn:"গড় মাসিক আয়",
    steps_title:"৩টি সহজ ধাপ",
    step1_title:"বিনামূল্যে আবেদন", step1_desc:"ফর্ম পূরণ করুন — ২ মিনিট।",
    step2_title:"প্রশিক্ষণ নিন", step2_desc:"ব্যাংকের অনলাইন প্রশিক্ষণ। ১–৩ দিন।",
    step3_title:"আয় শুরু করুন", step3_desc:"FASTag দিন, মাসিক কমিশন অ্যাকাউন্টে।",
    bank_title:"ব্যাংক পার্টনার বেছে নিন", bank_sub:"কমিশন তুলনা করুন",
    form_title:"সাথী আবেদন", form_sub:"২৪ ঘণ্টার মধ্যে কল করব",
    form_name:"পুরো নাম", form_mobile:"মোবাইল নম্বর", form_city:"শহর",
    form_bank:"ব্যাংক", form_exp:"অভিজ্ঞতা", form_estimate:"মাসিক লক্ষ্যমাত্রা",
    submit:"আবেদন জমা দিন",
    success_title:"আবেদন জমা হয়েছে!", success_sub:"২৪ ঘণ্টার মধ্যে যোগাযোগ করব:",
    call_now:"এখনই কল করুন", or_apply:"সরাসরি কল করুন:",
    faq_title:"সাধারণ প্রশ্নসমূহ",
  },
  gu: {
    flag:"🇮🇳", name:"ગુજરાતી",
    headline:"મહિને ₹15,000–₹50,000 કમાઓ", sub:"FASTag સાથી બનો — કોઈ રોકાણ નહીં", cta:"મફત અરજી કરો",
    lang_title:"તમારી ભાષા પસંદ કરો",
    stat_sathis:"સક્રિય સાથી", stat_earn:"સરેરાશ માસિક કમાણી",
    steps_title:"3 સરળ પગલાં",
    step1_title:"મફત અરજી", step1_desc:"ફોર્મ ભરો — 2 મિનિટ.",
    step2_title:"તાલીમ લો", step2_desc:"બેંક ઓનલાઈન તાલીમ. 1–3 દિવસ.",
    step3_title:"કમાણી શરૂ કરો", step3_desc:"FASTag આપો, માસિક કમિશન ખાતામાં.",
    bank_title:"બેંક પાર્ટનર પસંદ કરો", bank_sub:"કમિશન સરખાવો",
    form_title:"સાથી અરજી", form_sub:"24 કલાકમાં ફોન કરીશું",
    form_name:"પૂરું નામ", form_mobile:"મોબાઈલ નંબર", form_city:"શહેર",
    form_bank:"બેંક", form_exp:"અનુભવ", form_estimate:"માસિક લક્ષ્ય",
    submit:"અરજી સબમિટ કરો",
    success_title:"અરજી સ્વીકારી!", success_sub:"24 કલાકમાં સંપર્ક કરીશું:",
    call_now:"અત્યારે કૉલ કરો", or_apply:"સીધો કૉલ:",
    faq_title:"સામાન્ય પ્રશ્નો",
  },
};

// ── Bank Plans ─────────────────────────────────────────────────────────────────
const BANK_PLANS = {
  sbi: {
    key: "sbi", dbSlug: "sbi-fastag",
    name: "SBI FASTag",
    badgeText: "Largest Network",
    badgeCls: "bg-blue-100 text-blue-700",
    headerCls: "from-blue-700 to-blue-500",
    borderCls: "border-blue-300",
    ringCls: "ring-blue-400",
    dotCls: "bg-blue-500",
    icon: "🏦",
    commissions: [
      { label: "Car/Jeep",   value: "Up to ₹200 instant" },
      { label: "Commercial", value: "Up to ₹500 instant" },
      { label: "Recharge",   value: "0.25% per txn" },
      { label: "Target",     value: "50 tags/month" },
      { label: "Payout",     value: "25th of month" },
      { label: "Training",   value: "Online · 2 days" },
    ],
    estimate: "₹8k–₹25k/mo",
    highlight: "Instant commission per tag · Salary option on discussed target",
    staff: { name: "Priya Sharma", phone: "9876543210", role: "SBI Partner Manager" },
  },
  idfc: {
    key: "idfc", dbSlug: "idfc-fastag",
    name: "IDFC First Bank",
    badgeText: "Best Commission",
    badgeCls: "bg-purple-100 text-purple-700",
    headerCls: "from-purple-700 to-purple-500",
    borderCls: "border-purple-300",
    ringCls: "ring-purple-400",
    dotCls: "bg-purple-500",
    icon: "💜",
    commissions: [
      { label: "Car/Jeep",   value: "Up to ₹150 instant" },
      { label: "Commercial", value: "Up to ₹500 instant" },
      { label: "Recharge",   value: "0.5% per txn" },
      { label: "Target",     value: "40 tags/month" },
      { label: "Payout",     value: "20th of month" },
      { label: "Training",   value: "Online + field · 3d" },
    ],
    estimate: "₹10k–₹35k/mo",
    highlight: "Instant commission per tag · Salary option on discussed target",
    staff: { name: "Rahul Verma", phone: "8765432109", role: "IDFC First Bank Channel Manager" },
  },
  bajaj: {
    key: "bajaj", dbSlug: "bajaj-fastag",
    name: "Bajaj Finance",
    badgeText: "Fastest Activation",
    badgeCls: "bg-orange-100 text-orange-700",
    headerCls: "from-[#FF6B00] to-orange-400",
    borderCls: "border-orange-300",
    ringCls: "ring-orange-400",
    dotCls: "bg-[#FF6B00]",
    icon: "⚡",
    commissions: [
      { label: "Car/Jeep",   value: "Up to ₹150 instant" },
      { label: "Commercial", value: "Up to ₹500 instant" },
      { label: "Recharge",   value: "0.3% per txn" },
      { label: "Target",     value: "30 tags/month" },
      { label: "Payout",     value: "28th of month" },
      { label: "Training",   value: "Online only · 1 day" },
    ],
    estimate: "₹8k–₹25k/mo",
    highlight: "Instant commission per tag · Salary option on discussed target",
    staff: { name: "Amit Kumar", phone: "7654321098", role: "Bajaj Finance FASTag Manager" },
  },
};

const EXPERIENCE_OPTIONS = [
  { value: "new",   label: "No experience (I'm new)" },
  { value: "0-1yr", label: "0–1 year" },
  { value: "1-3yr", label: "1–3 years" },
  { value: "3yr+",  label: "3+ years (Experienced)" },
];

const ESTIMATE_OPTIONS = [
  { value: "1-20",   label: "1–20 tags/month" },
  { value: "20-50",  label: "20–50 tags/month" },
  { value: "50-100", label: "50–100 tags/month" },
  { value: "100+",   label: "100+ tags/month" },
];

// Helper — full URL for bank logos stored in DB (may be /uploads/... or data: or http)
const fullUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  return url;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function JoinPage() {
  const [lang, setLang]             = useState("en");
  const [showLang, setShowLang]     = useState(true);
  const [activeBank, setActiveBank] = useState("sbi");
  const [step, setStep]             = useState("form"); // "form"|"success"
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState("");
  const [bankLogos, setBankLogos]   = useState({}); // slug → logo URL
  const [form, setForm] = useState({
    name: "", mobile: "", city: "",
    bank_preference: "sbi", experience: "new", monthly_estimate: "20-50",
    lat: null, lng: null, language: "en", ref: "",
  });
  const formRef = useRef(null);
  const t = T[lang];

  useEffect(() => {
    // Ref from WhatsApp URL + silent geolocation
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    if (ref) setForm((f) => ({ ...f, ref }));
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setForm((f) => ({ ...f, lat: pos.coords.latitude, lng: pos.coords.longitude })),
        () => {}, { timeout: 8000 }
      );
    }
    // Fetch bank logos from DB
    fetch("/api/banks")
      .then((r) => r.json())
      .then((data) => {
        const logos = {};
        (data.banks || []).forEach((b) => { if (b.logo) logos[b.slug] = b.logo; });
        setBankLogos(logos);
      })
      .catch(() => {});
  }, []);

  const chooseLanguage = (code) => { setLang(code); setForm((f) => ({ ...f, language: code })); setShowLang(false); };
  const scrollToForm   = () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const selectBank     = (key) => { setActiveBank(key); setForm((f) => ({ ...f, bank_preference: key })); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim())                          return setError("Please enter your full name.");
    if (!/^\d{10}$/.test(form.mobile.trim()))       return setError("Enter a valid 10-digit mobile number.");
    if (!form.city.trim())                          return setError("Please enter your city.");
    setSubmitting(true);
    try {
      await leadApi.submitJoin({ ...form, source: "website" });
      setStep("success");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Something went wrong. Please try again or call us directly.");
    } finally { setSubmitting(false); }
  };

  // Bank logo: prefer DB logo, fall back to emoji
  const BankLogo = ({ plan, className = "h-7 w-auto object-contain" }) => {
    const url = fullUrl(bankLogos[plan.dbSlug]);
    return url
      ? <img src={url} alt={plan.name} className={className} onError={(e) => { e.target.style.display = "none"; }} />
      : <span className="text-2xl leading-none">{plan.icon}</span>;
  };

  const activePlan = BANK_PLANS[activeBank];

  return (
    <>
      <SEO
        title="Join as FASTag Sathi — Earn ₹15,000–₹50,000/Month · ApnaFastag"
        description="Become an authorised ApnaFastag Sathi partner. Earn commission on every FASTag you issue or recharge — SBI, IDFC First Bank, Bajaj. No investment. Apply free today."
        keywords="FASTag sathi partner, FASTag agent commission, SBI FASTag agent, IDFC FASTag partner, Bajaj FASTag distributor"
        schema={breadcrumbSchema([
          { name: "Home", url: "https://apnafastag.com/" },
          { name: "Join as Sathi", url: "https://apnafastag.com/join" },
        ])}
      />

      {/* ── Language Modal ── */}
      {showLang && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#FF6B00]" />
                <h2 className="text-base font-bold text-gray-900">{t.lang_title}</h2>
              </div>
              <button onClick={() => setShowLang(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(T).map(([code, info]) => (
                <button key={code} onClick={() => chooseLanguage(code)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all hover:border-[#FF6B00] ${lang === code ? "border-[#FF6B00] bg-orange-50" : "border-gray-200"}`}>
                  <span className="text-lg">{info.flag}</span>
                  <span className="font-medium text-gray-800 text-sm">{info.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Success Screen ── */}
      {step === "success" ? (
        <div className="min-h-[70vh] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
          <div className="w-full max-w-md text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">{t.success_title}</h1>
            <p className="text-gray-300 mb-6 text-sm">{t.success_sub}</p>
            <div className="space-y-2">
              {Object.values(BANK_PLANS).map((plan) => (
                <div key={plan.key} className="bg-white rounded-xl p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                      <BankLogo plan={plan} className="h-6 w-auto object-contain" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">{plan.staff.name}</p>
                      <p className="text-xs text-gray-500">{plan.name}</p>
                    </div>
                  </div>
                  <a href={`tel:+91${plan.staff.phone}`}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-white bg-gradient-to-r ${plan.headerCls} text-xs whitespace-nowrap`}>
                    <Phone className="w-3.5 h-3.5" />{t.call_now}
                  </a>
                </div>
              ))}
            </div>
            <Link to="/" className="inline-block mt-5 text-[#FF6B00] hover:underline text-sm">← Back to ApnaFastag</Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Hero ── */}
          <section className="relative bg-gradient-to-br from-gray-900 via-[#1a1a2e] to-gray-900 overflow-hidden">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-10 left-0 w-64 h-64 bg-[#FF6B00] rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-600 rounded-full blur-3xl" />
            </div>
            <div className="relative max-w-4xl mx-auto px-4 py-10 md:py-14">
              <div className="inline-flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 rounded-full px-3 py-1 mb-4">
                <Smartphone className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400 text-xs font-medium">Official ApnaFastag Partner Program</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-2 leading-tight">{t.headline}</h1>
              <p className="text-base text-gray-300 mb-5 max-w-lg">{t.sub}</p>

              {/* Compact stats row */}
              <div className="flex flex-wrap gap-2 mb-6">
                {[
                  { icon: Users,     val: "2,400+",  label: t.stat_sathis },
                  { icon: Shield,    val: "3 Banks",  label: "SBI · IDFC · Bajaj" },
                  { icon: TrendingUp,val: "₹28,000", label: t.stat_earn },
                ].map(({ icon: Icon, val, label }) => (
                  <div key={label} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5">
                    <Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                    <span className="text-white font-bold text-xs">{val}</span>
                    <span className="text-gray-400 text-xs">{label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={scrollToForm}
                  className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-orange-500 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-orange-500/25 text-sm">
                  {t.cta} <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => setShowLang(true)}
                  className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-3 rounded-xl border border-white/20 transition-all text-sm">
                  <Globe2 className="w-3.5 h-3.5" />{T[lang].name}<ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </section>

          {/* ── 3 Steps (compact horizontal) ── */}
          <section className="bg-gray-50 py-6 border-b border-gray-200">
            <div className="max-w-4xl mx-auto px-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center mb-4">{t.steps_title}</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { num: "1", icon: Gift,        title: t.step1_title, desc: t.step1_desc },
                  { num: "2", icon: BadgeCheck,  title: t.step2_title, desc: t.step2_desc },
                  { num: "3", icon: IndianRupee, title: t.step3_title, desc: t.step3_desc },
                ].map(({ num, icon: Icon, title, desc }) => (
                  <div key={num} className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FF6B00]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-3.5 h-3.5 text-[#FF6B00]" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{title}</p>
                      <p className="text-gray-500 text-xs leading-relaxed mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Bank Plans ── */}
          <section className="py-8 bg-white">
            <div className="max-w-4xl mx-auto px-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-black text-gray-900">{t.bank_title}</h2>
                  <p className="text-gray-400 text-xs mt-0.5">{t.bank_sub}</p>
                </div>
              </div>

              {/* 3 compact bank selector cards */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Object.values(BANK_PLANS).map((plan) => (
                  <button key={plan.key} onClick={() => selectBank(plan.key)}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                      activeBank === plan.key
                        ? `${plan.borderCls} bg-gray-50 ring-2 ${plan.ringCls} ring-offset-1`
                        : "border-gray-200 hover:border-gray-300 bg-white"
                    }`}
                  >
                    {activeBank === plan.key && (
                      <span className={`absolute top-2 right-2 w-2 h-2 rounded-full ${plan.dotCls}`} />
                    )}
                    <div className="h-8 flex items-center mb-2">
                      <BankLogo plan={plan} className="h-7 w-auto object-contain max-w-[80px]" />
                    </div>
                    <p className="font-bold text-gray-800 text-xs leading-tight">{plan.name}</p>
                    <p className="text-[#FF6B00] font-bold text-xs mt-1">{plan.estimate}</p>
                    <span className={`inline-block mt-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${plan.badgeCls}`}>
                      {plan.badgeText}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active plan detail — compact 2-col grid */}
              <div className={`border-2 ${activePlan.borderCls} rounded-xl overflow-hidden`}>
                <div className={`bg-gradient-to-r ${activePlan.headerCls} px-4 py-3 flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className="h-8 flex items-center">
                      <BankLogo plan={activePlan} className="h-7 w-auto object-contain brightness-0 invert" />
                    </div>
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-wide">{activePlan.badgeText}</p>
                      <p className="text-white font-black text-sm">{activePlan.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[10px]">Est. monthly</p>
                    <p className="text-white font-black text-base">{activePlan.estimate}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {activePlan.commissions.map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
                        <span className="text-gray-500 text-xs">{label}</span>
                        <span className="font-bold text-gray-900 text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Star className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    <p className="text-green-700 text-xs font-medium">{activePlan.highlight}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Application Form ── */}
          <section ref={formRef} className="py-8 bg-gray-50 border-t border-gray-200">
            <div className="max-w-lg mx-auto px-4">
              <div className="text-center mb-5">
                <span className="inline-block bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold px-3 py-1 rounded-full mb-2">Free</span>
                <h2 className="text-xl font-black text-gray-900">{t.form_title}</h2>
                <p className="text-gray-500 text-sm mt-1">{t.form_sub}</p>
              </div>

              <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
                {/* Name + Mobile row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_name} *</label>
                    <input type="text" value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Ramesh Kumar"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_mobile} *</label>
                    <div className="flex">
                      <span className="flex items-center px-2.5 border border-r-0 border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-xs">+91</span>
                      <input type="tel" maxLength={10} value={form.mobile}
                        onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value.replace(/\D/g, "") }))}
                        placeholder="9876543210"
                        className="flex-1 border border-gray-200 rounded-r-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]" />
                    </div>
                  </div>
                </div>

                {/* City */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_city} *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" value={form.city}
                      onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                      placeholder="Pune, Maharashtra"
                      className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 focus:border-[#FF6B00]" />
                  </div>
                  {form.lat && <p className="text-[11px] text-green-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Location captured</p>}
                </div>

                {/* Bank */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_bank}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.values(BANK_PLANS).map((plan) => (
                      <button key={plan.key} type="button" onClick={() => selectBank(plan.key)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all ${
                          form.bank_preference === plan.key
                            ? `${plan.borderCls} bg-gray-50 ring-1 ${plan.ringCls}`
                            : "border-gray-200 hover:border-gray-300"
                        }`}>
                        <div className="h-6 flex items-center justify-center">
                          <BankLogo plan={plan} className="h-5 w-auto object-contain max-w-[56px]" />
                        </div>
                        <span className="text-[10px] font-semibold text-gray-700 text-center leading-tight">{plan.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Experience + Estimate row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_exp}</label>
                    <select value={form.experience} onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-white">
                      {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{t.form_estimate}</label>
                    <select value={form.monthly_estimate} onChange={(e) => setForm((f) => ({ ...f, monthly_estimate: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/30 bg-white">
                      {ESTIMATE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-700 text-xs">{error}</div>
                )}

                <button type="submit" disabled={submitting}
                  className="w-full bg-[#FF6B00] hover:bg-orange-500 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-500/20">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  {submitting ? "Submitting…" : t.submit}
                </button>

                <p className="text-center text-[11px] text-gray-400">
                  By submitting you agree to our <Link to="/terms" className="text-[#FF6B00] hover:underline">Terms</Link> and <Link to="/privacy" className="text-[#FF6B00] hover:underline">Privacy Policy</Link>.
                </p>
              </form>

              {/* Staff contacts */}
              <div className="mt-4">
                <p className="text-center text-xs text-gray-500 mb-2">{t.or_apply}</p>
                <div className="space-y-2">
                  {Object.values(BANK_PLANS).map((plan) => (
                    <a key={plan.key} href={`tel:+91${plan.staff.phone}`}
                      className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-3 py-2.5 hover:border-gray-300 transition group">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                          <BankLogo plan={plan} className="h-5 w-auto object-contain" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-xs">{plan.staff.name}</p>
                          <p className="text-[11px] text-gray-400">{plan.staff.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#FF6B00]">
                        <Phone className="w-3.5 h-3.5" />
                        <span className="text-xs font-bold">+91 {plan.staff.phone.replace(/(\d{5})(\d{5})/, "$1 $2")}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Quick FAQ ── */}
          <section className="py-6 bg-white border-t border-gray-100">
            <div className="max-w-2xl mx-auto px-4">
              <h2 className="text-base font-black text-gray-900 text-center mb-3">{t.faq_title}</h2>
              <div className="space-y-2">
                {[
                  { q: "Do I need any investment or fees?", a: "Zero investment required. Becoming a Sathi is completely free." },
                  { q: "When will I get paid?", a: "Commission is credited monthly (20th–28th) directly to your bank account." },
                  { q: "Can I work from home?", a: "Yes — most Sathis work from home, shop, or near a toll plaza." },
                  { q: "Can I work with more than one bank?", a: "Yes. Many Sathis are empanelled with 2–3 banks to maximize earnings." },
                ].map(({ q, a }) => (
                  <details key={q} className="bg-gray-50 rounded-xl px-4 py-3 group">
                    <summary className="font-semibold text-gray-900 text-sm cursor-pointer flex items-center justify-between list-none">
                      {q}<ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
                    </summary>
                    <p className="text-gray-500 text-sm mt-2 leading-relaxed">{a}</p>
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
