import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import SEO from "@/components/seo/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { Phone, ShieldCheck, ArrowRight, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { sathiDashApi } from "@/lib/api";

export default function LoginPage() {
  const { user, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnTo = params.get("returnTo") || "/find";

  const [step, setStep] = useState("phone"); // 'phone' | 'otp'
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) navigate(decodeURIComponent(returnTo), { replace: true }); }, [user, navigate, returnTo]);

  const submitPhone = async (e) => {
    e.preventDefault();
    setErr(null);
    if (!/^\d{10}$/.test(phone)) { setErr("Enter a 10-digit Indian mobile."); return; }
    setLoading(true);
    await requestOtp(phone);
    setLoading(false);
    setStep("otp");
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const r = await verifyOtp(phone, otp);
    if (!r.ok) { setLoading(false); setErr(r.error); return; }
    // If user is a Sathi, send them to their dashboard
    try {
      const check = await sathiDashApi.check();
      if (check.data?.is_sathi) { navigate("/dashboard", { replace: true }); return; }
    } catch {}
    setLoading(false);
    navigate(decodeURIComponent(returnTo), { replace: true });
  };

  return (
    <>
      <SEO title="Login with mobile OTP" description="Quick 4-digit OTP login. We use this to hide Sathi contact details from bots." path="/login" noindex />

      <PageHero
        eyebrow="Sign in"
        title={<>One <span className="text-[#FF6B00]">OTP</span>. You're in.</>}
        sub="We hide Sathi contact details from bots — quick mobile verification, then you're unlocked across the whole site."
        breadcrumb={[{ label: "Login" }]}
      />

      <section className="py-12 bg-[#F8F9FA]">
        <div className="max-w-md mx-auto px-6">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 md:p-8 shadow-[8px_8px_0_#FF6B00]"
          >
            {step === "phone" && (
              <form onSubmit={submitPhone}>
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
                  <Phone className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h2 className="font-display font-black text-2xl">Enter your mobile</h2>
                <p className="text-sm text-[#4B5563] mt-1">We'll send a 4-digit OTP.</p>

                <label className="block mt-5 text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">Mobile number</label>
                <div className="mt-1 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3">
                  <span className="font-mono font-bold text-[#0A0A0A]">+91</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="98XXX XXXXX"
                    inputMode="numeric"
                    data-testid="login-phone-input"
                    className="bg-transparent flex-1 outline-none font-mono text-lg"
                  />
                </div>
                {err && <ErrorPill msg={err} />}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="login-send-otp"
                  className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-4 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-60"
                >
                  {loading ? "Sending OTP…" : "Send OTP"}
                </button>

                <div className="mt-5 flex items-start gap-2 bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl p-3 text-xs text-[#4B5563]">
                  <ShieldCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />
                  <span>We never spam. Number is used only for verification & match dispatch.</span>
                </div>
              </form>
            )}

            {step === "otp" && (
              <form onSubmit={submitOtp}>
                <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6 text-[#FF6B00]" />
                </div>
                <h2 className="font-display font-black text-2xl">Enter the OTP</h2>
                <p className="text-sm text-[#4B5563] mt-1">Sent to <strong>+91 ····· ··{phone.slice(-3)}</strong> · <button type="button" onClick={() => setStep("phone")} className="text-[#FF6B00] underline" data-testid="login-change-phone">change</button></p>

                <p className="mt-3 text-[10px] uppercase tracking-widest font-bold text-[#FF6B00] bg-[#FF6B00]/10 inline-block px-2 py-1 rounded">Demo · any 4 digits work</p>

                <label className="block mt-5 text-xs font-bold uppercase tracking-widest text-[#0A0A0A]">4-digit code</label>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  inputMode="numeric"
                  placeholder="••••"
                  data-testid="login-otp-input"
                  className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-4 outline-none text-center font-display font-black text-3xl tracking-[0.5em]"
                />
                {err && <ErrorPill msg={err} />}

                <button
                  type="submit"
                  disabled={loading || otp.length !== 4}
                  data-testid="login-verify-otp"
                  className="mt-5 w-full bg-[#FF6B00] text-white font-bold py-4 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {loading ? "Verifying…" : <>Verify & continue <ArrowRight className="w-4 h-4" /></>}
                </button>
              </form>
            )}
          </motion.div>

          <p className="text-center text-xs text-[#4B5563] mt-6">By continuing you agree to our <Link to="/terms" className="underline">Terms</Link> & <Link to="/privacy" className="underline">Privacy Policy</Link>.</p>
        </div>
      </section>
    </>
  );
}

function ErrorPill({ msg }) {
  return (
    <div className="mt-4 flex items-start gap-2 bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] text-sm rounded-xl p-3">
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </div>
  );
}
