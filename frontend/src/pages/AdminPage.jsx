import React, { useEffect, useState, useCallback } from "react";
import { adminApi, setAdminSecret, getAdminSecret, clearAdminSecret } from "@/lib/api";
import {
  Users, Briefcase, MapPin, ClipboardList, CheckCircle2, XCircle,
  Clock, Loader2, LogOut, RefreshCw, ChevronDown, BadgeCheck, Shield,
  Tag, Percent, Trash2, ToggleLeft, ToggleRight, Plus, Search,
} from "lucide-react";

const TABS = ["Dashboard", "Applications", "Jobs", "Sathis", "Promo Codes", "Settlements", "Plazas"];

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const fullUrl = (url) => { if (!url) return ""; if (url.startsWith("http")) return url; if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return ""; return `${BACKEND}${url}`; };

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
