import React, { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { webAppSchema } from "@/components/seo/SEO";
import { Link, useSearchParams } from "react-router-dom";
import { Search, CheckCircle2, Clock, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { track } from "@/lib/analytics";
import { jobApi } from "@/lib/api";

const STATUS_STAGES = {
  pending: [
    { label: "Booking received by Sathi", done: true },
    { label: "Sathi accepted your case", done: false, active: true },
    { label: "Resolution in progress", done: false },
    { label: "Dispute resolved & closed", done: false },
  ],
  accepted: [
    { label: "Booking received by Sathi", done: true },
    { label: "Sathi accepted your case", done: true },
    { label: "Resolution in progress", done: false, active: true },
    { label: "Dispute resolved & closed", done: false },
  ],
  in_progress: [
    { label: "Booking received by Sathi", done: true },
    { label: "Sathi accepted your case", done: true },
    { label: "Resolution in progress", done: true },
    { label: "Dispute resolved & closed", done: false, active: true },
  ],
  resolved: [
    { label: "Booking received by Sathi", done: true },
    { label: "Sathi accepted your case", done: true },
    { label: "Resolution in progress", done: true },
    { label: "Dispute resolved & closed", done: true },
  ],
  cancelled: [
    { label: "Booking received by Sathi", done: true },
    { label: "Booking cancelled", done: true, cancelled: true },
  ],
};

const ISSUE_LABELS = {
  dispute: "Mischarge / Dispute filing",
  kyc: "KYC & Re-KYC paperwork",
  recharge: "Recharge & low-balance fix",
  sos: "Emergency / SOS dispatch",
};

export default function DisputeTrackerPage() {
  const [searchParams] = useSearchParams();
  const [ref, setRef] = useState(searchParams.get("ref") || "");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { track("page_view", { page: "tool_dispute_tracker" }); }, []);

  // Auto-check if ref came from URL
  useEffect(() => {
    const urlRef = searchParams.get("ref");
    if (urlRef) check(urlRef);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const check = async (overrideRef) => {
    const trimmed = (overrideRef || ref).trim().toUpperCase();
    if (!trimmed) return;
    setNotFound(false);
    setResult(null);
    setLoading(true);
    track("dispute_check_run", { ref_len: trimmed.length });
    try {
      const res = await jobApi.byRef(trimmed);
      setResult(res.data);
    } catch (err) {
      if (err?.response?.status === 404) {
        setNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => { if (e.key === "Enter") check(); };

  const stages = result ? (STATUS_STAGES[result.status] || STATUS_STAGES.pending) : [];

  return (
    <>
      <SEO
        title="FASTag dispute tracker — see your refund status in real-time"
        description="Track NHAI + bank dispute resolution stages with one ref number. See where your mischarge claim is stuck and escalate via a Sathi if needed."
        path="/tools/dispute-tracker"
        keywords="fastag dispute status, fastag refund status, nhai dispute tracker, fastag mischarge status"
        jsonLd={webAppSchema({
          name: "FASTag Dispute Tracker",
          description: "Real-time status across NHAI + bank for any FASTag dispute reference.",
          url: "https://apnafastag.com/tools/dispute-tracker",
        })}
      />
      <PageHero
        eyebrow="Free tool"
        title={<>Track your <span className="text-[#FF6B00]">dispute.</span></>}
        sub="Paste the reference number from your booking confirmation. We'll show the current stage across Sathi + NHAI, in plain language."
        breadcrumb={[{ label: "Tools", to: "/" }, { label: "Dispute tracker" }]}
      />

      <section className="pt-2 pb-12 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0_#FF6B00]">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
                <input
                  value={ref}
                  onChange={(e) => { setRef(e.target.value.toUpperCase()); setNotFound(false); setResult(null); }}
                  onKeyDown={handleKey}
                  placeholder="e.g. DSP-MH-2026-AB12C3"
                  data-testid="dispute-ref"
                  className="w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-full pl-12 pr-4 py-3 outline-none uppercase font-mono"
                />
              </div>
              <button
                onClick={check}
                disabled={loading || !ref.trim()}
                data-testid="dispute-check-btn"
                className="bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-60 inline-flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
              </button>
            </div>
            <p className="text-xs text-[#4B5563] mt-3">Reference number was sent in your booking confirmation (format: DSP-XX-YYYY-XXXXXX).</p>
          </div>

          {/* Not found */}
          {notFound && (
            <div className="mt-6 bg-[#FEF2F2] border-2 border-[#DC2626] rounded-2xl p-5 text-center">
              <XCircle className="w-8 h-8 text-[#DC2626] mx-auto mb-2" />
              <p className="font-display font-bold text-[#DC2626]">Reference not found</p>
              <p className="text-sm text-[#4B5563] mt-1">Double-check the code from your booking SMS/email. You can also <Link to="/find" className="text-[#FF6B00] underline">find a Sathi</Link> to help.</p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="mt-8 bg-white border-2 border-[#0A0A0A] rounded-3xl p-7">
              <div className="flex justify-between text-sm flex-wrap gap-2">
                <span className="text-[#4B5563]">Ref: <strong className="text-[#0A0A0A] font-mono">{result.ref_code}</strong></span>
                <span className="text-[#4B5563]">Filed: <strong className="text-[#0A0A0A]">{new Date(result.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</strong></span>
              </div>

              <div className="mt-3">
                <p className="text-xl font-display font-bold">{ISSUE_LABELS[result.issue] || result.issue}</p>
                <p className="text-sm text-[#4B5563] mt-0.5">
                  Sathi: <strong className="text-[#0A0A0A]">{result.sathi_name}</strong> · Vehicle: <strong className="text-[#0A0A0A] font-mono">{result.vehicle_number || "—"}</strong>
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {stages.map((stage, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-4 border-2 rounded-2xl p-4 ${
                      stage.cancelled ? "bg-[#FEF2F2] border-[#DC2626]"
                      : stage.done ? "bg-[#F0FDF4] border-[#059669]"
                      : stage.active ? "bg-[#FFF7ED] border-[#FF6B00]"
                      : "bg-white border-[#E5E7EB]"
                    }`}
                  >
                    {stage.cancelled
                      ? <XCircle className="w-6 h-6 text-[#DC2626]" />
                      : stage.done
                      ? <CheckCircle2 className="w-6 h-6 text-[#059669]" />
                      : stage.active
                      ? <Clock className="w-6 h-6 text-[#FF6B00]" />
                      : <Clock className="w-6 h-6 text-[#9CA3AF]" />
                    }
                    <div className="flex-1 font-display font-bold">{stage.label}</div>
                  </div>
                ))}
              </div>

              {result.status === "resolved" && result.review && (
                <div className="mt-5 bg-[#F0FDF4] border-2 border-[#059669] rounded-2xl p-4">
                  <p className="text-sm font-bold text-[#059669]">Your review</p>
                  <p className="text-sm text-[#0A0A0A] mt-1">{"★".repeat(result.review.stars)} · {result.review.text}</p>
                </div>
              )}

              {result.status !== "resolved" && result.status !== "cancelled" && (
                <div className="mt-6 bg-[#FF6B00] text-white rounded-2xl p-5">
                  <AlertCircle className="w-6 h-6 mb-2" />
                  <div className="font-display font-bold">Dispute stuck more than 5 days?</div>
                  <p className="text-sm text-white/90 mt-1">A Sathi can escalate at the plaza office — usually gets resolution within 48 hours.</p>
                  <Link to="/find" className="mt-3 inline-flex items-center gap-1.5 bg-white text-[#FF6B00] font-bold px-4 py-2 rounded-full text-sm">Find another Sathi →</Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <PageCTA />
    </>
  );
}
