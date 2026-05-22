import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageHero from "@/components/layout/PageHero";
import SEO from "@/components/seo/SEO";
import { jobApi, paymentsApi } from "@/lib/api";
import { track } from "@/lib/analytics";
import {
  Briefcase, CheckCircle2, Clock, XCircle, Star, ArrowRight,
  Loader2, AlertCircle, User, CheckCheck,
} from "lucide-react";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
function fullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return "";
  return `${BACKEND}${url}`;
}

const STATUS_CONFIG = {
  pending:     { label: "Pending",      Icon: Clock,        color: "text-[#F59E0B]", bg: "bg-[#FFFBEB] border-[#F59E0B]" },
  accepted:    { label: "Accepted",     Icon: CheckCircle2, color: "text-[#059669]", bg: "bg-[#F0FDF4] border-[#059669]" },
  in_progress: { label: "In Progress",  Icon: Clock,        color: "text-[#FF6B00]", bg: "bg-[#FFF7ED] border-[#FF6B00]" },
  resolved:    { label: "Resolved",     Icon: CheckCircle2, color: "text-[#059669]", bg: "bg-[#F0FDF4] border-[#059669]" },
  cancelled:   { label: "Cancelled",    Icon: XCircle,      color: "text-[#DC2626]", bg: "bg-[#FEF2F2] border-[#DC2626]" },
};

const ISSUE_LABELS = {
  dispute:  "Mischarge / Dispute",
  kyc:      "KYC Paperwork",
  recharge: "Recharge Fix",
  sos:      "Emergency SOS",
};

const ACTIVE_STATUSES = ["pending", "accepted", "in_progress"];

function groupJobs(jobs) {
  const active    = jobs.filter((j) => ACTIVE_STATUSES.includes(j.status));
  const resolved  = jobs.filter((j) => j.status === "resolved");
  const cancelled = jobs.filter((j) => j.status === "cancelled");
  return { active, resolved, cancelled };
}

export default function MyJobsPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentBanner, setPaymentBanner] = useState(null);
  const [newJobRef, setNewJobRef] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchJobs = useCallback(() => {
    if (!user) { setLoading(false); return; }
    return jobApi.myJobs()
      .then((r) => setJobs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    track("page_view", { page: "my_jobs" });
    fetchJobs();
  }, [fetchJobs]);

  // Handle Cashfree return redirect
  useEffect(() => {
    const paymentId = searchParams.get("payment_id");
    if (!paymentId || !user) return;
    setSearchParams({}, { replace: true });
    paymentsApi.verify(paymentId)
      .then((r) => {
        const { payment_status, job_ref } = r.data || {};
        setPaymentBanner(payment_status === "paid" ? "success" : "pending");
        if (job_ref) setNewJobRef(job_ref);
        if (payment_status === "paid") fetchJobs();
      })
      .catch(() => setPaymentBanner("pending"));
  }, [searchParams, user, fetchJobs, setSearchParams]);

  const { active, resolved, cancelled } = groupJobs(jobs);

  return (
    <>
      <SEO
        title="My Bookings"
        description="Track your FASTag Sathi bookings and dispute resolution progress."
        path="/my-jobs"
        noindex
      />

      <PageHero
        eyebrow="Account"
        title={<>My <span className="text-[#FF6B00]">Bookings.</span></>}
        sub="All your Sathi requests in one place. Track status, view dispute refs, and leave reviews after resolution."
        breadcrumb={[{ label: "My Bookings" }]}
      />

      <section className="py-12 bg-[#F8F9FA] min-h-[60vh]">
        <div className="max-w-3xl mx-auto px-6">

          {/* Payment result banner */}
          {paymentBanner === "success" && (
            <div className="mb-6 flex items-start gap-3 bg-[#F0FDF4] border-2 border-[#059669] rounded-2xl px-5 py-4">
              <CheckCheck className="w-5 h-5 text-[#059669] flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#059669] text-sm">Payment confirmed — booking created!</p>
                {newJobRef && (
                  <p className="text-xs font-mono bg-[#0A0A0A] text-[#FFD60A] inline-block px-2 py-1 rounded mt-1">{newJobRef}</p>
                )}
                <p className="text-xs text-[#4B5563] mt-1.5">Your Sathi has been notified and will accept shortly. Track progress with the ref above.</p>
              </div>
            </div>
          )}
          {paymentBanner === "pending" && (
            <div className="mb-6 flex items-center gap-3 bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl px-5 py-4">
              <AlertCircle className="w-5 h-5 text-[#F59E0B] flex-shrink-0" />
              <p className="text-sm font-bold text-[#92400E]">Payment not confirmed yet. If you completed it, please wait a moment and refresh.</p>
            </div>
          )}

          {/* Not logged in */}
          {!user && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-10 text-center shadow-[6px_6px_0_#FF6B00]">
              <AlertCircle className="w-10 h-10 text-[#FF6B00] mx-auto mb-3" />
              <h2 className="font-display font-black text-2xl">Login to see your bookings</h2>
              <p className="text-[#4B5563] mt-2">All Sathi requests tied to your mobile number show up here.</p>
              <Link
                to="/login?returnTo=%2Fmy-jobs"
                className="mt-5 inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-full shadow-[0_4px_0_#0A0A0A]"
              >
                Verify mobile to continue
              </Link>
            </div>
          )}

          {/* Loading */}
          {user && loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
            </div>
          )}

          {/* Empty state — no jobs at all */}
          {user && !loading && jobs.length === 0 && (
            <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-10 text-center shadow-[6px_6px_0_#FF6B00]">
              <Briefcase className="w-10 h-10 text-[#4B5563] mx-auto mb-3" />
              <h2 className="font-display font-black text-2xl">No bookings yet</h2>
              <p className="text-[#4B5563] mt-2">Find a verified Sathi near your toll plaza and send a booking request.</p>
              <Link
                to="/find"
                className="mt-5 inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-full shadow-[0_4px_0_#0A0A0A]"
              >
                Find a Sathi <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* Grouped job sections */}
          {user && !loading && jobs.length > 0 && (
            <div className="space-y-10">
              <JobSection
                title="Active"
                accent="#FF6B00"
                jobs={active}
                emptyMessage="No active bookings right now."
                onRefresh={fetchJobs}
              />
              <JobSection
                title="Resolved"
                accent="#059669"
                jobs={resolved}
                emptyMessage="No resolved bookings yet — active jobs will move here once your Sathi closes them."
                onRefresh={fetchJobs}
              />
              <JobSection
                title="Cancelled"
                accent="#DC2626"
                jobs={cancelled}
                emptyMessage="No cancelled bookings."
                onRefresh={fetchJobs}
              />
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function JobSection({ title, accent, jobs, emptyMessage, onRefresh }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span
          className="font-display font-black text-lg"
          style={{ color: accent }}
        >
          {title}
        </span>
        <span className="text-sm font-bold text-[#9CA3AF]">
          {jobs.length} {jobs.length === 1 ? "job" : "jobs"}
        </span>
        <div className="flex-1 h-px bg-[#E5E7EB]" />
      </div>

      {jobs.length === 0 ? (
        <p className="text-sm text-[#9CA3AF] italic pl-1">{emptyMessage}</p>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onRefresh={onRefresh} />
          ))}
        </div>
      )}
    </div>
  );
}

function SubRatingRow({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#4B5563] w-28 flex-shrink-0">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${label} ${n} star`}>
            <Star className={`w-5 h-5 transition-colors ${n <= value ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E5E7EB]"}`} />
          </button>
        ))}
      </div>
    </div>
  );
}

function JobCard({ job, onRefresh }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const { Icon } = cfg;

  const [reviewing, setReviewing]     = useState(false);
  const [stars, setStars]             = useState(5);
  const [reviewText, setReviewText]   = useState("");
  const [subRatings, setSubRatings]   = useState({ speed: 0, communication: 0, resolution: 0 });
  const [submitted, setSubmitted]     = useState(!!job.review);
  const [submitting, setSubmitting]   = useState(false);
  const avatarSrc = fullUrl(job.sathi_avatar);

  const submitReview = async () => {
    setSubmitting(true);
    try {
      const payload = { stars, text: reviewText };
      if (subRatings.speed)         payload.speed         = subRatings.speed;
      if (subRatings.communication) payload.communication = subRatings.communication;
      if (subRatings.resolution)    payload.resolution    = subRatings.resolution;
      await jobApi.submitReview(job.id, payload);
      setSubmitted(true);
      setReviewing(false);
      track("review_submitted", { job_id: job.id, stars });
    } catch {}
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 shadow-[4px_4px_0_#0A0A0A]">

      {/* Top row: avatar + info + badge */}
      <div className="flex items-start gap-4">
        {/* Sathi avatar */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 border-[#E5E7EB] bg-[#F3F4F6] relative">
          {avatarSrc ? (
            <img src={avatarSrc} alt="" className="absolute inset-0 w-full h-full object-cover block"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center" style={{ display: avatarSrc ? "none" : "flex" }}>
            <User className="w-6 h-6 text-[#9CA3AF]" />
          </div>
        </div>

        {/* Job details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-xs font-mono text-[#9CA3AF]">{job.ref_code}</p>
              <h3 className="font-display font-bold text-base leading-tight mt-0.5">
                {ISSUE_LABELS[job.issue] || job.issue}
              </h3>
              <p className="text-sm text-[#4B5563] mt-0.5">
                <strong className="text-[#0A0A0A]">{job.sathi_name || "—"}</strong>
                {job.vehicle_number && (
                  <> · <span className="font-mono text-xs">{job.vehicle_number}</span></>
                )}
              </p>
              <p className="text-xs text-[#9CA3AF] mt-1">
                {new Date(job.created_at).toLocaleDateString("en-IN", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </p>
            </div>

            {/* Status badge */}
            <div
              className={`flex-shrink-0 flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-bold ${cfg.color} ${cfg.bg}`}
            >
              <Icon className="w-3 h-3" />
              {cfg.label}
            </div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="mt-3 flex items-center gap-4 flex-wrap">
        <Link
          to={`/tools/dispute-tracker?ref=${job.ref_code}`}
          className="text-xs font-bold text-[#FF6B00] underline underline-offset-2"
        >
          Track dispute →
        </Link>
        {job.sathi_slug && (
          <Link
            to={`/sathi/${job.sathi_slug}`}
            className="text-xs font-bold text-[#4B5563] underline underline-offset-2"
          >
            View Sathi →
          </Link>
        )}
      </div>

      {/* Paid badge — all jobs are pre-paid at booking */}
      <div className="mt-3 flex items-center gap-2 text-xs font-bold text-[#059669]">
        <CheckCheck className="w-3.5 h-3.5" /> Paid ₹{job.platform_fee || 99}
      </div>

      {/* Rate this Sathi button (resolved, no review yet) */}
      {job.status === "resolved" && !submitted && !reviewing && (
        <button
          onClick={() => setReviewing(true)}
          className="mt-3 w-full border-2 border-dashed border-[#F59E0B] text-[#F59E0B] font-bold py-2.5 rounded-xl text-sm hover:bg-[#FFFBEB] transition-colors"
        >
          <Star className="w-4 h-4 inline mr-1.5" />Rate this Sathi
        </button>
      )}

      {/* Inline review form */}
      {reviewing && (
        <div className="mt-3 border-2 border-[#F59E0B] rounded-xl p-4 space-y-3">
          <p className="text-xs font-bold text-[#4B5563]">How would you rate {job.sathi_name || "this Sathi"}?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setStars(n)} aria-label={`${n} star`}>
                <Star
                  className={`w-7 h-7 transition-colors ${
                    n <= stars ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#E5E7EB]"
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={2}
            placeholder="How did it go? (optional)"
            className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 outline-none text-sm resize-none"
          />
          <div className="border-t border-[#F3F4F6] pt-3 space-y-2">
            <p className="text-[10px] uppercase tracking-widest font-bold text-[#9CA3AF]">Optional breakdown</p>
            <SubRatingRow label="Speed"         value={subRatings.speed}         onChange={(v) => setSubRatings((p) => ({ ...p, speed: v }))} />
            <SubRatingRow label="Communication" value={subRatings.communication} onChange={(v) => setSubRatings((p) => ({ ...p, communication: v }))} />
            <SubRatingRow label="Resolution"    value={subRatings.resolution}    onChange={(v) => setSubRatings((p) => ({ ...p, resolution: v }))} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={submitReview}
              disabled={submitting}
              className="bg-[#FF6B00] text-white font-bold px-5 py-2 rounded-full text-sm shadow-[0_3px_0_#0A0A0A] hover:-translate-y-px hover:shadow-[0_4px_0_#0A0A0A] transition-all disabled:opacity-60 disabled:translate-y-0"
            >
              {submitting ? "Submitting…" : "Submit review"}
            </button>
            <button
              onClick={() => setReviewing(false)}
              className="text-sm text-[#4B5563] underline underline-offset-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Submitted review display */}
      {submitted && job.review && (
        <div className="mt-3 bg-[#F0FDF4] border border-[#059669] rounded-xl p-3 text-sm">
          <p className="text-[#059669] font-bold">
            {"★".repeat(job.review.stars)}{"☆".repeat(5 - job.review.stars)} Your review
          </p>
          {job.review.text && (
            <p className="text-[#0A0A0A] mt-1">{job.review.text}</p>
          )}
        </div>
      )}

      {/* Submitted but no review object (just submitted in this session) */}
      {submitted && !job.review && (
        <div className="mt-3 bg-[#F0FDF4] border border-[#059669] rounded-xl p-3 text-sm">
          <p className="text-[#059669] font-bold">
            {"★".repeat(stars)} Review submitted — thank you!
          </p>
        </div>
      )}
    </div>
  );
}
