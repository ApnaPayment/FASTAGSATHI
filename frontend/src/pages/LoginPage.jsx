import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import SEO from "@/components/seo/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Phone, ShieldCheck, ArrowRight, AlertCircle, User, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sathiDashApi } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// ── Google Sign-In button — waits for GSI script to finish loading ────────────
function GoogleButton({ onSuccess }) {
  const btnRef  = useRef(null);
  const [ready, setReady] = useState(!!window.google);

  // Poll until window.google is available (script loads async)
  useEffect(() => {
    if (window.google) { setReady(true); return; }
    const id = setInterval(() => { if (window.google) { setReady(true); clearInterval(id); } }, 100);
    return () => clearInterval(id);
  }, []);

  // Render the button once Google SDK is ready
  useEffect(() => {
    if (!ready || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => onSuccess(res.credential),
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard", theme: "outline", size: "large",
      text: "continue_with", shape: "pill", width: "100%",
    });
  }, [ready, onSuccess]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <div className="w-full min-h-[44px] flex items-center justify-center">
      {!ready && (
        <div className="w-full h-11 rounded-full bg-[#F3F4F6] animate-pulse" />
      )}
      <div ref={btnRef} className={ready ? "w-full" : "hidden"} />
    </div>
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, requestOtp, verifyOtp, googleLogin, verifyPhone, confirmPhone, updateProfile } = useAuth();
  const { t } = useLanguage();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const returnTo  = params.get("returnTo") || "/find";

  // steps: phone | otp | profile | link-phone | link-otp
  const [step,    setStep]    = useState("phone");
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [linkPhone, setLinkPhone] = useState(""); // for Google users linking phone
  const [linkOtp,   setLinkOtp]   = useState("");
  const [err,     setErr]     = useState(null);
  const [loading, setLoading] = useState(false);

  // Don't auto-redirect if we're in link-phone / link-otp steps — user is logged in but needs phone
  useEffect(() => {
    if (user && !["link-phone", "link-otp"].includes(step)) {
      navigate(decodeURIComponent(returnTo), { replace: true });
    }
  }, [user, step, navigate, returnTo]);

  // Load Google GSI script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id  = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const goNext = async (is_new_user, prefillName = "", prefillEmail = "") => {
    try {
      const check = await sathiDashApi.check();
      if (check.data?.is_sathi) { navigate("/dashboard", { replace: true }); return; }
    } catch {}
    if (is_new_user) {
      if (prefillName) setName(prefillName);
      if (prefillEmail) setEmail(prefillEmail);
      setStep("profile");
      return;
    }
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  // Step 1 — phone
  const submitPhone = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!/^\d{10}$/.test(phone)) { setErr("Enter a valid 10-digit mobile number."); return; }
    setLoading(true);
    await requestOtp(phone);
    setLoading(false);
    setStep("otp");
  };

  // Step 2 — OTP (phone login)
  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await verifyOtp(phone, otp);
    if (!r.ok) { setLoading(false); setErr(r.error); return; }
    setLoading(false);
    await goNext(r.is_new_user);
  };

  // Google login — must then verify phone
  const handleGoogle = useCallback(async (credential) => {
    setErr(null);
    setLoading(true);
    const r = await googleLogin(credential);
    setLoading(false);
    if (!r.ok) { setErr(r.error); return; }
    // Always require phone verification after Google login
    setStep("link-phone");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleLogin]);

  // Step: link-phone — send OTP to new phone for Google user
  const submitLinkPhone = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!/^\d{10}$/.test(linkPhone)) { setErr("Enter a valid 10-digit mobile number."); return; }
    setLoading(true);
    const r = await verifyPhone(linkPhone);
    setLoading(false);
    if (!r.ok) { setErr(r.error); return; }
    setLinkOtp("");
    setStep("link-otp");
  };

  // Step: link-otp — confirm OTP and link phone
  const submitLinkOtp = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await confirmPhone(linkPhone, linkOtp);
    setLoading(false);
    if (!r.ok) { setErr(r.error); return; }
    // Phone linked — proceed
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  // Step 3 — profile (new phone users only)
  const submitProfile = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) { setErr("Please enter your name."); return; }
    setLoading(true);
    const r = await updateProfile({ name: name.trim(), email: email.trim() || null });
    setLoading(false);
    if (!r.ok) { setErr(r.error); return; }
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  return (
    <>
      <SEO title="Sign in — ApnaFastag" description="Quick mobile OTP or Google sign-in." path="/login" noindex />

      <PageHero
        eyebrow="Sign in"
        title={<>Welcome to <span className="text-[#FF6B00]">ApnaFastag</span></>}
        sub="Verify your mobile to book a Sathi and track your requests."
        breadcrumb={[{ label: "Login" }]}
      />

      <section className="py-12 bg-[#F8F9FA] min-h-[60vh]">
        <div className="max-w-sm mx-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.2 }}
              className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 shadow-[6px_6px_0_#FF6B00]"
            >

              {/* ── Step 1: Phone ── */}
              {step === "phone" && (
                <form onSubmit={submitPhone}>
                  <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                    <Phone className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">{t("login.enterMobile")}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{t("login.otpSub")}</p>

                  {/* Google button */}
                  {GOOGLE_CLIENT_ID && (
                    <>
                      <div className="mt-5">
                        <GoogleButton onSuccess={handleGoogle} onError={(e) => setErr(e)} loading={loading} />
                      </div>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                        <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">{t("common.or")}</span>
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                      </div>
                    </>
                  )}

                  <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A] mt-2">{t("login.mobileLabel")}</label>
                  <div className="mt-1.5 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                    <span className="font-mono font-bold text-[#0A0A0A] text-sm">+91</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98XXX XXXXX"
                      inputMode="numeric"
                      data-testid="login-phone-input"
                      className="bg-transparent flex-1 outline-none font-mono text-lg"
                      autoFocus
                    />
                  </div>

                  {err && <ErrorPill msg={err} />}

                  <button
                    type="submit"
                    disabled={loading || phone.length !== 10}
                    data-testid="login-send-otp"
                    className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-3.5 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loading ? t("login.sending") : <> {t("login.sendOtp")} <ArrowRight className="w-4 h-4" /> </>}
                  </button>

                  <p className="mt-4 flex items-start gap-1.5 text-[11px] text-[#9CA3AF]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669] flex-shrink-0 mt-0.5" />
                    {t("login.noSpam")}
                  </p>
                </form>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <form onSubmit={submitOtp}>
                  <div className="w-11 h-11 rounded-2xl bg-[#059669]/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-[#059669]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">{t("login.enterOtp")}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Sent to <strong className="text-[#0A0A0A]">+91 ·····{phone.slice(-3)}</strong>
                    {" · "}
                    <button type="button" onClick={() => { setStep("phone"); setErr(null); setOtp(""); }} className="text-[#FF6B00] font-bold underline underline-offset-2">
                      {t("login.change")}
                    </button>
                  </p>

                  <input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    placeholder="••••"
                    data-testid="login-otp-input"
                    className="mt-5 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-2xl px-4 py-5 outline-none text-center font-display font-black text-4xl tracking-[0.6em] transition-colors"
                    autoFocus
                  />

                  {err && <ErrorPill msg={err} />}

                  <button
                    type="submit"
                    disabled={loading || otp.length !== 4}
                    data-testid="login-verify-otp"
                    className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-3.5 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loading ? t("login.verifying") : <> {t("login.verify")} <ArrowRight className="w-4 h-4" /> </>}
                  </button>
                </form>
              )}

              {/* ── Step: Link phone (Google users must verify a mobile number) ── */}
              {step === "link-phone" && (
                <form onSubmit={submitLinkPhone}>
                  <div className="w-11 h-11 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mb-4">
                    <Phone className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">{t("login.addMobile")}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{t("login.addMobileSub")}</p>

                  <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A] mt-5">{t("login.mobileLabel")}</label>
                  <div className="mt-1.5 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                    <span className="font-mono font-bold text-[#0A0A0A] text-sm">+91</span>
                    <input
                      value={linkPhone}
                      onChange={(e) => setLinkPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      placeholder="98XXX XXXXX"
                      inputMode="numeric"
                      data-testid="link-phone-input"
                      className="bg-transparent flex-1 outline-none font-mono text-lg"
                      autoFocus
                    />
                  </div>

                  {err && <ErrorPill msg={err} />}

                  <button
                    type="submit"
                    disabled={loading || linkPhone.length !== 10}
                    data-testid="link-phone-send-otp"
                    className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-3.5 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loading ? t("login.sending") : <> {t("login.sendOtp")} <ArrowRight className="w-4 h-4" /> </>}
                  </button>

                  <p className="mt-4 flex items-start gap-1.5 text-[11px] text-[#9CA3AF]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669] flex-shrink-0 mt-0.5" />
                    {t("login.noSpam")}
                  </p>
                </form>
              )}

              {/* ── Step: Link OTP — confirm phone for Google users ── */}
              {step === "link-otp" && (
                <form onSubmit={submitLinkOtp}>
                  <div className="w-11 h-11 rounded-2xl bg-[#059669]/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-[#059669]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">{t("login.verifyMobile")}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Sent to <strong className="text-[#0A0A0A]">+91 ·····{linkPhone.slice(-3)}</strong>
                    {" · "}
                    <button type="button" onClick={() => { setStep("link-phone"); setErr(null); setLinkOtp(""); }} className="text-[#FF6B00] font-bold underline underline-offset-2">
                      {t("login.change")}
                    </button>
                  </p>

                  <input
                    value={linkOtp}
                    onChange={(e) => setLinkOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    placeholder="••••"
                    data-testid="link-otp-input"
                    className="mt-5 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-2xl px-4 py-5 outline-none text-center font-display font-black text-4xl tracking-[0.6em] transition-colors"
                    autoFocus
                  />

                  {err && <ErrorPill msg={err} />}

                  <button
                    type="submit"
                    disabled={loading || linkOtp.length !== 4}
                    data-testid="link-otp-verify"
                    className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-3.5 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loading ? t("login.verifying") : <> {t("login.verify")} <ArrowRight className="w-4 h-4" /> </>}
                  </button>
                </form>
              )}

              {/* ── Step 3: Profile (new users only) ── */}
              {step === "profile" && (
                <form onSubmit={submitProfile}>
                  <div className="w-11 h-11 rounded-2xl bg-[#0A0A0A]/10 flex items-center justify-center mb-4">
                    <User className="w-5 h-5 text-[#0A0A0A]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">{t("login.oneLastStep")}</h2>
                  <p className="text-sm text-[#6B7280] mt-1">{t("login.profileSub")}</p>

                  <label className="block mt-5 text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">{t("login.yourName")} <span className="text-[#FF6B00]">*</span></label>
                  <div className="mt-1.5 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                    <User className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ramesh Kumar"
                      data-testid="login-name-input"
                      className="bg-transparent flex-1 outline-none text-base"
                      autoFocus
                    />
                  </div>

                  <label className="block mt-4 text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">
                    {t("login.email")} <span className="text-[#9CA3AF] font-normal normal-case tracking-normal">{t("login.optional")}</span>
                  </label>
                  <div className="mt-1.5 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                    <Mail className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ramesh@gmail.com"
                      type="email"
                      inputMode="email"
                      data-testid="login-email-input"
                      className="bg-transparent flex-1 outline-none text-base"
                    />
                  </div>

                  {err && <ErrorPill msg={err} />}

                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    data-testid="login-save-profile"
                    className="mt-5 w-full bg-[#0A0A0A] text-white font-bold py-3.5 rounded-full hover:bg-[#222] shadow-[0_4px_0_#FF6B00] disabled:opacity-50 transition-all inline-flex items-center justify-center gap-2"
                  >
                    {loading ? t("login.saving") : <> {t("login.saveProfile")} <ArrowRight className="w-4 h-4" /> </>}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(decodeURIComponent(returnTo), { replace: true })}
                    className="mt-3 w-full text-sm text-[#9CA3AF] hover:text-[#6B7280] py-2 transition-colors"
                  >
                    {t("login.skipForNow")}
                  </button>
                </form>
              )}

            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-[#9CA3AF] mt-5">
            {t("login.terms")}{" "}
            <Link to="/terms" className="underline hover:text-[#0A0A0A]">{t("login.termsLink")}</Link>
            {" & "}
            <Link to="/privacy" className="underline hover:text-[#0A0A0A]">{t("login.privacy")}</Link>.
          </p>
        </div>
      </section>
    </>
  );
}

function ErrorPill({ msg }) {
  return (
    <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}
