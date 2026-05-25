import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import SEO from "@/components/seo/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, ShieldCheck, ArrowRight, AlertCircle, User, Mail } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { sathiDashApi } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || "";

// ── Google One-Tap / Sign-In button ──────────────────────────────────────────
function GoogleButton({ onSuccess, onError, loading }) {
  const btnRef = useRef(null);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google || !btnRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (res) => onSuccess(res.credential),
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      type: "standard", theme: "outline", size: "large",
      text: "continue_with", shape: "pill", width: "100%",
    });
  }, [onSuccess]);

  if (!GOOGLE_CLIENT_ID) return null; // hide until configured

  return (
    <div className="w-full" ref={btnRef} />
  );
}

// ── Steps ─────────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { user, requestOtp, verifyOtp, googleLogin, updateProfile } = useAuth();
  const navigate  = useNavigate();
  const [params]  = useSearchParams();
  const returnTo  = params.get("returnTo") || "/find";

  const [step,    setStep]    = useState("phone"); // phone | otp | profile
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [name,    setName]    = useState("");
  const [email,   setEmail]   = useState("");
  const [err,     setErr]     = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate(decodeURIComponent(returnTo), { replace: true }); }, [user, navigate, returnTo]);

  // Load Google GSI script
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || document.getElementById("gsi-script")) return;
    const s = document.createElement("script");
    s.id  = "gsi-script";
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  const goNext = async (is_new_user) => {
    try {
      const check = await sathiDashApi.check();
      if (check.data?.is_sathi) { navigate("/dashboard", { replace: true }); return; }
    } catch {}
    if (is_new_user) { setStep("profile"); return; }
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

  // Step 2 — OTP
  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await verifyOtp(phone, otp);
    if (!r.ok) { setLoading(false); setErr(r.error); return; }
    setLoading(false);
    await goNext(r.is_new_user);
  };

  // Google login
  const handleGoogle = async (credential) => {
    setErr(null);
    setLoading(true);
    const r = await googleLogin(credential);
    setLoading(false);
    if (!r.ok) { setErr(r.error); return; }
    await goNext(r.is_new_user);
  };

  // Step 3 — profile
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
                  <h2 className="font-display font-black text-2xl">Enter your mobile</h2>
                  <p className="text-sm text-[#6B7280] mt-1">We'll send a 4-digit OTP to verify.</p>

                  {/* Google button */}
                  {GOOGLE_CLIENT_ID && (
                    <>
                      <div className="mt-5">
                        <GoogleButton onSuccess={handleGoogle} onError={(e) => setErr(e)} loading={loading} />
                      </div>
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                        <span className="text-xs font-bold text-[#9CA3AF] uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-[#E5E7EB]" />
                      </div>
                    </>
                  )}

                  <label className="block text-xs font-bold uppercase tracking-widest text-[#0A0A0A] mt-2">Mobile number</label>
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
                    {loading ? "Sending…" : <> Send OTP <ArrowRight className="w-4 h-4" /> </>}
                  </button>

                  <p className="mt-4 flex items-start gap-1.5 text-[11px] text-[#9CA3AF]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#059669] flex-shrink-0 mt-0.5" />
                    Number used only for verification & booking dispatch. No spam.
                  </p>
                </form>
              )}

              {/* ── Step 2: OTP ── */}
              {step === "otp" && (
                <form onSubmit={submitOtp}>
                  <div className="w-11 h-11 rounded-2xl bg-[#059669]/10 flex items-center justify-center mb-4">
                    <ShieldCheck className="w-5 h-5 text-[#059669]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">Enter OTP</h2>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Sent to <strong className="text-[#0A0A0A]">+91 ·····{phone.slice(-3)}</strong>
                    {" · "}
                    <button type="button" onClick={() => { setStep("phone"); setErr(null); setOtp(""); }} className="text-[#FF6B00] font-bold underline underline-offset-2">
                      Change
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
                    {loading ? "Verifying…" : <> Verify & continue <ArrowRight className="w-4 h-4" /> </>}
                  </button>
                </form>
              )}

              {/* ── Step 3: Profile (new users only) ── */}
              {step === "profile" && (
                <form onSubmit={submitProfile}>
                  <div className="w-11 h-11 rounded-2xl bg-[#0A0A0A]/10 flex items-center justify-center mb-4">
                    <User className="w-5 h-5 text-[#0A0A0A]" />
                  </div>
                  <h2 className="font-display font-black text-2xl">One last step</h2>
                  <p className="text-sm text-[#6B7280] mt-1">Tell us your name so your Sathi knows who to help.</p>

                  <label className="block mt-5 text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">Your name <span className="text-[#FF6B00]">*</span></label>
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
                    Email <span className="text-[#9CA3AF] font-normal normal-case tracking-normal">(optional)</span>
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
                    {loading ? "Saving…" : <> Save & continue <ArrowRight className="w-4 h-4" /> </>}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(decodeURIComponent(returnTo), { replace: true })}
                    className="mt-3 w-full text-sm text-[#9CA3AF] hover:text-[#6B7280] py-2 transition-colors"
                  >
                    Skip for now
                  </button>
                </form>
              )}

            </motion.div>
          </AnimatePresence>

          <p className="text-center text-xs text-[#9CA3AF] mt-5">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline hover:text-[#0A0A0A]">Terms</Link>
            {" & "}
            <Link to="/privacy" className="underline hover:text-[#0A0A0A]">Privacy Policy</Link>.
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
