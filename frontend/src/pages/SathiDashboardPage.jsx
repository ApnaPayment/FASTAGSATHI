import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEO from "@/components/seo/SEO";
import { sathiDashApi, applicationApi, getToken } from "@/lib/api";
import { track } from "@/lib/analytics";
import { motion, AnimatePresence } from "framer-motion";
import {
  BadgeCheck, CheckCircle2, Clock, XCircle, Star, Loader2, AlertCircle,
  IndianRupee, Briefcase, ToggleLeft, ToggleRight, ChevronRight,
  Play, Ban, Camera, Upload, Trash2, X, Save, Edit3, Image, Info,
  Building2, MapPin, Navigation, ToggleLeft as ToggleOff,
} from "lucide-react";

const ISSUE_LABELS  = { dispute: "Mischarge / Dispute", kyc: "KYC paperwork", recharge: "Recharge fix", sos: "Emergency SOS" };
const STATUS_CONFIG = {
  pending:     { label: "Pending",     color: "text-[#F59E0B]", bg: "bg-[#FFFBEB] border-[#F59E0B]" },
  accepted:    { label: "Accepted",    color: "text-[#059669]", bg: "bg-[#F0FDF4] border-[#059669]" },
  in_progress: { label: "In Progress", color: "text-[#FF6B00]", bg: "bg-[#FFF7ED] border-[#FF6B00]" },
  resolved:    { label: "Resolved",    color: "text-[#059669]", bg: "bg-[#F0FDF4] border-[#059669]" },
  cancelled:   { label: "Cancelled",   color: "text-[#9CA3AF]", bg: "bg-[#F9FAFB] border-[#E5E7EB]" },
};
const ALL_SERVICES = [
  { id: "dispute",  label: "Mischarge / Dispute" },
  { id: "kyc",      label: "KYC & Re-KYC" },
  { id: "recharge", label: "Recharge fix" },
  { id: "sos",      label: "Emergency SOS" },
];
const ALL_BANKS = [
  { id: "sbi-fastag",   label: "SBI FASTag" },
  { id: "paytm-fastag", label: "Paytm FASTag" },
  { id: "icici-fastag", label: "ICICI FASTag" },
  { id: "hdfc-fastag",  label: "HDFC FASTag" },
  { id: "axis-fastag",  label: "Axis FASTag" },
  { id: "kotak-fastag", label: "Kotak FASTag" },
  { id: "yes-fastag",   label: "Yes Bank" },
  { id: "idfc-fastag",  label: "IDFC FASTag" },
];
const ALL_LANGS = ["Hindi","English","Marathi","Tamil","Kannada","Telugu","Bengali","Gujarati","Punjabi","Malayalam","Odia","Urdu"];
const DAYS = ["mon","tue","wed","thu","fri","sat","sun"];
const DAY_LABELS = { mon:"Mon",tue:"Tue",wed:"Wed",thu:"Thu",fri:"Fri",sat:"Sat",sun:"Sun" };

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";

function fullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return "";
  return `${BACKEND}${url}`;
}

export default function SathiDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading]     = useState(true);
  const [profile, setProfile]     = useState(null);
  const [notSathi, setNotSathi]   = useState(null);
  const [claimSlug, setClaimSlug] = useState("");
  const [claimErr, setClaimErr]   = useState(null);
  const [claimLoading, setClaimLoading] = useState(false);

  const [jobs, setJobs]         = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [perfStats, setPerfStats] = useState(null);
  const [tab, setTab]           = useState("pending");
  const [available, setAvailable]         = useState(false);
  const [togglingAvail, setTogglingAvail] = useState(false);

  const [showEditor, setShowEditor] = useState(false);
  const [jobToast, setJobToast] = useState(null); // { job, id }
  const toastTimerRef = useRef(null);

  useEffect(() => {
    track("page_view", { page: "sathi_dashboard" });
    if (!user) { navigate("/login?returnTo=%2Fdashboard", { replace: true }); return; }
    loadDashboard();
  }, [user]); // eslint-disable-line

  // ── SSE: real-time job notifications ────────────────────────────────────────
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const url = `${BACKEND}/api/sathi-dashboard/events?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.type === "new_job") {
          const job = msg.data;
          // Prepend to jobs list (avoid duplicates)
          setJobs((prev) => prev.some((j) => j.id === job.id) ? prev : [job, ...prev]);
          // Show toast
          const toastId = Date.now();
          setJobToast({ job, id: toastId });
          clearTimeout(toastTimerRef.current);
          toastTimerRef.current = setTimeout(() => setJobToast(null), 4000);
        }
      } catch {}
    };

    es.onerror = () => {
      // EventSource will auto-reconnect; nothing extra needed
    };

    return () => {
      es.close();
      clearTimeout(toastTimerRef.current);
    };
  }, [user]); // eslint-disable-line

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [profRes, jobsRes, earnRes, statsRes] = await Promise.all([
        sathiDashApi.profile(), sathiDashApi.jobs(), sathiDashApi.earnings(), sathiDashApi.stats(),
      ]);
      setProfile(profRes.data);
      setAvailable(profRes.data.is_available ?? false);
      setJobs(jobsRes.data);
      setEarnings(earnRes.data);
      setPerfStats(statsRes.data);
    } catch (err) {
      if (err?.response?.status === 403) {
        try { const c = await sathiDashApi.check(); setNotSathi(c.data); }
        catch { setNotSathi({ application_status: null }); }
      }
    } finally { setLoading(false); }
  }, []);

  const handleClaim = async (e) => {
    e.preventDefault(); setClaimErr(null);
    if (!claimSlug.trim()) { setClaimErr("Enter your Sathi profile slug."); return; }
    setClaimLoading(true);
    try {
      await sathiDashApi.claim(claimSlug.trim().toLowerCase());
      setNotSathi(null); track("sathi_claim", { slug: claimSlug }); loadDashboard();
    } catch (err) { setClaimErr(err?.response?.data?.detail || "Claim failed — check the slug."); }
    finally { setClaimLoading(false); }
  };

  const toggleAvailability = async () => {
    setTogglingAvail(true);
    try { await sathiDashApi.setAvailability(!available); setAvailable((v) => !v); }
    catch {} finally { setTogglingAvail(false); }
  };

  const updateJob = (id, patch) => setJobs((prev) => prev.map((j) => j.id === id ? { ...j, ...patch } : j));
  const actionJob = async (id, action) => {
    try {
      let res;
      if (action === "accept")  res = await sathiDashApi.acceptJob(id);
      if (action === "start")   res = await sathiDashApi.startJob(id);
      if (action === "resolve") res = await sathiDashApi.resolveJob(id);
      if (action === "cancel")  res = await sathiDashApi.cancelJob(id);
      if (res) updateJob(id, res.data);
      track(`sathi_job_${action}`, { job_id: id });
      if (action === "resolve") sathiDashApi.earnings().then((r) => setEarnings(r.data)).catch(() => {});
    } catch {}
  };

  if (loading) return <div className="pt-40 pb-32 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>;

  // ── Not linked ──────────────────────────────────────────────────────────────
  if (notSathi !== null) {
    const appStatus = notSathi?.application_status;
    return (
      <>
        <SEO title="Sathi Portal" path="/dashboard" noindex />
        <div className="min-h-screen bg-[#F8F9FA] pt-32 pb-20 px-4">
          <div className="max-w-md mx-auto space-y-4">
            {appStatus && (
              <div className={`border-2 rounded-3xl p-7 ${appStatus === "approved" ? "bg-[#F0FDF4] border-[#059669] shadow-[8px_8px_0_#059669]" : "bg-white border-[#0A0A0A] shadow-[8px_8px_0_#FF6B00]"}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${appStatus === "approved" ? "bg-[#059669]/15" : "bg-[#FF6B00]/15"}`}>
                  {appStatus === "approved" ? <BadgeCheck className="w-6 h-6 text-[#059669]" /> : <Clock className="w-6 h-6 text-[#FF6B00]" />}
                </div>
                <h2 className="font-display font-black text-2xl">
                  {appStatus === "approved"  && "Application approved!"}
                  {appStatus === "reviewing" && "Application under review"}
                  {appStatus === "pending"   && "Application received"}
                  {appStatus === "rejected"  && "Application not approved"}
                </h2>
                {notSathi?.name && <p className="text-[#4B5563] mt-1 font-medium">Hi {notSathi.name}</p>}
                <p className="text-sm text-[#4B5563] mt-2">
                  {appStatus === "approved"  && "Your profile is live. Our team will call you within 48 hours to complete onboarding."}
                  {appStatus === "reviewing" && "We're reviewing your application and will call within 2 business days."}
                  {appStatus === "pending"   && "We've received your application — review takes 48 hours."}
                  {appStatus === "rejected"  && "Your application wasn't approved this time. Contact support for details."}
                </p>
                {notSathi?.application_ref && <p className="mt-3 text-xs font-mono bg-white/60 px-3 py-2 rounded-lg inline-block text-[#4B5563]">Ref: {notSathi.application_ref}</p>}
              </div>
            )}
            <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-7">
              <h3 className="font-display font-bold text-lg">Already have a Sathi profile?</h3>
              <p className="text-[#4B5563] mt-1 text-sm">If onboarded directly, enter your profile slug to link it.</p>
              <form onSubmit={handleClaim} className="mt-4 space-y-3">
                <input value={claimSlug} onChange={(e) => setClaimSlug(e.target.value)} placeholder="e.g. ravi-shinde-khalapur"
                  className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none font-mono text-sm" />
                {claimErr && <div className="flex items-start gap-2 bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] text-sm rounded-xl p-3"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />{claimErr}</div>}
                <button type="submit" disabled={claimLoading || !claimSlug.trim()}
                  className="w-full bg-[#0A0A0A] text-white font-bold py-3 rounded-full disabled:opacity-50 flex items-center justify-center gap-2">
                  {claimLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BadgeCheck className="w-4 h-4" />}
                  {claimLoading ? "Linking…" : "Link profile"}
                </button>
              </form>
            </div>
            {!appStatus && <p className="text-center text-sm text-[#4B5563]">Not a Sathi yet? <Link to="/become-a-sathi#apply" className="text-[#FF6B00] font-bold underline">Apply now →</Link></p>}
          </div>
        </div>
      </>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  const pendingJobs   = jobs.filter((j) => j.status === "pending");
  const activeJobs    = jobs.filter((j) => j.status === "accepted" || j.status === "in_progress");
  const resolvedJobs  = jobs.filter((j) => j.status === "resolved");
  const cancelledJobs = jobs.filter((j) => j.status === "cancelled");
  const tabJobs = tab === "pending" ? pendingJobs : tab === "active" ? activeJobs : tab === "resolved" ? resolvedJobs : cancelledJobs;

  const pendingActions = getPendingActions(profile, available, () => setShowEditor(true));

  return (
    <>
      <SEO title="Sathi Dashboard" path="/dashboard" noindex />

      {/* Dark header */}
      <div className="bg-[#0A0A0A] text-white pt-28 pb-10">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="flex flex-wrap items-center gap-5 justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar with upload */}
              <AvatarUpload profile={profile} onUploaded={(url) => setProfile((p) => ({ ...p, avatar: url }))} />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-display font-black text-2xl">{profile?.name}</h1>
                  {profile?.verified && <BadgeCheck className="w-5 h-5 text-[#059669]" />}
                  {profile?.premium && <span className="text-[9px] font-black uppercase bg-[#FF6B00] text-white px-1.5 py-0.5 rounded">Pro</span>}
                </div>
                <p className="text-white/60 text-sm">{profile?.city} · {profile?.slug}</p>
                <button onClick={() => setShowEditor(true)}
                  className="mt-1 text-xs text-[#FF6B00] hover:text-[#FFD60A] flex items-center gap-1 transition-colors">
                  <Edit3 className="w-3 h-3" /> Edit profile
                </button>
              </div>
            </div>

            <button onClick={toggleAvailability} disabled={togglingAvail}
              className={`flex items-center gap-3 border-2 rounded-2xl px-5 py-3 font-bold text-sm transition-colors ${available ? "border-[#059669] bg-[#059669]/15 text-[#059669]" : "border-white/20 bg-white/5 text-white/50"}`}>
              {togglingAvail ? <Loader2 className="w-5 h-5 animate-spin" /> : available ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
              {available ? "Available for jobs" : "Off duty"}
            </button>
          </div>

          {/* Pending actions */}
          {pendingActions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {pendingActions.map((a) => (
                <button key={a.label} onClick={a.action}
                  className="flex items-center gap-2 bg-[#FF6B00]/15 border border-[#FF6B00]/40 text-[#FF6B00] text-xs font-bold px-3 py-2 rounded-full hover:bg-[#FF6B00]/25 transition-colors">
                  <Info className="w-3.5 h-3.5 flex-shrink-0" /> {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Pending"    value={pendingJobs.length}  accent="#F59E0B" sub="need response" />
            <StatCard label="Active"     value={activeJobs.length}   accent="#FF6B00" sub="in progress" />
            <StatCard label="Resolved"   value={resolvedJobs.length} accent="#059669" sub="all time" />
            <StatCard label="This month" value={`₹${(earnings?.this_month || 0).toLocaleString("en-IN")}`} accent="#FFD60A" sub="earnings" />
          </div>
        </div>
      </div>

      <div className="bg-[#F8F9FA] min-h-screen">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 grid lg:grid-cols-3 gap-8">

          {/* Job queue */}
          <div className="lg:col-span-2">
            <div className="flex bg-white border-2 border-[#0A0A0A] rounded-full p-1 w-fit mb-5 flex-wrap gap-1">
              {[
                { id: "pending",   label: `Pending (${pendingJobs.length})` },
                { id: "active",    label: `Active (${activeJobs.length})` },
                { id: "resolved",  label: `Resolved (${resolvedJobs.length})` },
                { id: "cancelled", label: `Cancelled (${cancelledJobs.length})` },
              ].map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-full transition-all ${tab === t.id ? "bg-[#0A0A0A] text-white" : "text-[#4B5563]"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {tabJobs.length === 0 ? (
              <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-10 text-center text-[#9CA3AF]">
                <Briefcase className="w-8 h-8 mx-auto mb-2" />
                <p className="font-bold">No {tab} jobs</p>
                {tab === "pending" && !available && (
                  <p className="text-xs mt-2">You're off duty — go online to receive jobs.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {tabJobs.map((job) => <JobCard key={job.id} job={job} onAction={actionJob} />)}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Earnings */}
            <div className="bg-[#0A0A0A] text-white rounded-3xl p-6">
              <IndianRupee className="w-6 h-6 text-[#FFD60A] mb-3" />
              <p className="text-xs uppercase tracking-widest text-white/50 font-bold">Total earnings</p>
              <p className="font-display font-black text-4xl text-[#FFD60A] mt-1">₹{(earnings?.total_earnings || 0).toLocaleString("en-IN")}</p>
              <div className="mt-4 border-t border-white/10 pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/60">This month</span><span className="font-bold text-[#FFD60A]">₹{(earnings?.this_month || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-white/60">Jobs resolved</span><span className="font-bold">{earnings?.resolved_count || 0}</span></div>
              </div>
            </div>

            {/* Performance */}
            {perfStats && <PerformanceCard stats={perfStats} />}

            {/* Recent payouts */}
            {earnings?.recent?.length > 0 && (
              <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5">
                <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#4B5563] mb-3">Recent payouts</h3>
                <div className="space-y-2">
                  {earnings.recent.slice(0, 5).map((j, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div><p className="font-mono text-xs text-[#9CA3AF]">{j.ref_code}</p><p className="font-bold">{ISSUE_LABELS[j.issue] || j.issue}</p></div>
                      <span className="font-display font-black text-[#059669]">+₹{j.platform_fee || 99}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery preview */}
            <GalleryPreview profile={profile} onUpdate={(g) => setProfile((p) => ({ ...p, gallery: g }))} />

            {/* Apnafastag Center */}
            <ApnafastagCenterCard profile={profile} onSaved={(updated) => setProfile(updated)} />

            {/* Quick links */}
            <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 space-y-3">
              <Link to={`/sathi/${profile?.slug}`} className="flex items-center justify-between text-sm font-bold text-[#0A0A0A] hover:text-[#FF6B00]">
                <span>View your public profile</span><ChevronRight className="w-4 h-4" />
              </Link>
              <Link to="/tools/dispute-tracker" className="flex items-center justify-between text-sm font-bold text-[#0A0A0A] hover:text-[#FF6B00]">
                <span>Dispute tracker</span><ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Profile editor slide-over */}
      <AnimatePresence>
        {showEditor && (
          <ProfileEditor
            profile={profile}
            onClose={() => setShowEditor(false)}
            onSaved={(updated) => { setProfile((p) => ({ ...p, ...updated })); setShowEditor(false); }}
          />
        )}
      </AnimatePresence>

      {/* New job toast notification */}
      <AnimatePresence>
        {jobToast && (
          <motion.div
            key={jobToast.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-6 right-6 z-50 max-w-xs w-full bg-[#0A0A0A] text-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.3)] border border-[#FF6B00]/40"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#FF6B00]/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-[#FF6B00]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-[#FF6B00]">New job received!</p>
                <p className="text-xs text-white/80 mt-0.5 truncate">
                  {ISSUE_LABELS[jobToast.job.issue] || jobToast.job.issue}
                  {jobToast.job.vehicle_number ? ` · ${jobToast.job.vehicle_number}` : ""}
                </p>
                <p className="font-mono text-[10px] text-white/40 mt-0.5">{jobToast.job.ref_code}</p>
              </div>
              <button onClick={() => setJobToast(null)} className="text-white/40 hover:text-white/80 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Pending actions ─────────────────────────────────────────────────────── */

function getPendingActions(profile, available, openEditor) {
  if (!profile) return [];
  const actions = [];
  if (!profile.avatar || profile.avatar === "") actions.push({ label: "Add a profile photo", action: () => document.getElementById("avatar-upload-input")?.click() });
  if (!profile.bio || profile.bio.length < 20) actions.push({ label: "Complete your bio", action: openEditor });
  if (!profile.banks || profile.banks.length === 0) actions.push({ label: "Add supported banks", action: openEditor });
  if (!profile.verified) actions.push({ label: "Verification pending — admin will review", action: null });
  if (!available) actions.push({ label: "Go online to receive jobs" });
  return actions;
}

/* ─── Avatar upload ───────────────────────────────────────────────────────── */

function AvatarUpload({ profile, onUploaded }) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState("");
  // Track a cache-bust version so the browser re-fetches after each upload
  const [version, setVersion] = useState(1);
  // Track whether the img element itself failed to load
  const [imgError, setImgError] = useState(false);

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadErr("");
    setImgError(false);
    try {
      const res = await sathiDashApi.uploadAvatar(file);
      setVersion((v) => v + 1); // force cache-bust on success
      onUploaded(res.data.url);
    } catch (err) {
      setUploadErr(err?.response?.data?.detail || "Upload failed. Try again.");
    } finally { setUploading(false); }
  };

  const rawUrl = fullUrl(profile?.avatar);
  // Only append cache-bust param for non-data URLs (appending ?v=N to a data: URL corrupts it)
  const avatarUrl = rawUrl
    ? rawUrl.startsWith("data:") ? rawUrl : `${rawUrl}?v=${version}`
    : "";
  const showImage = avatarUrl && !imgError;

  return (
    <div className="relative flex-shrink-0">
      <div className="w-16 h-16 rounded-2xl border-2 border-[#FF6B00] overflow-hidden bg-[#FF6B00]/20 relative">
        {showImage ? (
          <img
            src={avatarUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover block"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-display font-black text-2xl text-[#FF6B00]">{(profile?.name || "S")[0]}</span>
          </div>
        )}
      </div>
      <button onClick={() => { setUploadErr(""); inputRef.current?.click(); }} title="Change photo"
        className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-[#FF6B00] rounded-full flex items-center justify-center border-2 border-[#0A0A0A] hover:scale-110 transition-transform">
        {uploading ? <Loader2 className="w-3 h-3 text-white animate-spin" /> : <Camera className="w-3 h-3 text-white" />}
      </button>
      <input id="avatar-upload-input" ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      {uploadErr && (
        <div className="absolute top-full mt-2 left-0 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
          {uploadErr}
        </div>
      )}
    </div>
  );
}

/* ─── Gallery ─────────────────────────────────────────────────────────────── */

function GalleryPreview({ profile, onUpdate }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await sathiDashApi.uploadGallery(file);
      onUpdate([...(profile?.gallery || []), res.data.url]);
    } catch {}
    finally { setUploading(false); e.target.value = ""; }
  };

  const remove = async (url) => {
    try {
      await sathiDashApi.deleteGallery(url);
      onUpdate((profile?.gallery || []).filter((u) => u !== url));
    } catch {}
  };

  const gallery = profile?.gallery || [];

  return (
    <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm text-[#0A0A0A] flex items-center gap-1.5"><Image className="w-4 h-4" /> Business photos</h3>
        <button onClick={() => inputRef.current?.click()} disabled={uploading}
          className="text-xs font-bold text-[#FF6B00] hover:text-[#E66000] flex items-center gap-1">
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? "Uploading…" : "Add photo"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handle} />
      </div>
      {gallery.length === 0 ? (
        <button onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-[#E5E7EB] rounded-xl py-6 text-center text-sm text-[#9CA3AF] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
          <Upload className="w-5 h-5 mx-auto mb-1" />
          Upload photos of your work at the plaza
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((url) => (
            <div key={url} className="relative group aspect-square">
              <img src={fullUrl(url)} alt="" className="w-full h-full object-cover rounded-lg" />
              <button onClick={() => remove(url)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
          {gallery.length < 9 && (
            <button onClick={() => inputRef.current?.click()}
              className="aspect-square border-2 border-dashed border-[#E5E7EB] rounded-lg flex items-center justify-center hover:border-[#FF6B00] transition-colors">
              <Upload className="w-4 h-4 text-[#9CA3AF]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Apnafastag Center card ──────────────────────────────────────────────── */

function ApnafastagCenterCard({ profile, onSaved }) {
  const existing = profile?.center || {};
  const [active,  setActive]  = useState(!!existing.active);
  const [name,    setName]    = useState(existing.name || "");
  const [address, setAddress] = useState(existing.address || "");
  const [hours,   setHours]   = useState(existing.hours || "");
  const [lat,     setLat]     = useState(existing.lat || null);
  const [lng,     setLng]     = useState(existing.lng || null);
  const [locating, setLocating] = useState(false);
  const [locErr,   setLocErr]   = useState("");
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [saveErr,  setSaveErr]  = useState("");
  const [open,     setOpen]     = useState(false);

  const grabLocation = () => {
    if (!navigator.geolocation) { setLocErr("Geolocation not supported by your browser."); return; }
    setLocating(true); setLocErr("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
        setLocating(false);
        // Reverse-geocode using OpenStreetMap Nominatim (no API key needed)
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`)
          .then((r) => r.json())
          .then((d) => { if (d.display_name) setAddress(d.display_name.split(",").slice(0, 3).join(", ")); })
          .catch(() => {});
      },
      (err) => { setLocating(false); setLocErr("Could not get location. Please allow location access."); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const save = async () => {
    setSaving(true); setSaveErr(""); setSaved(false);
    try {
      const payload = { active, name: name.trim() || null, address: address.trim() || null, lat, lng, hours: hours.trim() || null };
      await sathiDashApi.updateCenter(payload);
      setSaved(true);
      onSaved({ ...profile, center: payload });
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setSaveErr(err?.response?.data?.detail || "Failed to save. Try again.");
    } finally { setSaving(false); }
  };

  const hasCenter = existing.lat && existing.active;

  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
      {/* Header row */}
      <button onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#F8F9FA] transition-colors">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${hasCenter ? "bg-[#FF6B00]" : "bg-[#F3F4F6]"}`}>
            <Building2 className={`w-4 h-4 ${hasCenter ? "text-white" : "text-[#9CA3AF]"}`} />
          </div>
          <div className="text-left">
            <p className="font-bold text-sm text-[#0A0A0A]">Apnafastag Center</p>
            <p className="text-[11px] text-[#4B5563]">
              {hasCenter ? (existing.name || "Center active") : "Set up your service location"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasCenter && <span className="text-[10px] font-black uppercase bg-[#059669] text-white px-2 py-0.5 rounded-full">Live</span>}
          <ChevronRight className={`w-4 h-4 text-[#9CA3AF] transition-transform ${open ? "rotate-90" : ""}`} />
        </div>
      </button>

      {/* Expanded form */}
      {open && (
        <div className="border-t-2 border-[#E5E7EB] px-5 py-5 space-y-4">
          <p className="text-xs text-[#4B5563] leading-relaxed">
            Set up a physical service point where customers can walk in for FASTag help.
            Your center will appear on the map separately from your toll plaza.
          </p>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-[#F8F9FA] rounded-xl px-4 py-3">
            <div>
              <p className="font-bold text-sm">Center is open</p>
              <p className="text-[11px] text-[#4B5563]">Toggle off when you're closed</p>
            </div>
            <button type="button" onClick={() => setActive((a) => !a)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${active ? "bg-[#059669] border-[#059669] text-white" : "bg-white border-[#E5E7EB] text-[#9CA3AF]"}`}>
              {active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {active ? "Open" : "Closed"}
            </button>
          </div>

          {/* Center name */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">Center name</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder={`${(profile?.name || "Your").split(" ")[0]}'s FASTag Help Center`}
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>

          {/* Location picker */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">Location</label>
            <button type="button" onClick={grabLocation} disabled={locating}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-[#FF6B00] rounded-xl py-3 text-sm font-bold text-[#FF6B00] hover:bg-[#FF6B00]/5 transition-colors disabled:opacity-60">
              {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
              {locating ? "Getting location…" : lat ? "Update my location" : "Use my current location"}
            </button>
            {locErr && <p className="text-xs text-red-600 mt-1.5">{locErr}</p>}
            {lat && lng && (
              <div className="mt-2 flex items-center gap-2 bg-[#F0FDF4] border border-[#059669] rounded-xl px-3 py-2">
                <MapPin className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                <span className="text-xs text-[#059669] font-semibold">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">Address <span className="font-normal text-[#9CA3AF]">(auto-filled from GPS, or type manually)</span></label>
            <textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop no., street, landmark, city…"
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
          </div>

          {/* Hours */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] mb-1.5">Working hours <span className="font-normal text-[#9CA3AF]">(optional)</span></label>
            <input value={hours} onChange={(e) => setHours(e.target.value)}
              placeholder="e.g. Mon–Sat, 9am–6pm"
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none" />
          </div>

          {saveErr && <p className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">{saveErr}</p>}

          <button onClick={save} disabled={saving || (!lat && !address.trim())}
            className="w-full bg-[#FF6B00] text-white font-bold py-3 rounded-full shadow-[0_4px_0_#0A0A0A] disabled:opacity-60 flex items-center justify-center gap-2 text-sm">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save center"}
          </button>
          <p className="text-[10px] text-[#9CA3AF] text-center">You must add a location (GPS or address) before saving.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Profile editor slide-over ───────────────────────────────────────────── */

function ProfileEditor({ profile, onClose, onSaved }) {
  const [form, setForm] = useState({
    bio:          profile?.bio || "",
    languages:    profile?.languages || [],
    services:     profile?.services || [],
    banks:        profile?.banks || [],
    active_hours: profile?.activeHours || profile?.active_hours || {},
    whatsapp:     profile?.contact?.whatsapp || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [saveError, setSaveError] = useState("");

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = (k, id) => set(k, form[k].includes(id) ? form[k].filter((x) => x !== id) : [...form[k], id]);

  const save = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await sathiDashApi.updateProfile(form);
      setSaved(true);
      setTimeout(() => { onSaved(form); }, 800);
    } catch (err) {
      setSaveError(err?.response?.data?.detail || "Failed to save. Please try again.");
    } finally { setSaving(false); }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black z-40" onClick={onClose} />
      <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-[#E5E7EB] flex-shrink-0">
          <h2 className="font-display font-black text-xl">Edit profile</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#F8F9FA] flex items-center justify-center hover:bg-[#E5E7EB]"><X className="w-4 h-4" /></button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">

          {/* Bio */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">Bio <span className="font-normal text-[#4B5563] text-xs">(shown on public profile)</span></label>
            <textarea rows={4} value={form.bio} onChange={(e) => set("bio", e.target.value)}
              placeholder="Tell commuters about your experience at the plaza…"
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none text-sm resize-none" />
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">Languages</label>
            <div className="flex flex-wrap gap-2">
              {ALL_LANGS.map((l) => (
                <button key={l} type="button" onClick={() => toggle("languages", l)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${form.languages.includes(l) ? "bg-[#FF6B00] border-[#FF6B00] text-white" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#FF6B00]"}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">Services offered</label>
            <div className="space-y-2">
              {ALL_SERVICES.map((s) => (
                <button key={s.id} type="button" onClick={() => toggle("services", s.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl border-2 flex items-center gap-3 transition-all text-sm ${form.services.includes(s.id) ? "border-[#FF6B00] bg-[#FF6B00]/5 font-semibold" : "border-[#E5E7EB] text-[#4B5563]"}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${form.services.includes(s.id) ? "border-[#FF6B00] bg-[#FF6B00]" : "border-[#D1D5DB]"}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Banks */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">Supported banks</label>
            <div className="flex flex-wrap gap-2">
              {ALL_BANKS.map((b) => (
                <button key={b.id} type="button" onClick={() => toggle("banks", b.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${form.banks.includes(b.id) ? "bg-[#0A0A0A] border-[#0A0A0A] text-white" : "border-[#E5E7EB] text-[#4B5563] hover:border-[#0A0A0A]"}`}>
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active hours */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">Active hours</label>
            <div className="space-y-2">
              {DAYS.map((day) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#4B5563] w-8">{DAY_LABELS[day]}</span>
                  <input type="text" value={form.active_hours[day] || ""}
                    onChange={(e) => set("active_hours", { ...form.active_hours, [day]: e.target.value })}
                    placeholder="e.g. 6am–10pm or Off"
                    className="flex-1 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-lg px-3 py-1.5 text-sm outline-none" />
                </div>
              ))}
            </div>
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-bold text-[#0A0A0A] mb-2">WhatsApp number</label>
            <div className="flex gap-2">
              <span className="flex items-center px-4 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl text-[#4B5563] font-bold text-sm">+91</span>
              <input type="tel" maxLength={10} value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, ""))}
                placeholder="WhatsApp number"
                className="flex-1 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 outline-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-[#E5E7EB] flex-shrink-0">
          {saveError && (
            <p className="text-xs text-red-600 font-semibold mb-3 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{saveError}</p>
          )}
          <button onClick={save} disabled={saving || saved}
            className="w-full bg-[#FF6B00] text-white font-bold py-4 rounded-full shadow-[0_4px_0_#0A0A0A] disabled:opacity-70 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
          </button>
        </div>
      </motion.div>
    </>
  );
}

/* ─── Shared ──────────────────────────────────────────────────────────────── */

function StatCard({ label, value, accent, sub }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{label}</p>
      <p className="font-display font-black text-3xl mt-1" style={{ color: accent }}>{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>
    </div>
  );
}

function JobCard({ job, onAction }) {
  const cfg = STATUS_CONFIG[job.status] || STATUS_CONFIG.pending;
  const [busy, setBusy] = useState(null);
  const act = async (action) => { setBusy(action); await onAction(job.id, action); setBusy(null); };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 shadow-[4px_4px_0_#0A0A0A]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-xs text-[#9CA3AF]">{job.ref_code}</p>
          <h3 className="font-display font-bold text-lg mt-0.5">{ISSUE_LABELS[job.issue] || job.issue}</h3>
          {job.vehicle_number && <p className="text-sm text-[#4B5563] font-mono">{job.vehicle_number}</p>}
          {job.note && <p className="text-sm text-[#4B5563] mt-1 leading-snug">{job.note}</p>}
          <p className="text-xs text-[#9CA3AF] mt-1">
            {new Date(job.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <div className={`flex items-center gap-1.5 border rounded-full px-3 py-1 text-xs font-bold ${cfg.color} ${cfg.bg}`}>{cfg.label}</div>
      </div>

      <div className="mt-4 flex gap-2 flex-wrap">
        {job.status === "pending" && (
          <>
            <ActionBtn label="Accept" color="bg-[#059669] text-white shadow-[0_3px_0_#065F46]" loading={busy === "accept"} onClick={() => act("accept")} />
            <ActionBtn label="Decline" color="bg-white text-[#DC2626] border-2 border-[#DC2626]" loading={busy === "cancel"} onClick={() => act("cancel")} />
          </>
        )}
        {job.status === "accepted" && (
          <>
            <ActionBtn label="Start work" color="bg-[#FF6B00] text-white shadow-[0_3px_0_#0A0A0A]" loading={busy === "start"} onClick={() => act("start")} />
            <ActionBtn label="Cancel" color="bg-white text-[#DC2626] border-2 border-[#DC2626]" loading={busy === "cancel"} onClick={() => act("cancel")} />
          </>
        )}
        {job.status === "in_progress" && (
          <ActionBtn label="Mark resolved" color="bg-[#059669] text-white shadow-[0_3px_0_#065F46]" loading={busy === "resolve"} onClick={() => act("resolve")} />
        )}
        {(job.status === "resolved" || job.status === "cancelled") && (
          <span className="text-xs text-[#9CA3AF]">{job.status === "resolved" ? `Resolved · ₹${job.platform_fee || 99} earned` : "Cancelled"}</span>
        )}
      </div>
    </motion.div>
  );
}

function ActionBtn({ label, color, loading, onClick }) {
  return (
    <button onClick={onClick} disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold disabled:opacity-60 ${color}`}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
      {label}
    </button>
  );
}

/* ─── Tier badge ──────────────────────────────────────────────────────────── */

const TIER_CONFIG = {
  Rising:   { color: "bg-[#9CA3AF] text-white",           bar: "#9CA3AF", label: "Rising",   next: "Verified (10 jobs)" },
  Verified: { color: "bg-[#3B82F6] text-white",           bar: "#3B82F6", label: "Verified", next: "Pro (50 jobs)" },
  Pro:      { color: "bg-[#FF6B00] text-white",           bar: "#FF6B00", label: "Pro",      next: "Elite (200 jobs)" },
  Elite:    { color: "bg-[#FFD60A] text-[#0A0A0A]",       bar: "#FFD60A", label: "Elite",    next: null },
};

function TierBadge({ tier, tierProgress }) {
  const cfg = TIER_CONFIG[tier] || TIER_CONFIG.Rising;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className={`inline-block text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-full ${cfg.color}`}>
          {cfg.label}
        </span>
        {cfg.next && (
          <span className="text-[10px] text-[#9CA3AF] font-medium">Next: {cfg.next}</span>
        )}
      </div>
      {tier !== "Elite" && (
        <div className="h-1.5 w-full bg-[#F3F4F6] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(tierProgress, 100)}%`, backgroundColor: cfg.bar }}
          />
        </div>
      )}
      {tier === "Elite" && (
        <p className="text-[10px] text-[#9CA3AF]">Top tier — you've made it!</p>
      )}
    </div>
  );
}

/* ─── Performance card ────────────────────────────────────────────────────── */

function fmtTime(sec) {
  if (!sec || sec === 0) return "—";
  if (sec < 60) return `${Math.round(sec)}s`;
  if (sec < 3600) return `${Math.round(sec / 60)}m`;
  return `${(sec / 3600).toFixed(1)}h`;
}

function RatePill({ label, value, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[#6B7280]">{label}</span>
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>{value}</span>
    </div>
  );
}

function StarRating({ rating }) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i}
          className={`w-3 h-3 ${i <= full ? "fill-[#F59E0B] text-[#F59E0B]" : i === full + 1 && half ? "fill-[#F59E0B]/50 text-[#F59E0B]" : "text-[#D1D5DB]"}`}
        />
      ))}
    </span>
  );
}

function PerformanceCard({ stats }) {
  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 space-y-4">
      <h3 className="font-display font-bold text-sm uppercase tracking-widest text-[#4B5563]">Performance</h3>

      {/* Tier */}
      <TierBadge tier={stats.tier} tierProgress={stats.tier_progress} />

      <div className="border-t border-[#F3F4F6] pt-3 space-y-2">
        {/* Acceptance rate */}
        <RatePill
          label="Acceptance rate"
          value={`${stats.acceptance_rate}%`}
          color={stats.acceptance_rate >= 80 ? "bg-[#DCFCE7] text-[#059669]" : stats.acceptance_rate >= 50 ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#FEE2E2] text-[#DC2626]"}
        />
        {/* Resolution rate */}
        <RatePill
          label="Resolution rate"
          value={`${stats.resolution_rate}%`}
          color={stats.resolution_rate >= 80 ? "bg-[#DCFCE7] text-[#059669]" : stats.resolution_rate >= 50 ? "bg-[#FEF3C7] text-[#B45309]" : "bg-[#FEE2E2] text-[#DC2626]"}
        />
        {/* Avg response time */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#6B7280]">Avg response time</span>
          <span className="text-xs font-bold text-[#0A0A0A]">{fmtTime(stats.avg_response_sec)}</span>
        </div>
      </div>

      {/* Reviews */}
      {stats.total_reviews > 0 && (
        <div className="border-t border-[#F3F4F6] pt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <StarRating rating={stats.avg_rating} />
            <span className="text-xs font-bold text-[#0A0A0A]">{stats.avg_rating.toFixed(1)}</span>
          </div>
          <span className="text-xs text-[#6B7280]">{stats.total_reviews} review{stats.total_reviews !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
