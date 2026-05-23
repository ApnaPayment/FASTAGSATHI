import React, { useEffect, useState, useCallback, useRef } from "react";
import { adminApi, setAdminSecret, getAdminSecret, clearAdminSecret } from "@/lib/api";
import { useBranding } from "@/contexts/BrandingContext";
import {
  Users, Briefcase, MapPin, ClipboardList, CheckCircle2, XCircle,
  Clock, Loader2, LogOut, RefreshCw, ChevronDown, BadgeCheck, Shield,
  Tag, Percent, Trash2, ToggleLeft, ToggleRight, Plus, Search,
  FileText, Edit2, Download, Globe, Map, Building2, Landmark, Route,
  AlertTriangle, CheckCircle, ExternalLink, Upload,
} from "lucide-react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { BANKS as SEED_BANKS, STATES as SEED_STATES } from "@/data/seed";

const TABS = ["Dashboard", "Applications", "Jobs", "Sathis", "Promo Codes", "Settlements", "Plazas", "Sitemap", "Content", "Branding"];

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const fullUrl = (url) => { if (!url) return ""; if (url.startsWith("http") || url.startsWith("data:")) return url; if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return ""; return `${BACKEND}${url}`; };

const STATUS_COLORS = {
  pending:    "bg-yellow-100 text-yellow-800",
  reviewing:  "bg-blue-100 text-blue-800",
  approved:   "bg-green-100 text-green-800",
  rejected:   "bg-red-100 text-red-800",
  accepted:   "bg-blue-100 text-blue-800",
  in_progress:"bg-purple-100 text-purple-800",
  resolved:   "bg-green-100 text-green-800",
  cancelled:  "bg-gray-100 text-gray-600",
};

export default function AdminPage() {
  const [secret, setSecret] = useState(getAdminSecret() || "");
  const [authed, setAuthed] = useState(false);
  const [loginErr, setLoginErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // auto-verify on mount

  // On mount: if a secret is stored, silently verify it so refresh keeps session
  useEffect(() => {
    const stored = getAdminSecret();
    if (!stored) { setChecking(false); return; }
    adminApi.login(stored)
      .then(() => setAuthed(true))
      .catch(() => { clearAdminSecret(); setSecret(""); })
      .finally(() => setChecking(false));
  }, []);

  const login = async () => {
    setLoading(true);
    setLoginErr("");
    try {
      await adminApi.login(secret);
      setAdminSecret(secret);
      setAuthed(true);
    } catch {
      setLoginErr("Invalid admin secret.");
    } finally {
      setLoading(false);
    }
  };

  const logout = () => { clearAdminSecret(); setAuthed(false); setSecret(""); };

  if (checking) return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
    </div>
  );
  if (!authed) return <LoginScreen secret={secret} setSecret={setSecret} login={login} loading={loading} error={loginErr} />;
  return <Dashboard onLogout={logout} />;
}

/* ─── Login ───────────────────────────────────────────────────────────────── */

function LoginScreen({ secret, setSecret, login, loading, error }) {
  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0A0A0A] flex-col justify-between p-12">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B00] flex items-center justify-center">
              <span className="font-black text-white text-lg">A</span>
            </div>
            <span className="font-display font-black text-white text-xl">ApnaFastag</span>
          </div>
        </div>
        <div>
          <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/20 flex items-center justify-center mb-6">
            <Shield className="w-7 h-7 text-[#FF6B00]" />
          </div>
          <h2 className="font-display font-black text-4xl text-white leading-tight mb-3">
            Internal<br />Dashboard
          </h2>
          <p className="text-white/50 text-sm">Manage Sathis, jobs, applications,<br />settlements and promo codes.</p>
        </div>
        <p className="text-white/20 text-xs">© 2026 ApnaFastag Technologies Pvt. Ltd.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-[#F8F9FA] px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-[#0A0A0A] flex items-center justify-center">
              <span className="font-black text-white text-sm">A</span>
            </div>
            <span className="font-display font-black text-[#0A0A0A]">ApnaFastag Admin</span>
          </div>

          <h1 className="font-display font-black text-3xl text-[#0A0A0A] mb-1">Welcome back</h1>
          <p className="text-[#6B7280] text-sm mb-8">Enter your admin secret to access the dashboard.</p>

          <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-8 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-widest text-[#4B5563] mb-2">
              Admin Secret
            </label>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && login()}
              placeholder="Enter your secret key"
              autoFocus
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors font-mono text-sm"
            />
            {error && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600 flex items-center gap-2">
                <XCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}
            <button
              onClick={login}
              disabled={loading || !secret}
              className="mt-5 w-full bg-[#0A0A0A] text-white font-bold py-3.5 rounded-xl hover:bg-[#FF6B00] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Sign in <span className="opacity-60">→</span></>}
            </button>
          </div>

          <p className="text-center text-xs text-[#9CA3AF] mt-6">
            Restricted access · ApnaFastag internal only
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Dashboard shell ─────────────────────────────────────────────────────── */

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState("Dashboard");

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Top nav */}
      <header className="bg-[#0A0A0A] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center font-black text-sm">A</div>
          <span className="font-display font-black text-lg">ApnaFastag Admin</span>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors">
          <LogOut className="w-4 h-4" /> Sign out
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-[#E5E7EB] px-6 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-4 text-sm font-semibold border-b-2 transition-colors ${
              tab === t ? "border-[#FF6B00] text-[#FF6B00]" : "border-transparent text-[#4B5563] hover:text-[#0A0A0A]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {tab === "Dashboard"    && <StatsTab />}
        {tab === "Applications" && <ApplicationsTab />}
        {tab === "Jobs"         && <JobsTab />}
        {tab === "Sathis"       && <SathisTab />}
        {tab === "Promo Codes"  && <PromoCodesTab />}
        {tab === "Settlements"  && <SettlementsTab />}
        {tab === "Plazas"       && <PlazasTab />}
        {tab === "Sitemap"      && <SitemapTab />}
        {tab === "Content"      && <ContentTab />}
        {tab === "Branding"     && <BrandingTab />}
      </main>
    </div>
  );
}

/* ─── Stats ───────────────────────────────────────────────────────────────── */

function StatsTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.stats().then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const cards = [
    { label: "Total users",        value: stats.users,               Icon: Users,         color: "#FF6B00" },
    { label: "Sathis",             value: stats.sathis,              Icon: BadgeCheck,    color: "#059669" },
    { label: "Total jobs",         value: stats.jobs,                Icon: Briefcase,     color: "#7C3AED" },
    { label: "Applications",       value: stats.applications,        Icon: ClipboardList, color: "#0EA5E9" },
    { label: "Pending apps",       value: stats.pending_applications,Icon: Clock,         color: "#F59E0B" },
    { label: "Pending jobs",       value: stats.pending_jobs,        Icon: Clock,         color: "#F59E0B" },
    { label: "Active jobs",        value: stats.active_jobs,         Icon: RefreshCw,     color: "#7C3AED" },
    { label: "Resolved jobs",      value: stats.resolved_jobs,       Icon: CheckCircle2,  color: "#059669" },
    { label: "Toll plazas",        value: stats.plazas,              Icon: MapPin,        color: "#0A0A0A" },
    { label: "States covered",     value: stats.states,              Icon: MapPin,        color: "#0A0A0A" },
  ];

  return (
    <div>
      <h2 className="font-display font-black text-2xl mb-6">Overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${c.color}18` }}>
              <c.Icon className="w-4 h-4" style={{ color: c.color }} />
            </div>
            <div className="font-display font-black text-3xl text-[#0A0A0A]">{c.value ?? "—"}</div>
            <div className="text-xs text-[#4B5563] mt-1 font-medium">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Applications ────────────────────────────────────────────────────────── */

const SVC_COLORS = {
  dispute:  "bg-blue-100 text-blue-700",
  kyc:      "bg-purple-100 text-purple-700",
  recharge: "bg-green-100 text-green-700",
  sos:      "bg-red-100 text-red-700",
};
const SVC_LABELS = { dispute: "Dispute", kyc: "KYC", recharge: "Recharge", sos: "SOS" };

/* Full-detail side drawer */
function AppDrawer({ a, onClose, onRefresh }) {
  const [note, setNote]     = useState(a.note || "");
  const [saving, setSaving] = useState(false);

  const doUpdate = async (status) => {
    setSaving(true);
    try {
      await adminApi.updateApplication(a.ref, status, note);
      onRefresh();
      onClose();
    } catch {}
    finally { setSaving(false); }
  };

  useEffect(() => {
    const esc = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const Field = ({ label, children }) => children ? (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-0.5">{label}</p>
      <div className="text-sm text-[#0A0A0A]">{children}</div>
    </div>
  ) : null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" onClick={onClose} />
      {/* Panel */}
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-[#E5E7EB] sticky top-0 bg-white z-10">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-black text-xl">{a.name}</span>
              <StatusBadge status={a.status} />
            </div>
            <p className="text-xs font-mono text-[#9CA3AF] mt-0.5">{a.ref}</p>
          </div>
          <button onClick={onClose} className="text-[#9CA3AF] hover:text-[#0A0A0A] text-xl font-bold ml-4">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 space-y-5">
          {/* Contact */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Phone">{a.phone}</Field>
            <Field label="WhatsApp">{a.whatsapp && a.whatsapp !== a.phone ? a.whatsapp : a.phone}</Field>
            <Field label="State">{a.state}</Field>
            <Field label="Plaza">{a.plaza_name || a.plaza_slug}</Field>
            <Field label="Hours / week">{a.hours_per_week}h</Field>
            <Field label="Languages">{(a.languages || []).join(", ")}</Field>
            <Field label="Submitted">{new Date(a.submitted_at).toLocaleString("en-IN")}</Field>
            {a.reviewed_at && <Field label="Reviewed">{new Date(a.reviewed_at).toLocaleString("en-IN")}</Field>}
          </div>

          {/* Services */}
          {(a.services || []).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {a.services.map((sv) => (
                  <span key={sv} className={`text-xs font-bold px-2.5 py-1 rounded-full ${SVC_COLORS[sv] || "bg-gray-100 text-gray-600"}`}>
                    {SVC_LABELS[sv] || sv}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Banks */}
          {(a.banks || []).length > 0 && (
            <Field label="Banks">
              <div className="flex flex-wrap gap-1.5 mt-1">
                {a.banks.map((b) => (
                  <span key={b} className="text-xs bg-[#F8F9FA] border border-[#E5E7EB] px-2 py-0.5 rounded font-mono">{b.replace("-fastag","").toUpperCase()}</span>
                ))}
              </div>
            </Field>
          )}

          {/* Vehicle types */}
          {(a.vehicle_types || []).length > 0 && (
            <Field label="Vehicle types">{a.vehicle_types.join(", ")}</Field>
          )}

          {/* Bio / Experience */}
          {a.bio && <Field label="Bio"><p className="whitespace-pre-line">{a.bio}</p></Field>}
          {a.experience && (
            <Field label="Experience"><p className="italic text-[#4B5563]">"{a.experience}"</p></Field>
          )}

          {/* Active hours */}
          {a.active_hours && Object.keys(a.active_hours).length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-1.5">Active hours</p>
              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(a.active_hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between text-xs bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg px-3 py-1.5">
                    <span className="font-bold capitalize text-[#0A0A0A]">{day}</span>
                    <span className="text-[#4B5563]">{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sathi profile link */}
          {a.status === "approved" && a.sathi_slug && (
            <a href={`/sathi/${a.sathi_slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 bg-[#FF6B00]/10 text-[#FF6B00] font-bold text-sm px-4 py-3 rounded-xl hover:bg-[#FF6B00]/20 transition-colors">
              <BadgeCheck className="w-4 h-4" /> View Sathi profile →
            </a>
          )}

          {/* Previous admin note */}
          {a.note && (
            <div className="bg-[#FFFBEB] border border-[#F59E0B] rounded-xl px-4 py-3 text-sm">
              <span className="font-bold text-[#92400E]">Previous note:</span> {a.note}
            </div>
          )}
        </div>

        {/* Action footer */}
        <div className="border-t border-[#E5E7EB] p-6 bg-[#F8F9FA] space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Admin note (optional, saved with status change)…"
            className="w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 text-sm outline-none resize-none"
          />
          <div className="flex gap-2">
            {a.status !== "approved"  && (
              <button onClick={() => doUpdate("approved")} disabled={saving}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? "…" : "✓ Approve"}
              </button>
            )}
            {a.status !== "reviewing" && (
              <button onClick={() => doUpdate("reviewing")} disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? "…" : "⟳ Review"}
              </button>
            )}
            {a.status !== "rejected" && (
              <button onClick={() => doUpdate("rejected")} disabled={saving}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-sm disabled:opacity-50 transition-colors">
                {saving ? "…" : "✗ Reject"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ApplicationsTab() {
  const [data, setData]       = useState({ items: [], total: 0, page: 1, pages: 1 });
  const [filter, setFilter]   = useState("");
  const [search, setSearch]   = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage]       = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 25 };
    if (filter) params.status = filter;
    if (search) params.search = search;
    adminApi.applications(params)
      .then((r) => setData(r.data))
      .finally(() => setLoading(false));
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  // Reset to page 1 when filter/search changes
  useEffect(() => { setPage(1); }, [filter, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const { items, total, pages } = data;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="font-display font-black text-2xl">
          Applications <span className="text-[#9CA3AF] font-normal text-lg">({total.toLocaleString()})</span>
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex items-center gap-1">
            <input
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); if (!e.target.value) setSearch(""); }}
              placeholder="Search name, phone, ref…"
              className="bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 text-sm outline-none w-52"
            />
            <button type="submit" className="bg-[#0A0A0A] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#FF6B00] transition-colors">Go</button>
          </form>
          {/* Status filter */}
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="bg-white border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm font-medium outline-none">
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <RefreshBtn onClick={load} />
        </div>
      </div>

      {/* Table */}
      {loading ? <Spinner /> : items.length === 0 ? <Empty label="No applications found" /> : (
        <>
          <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[2fr_1.2fr_1.2fr_1fr_auto] gap-4 px-4 py-2.5 bg-[#F8F9FA] border-b border-[#E5E7EB] text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF]">
              <span>Applicant</span>
              <span>Contact</span>
              <span>Location</span>
              <span>Services</span>
              <span>Status</span>
            </div>

            {items.map((a, i) => (
              <button
                key={a.ref}
                onClick={() => setSelected(a)}
                className={`w-full text-left grid grid-cols-[2fr_1.2fr_1.2fr_1fr_auto] gap-4 px-4 py-3 hover:bg-[#FFF7ED] transition-colors border-b border-[#F3F4F6] last:border-0 ${i % 2 === 0 ? "" : "bg-[#FAFAFA]"}`}
              >
                {/* Name + ref */}
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#0A0A0A] truncate">{a.name}</p>
                  <p className="text-[11px] font-mono text-[#9CA3AF] truncate">{a.ref}</p>
                </div>
                {/* Phone */}
                <div className="min-w-0">
                  <p className="text-sm text-[#4B5563] truncate">{a.phone}</p>
                  <p className="text-[11px] text-[#9CA3AF]">{a.hours_per_week}h/week</p>
                </div>
                {/* Location */}
                <div className="min-w-0">
                  <p className="text-sm text-[#4B5563] truncate">{a.plaza_name || a.plaza_slug}</p>
                  <p className="text-[11px] text-[#9CA3AF] capitalize">{a.state}</p>
                </div>
                {/* Services */}
                <div className="flex flex-wrap gap-1 items-start">
                  {(a.services || []).slice(0, 3).map((sv) => (
                    <span key={sv} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${SVC_COLORS[sv] || "bg-gray-100 text-gray-600"}`}>
                      {SVC_LABELS[sv] || sv}
                    </span>
                  ))}
                </div>
                {/* Status */}
                <div className="flex items-center">
                  <StatusBadge status={a.status} />
                </div>
              </button>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-[#9CA3AF]">
                Page {page} of {pages} · {total.toLocaleString()} total
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-[#E5E7EB] rounded-lg disabled:opacity-40 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  «
                </button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-[#E5E7EB] rounded-lg disabled:opacity-40 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  ‹ Prev
                </button>
                {/* Page window */}
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, pages - 4));
                  const p = start + i;
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs font-bold border-2 rounded-lg transition-colors ${p === page ? "border-[#FF6B00] bg-[#FF6B00] text-white" : "border-[#E5E7EB] hover:border-[#FF6B00] hover:text-[#FF6B00]"}`}>
                      {p}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-[#E5E7EB] rounded-lg disabled:opacity-40 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  Next ›
                </button>
                <button onClick={() => setPage(pages)} disabled={page === pages}
                  className="px-3 py-1.5 text-xs font-bold border-2 border-[#E5E7EB] rounded-lg disabled:opacity-40 hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">
                  »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail drawer */}
      {selected && (
        <AppDrawer
          a={selected}
          onClose={() => setSelected(null)}
          onRefresh={() => { load(); setSelected(null); }}
        />
      )}
    </div>
  );
}

/* ─── Jobs ────────────────────────────────────────────────────────────────── */

function JobsTab() {
  const [jobs, setJobs] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.jobs(filter || undefined)
      .then((r) => setJobs(r.data))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  const ISSUE_LABELS = { dispute: "Dispute", kyc: "KYC", recharge: "Recharge", sos: "SOS" };
  const ISSUE_RATES  = { dispute: 99, kyc: 149, recharge: 49, sos: 199 };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-black text-2xl">All Jobs</h2>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border-2 border-[#E5E7EB] rounded-xl px-4 py-2 text-sm font-medium outline-none"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <RefreshBtn onClick={load} />
        </div>
      </div>

      {loading ? <Spinner /> : jobs.length === 0 ? <Empty label="No jobs found" /> : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#E5E7EB]">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b-2 border-[#E5E7EB]">
              <tr>
                {["Ref", "User", "Sathi", "Issue", "Vehicle", "Rate", "Status", "Created"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4B5563]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white">
              {jobs.map((j) => (
                <tr key={j.ref_code} className="hover:bg-[#F8F9FA] transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-bold text-[#FF6B00]">{j.ref_code}</td>
                  <td className="px-4 py-3 text-[#4B5563]">{j.user_phone || "—"}</td>
                  <td className="px-4 py-3 font-medium">{j.sathi_slug}</td>
                  <td className="px-4 py-3"><span className="bg-[#FF6B00]/10 text-[#FF6B00] text-xs font-bold px-2 py-0.5 rounded-full">{ISSUE_LABELS[j.issue] || j.issue}</span></td>
                  <td className="px-4 py-3 font-mono text-xs">{j.vehicle_number}</td>
                  <td className="px-4 py-3 font-bold">₹{ISSUE_RATES[j.issue] || "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={j.status} /></td>
                  <td className="px-4 py-3 text-[#9CA3AF] text-xs">{new Date(j.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Sathis ──────────────────────────────────────────────────────────────── */

function SathisTab() {
  const [sathis, setSathis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillMsg, setBackfillMsg] = useState(null);

  const load = () => {
    setLoading(true);
    adminApi.sathis().then((r) => setSathis(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleVerified = async (slug, current) => {
    await adminApi.toggleVerified(slug, !current);
    load();
  };

  const backfillCoords = async () => {
    setBackfilling(true); setBackfillMsg(null);
    try {
      const r = await adminApi.backfillCoords();
      setBackfillMsg(`Fixed ${r.data.updated} Sathi location(s).`);
      load();
    } catch { setBackfillMsg("Backfill failed."); }
    finally { setBackfilling(false); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-black text-2xl">Sathis ({sathis.length})</h2>
        <div className="flex items-center gap-2">
          <button onClick={backfillCoords} disabled={backfilling}
            className="text-xs font-bold px-3 py-2 rounded-full border-2 border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white transition-colors disabled:opacity-50">
            {backfilling ? "Fixing…" : "Fix missing locations"}
          </button>
          <RefreshBtn onClick={load} />
        </div>
      </div>
      {backfillMsg && <p className="mb-4 text-sm font-semibold text-[#059669] bg-[#F0FDF4] border border-[#059669] rounded-xl px-4 py-2">{backfillMsg}</p>}

      {loading ? <Spinner /> : sathis.length === 0 ? <Empty label="No Sathis found" /> : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sathis.map((s) => (
            <div key={s.slug} className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-[#E5E7EB] flex-shrink-0 bg-[#FF6B00]/20 relative overflow-hidden">
                  {fullUrl(s.avatar) ? (
                    <img src={fullUrl(s.avatar)} alt="" className="absolute inset-0 w-full h-full object-cover block"
                      onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }} />
                  ) : null}
                  <div className="absolute inset-0 flex items-center justify-center font-display font-black text-lg text-[#FF6B00]"
                    style={{ display: fullUrl(s.avatar) ? "none" : "flex" }}>{(s.name || "S")[0]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-base">{s.name}</span>
                    {s.verified && <BadgeCheck className="w-4 h-4 text-[#059669] flex-shrink-0" />}
                    {s.premium && <span className="text-[10px] font-black bg-[#FFD60A] text-[#0A0A0A] px-2 py-0.5 rounded-full uppercase">Pro</span>}
                  </div>
                  <div className="text-xs text-[#4B5563] mt-0.5">{s.city} · {s.state}</div>
                  <div className="text-xs text-[#4B5563]">⭐ {s.rating} · {s.jobsResolved} jobs</div>
                  {s.registered_phone && <div className="text-xs text-[#059669] mt-1 font-medium">📞 {s.registered_phone}</div>}
                  <div className="flex items-center gap-2 mt-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${s.is_available ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {s.is_available ? "Online" : "Offline"}
                    </span>
                    <button
                      onClick={() => toggleVerified(s.slug, s.verified)}
                      className={`text-xs px-3 py-1 rounded-full border-2 font-semibold transition-colors ${
                        s.verified
                          ? "border-[#059669] text-[#059669] hover:bg-[#059669] hover:text-white"
                          : "border-[#E5E7EB] text-[#4B5563] hover:border-[#059669] hover:text-[#059669]"
                      }`}
                    >
                      {s.verified ? "Verified ✓" : "Mark verified"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Promo Codes ─────────────────────────────────────────────────────────── */

const SERVICE_OPTIONS = [
  { value: "dispute",  label: "Dispute",  price: 99  },
  { value: "kyc",      label: "KYC",      price: 149 },
  { value: "recharge", label: "Recharge", price: 49  },
  { value: "sos",      label: "SOS",      price: 199 },
];

const BLANK_FORM = {
  code: "",
  label: "",
  discount_type: "flat",
  discount_value: 50,
  applicable_services: [],
  applicable_user_phones: "",
  max_uses: 0,
  valid_until: "",
};

function PromoCodesTab() {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);

  const load = () => {
    setLoading(true);
    adminApi.promoCodes()
      .then((r) => setCodes(r.data))
      .catch(() => setErr("Failed to load promo codes."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const toggleService = (val) => {
    setForm((f) => {
      const has = f.applicable_services.includes(val);
      return {
        ...f,
        applicable_services: has
          ? f.applicable_services.filter((s) => s !== val)
          : [...f.applicable_services, val],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        applicable_user_phones: form.applicable_user_phones
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      };
      await adminApi.createPromoCode(payload);
      setForm(BLANK_FORM);
      load();
    } catch (e) {
      setErr(e?.response?.data?.error || "Failed to create promo code.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (code) => {
    try {
      await adminApi.togglePromoCode(code);
      load();
    } catch {
      setErr("Failed to toggle promo code.");
    }
  };

  const handleDelete = async (code) => {
    if (!window.confirm(`Delete promo code "${code}"? This cannot be undone.`)) return;
    try {
      await adminApi.deletePromoCode(code);
      load();
    } catch {
      setErr("Failed to delete promo code.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-black text-2xl">Promo Codes</h2>
        <RefreshBtn onClick={load} />
      </div>

      {err && (
        <div className="mb-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm font-semibold px-4 py-3 rounded-xl">
          {err}
        </div>
      )}

      {/* Create form */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-xl bg-[#FF6B00]/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <h3 className="font-display font-black text-lg">New Promo Code</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Code */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Code</label>
              <input
                type="text"
                required
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                placeholder="WELCOME50"
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm font-mono font-bold outline-none transition-colors"
              />
            </div>

            {/* Label */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Label</label>
              <input
                type="text"
                value={form.label}
                onChange={(e) => setField("label", e.target.value)}
                placeholder="Welcome offer"
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Discount type */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Discount Type</label>
              <select
                value={form.discount_type}
                onChange={(e) => setField("discount_type", e.target.value)}
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm font-medium outline-none transition-colors"
              >
                <option value="flat">Flat ₹</option>
                <option value="percent">Percentage %</option>
              </select>
            </div>

            {/* Discount value */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">
                Discount Value {form.discount_type === "flat" ? "(₹)" : "(%)"}
              </label>
              <input
                type="number"
                required
                min={1}
                value={form.discount_value}
                onChange={(e) => setField("discount_value", Number(e.target.value))}
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Max uses */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Max Uses (0 = unlimited)</label>
              <input
                type="number"
                min={0}
                value={form.max_uses}
                onChange={(e) => setField("max_uses", Number(e.target.value))}
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>

            {/* Valid until */}
            <div>
              <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Valid Until (optional)</label>
              <input
                type="date"
                value={form.valid_until}
                onChange={(e) => setField("valid_until", e.target.value)}
                className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
              />
            </div>
          </div>

          {/* Applicable services */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-2">Applicable Services (empty = all)</label>
            <div className="flex flex-wrap gap-3">
              {SERVICE_OPTIONS.map((svc) => {
                const checked = form.applicable_services.includes(svc.value);
                return (
                  <label
                    key={svc.value}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 cursor-pointer text-sm font-semibold transition-colors select-none ${
                      checked
                        ? "border-[#FF6B00] bg-[#FF6B00]/10 text-[#FF6B00]"
                        : "border-[#E5E7EB] bg-[#F8F9FA] text-[#4B5563] hover:border-[#FF6B00]/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => toggleService(svc.value)}
                    />
                    {svc.label} <span className="font-normal text-xs opacity-70">₹{svc.price}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Applicable user phones */}
          <div>
            <label className="block text-xs font-bold text-[#0A0A0A] uppercase tracking-wider mb-1">Applicable User Phones</label>
            <input
              type="text"
              value={form.applicable_user_phones}
              onChange={(e) => setField("applicable_user_phones", e.target.value)}
              placeholder="9876543210, 9123456789 (blank = all users)"
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-2.5 text-sm outline-none transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !form.code}
            className="flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-6 py-2.5 rounded-full hover:bg-[#E66000] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
            {saving ? "Creating…" : "Create Promo Code"}
          </button>
        </form>
      </div>

      {/* Codes table */}
      {loading ? (
        <Spinner />
      ) : codes.length === 0 ? (
        <Empty label="No promo codes yet" />
      ) : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#E5E7EB]">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b-2 border-[#E5E7EB]">
              <tr>
                {["Code", "Label", "Discount", "Services", "Users", "Uses", "Expires", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#4B5563]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] bg-white">
              {codes.map((c) => {
                const discountLabel = c.discount_type === "flat"
                  ? `₹${c.discount_value} off`
                  : `${c.discount_value}% off`;
                const servicesLabel = c.applicable_services && c.applicable_services.length > 0
                  ? c.applicable_services.join(", ")
                  : "All";
                const usersLabel = c.applicable_user_phones && c.applicable_user_phones.length > 0
                  ? c.applicable_user_phones.length
                  : "All";
                const usesLabel = c.max_uses > 0
                  ? `${c.used_count ?? 0} / ${c.max_uses}`
                  : `${c.used_count ?? 0} / ∞`;
                const expiresLabel = c.valid_until
                  ? new Date(c.valid_until).toLocaleDateString("en-IN")
                  : "—";

                return (
                  <tr key={c.code} className="hover:bg-[#F8F9FA] transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-black text-[#FF6B00]">{c.code}</td>
                    <td className="px-4 py-3 text-[#4B5563]">{c.label || "—"}</td>
                    <td className="px-4 py-3 font-bold">
                      <span className="flex items-center gap-1">
                        {c.discount_type === "flat"
                          ? <Tag className="w-3 h-3 text-[#FF6B00]" />
                          : <Percent className="w-3 h-3 text-[#7C3AED]" />}
                        {discountLabel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#4B5563]">{servicesLabel}</td>
                    <td className="px-4 py-3 text-xs text-[#4B5563]">{usersLabel}</td>
                    <td className="px-4 py-3 text-xs font-medium">{usesLabel}</td>
                    <td className="px-4 py-3 text-xs text-[#9CA3AF]">{expiresLabel}</td>
                    <td className="px-4 py-3">
                      {c.is_active
                        ? <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-100 text-green-700">Active</span>
                        : <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">Inactive</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggle(c.code)}
                          title={c.is_active ? "Deactivate" : "Activate"}
                          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 transition-colors ${
                            c.is_active
                              ? "border-gray-200 text-gray-500 hover:bg-gray-100"
                              : "border-green-200 text-green-700 hover:bg-green-50"
                          }`}
                        >
                          {c.is_active
                            ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
                            : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>}
                        </button>
                        <button
                          onClick={() => handleDelete(c.code)}
                          title="Delete"
                          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─── Settlements Tab ─────────────────────────────────────────────────────── */

function SettlementsTab() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const res = await adminApi.settlements();
      setRows(res.data);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load settlements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + (r.gross_earnings || 0),
      comm:  acc.comm  + (r.platform_commission || 0),
      net:   acc.net   + (r.net_earnings || 0),
      jobs:  acc.jobs  + (r.resolved_jobs || 0),
    }),
    { gross: 0, comm: 0, net: 0, jobs: 0 }
  );

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const fmtDate = (s) => {
    if (!s) return "—";
    try { return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return s; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-[#0A0A0A]">Settlements</h2>
        <RefreshBtn onClick={load} />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Resolved Jobs",      value: totals.jobs,                      color: "text-[#0A0A0A]" },
          { label: "Gross Collected",    value: fmt(totals.gross),                color: "text-blue-700"  },
          { label: "Platform Commission",value: fmt(totals.comm),                 color: "text-[#FF6B00]" },
          { label: "Net to Sathis",      value: fmt(Math.max(0, totals.net)),     color: "text-green-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
            <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {err && <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-sm text-red-700 font-medium">{err}</div>}
      {loading ? <Spinner /> : rows.length === 0 ? (
        <Empty label="No resolved jobs yet — settlements will appear here once Sathis start resolving jobs." />
      ) : (
        <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-[#E5E7EB] bg-[#F9FAFB]">
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Sathi</th>
                <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Phone</th>
                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Jobs</th>
                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Gross</th>
                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Commission</th>
                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Net</th>
                <th className="text-right px-4 py-3 text-xs font-black uppercase tracking-wider text-[#6B7280]">Last Job</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const isHighEarner = r.net_earnings > 1000;
                return (
                  <tr
                    key={r.sathi_slug}
                    className={`border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors ${isHighEarner ? "bg-green-50/40" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {isHighEarner && <span title="High earner" className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                        <div>
                          <p className="font-bold text-[#0A0A0A]">{r.sathi_name}</p>
                          <p className="text-xs text-[#9CA3AF] font-mono">{r.sathi_slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4B5563] font-mono text-xs">{r.phone}</td>
                    <td className="px-4 py-3 text-right font-bold text-[#0A0A0A]">{r.resolved_jobs}</td>
                    <td className="px-4 py-3 text-right font-semibold text-blue-700">{fmt(r.gross_earnings)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#FF6B00]">{fmt(r.platform_commission)}</td>
                    <td className={`px-4 py-3 text-right font-black ${r.net_earnings >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {fmt(Math.abs(r.net_earnings))}{r.net_earnings < 0 ? " (−)" : ""}
                    </td>
                    <td className="px-4 py-3 text-right text-[#6B7280] text-xs">{fmtDate(r.last_job_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[#9CA3AF] font-medium">
        Commission = ₹199 × resolved jobs. Net = Gross − Commission. Negative net means commission exceeds earnings (low-ticket services).
      </p>
    </div>
  );
}

/* ─── Shared UI ───────────────────────────────────────────────────────────── */

function StatusBadge({ status }) {
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

function ActionBtn({ color, onClick, children }) {
  const colors = {
    green: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100",
    blue:  "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100",
    red:   "bg-red-50 border-red-200 text-red-700 hover:bg-red-100",
  };
  return (
    <button onClick={onClick} className={`text-xs font-bold px-3 py-1.5 rounded-lg border-2 transition-colors ${colors[color]}`}>
      {children}
    </button>
  );
}

function RefreshBtn({ onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-sm font-semibold text-[#4B5563] hover:text-[#0A0A0A] border-2 border-[#E5E7EB] hover:border-[#0A0A0A] px-3 py-2 rounded-xl transition-colors">
      <RefreshCw className="w-3.5 h-3.5" /> Refresh
    </button>
  );
}

function Spinner() {
  return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" /></div>;
}

function Empty({ label }) {
  return <div className="text-center py-20 text-[#4B5563] font-medium">{label}</div>;
}

/* ─── Plazas Tab ──────────────────────────────────────────────────────────── */

const PLAZA_FIELDS = [
  { key: "name",              label: "Name",            type: "text",   required: true },
  { key: "highway",           label: "Highway",         type: "text",   required: true, placeholder: "NH-48" },
  { key: "state",             label: "State slug",      type: "text",   required: true, placeholder: "maharashtra" },
  { key: "city",              label: "City",            type: "text",   required: true },
  { key: "lat",               label: "Latitude",        type: "number", required: true },
  { key: "lng",               label: "Longitude",       type: "number", required: true },
  { key: "carRate",           label: "Car Rate (₹)",    type: "number" },
  { key: "truckRate",         label: "Truck Rate (₹)",  type: "number" },
  { key: "avgWait",           label: "Avg Wait",        type: "text",   placeholder: "4 min" },
  { key: "topIssue",          label: "Top Issue",       type: "text" },
  { key: "monthlyComplaints", label: "Monthly Complaints", type: "number" },
];

function PlazasTab() {
  const [stats, setStats]       = useState(null);
  const [plazas, setPlazas]     = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [page, setPage]         = useState(0);
  const PAGE = 50;

  // Modal state
  const [modal, setModal]       = useState(null); // null | "add" | "edit" | "import"
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [saveErr, setSaveErr]   = useState("");

  // Import state
  const [importText, setImportText]     = useState("");
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting]       = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [plazaRes, statsRes] = await Promise.all([
        adminApi.plazas({ q: q || undefined, state: stateFilter || undefined, skip: page * PAGE, limit: PAGE }),
        stats ? Promise.resolve({ data: stats }) : adminApi.plazaStats(),
      ]);
      setPlazas(plazaRes.data.plazas);
      setTotal(plazaRes.data.total);
      if (!stats) setStats(statsRes.data);
    } catch { }
    setLoading(false);
  }, [q, stateFilter, page, stats]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(0); load(); }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line
  }, [q, stateFilter]);

  const openAdd = () => { setForm({}); setSaveErr(""); setModal("add"); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setSaveErr(""); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditing(null); setForm({}); setImportResult(null); setImportText(""); };

  const save = async () => {
    setSaving(true); setSaveErr("");
    try {
      if (modal === "add") {
        await adminApi.createPlaza(form);
      } else {
        await adminApi.updatePlaza(editing.slug, form);
      }
      closeModal(); load();
    } catch (e) {
      setSaveErr(e?.response?.data?.detail || "Save failed");
    }
    setSaving(false);
  };

  const deletePlaza = async (slug) => {
    try { await adminApi.deletePlaza(slug); setDeleteConfirm(null); load(); } catch { }
  };

  const runImport = async () => {
    setImporting(true); setImportResult(null);
    try {
      let list;
      try { list = JSON.parse(importText); } catch { setImportResult({ error: "Invalid JSON" }); setImporting(false); return; }
      if (!Array.isArray(list)) { setImportResult({ error: "JSON must be an array of plaza objects" }); setImporting(false); return; }
      const res = await adminApi.importPlazas(list);
      setImportResult(res.data);
      setStats(null); // refresh stats
      load();
    } catch (e) { setImportResult({ error: e?.response?.data?.detail || "Import failed" }); }
    setImporting(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImportText(ev.target.result);
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">Total Plazas</p>
            <p className="text-3xl font-black mt-1">{stats.total.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4">
            <p className="text-xs font-bold uppercase text-[#9CA3AF]">States Covered</p>
            <p className="text-3xl font-black mt-1">{stats.by_state?.length || 0}</p>
          </div>
          <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 md:col-span-2">
            <p className="text-xs font-bold uppercase text-[#9CA3AF] mb-2">Top Highways</p>
            <div className="flex flex-wrap gap-1.5">
              {(stats.by_highway || []).slice(0, 6).map((h) => (
                <span key={h._id} className="text-xs font-bold bg-[#F3F4F6] px-2 py-1 rounded-full">
                  {h._id} <span className="text-[#FF6B00]">{h.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex gap-2 flex-1 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, city, highway…"
              className="w-full pl-9 pr-4 py-2 border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl outline-none text-sm"
            />
          </div>
          <input
            value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}
            placeholder="Filter by state slug…"
            className="px-4 py-2 border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl outline-none text-sm w-48"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal("import")} className="flex items-center gap-1.5 text-sm font-bold border-2 border-[#0A0A0A] px-4 py-2 rounded-xl hover:bg-[#F3F4F6] transition-colors">
            <Plus className="w-4 h-4" /> Import JSON
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-sm font-bold bg-[#FF6B00] text-white px-4 py-2 rounded-xl hover:bg-[#E66000] transition-colors shadow-[0_3px_0_#0A0A0A]">
            <Plus className="w-4 h-4" /> Add Plaza
          </button>
          <RefreshBtn onClick={load} />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-[#6B7280]">Showing {plazas.length} of {total} plazas{q ? ` matching "${q}"` : ""}</p>

      {/* Table */}
      {loading ? <Spinner /> : plazas.length === 0 ? <Empty label="No plazas found" /> : (
        <div className="overflow-x-auto rounded-2xl border-2 border-[#0A0A0A]">
          <table className="w-full text-sm">
            <thead className="bg-[#0A0A0A] text-white">
              <tr>
                {["Name", "Highway", "State", "City", "Lat", "Lng", "Car ₹", "Truck ₹", "Avg Wait", "Top Issue", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {plazas.map((p) => (
                <tr key={p.slug} className="hover:bg-[#FFFBEB] transition-colors">
                  <td className="px-4 py-3 font-semibold whitespace-nowrap max-w-[180px] truncate" title={p.name}>{p.name}</td>
                  <td className="px-4 py-3 text-[#FF6B00] font-bold">{p.highway}</td>
                  <td className="px-4 py-3 text-[#4B5563] capitalize">{p.state}</td>
                  <td className="px-4 py-3">{p.city}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.lat?.toFixed(4)}</td>
                  <td className="px-4 py-3 font-mono text-xs">{p.lng?.toFixed(4)}</td>
                  <td className="px-4 py-3">{p.carRate ? `₹${p.carRate}` : "—"}</td>
                  <td className="px-4 py-3">{p.truckRate ? `₹${p.truckRate}` : "—"}</td>
                  <td className="px-4 py-3 text-[#4B5563]">{p.avgWait || "—"}</td>
                  <td className="px-4 py-3 text-[#4B5563] max-w-[160px] truncate" title={p.topIssue}>{p.topIssue || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(p)} className="text-xs font-bold border border-[#E5E7EB] px-2 py-1 rounded-lg hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors">Edit</button>
                      <button onClick={() => setDeleteConfirm(p.slug)} className="text-xs font-bold border border-[#E5E7EB] px-2 py-1 rounded-lg hover:border-red-500 hover:text-red-500 transition-colors">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total > PAGE && (
        <div className="flex items-center justify-between">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="text-sm font-bold border-2 border-[#E5E7EB] px-4 py-2 rounded-xl disabled:opacity-40 hover:border-[#0A0A0A] transition-colors">← Prev</button>
          <span className="text-sm text-[#6B7280]">Page {page + 1} of {Math.ceil(total / PAGE)}</span>
          <button disabled={(page + 1) * PAGE >= total} onClick={() => setPage(p => p + 1)} className="text-sm font-bold border-2 border-[#E5E7EB] px-4 py-2 rounded-xl disabled:opacity-40 hover:border-[#0A0A0A] transition-colors">Next →</button>
        </div>
      )}

      {/* Add / Edit Modal */}
      {(modal === "add" || modal === "edit") && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display font-black text-2xl">{modal === "add" ? "Add New Plaza" : `Edit: ${editing?.name}`}</h2>
              <button onClick={closeModal} className="text-[#4B5563] hover:text-[#0A0A0A]"><XCircle className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {PLAZA_FIELDS.map((f) => (
                <label key={f.key} className={`block text-xs font-bold uppercase tracking-widest text-[#4B5563] ${f.key === "name" || f.key === "topIssue" ? "col-span-2" : ""}`}>
                  {f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}
                  <input
                    type={f.type}
                    value={form[f.key] ?? ""}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? +e.target.value : e.target.value }))}
                    placeholder={f.placeholder || ""}
                    className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 outline-none font-normal text-sm"
                  />
                </label>
              ))}
            </div>
            {saveErr && <p className="text-red-500 text-sm mt-3">{saveErr}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#FF6B00] text-white font-bold py-3 rounded-xl hover:bg-[#E66000] disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : modal === "add" ? "Create Plaza" : "Save Changes"}
              </button>
              <button onClick={closeModal} className="px-6 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold hover:border-[#0A0A0A] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {modal === "import" && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display font-black text-2xl">Import Plazas (JSON)</h2>
              <button onClick={closeModal}><XCircle className="w-6 h-6 text-[#4B5563]" /></button>
            </div>
            <p className="text-sm text-[#6B7280] mb-4">Paste a JSON array or upload a file. Each object needs at minimum: <code className="bg-[#F3F4F6] px-1 rounded">name, state, city, lat, lng</code></p>

            <div className="mb-3">
              <label className="text-xs font-bold uppercase tracking-widest text-[#4B5563]">Upload JSON file</label>
              <input type="file" accept=".json" onChange={handleFileUpload} className="mt-1 w-full text-sm border-2 border-dashed border-[#E5E7EB] rounded-xl px-3 py-2 cursor-pointer hover:border-[#FF6B00]" />
            </div>

            <label className="text-xs font-bold uppercase tracking-widest text-[#4B5563]">Or paste JSON</label>
            <textarea
              value={importText} onChange={(e) => setImportText(e.target.value)}
              rows={10} placeholder='[{"name":"Khalapur Plaza","highway":"NH-48","state":"maharashtra","city":"Khalapur","lat":18.81,"lng":73.27}]'
              className="mt-1 w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 outline-none text-xs font-mono resize-none"
            />

            {importResult && (
              <div className={`mt-3 p-3 rounded-xl text-sm font-semibold ${importResult.error ? "bg-red-50 text-red-600 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {importResult.error ? `❌ ${importResult.error}` : `✅ Imported ${importResult.imported} plazas · ${importResult.skipped} skipped`}
              </div>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={runImport} disabled={importing || !importText.trim()} className="flex-1 bg-[#0A0A0A] text-white font-bold py-3 rounded-xl hover:bg-[#FF6B00] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Run Import"}
              </button>
              <button onClick={closeModal} className="px-6 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold hover:border-[#0A0A0A] transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete plaza?</h3>
            <p className="text-sm text-[#4B5563] mb-5">This will permanently remove <strong>{deleteConfirm}</strong> from the database.</p>
            <div className="flex gap-3">
              <button onClick={() => deletePlaza(deleteConfirm)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-[#E5E7EB] font-bold py-2.5 rounded-xl hover:border-[#0A0A0A] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Content Tab ─────────────────────────────────────────────────────────── */

const ARTICLE_CATEGORIES = ["Disputes", "Balance", "KYC", "Blacklist", "Installation", "General"];

const EMPTY_FORM = {
  slug: "", title: "", category: "General", excerpt: "", body: "",
  meta_description: "", meta_keywords: "", related_bank: "", related_state: "",
  faq_pairs: [], cover: "", is_published: true, read_min: 4,
};

const QUILL_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link"],
    ["clean"],
  ],
};

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ContentTab() {
  const [articles, setArticles]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState("");

  const [form, setForm]           = useState(EMPTY_FORM);
  const [editSlug, setEditSlug]   = useState(null); // null = create, string = editing
  const [saving, setSaving]       = useState(false);
  const [saveErr, setSaveErr]     = useState("");
  const [saveOk, setSaveOk]       = useState(false);

  const [seeding, setSeeding]     = useState(false);
  const [seedMsg, setSeedMsg]     = useState("");
  const [deleteSlug, setDeleteSlug] = useState(null);

  const LIMIT = 20;
  const debounceRef = useRef(null);

  const load = useCallback(async (p = 1, s = search, c = catFilter) => {
    setLoading(true); setErr("");
    try {
      const params = { page: p, limit: LIMIT };
      if (s) params.search = s;
      if (c) params.category = c;
      const res = await adminApi.articles(params);
      const d = res.data || {};
      const list = Array.isArray(d.articles) ? d.articles
                 : Array.isArray(d.items)    ? d.items
                 : Array.isArray(d)          ? d : [];
      setArticles(list);
      setTotal(d.total != null ? Number(d.total) : list.length);
      setPage(p);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => { load(1, search, catFilter); }, [catFilter]); // eslint-disable-line
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => load(1, search, catFilter), 350);
    return () => clearTimeout(debounceRef.current);
  }, [search]); // eslint-disable-line

  const resetForm = () => { setForm(EMPTY_FORM); setEditSlug(null); setSaveErr(""); setSaveOk(false); };

  const startEdit = (a) => {
    setForm({
      slug: a.slug, title: a.title, category: a.category || "General",
      excerpt: a.excerpt || "", body: a.body || "",
      meta_description: a.meta_description || "", meta_keywords: a.meta_keywords || "",
      related_bank: a.related_bank || "", related_state: a.related_state || "",
      faq_pairs: a.faq_pairs || [], cover: a.cover || "",
      is_published: a.is_published !== false, read_min: a.read_min || 4,
    });
    setEditSlug(a.slug);
    setSaveErr(""); setSaveOk(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleTitleChange = (val) => {
    setForm((f) => ({
      ...f, title: val,
      ...(editSlug === null ? { slug: slugify(val) } : {}),
    }));
  };

  const setFaq = (idx, field, val) => {
    setForm((f) => {
      const pairs = [...f.faq_pairs];
      pairs[idx] = { ...pairs[idx], [field]: val };
      return { ...f, faq_pairs: pairs };
    });
  };

  const addFaq = () => setForm((f) => ({ ...f, faq_pairs: [...f.faq_pairs, { q: "", a: "" }] }));
  const removeFaq = (idx) => setForm((f) => ({ ...f, faq_pairs: f.faq_pairs.filter((_, i) => i !== idx) }));

  const save = async () => {
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const data = { ...form, read_min: Number(form.read_min) };
      if (editSlug) {
        await adminApi.updateArticle(editSlug, data);
      } else {
        await adminApi.createArticle(data);
      }
      setSaveOk(true);
      resetForm();
      load(page, search, catFilter);
    } catch (e) {
      setSaveErr(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async (slug) => {
    try {
      await adminApi.deleteArticle(slug);
      setDeleteSlug(null);
      load(page, search, catFilter);
    } catch (e) {
      setErr(e?.response?.data?.detail || "Delete failed");
    }
  };

  const seedArticles = async () => {
    setSeeding(true); setSeedMsg("");
    try {
      const r = await adminApi.seedArticles();
      setSeedMsg(`✅ Seeded! ${r.data.inserted || 0} inserted, ${r.data.skipped || 0} skipped.`);
      load(1, "", "");
    } catch (e) {
      setSeedMsg("❌ " + (e?.response?.data?.detail || "Seed failed"));
    } finally {
      setSeeding(false);
    }
  };

  const downloadSitemap = async () => {
    try {
      const res = await fetch(`${BACKEND}/sitemap.xml`);
      const xml = await res.text();
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "sitemap.xml"; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setErr("Could not fetch sitemap");
    }
  };

  const fieldCls = "w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-3 py-2 outline-none text-sm transition-colors";
  const labelCls = "text-xs font-bold uppercase tracking-widest text-[#4B5563] block mb-1";

  return (
    <div>
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="font-display font-black text-2xl">Content · {Number(total ?? 0).toLocaleString()} articles</h2>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={seedArticles} disabled={seeding}
            className="flex items-center gap-2 bg-[#0A0A0A] text-white font-bold px-4 py-2 rounded-xl hover:bg-[#FF6B00] disabled:opacity-50 transition-colors text-sm"
          >
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : "🌱"} Seed 1000+ Articles
          </button>
          <button
            onClick={downloadSitemap}
            className="flex items-center gap-2 border-2 border-[#E5E7EB] font-bold px-4 py-2 rounded-xl hover:border-[#0A0A0A] transition-colors text-sm"
          >
            <Download className="w-4 h-4" /> Sitemap XML
          </button>
        </div>
      </div>

      {seedMsg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-semibold ${seedMsg.startsWith("✅") ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
          {seedMsg}
        </div>
      )}

      {err && <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-200">{err}</div>}

      <div className="grid lg:grid-cols-5 gap-6">
        {/* ── Left: Form (2 cols) ── */}
        <div className="lg:col-span-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-2xl p-5 h-fit sticky top-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-black text-lg">
              {editSlug ? `Edit · ${editSlug}` : "New Article"}
            </h3>
            {editSlug && (
              <button onClick={resetForm} className="text-xs font-bold text-[#4B5563] hover:text-[#0A0A0A] border border-[#E5E7EB] px-3 py-1 rounded-full">
                + New
              </button>
            )}
          </div>

          {saveOk && <div className="mb-4 px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-xl text-sm font-semibold">Saved successfully!</div>}
          {saveErr && <div className="mb-4 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm">{saveErr}</div>}

          <div className="space-y-4">
            <div>
              <label className={labelCls}>Title</label>
              <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className={fieldCls} placeholder="How to fix FASTag blacklist — complete guide" />
            </div>

            <div>
              <label className={labelCls}>Slug</label>
              <input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} className={fieldCls} placeholder="fix-fastag-blacklist" disabled={!!editSlug} />
              {editSlug && <p className="text-xs text-[#9CA3AF] mt-1">Slug is immutable after creation.</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Category</label>
                <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={fieldCls}>
                  {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Read time (min)</label>
                <input type="number" min={1} max={30} value={form.read_min} onChange={(e) => setForm((f) => ({ ...f, read_min: e.target.value }))} className={fieldCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Excerpt (150 chars)</label>
              <textarea value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} rows={2} maxLength={200} className={`${fieldCls} resize-none`} placeholder="Short summary for cards and meta description..." />
            </div>

            <div>
              <label className={labelCls}>Body (HTML)</label>
              <div className="rounded-xl overflow-hidden border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] bg-white">
                <ReactQuill
                  theme="snow"
                  value={form.body}
                  onChange={(val) => setForm((f) => ({ ...f, body: val }))}
                  modules={QUILL_MODULES}
                  style={{ minHeight: 200 }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Related bank</label>
                <select value={form.related_bank} onChange={(e) => setForm((f) => ({ ...f, related_bank: e.target.value }))} className={fieldCls}>
                  <option value="">— none —</option>
                  {SEED_BANKS.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Related state</label>
                <select value={form.related_state} onChange={(e) => setForm((f) => ({ ...f, related_state: e.target.value }))} className={fieldCls}>
                  <option value="">— none —</option>
                  {SEED_STATES.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className={labelCls}>Meta description</label>
              <textarea value={form.meta_description} onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))} rows={2} className={`${fieldCls} resize-none`} placeholder="Overrides excerpt for <meta description>" />
            </div>

            <div>
              <label className={labelCls}>Meta keywords</label>
              <input value={form.meta_keywords} onChange={(e) => setForm((f) => ({ ...f, meta_keywords: e.target.value }))} className={fieldCls} placeholder="fastag blacklist, fastag blocked, ..." />
            </div>

            <div>
              <label className={labelCls}>Cover image URL</label>
              <input value={form.cover} onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))} className={fieldCls} placeholder="https://..." />
            </div>

            {/* FAQ pairs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className={labelCls}>FAQ pairs</label>
                <button type="button" onClick={addFaq} className="text-xs font-bold text-[#FF6B00] hover:underline">+ Add FAQ</button>
              </div>
              {form.faq_pairs.length === 0 && <p className="text-xs text-[#9CA3AF]">No FAQ pairs yet.</p>}
              <div className="space-y-3">
                {form.faq_pairs.map((pair, i) => (
                  <div key={i} className="bg-white border-2 border-[#E5E7EB] rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input value={pair.q} onChange={(e) => setFaq(i, "q", e.target.value)} placeholder="Question" className={`${fieldCls} flex-1`} />
                      <button type="button" onClick={() => removeFaq(i)} className="text-[#EF4444] hover:text-red-700 flex-shrink-0">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea value={pair.a} onChange={(e) => setFaq(i, "a", e.target.value)} placeholder="Answer" rows={2} className={`${fieldCls} resize-none`} />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className={`${labelCls} mb-0`}>Published</label>
              <button type="button" onClick={() => setForm((f) => ({ ...f, is_published: !f.is_published }))} className="flex-shrink-0">
                {form.is_published
                  ? <ToggleRight className="w-7 h-7 text-[#059669]" />
                  : <ToggleLeft className="w-7 h-7 text-[#9CA3AF]" />}
              </button>
              <span className="text-xs text-[#4B5563]">{form.is_published ? "Visible to users" : "Draft — hidden"}</span>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={save} disabled={saving || !form.slug || !form.title} className="flex-1 bg-[#0A0A0A] text-white font-bold py-3 rounded-xl hover:bg-[#FF6B00] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editSlug ? "Update" : "Create"}
              </button>
              {editSlug && (
                <button onClick={resetForm} className="px-5 py-3 border-2 border-[#E5E7EB] rounded-xl font-bold hover:border-[#0A0A0A] transition-colors text-sm">Cancel</button>
              )}
            </div>
          </div>
        </div>

        {/* ── Right: Table (3 cols) ── */}
        <div className="lg:col-span-3">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search articles…" className="w-full pl-9 pr-3 py-2 border-2 border-[#E5E7EB] rounded-xl text-sm outline-none focus:border-[#FF6B00] transition-colors"
              />
            </div>
            <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); load(1, search, e.target.value); }} className="border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#FF6B00]">
              <option value="">All categories</option>
              {ARTICLE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="text-center py-16"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[#FF6B00]" /></div>
          ) : articles.length === 0 ? (
            <div className="text-center py-16 text-[#9CA3AF]">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="font-semibold">No articles yet. Seed 1000+ or create one.</p>
            </div>
          ) : (
            <>
              <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-[#F8F9FA] border-b-2 border-[#E5E7EB]">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-[#4B5563] text-xs uppercase tracking-wide">Title</th>
                      <th className="text-left px-4 py-3 font-bold text-[#4B5563] text-xs uppercase tracking-wide">Cat</th>
                      <th className="text-left px-4 py-3 font-bold text-[#4B5563] text-xs uppercase tracking-wide hidden md:table-cell">Bank</th>
                      <th className="text-center px-4 py-3 font-bold text-[#4B5563] text-xs uppercase tracking-wide">Pub</th>
                      <th className="text-right px-4 py-3 font-bold text-[#4B5563] text-xs uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {articles.map((a) => (
                      <tr key={a.slug} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#0A0A0A] line-clamp-1 text-xs leading-snug">{a.title}</p>
                          <p className="text-[10px] text-[#9CA3AF] font-mono mt-0.5">{a.slug}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] font-bold bg-[#F3F4F6] text-[#4B5563] px-2 py-0.5 rounded-full whitespace-nowrap">{a.category}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-[10px] text-[#9CA3AF]">{a.related_bank || "—"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {a.is_published
                            ? <CheckCircle2 className="w-4 h-4 text-[#059669] mx-auto" />
                            : <XCircle className="w-4 h-4 text-[#9CA3AF] mx-auto" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startEdit(a)} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] text-[#4B5563] hover:text-[#0A0A0A] transition-colors">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => setDeleteSlug(a.slug)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#9CA3AF] hover:text-red-600 transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {total > LIMIT && (
                <div className="flex items-center justify-between mt-4 text-sm">
                  <span className="text-[#9CA3AF]">Page {page} · {total} total</span>
                  <div className="flex gap-2">
                    <button onClick={() => load(page - 1, search, catFilter)} disabled={page <= 1} className="px-4 py-2 border-2 border-[#E5E7EB] rounded-xl font-bold disabled:opacity-40 hover:border-[#0A0A0A] transition-colors">Prev</button>
                    <button onClick={() => load(page + 1, search, catFilter)} disabled={page * LIMIT >= total} className="px-4 py-2 border-2 border-[#E5E7EB] rounded-xl font-bold disabled:opacity-40 hover:border-[#0A0A0A] transition-colors">Next</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteSlug && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete article?</h3>
            <p className="text-sm text-[#4B5563] mb-5">This will permanently remove <strong className="font-mono">{deleteSlug}</strong> from the database.</p>
            <div className="flex gap-3">
              <button onClick={() => doDelete(deleteSlug)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteSlug(null)} className="flex-1 border-2 border-[#E5E7EB] font-bold py-2.5 rounded-xl hover:border-[#0A0A0A] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sitemap Tab ──────────────────────────────────────────────────────────────

const SITEMAP_SUB_TABS = ["Overview", "States", "Highways", "Cities", "Banks"];

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";

/** Generic reusable import modal for JSON/CSV */
function ImportModal({ title, templateNote, onImport, onClose, importing, result }) {
  const [text, setText] = useState("");
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setText(ev.target.result);
    reader.readAsText(f);
  };

  const parseAndImport = () => {
    let list;
    try { list = JSON.parse(text); } catch { alert("Invalid JSON. Paste a valid JSON array."); return; }
    if (!Array.isArray(list)) { alert("Must be a JSON array [ {...}, {...} ]"); return; }
    onImport(list);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F3F4F6]">
          <h3 className="font-bold text-lg flex items-center gap-2"><Upload className="w-5 h-5 text-[#FF6B00]" />{title}</h3>
          <button onClick={onClose} className="text-[#6B7280] hover:text-[#0A0A0A] text-xl font-bold">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-[#6B7280]">{templateNote}</p>
          <div className="flex gap-3">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 text-sm font-bold border-2 border-[#0A0A0A] rounded-xl px-4 py-2 hover:border-[#FF6B00] transition-colors">
              <Upload className="w-4 h-4" /> Upload file
            </button>
            <input ref={fileRef} type="file" accept=".json,.csv,.txt" className="hidden" onChange={handleFile} />
          </div>
          <textarea
            className="w-full h-40 text-xs font-mono border-2 border-[#E5E7EB] rounded-xl p-3 focus:border-[#FF6B00] outline-none resize-none"
            placeholder='[{"slug":"nh-48","name":"NH-48","fullName":"...","length":"1428 km",...}]'
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {result && (
            <div className={`text-sm font-bold px-4 py-2 rounded-xl ${result.error ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
              {result.error ? `Error: ${result.error}` : `✓ Imported ${result.imported}, skipped ${result.skipped}`}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button onClick={parseAndImport} disabled={importing || !text.trim()} className="flex-1 bg-[#FF6B00] text-white font-bold py-2.5 rounded-xl disabled:opacity-50 transition-colors hover:bg-[#e55f00]">
              {importing ? "Importing…" : "Import"}
            </button>
            <button onClick={onClose} className="flex-1 border-2 border-[#E5E7EB] font-bold py-2.5 rounded-xl hover:border-[#0A0A0A] transition-colors">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Generic data table for States / Highways / Cities / Banks */
function GenericDataTable({ label, icon: Icon, fetchFn, createFn, updateFn, deleteFn, importFn, columns, formFields, templateNote }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const PAGE = 50;

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");

  const [showImport, setShowImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn({ q: q || undefined, skip: page * PAGE, limit: PAGE });
      const d = res.data || {};
      // Backend returns { total, <key>: [] } — find the array key
      const key = Object.keys(d).find((k) => Array.isArray(d[k]));
      setItems(key ? d[key] : []);
      setTotal(d.total != null ? Number(d.total) : (key ? d[key].length : 0));
    } catch { setItems([]); }
    setLoading(false);
  }, [fetchFn, q, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { const t = setTimeout(() => { setPage(0); load(); }, 400); return () => clearTimeout(t); }, [q]); // eslint-disable-line

  const openAdd = () => { setForm({}); setSaveErr(""); setEditing(null); setShowForm(true); };
  const openEdit = (item) => { setEditing(item); setForm({ ...item }); setSaveErr(""); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); setForm({}); };

  const save = async () => {
    setSaving(true); setSaveErr("");
    try {
      if (editing) { await updateFn(editing.slug, form); }
      else { await createFn(form); }
      closeForm(); load();
    } catch (e) { setSaveErr(e?.response?.data?.detail || "Save failed"); }
    setSaving(false);
  };

  const doDelete = async (slug) => {
    try { await deleteFn(slug); setDeleteConfirm(null); load(); } catch { }
  };

  const doImport = async (list) => {
    setImporting(true); setImportResult(null);
    try { const res = await importFn(list); setImportResult(res.data); load(); }
    catch (e) { setImportResult({ error: e?.response?.data?.detail || "Import failed" }); }
    setImporting(false);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
        <div className="flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] rounded-xl px-3 py-2 w-full md:w-72">
          <Search className="w-4 h-4 text-[#9CA3AF] flex-shrink-0" />
          <input className="bg-transparent outline-none text-sm w-full" placeholder={`Search ${label}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowImport(true); setImportResult(null); }} className="flex items-center gap-1.5 text-sm font-bold border-2 border-[#0A0A0A] rounded-xl px-3 py-2 hover:border-[#FF6B00] transition-colors">
            <Upload className="w-4 h-4" /> Import
          </button>
          <button onClick={openAdd} className="flex items-center gap-1.5 text-sm font-bold bg-[#FF6B00] text-white rounded-xl px-4 py-2 hover:bg-[#e55f00] transition-colors">
            <Plus className="w-4 h-4" /> Add {label}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F8F9FA] border-b-2 border-[#0A0A0A]">
              <tr>
                {columns.map((c) => <th key={c.key} className="text-left px-4 py-3 font-bold text-xs uppercase tracking-widest text-[#6B7280]">{c.label}</th>)}
                <th className="px-4 py-3 text-right font-bold text-xs uppercase tracking-widest text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-8 text-[#9CA3AF]"><Loader2 className="w-5 h-5 animate-spin inline mr-2" />Loading…</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={columns.length + 1} className="text-center py-8 text-[#9CA3AF]">No {label.toLowerCase()} found. Import or add one.</td></tr>
              ) : items.map((item) => (
                <tr key={item.slug} className="hover:bg-[#FAFAFA]">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 text-[#0A0A0A]">
                      {c.render ? c.render(item) : (item[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-[#F3F4F6] transition-colors" title="Edit"><Edit2 className="w-4 h-4 text-[#4B5563]" /></button>
                      <button onClick={() => setDeleteConfirm(item.slug)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Delete"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > PAGE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F3F4F6]">
            <span className="text-xs text-[#9CA3AF]">Showing {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 rounded-lg border border-[#E5E7EB] text-sm font-bold disabled:opacity-40">Prev</button>
              <button onClick={() => setPage((p) => p + 1)} disabled={(page + 1) * PAGE >= total} className="px-3 py-1 rounded-lg border border-[#E5E7EB] text-sm font-bold disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#F3F4F6]">
              <h3 className="font-bold text-lg">{editing ? `Edit ${label}` : `Add ${label}`}</h3>
              <button onClick={closeForm} className="text-[#6B7280] hover:text-[#0A0A0A] text-xl font-bold">×</button>
            </div>
            <div className="p-6 space-y-4">
              {formFields.map((f) => (
                <div key={f.key}>
                  <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-1">{f.label}{f.required && " *"}</label>
                  {f.type === "textarea" ? (
                    <textarea className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#FF6B00] outline-none resize-none h-20" value={form[f.key] || ""} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} />
                  ) : f.type === "toggle" ? (
                    <button type="button" onClick={() => setForm((p) => ({ ...p, [f.key]: !p[f.key] }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form[f.key] !== false ? "bg-[#FF6B00]" : "bg-[#D1D5DB]"}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form[f.key] !== false ? "translate-x-6" : "translate-x-1"}`} />
                    </button>
                  ) : (
                    <input type={f.type || "text"} className="w-full border-2 border-[#E5E7EB] rounded-xl px-3 py-2 text-sm focus:border-[#FF6B00] outline-none" value={form[f.key] ?? ""} onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))} placeholder={f.placeholder} disabled={f.disabled && !!editing} />
                  )}
                </div>
              ))}
              {saveErr && <p className="text-red-600 text-sm font-bold">{saveErr}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={save} disabled={saving} className="flex-1 bg-[#FF6B00] text-white font-bold py-2.5 rounded-xl disabled:opacity-50 hover:bg-[#e55f00] transition-colors">{saving ? "Saving…" : "Save"}</button>
                <button onClick={closeForm} className="flex-1 border-2 border-[#E5E7EB] font-bold py-2.5 rounded-xl hover:border-[#0A0A0A] transition-colors">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <ImportModal
          title={`Import ${label}`}
          templateNote={templateNote}
          onImport={doImport}
          onClose={() => { setShowImport(false); setImportResult(null); }}
          importing={importing}
          result={importResult}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Delete {label}?</h3>
            <p className="text-sm text-[#4B5563] mb-5">Permanently remove <strong className="font-mono">{deleteConfirm}</strong>?</p>
            <div className="flex gap-3">
              <button onClick={() => doDelete(deleteConfirm)} className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-xl hover:bg-red-700 transition-colors">Delete</button>
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border-2 border-[#E5E7EB] font-bold py-2.5 rounded-xl hover:border-[#0A0A0A] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SitemapTab() {
  const [subTab, setSubTab] = useState("Overview");
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  const refreshStats = () => {
    setLoadingStats(true);
    adminApi.sitemapStats().then((r) => { setStats(r.data); }).catch(() => {}).finally(() => setLoadingStats(false));
  };

  useEffect(() => { refreshStats(); }, []); // eslint-disable-line

  const seedGeo = async () => {
    setSeeding(true); setSeedResult(null);
    try {
      const r = await adminApi.seedGeoData();
      setSeedResult(r.data);
      refreshStats();
    } catch (e) { setSeedResult({ error: e?.response?.data?.detail || "Seed failed" }); }
    setSeeding(false);
  };

  const downloadSitemap = async (path) => {
    const base = BACKEND_URL || "";
    const url = `${base}${path}`;
    try {
      const res = await fetch(url);
      const text = await res.text();
      const blob = new Blob([text], { type: "application/xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = path.replace("/", "") || "sitemap.xml";
      a.click();
    } catch { alert("Download failed — check backend is running"); }
  };

  const CATEGORY_ICONS = { static: Globe, plazas: MapPin, states: Map, banks: Landmark, highways: Route, cities: Building2, help: FileText, sathis: Users };
  const CATEGORY_COLORS = { static: "bg-blue-50 border-blue-200 text-blue-700", plazas: "bg-orange-50 border-orange-200 text-orange-700", states: "bg-green-50 border-green-200 text-green-700", banks: "bg-purple-50 border-purple-200 text-purple-700", highways: "bg-yellow-50 border-yellow-200 text-yellow-700", cities: "bg-pink-50 border-pink-200 text-pink-700", help: "bg-indigo-50 border-indigo-200 text-indigo-700", sathis: "bg-teal-50 border-teal-200 text-teal-700" };

  return (
    <div className="space-y-6">
      {/* Sub-tab nav */}
      <div className="flex gap-1 border-b-2 border-[#E5E7EB] overflow-x-auto">
        {SITEMAP_SUB_TABS.map((t) => (
          <button key={t} onClick={() => setSubTab(t)} className={`px-4 py-2.5 text-sm font-bold whitespace-nowrap border-b-2 -mb-0.5 transition-colors ${subTab === t ? "border-[#FF6B00] text-[#FF6B00]" : "border-transparent text-[#4B5563] hover:text-[#0A0A0A]"}`}>{t}</button>
        ))}
      </div>

      {/* ── Overview ── */}
      {subTab === "Overview" && (
        <div className="space-y-6">
          {/* Index info */}
          <div className="bg-[#0A0A0A] text-white rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-white/60 uppercase tracking-widest font-bold mb-1">Sitemap Index</div>
              <div className="font-mono text-sm text-[#FFD60A]">/sitemap.xml</div>
              <div className="text-xs text-white/60 mt-1">Points to {stats?.categories?.length || 8} child sitemaps · {loadingStats ? "…" : (stats?.total || 0).toLocaleString("en-IN")} total URLs</div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={() => downloadSitemap("/sitemap.xml")} className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 transition-colors">
                <Download className="w-3.5 h-3.5" /> Download index
              </button>
              <a href={`${BACKEND_URL}/sitemap.xml`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 transition-colors">
                <ExternalLink className="w-3.5 h-3.5" /> Open in browser
              </a>
            </div>
          </div>

          {/* Category cards */}
          {loadingStats ? (
            <div className="text-center py-10 text-[#9CA3AF]"><Loader2 className="w-6 h-6 animate-spin inline mr-2" />Loading stats…</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {(stats?.categories || []).map((cat) => {
                const Icon = CATEGORY_ICONS[cat.key] || Globe;
                const color = CATEGORY_COLORS[cat.key] || "bg-gray-50 border-gray-200 text-gray-700";
                return (
                  <div key={cat.key} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${color}`}>
                        <Icon className="w-3.5 h-3.5" />{cat.label}
                      </span>
                      <span className="text-2xl font-black text-[#FF6B00]">{cat.count.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="text-xs text-[#6B7280] font-mono">{cat.url}</div>
                    <div className="text-xs text-[#9CA3AF]">Priority {cat.priority} · {cat.changefreq}</div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadSitemap(cat.url)} className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-[#E5E7EB] rounded-lg py-1.5 hover:border-[#FF6B00] transition-colors">
                        <Download className="w-3 h-3" /> Download
                      </button>
                      <a href={`${BACKEND_URL}${cat.url}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 text-xs font-bold border border-[#E5E7EB] rounded-lg py-1.5 hover:border-[#FF6B00] transition-colors">
                        <ExternalLink className="w-3 h-3" /> Preview
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seed defaults */}
          <div className="bg-[#FFFBEB] border-2 border-yellow-200 rounded-2xl p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold text-yellow-800 mb-1 flex items-center gap-2"><Globe className="w-4 h-4" />Seed default geo data</h4>
                <p className="text-sm text-yellow-700">Populate States (29), Highways (7), Cities (20), and Banks (8) with built-in defaults. Idempotent — safe to run again after importing custom data.</p>
                {seedResult && (
                  <div className={`mt-2 text-sm font-bold ${seedResult.error ? "text-red-700" : "text-green-700"}`}>
                    {seedResult.error ? `Error: ${seedResult.error}` : `✓ Seeded ${seedResult.states} states · ${seedResult.highways} highways · ${seedResult.cities} cities · ${seedResult.banks} banks`}
                  </div>
                )}
              </div>
              <button onClick={seedGeo} disabled={seeding} className="flex items-center gap-2 bg-yellow-600 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-yellow-700 disabled:opacity-50 transition-colors flex-shrink-0">
                {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                {seeding ? "Seeding…" : "Seed Geo Data"}
              </button>
            </div>
          </div>

          {/* Google ping instructions */}
          <div className="bg-[#F0FDF4] border-2 border-green-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-green-800 mb-1">Submit to Google Search Console</h4>
                <p className="text-sm text-green-700 mb-2">After adding/importing data, submit the sitemap index to Google Search Console so new URLs get discovered.</p>
                <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-green-700 underline flex items-center gap-1">
                  Open Google Search Console <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-xs text-green-600 mt-1 font-mono">Sitemap URL: {BACKEND_URL}/sitemap.xml</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── States ── */}
      {subTab === "States" && (
        <GenericDataTable
          label="State"
          icon={Map}
          fetchFn={(p) => adminApi.states(p)}
          createFn={(d) => adminApi.createState(d)}
          updateFn={(slug, d) => adminApi.updateState(slug, d)}
          deleteFn={(slug) => adminApi.deleteState(slug)}
          importFn={(list) => adminApi.importStates(list)}
          columns={[
            { key: "name", label: "Name" },
            { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.slug}</span> },
            { key: "plazaCount", label: "Plazas" },
            { key: "sathiCount", label: "Sathis" },
            { key: "highways", label: "Highways", render: (r) => <span className="text-xs">{(r.highways || []).join(", ") || "—"}</span> },
          ]}
          formFields={[
            { key: "name",       label: "State Name",    required: true,  placeholder: "Maharashtra" },
            { key: "slug",       label: "Slug",          required: true,  placeholder: "maharashtra", disabled: true },
            { key: "plazaCount", label: "Plaza Count",   type: "number",  placeholder: "142" },
            { key: "sathiCount", label: "Sathi Count",   type: "number",  placeholder: "386" },
            { key: "highways",   label: "Highways (comma-separated)", placeholder: "NH-48, NH-160", render: "csv" },
          ]}
          templateNote='JSON array: [{"slug":"maharashtra","name":"Maharashtra","plazaCount":142,"sathiCount":386,"highways":["NH-48","NH-160"]}]'
        />
      )}

      {/* ── Highways ── */}
      {subTab === "Highways" && (
        <GenericDataTable
          label="Highway"
          icon={Route}
          fetchFn={(p) => adminApi.highways(p)}
          createFn={(d) => adminApi.createHighway(d)}
          updateFn={(slug, d) => adminApi.updateHighway(slug, d)}
          deleteFn={(slug) => adminApi.deleteHighway(slug)}
          importFn={(list) => adminApi.importHighways(list)}
          columns={[
            { key: "name",      label: "Name" },
            { key: "fullName",  label: "Full Name",  render: (r) => <span className="text-xs">{r.fullName}</span> },
            { key: "length",    label: "Length" },
            { key: "plazaCount",label: "Plazas" },
            { key: "is_active", label: "Active", render: (r) => r.is_active !== false ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-400" /> },
          ]}
          formFields={[
            { key: "name",       label: "Highway ID",     required: true,  placeholder: "NH-48" },
            { key: "slug",       label: "Slug",           required: true,  placeholder: "nh-48", disabled: true },
            { key: "fullName",   label: "Full Name",      required: true,  placeholder: "National Highway 48 (Delhi–Mumbai)" },
            { key: "length",     label: "Length",         placeholder: "1428 km" },
            { key: "plazaCount", label: "Total Plazas",   type: "number",  placeholder: "67" },
            { key: "desc",       label: "Description",    type: "textarea", placeholder: "India's busiest highway…" },
            { key: "is_active",  label: "Active (in sitemap)", type: "toggle" },
          ]}
          templateNote='JSON array: [{"slug":"nh-48","name":"NH-48","fullName":"National Highway 48 (Delhi–Mumbai)","length":"1428 km","plazaCount":67,"states":["Delhi","Maharashtra"],"desc":"..."}]'
        />
      )}

      {/* ── Cities ── */}
      {subTab === "Cities" && (
        <GenericDataTable
          label="City"
          icon={Building2}
          fetchFn={(p) => adminApi.cities(p)}
          createFn={(d) => adminApi.createCity(d)}
          updateFn={(slug, d) => adminApi.updateCity(slug, d)}
          deleteFn={(slug) => adminApi.deleteCity(slug)}
          importFn={(list) => adminApi.importCities(list)}
          columns={[
            { key: "name",       label: "City" },
            { key: "state",      label: "State" },
            { key: "plazaCount", label: "Plazas" },
            { key: "sathiCount", label: "Sathis" },
            { key: "slug",       label: "Slug", render: (r) => <span className="font-mono text-xs text-[#6B7280]">{r.slug}</span> },
          ]}
          formFields={[
            { key: "name",       label: "City Name",    required: true,  placeholder: "Mumbai" },
            { key: "slug",       label: "Slug",         required: true,  placeholder: "mumbai", disabled: true },
            { key: "state",      label: "State",        required: true,  placeholder: "Maharashtra" },
            { key: "plazaCount", label: "Plaza Count",  type: "number",  placeholder: "8" },
            { key: "sathiCount", label: "Sathi Count",  type: "number",  placeholder: "42" },
          ]}
          templateNote='JSON array: [{"slug":"mumbai","name":"Mumbai","state":"Maharashtra","plazaCount":8,"sathiCount":42}]'
        />
      )}

      {/* ── Banks ── */}
      {subTab === "Banks" && (
        <GenericDataTable
          label="Bank"
          icon={Landmark}
          fetchFn={(p) => adminApi.banks(p)}
          createFn={(d) => adminApi.createBank(d)}
          updateFn={(slug, d) => adminApi.updateBank(slug, d)}
          deleteFn={(slug) => adminApi.deleteBank(slug)}
          importFn={(list) => adminApi.importBanks(list)}
          columns={[
            { key: "name",       label: "Bank" },
            { key: "shortName",  label: "Short" },
            { key: "helpline",   label: "Helpline" },
            { key: "smsCode",    label: "SMS Code" },
            { key: "marketShare",label: "Market %", render: (r) => r.marketShare != null ? `${r.marketShare}%` : "—" },
            { key: "is_active",  label: "Active", render: (r) => r.is_active !== false ? <CheckCircle className="w-4 h-4 text-green-500" /> : <AlertTriangle className="w-4 h-4 text-red-400" /> },
          ]}
          formFields={[
            { key: "name",        label: "Bank Name",      required: true,  placeholder: "SBI FASTag" },
            { key: "slug",        label: "Slug",           required: true,  placeholder: "sbi-fastag", disabled: true },
            { key: "shortName",   label: "Short Name",     required: true,  placeholder: "SBI" },
            { key: "helpline",    label: "Helpline",       placeholder: "1800-11-0018" },
            { key: "smsCode",     label: "SMS Code",       placeholder: "FTBAL" },
            { key: "marketShare", label: "Market Share %", type: "number",  placeholder: "18" },
            { key: "color",       label: "Brand Color",    placeholder: "#22409A" },
            { key: "logo",        label: "Logo URL",       placeholder: "/banks/sbi.svg" },
            { key: "is_active",   label: "Active (in sitemap)", type: "toggle" },
          ]}
          templateNote='JSON array: [{"slug":"sbi-fastag","name":"SBI FASTag","shortName":"SBI","helpline":"1800-11-0018","smsCode":"FTBAL","marketShare":18}]'
        />
      )}
    </div>
  );
}

// ─── Branding Tab ─────────────────────────────────────────────────────────────

function UploadZone({ label, hint, accept, current, onUpload, onDelete, uploading }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (file) onUpload(file);
  };

  return (
    <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-[#0A0A0A] text-base">{label}</h3>
          <p className="text-xs text-[#6B7280] mt-0.5">{hint}</p>
        </div>
        {current && (
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-700 font-semibold border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* Current preview */}
      {current && (
        <div className="bg-[#F9FAFB] rounded-xl p-4 flex items-center justify-center min-h-[80px] border border-[#E5E7EB]">
          <img src={current} alt={label} className="max-h-16 max-w-full object-contain" />
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
          dragOver ? "border-[#FF6B00] bg-[#FFF7F0]" : "border-[#D1D5DB] hover:border-[#FF6B00] hover:bg-[#FFF7F0]"
        }`}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-[#FF6B00] animate-spin" />
        ) : (
          <Upload className="w-6 h-6 text-[#9CA3AF]" />
        )}
        <span className="text-sm font-semibold text-[#4B5563]">
          {uploading ? "Uploading…" : "Click or drag & drop"}
        </span>
        <span className="text-xs text-[#9CA3AF]">{accept}</span>
        <input ref={inputRef} type="file" accept={accept} className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
      </div>
    </div>
  );
}

function BrandingTab() {
  const { logo, favicon, siteName, tagline, reload } = useBranding();
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ site_name: siteName, tagline });

  useEffect(() => { setForm({ site_name: siteName, tagline }); }, [siteName, tagline]);

  const toast = (text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleUploadLogo = async (file) => {
    setUploadingLogo(true);
    try {
      await adminApi.uploadLogo(file);
      await reload();
      toast("Logo updated successfully");
    } catch (e) {
      toast(e?.response?.data?.detail || "Logo upload failed", false);
    } finally { setUploadingLogo(false); }
  };

  const handleUploadFavicon = async (file) => {
    setUploadingFavicon(true);
    try {
      await adminApi.uploadFavicon(file);
      await reload();
      toast("Favicon updated successfully");
    } catch (e) {
      toast(e?.response?.data?.detail || "Favicon upload failed", false);
    } finally { setUploadingFavicon(false); }
  };

  const handleDeleteLogo = async () => {
    if (!window.confirm("Remove the current logo?")) return;
    await adminApi.deleteLogo();
    await reload();
    toast("Logo removed");
  };

  const handleDeleteFavicon = async () => {
    if (!window.confirm("Remove the current favicon?")) return;
    await adminApi.deleteFavicon();
    await reload();
    toast("Favicon removed");
  };

  const handleSaveText = async () => {
    setSaving(true);
    try {
      await adminApi.updateBranding(form);
      await reload();
      toast("Branding text saved");
    } catch (e) {
      toast("Save failed", false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-[#0A0A0A]">Branding</h2>
        <p className="text-sm text-[#6B7280] mt-1">Upload your logo and favicon. Changes go live instantly across the site.</p>
      </div>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {msg.text}
        </div>
      )}

      {/* Upload cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UploadZone
          label="Company Logo"
          hint="Shown in the header navbar. PNG, SVG, JPG (max 5 MB). Recommended: 400×120 px."
          accept=".png,.jpg,.jpeg,.svg,.webp"
          current={logo}
          onUpload={handleUploadLogo}
          onDelete={handleDeleteLogo}
          uploading={uploadingLogo}
        />
        <UploadZone
          label="Favicon"
          hint="Browser tab icon. PNG, ICO, SVG (max 2 MB). Recommended: 64×64 px."
          accept=".png,.ico,.svg,.jpg,.jpeg"
          current={favicon}
          onUpload={handleUploadFavicon}
          onDelete={handleDeleteFavicon}
          uploading={uploadingFavicon}
        />
      </div>

      {/* Live preview */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 space-y-3">
        <h3 className="font-bold text-[#0A0A0A]">Live Header Preview</h3>
        <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-xl px-6 py-4 flex items-center">
          {logo ? (
            <img src={logo} alt={form.site_name} className="h-10 w-auto max-w-[160px] object-contain" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="relative w-10 h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0_#FF6B00]">
                <span className="font-bold text-white text-lg">A</span>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#FF6B00] border-2 border-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-base text-[#0A0A0A]">{form.site_name || "ApnaFastag"}</span>
                <span className="text-[10px] text-[#4B5563] -mt-0.5">{form.tagline || "अपना फास्टैग साथी"}</span>
              </div>
            </div>
          )}
        </div>
        <p className="text-xs text-[#9CA3AF]">
          {logo ? "Custom logo is active. Remove it to fall back to the text logo." : "No logo uploaded — text logo with site name & tagline is shown."}
        </p>
      </div>

      {/* Text settings */}
      <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-6 space-y-5">
        <h3 className="font-bold text-[#0A0A0A]">Text Fallback (shown when no logo is uploaded)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Site Name</label>
            <input
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:border-[#FF6B00] focus:outline-none"
              value={form.site_name}
              onChange={(e) => setForm((f) => ({ ...f, site_name: e.target.value }))}
              placeholder="ApnaFastag"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#374151] mb-1.5">Tagline (Hindi / sub-text)</label>
            <input
              className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm focus:border-[#FF6B00] focus:outline-none"
              value={form.tagline}
              onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="अपना फास्टैग साथी"
            />
          </div>
        </div>
        <button
          onClick={handleSaveText}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#333] disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Saving…" : "Save Text Settings"}
        </button>
      </div>
    </div>
  );
}
