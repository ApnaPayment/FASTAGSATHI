import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, User, LogOut, LayoutDashboard,
  ScanSearch, Briefcase, ChevronDown, Tag,
} from "lucide-react";
import { track } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";

// Primary nav — keep it tight, 4 items max
const NAV = [
  { label: "How it Works",   to: "/how-it-works" },
  { label: "Become a Sathi", to: "/become-a-sathi" },
  { label: "Help",           to: "/help" },
  { label: "Buy FASTag",     to: "/buy-fastag", highlight: true },
];

export default function Header() {
  const [scrolled,  setScrolled]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { logo, siteName, tagline } = useBranding();
  const userMenuRef = useRef(null);

  // Scroll shadow
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); setUserOpen(false); }, [pathname]);

  // Close user dropdown on outside click
  useEffect(() => {
    if (!userOpen) return;
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [userOpen]);

  return (
    <>
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-xl border-b border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.06)]"
          : "bg-white/50 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-12 h-16 md:h-18 flex items-center justify-between gap-3">

        {/* ── Logo ── */}
        <Link to="/" data-testid="brand-logo" className="flex-shrink-0 flex items-center gap-2">
          {logo ? (
            <img
              src={logo}
              alt={siteName}
              className="h-10 md:h-12 w-auto max-w-[200px] object-contain"
            />
          ) : (
            <>
              <div className="relative w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[#0A0A0A] flex items-center justify-center shadow-[3px_3px_0_#FF6B00]">
                <span className="font-display font-black text-white text-lg leading-none">A</span>
                <span className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-[#FF6B00] border-2 border-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-base md:text-lg tracking-tight text-[#0A0A0A]">{siteName}</span>
                <span className="font-hindi text-[10px] md:text-[11px] text-[#4B5563] -mt-0.5">{tagline}</span>
              </div>
            </>
          )}
        </Link>

        {/* ── Desktop nav (center) ── */}
        <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            if (n.highlight) return (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`nav-link-${n.label.replace(/\s+/g, "-").toLowerCase()}`}
                className={`text-sm font-bold px-4 py-1.5 rounded-full border-2 transition-all ${
                  active
                    ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                    : "border-[#FF6B00] text-[#FF6B00] hover:bg-[#FF6B00] hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
            return (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`nav-link-${n.label.replace(/\s+/g, "-").toLowerCase()}`}
                className={`text-sm font-semibold transition-colors relative group ${
                  active ? "text-[#FF6B00]" : "text-[#0A0A0A] hover:text-[#FF6B00]"
                }`}
              >
                {n.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6B00] transition-all duration-300 ${
                  active ? "w-full" : "w-0 group-hover:w-full"
                }`} />
              </Link>
            );
          })}
        </nav>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2">

          {/* Primary CTA — visible on all screen sizes */}
          <Link
            to="/find"
            data-testid="header-cta-find"
            onClick={() => track("cta_find_sathi_click", { src: "header" })}
            className="inline-flex items-center bg-[#FF6B00] text-white font-bold text-xs md:text-sm px-3 md:px-5 py-2 md:py-2.5 rounded-full hover:bg-[#E66000] transition-all shadow-[0_4px_0_#0A0A0A] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#0A0A0A]"
          >
            Find a Sathi
          </Link>

          {/* User dropdown */}
          <div className="hidden md:block relative" ref={userMenuRef}>
            <button
              onClick={() => setUserOpen(!userOpen)}
              data-testid="user-menu-toggle"
              className={`flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-full border-2 transition-all ${
                userOpen
                  ? "bg-[#0A0A0A] text-white border-[#0A0A0A]"
                  : "border-[#E5E7EB] text-[#0A0A0A] hover:border-[#0A0A0A]"
              }`}
            >
              <User className="w-4 h-4" />
              {user ? `··${user.phone.slice(-4)}` : "Account"}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${userOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white border-2 border-[#0A0A0A] rounded-2xl shadow-[4px_4px_0_#0A0A0A] overflow-hidden"
                >
                  {/* Tools — always visible */}
                  <Link
                    to="/tools/fastag-status"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors"
                  >
                    <ScanSearch className="w-4 h-4 text-[#FF6B00]" /> FASTag Status
                  </Link>
                  <Link
                    to="/buy-fastag"
                    onClick={() => setUserOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors border-t border-[#F3F4F6]"
                  >
                    <Tag className="w-4 h-4 text-[#FF6B00]" /> Buy FASTag
                  </Link>

                  <div className="border-t-2 border-[#F3F4F6]" />

                  {user ? (
                    <>
                      <Link
                        to="/my-jobs"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-[#FF6B00]" /> My Jobs
                      </Link>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors border-t border-[#F3F4F6]"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#FF6B00]" /> Dashboard
                      </Link>
                      <button
                        onClick={() => { logout(); setUserOpen(false); }}
                        data-testid="header-logout"
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors border-t border-[#F3F4F6]"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/login?returnTo=%2Fdashboard"
                      data-testid="header-login"
                      onClick={() => setUserOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#FF6B00]" /> Sathi Login
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile menu toggle */}
          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            className="lg:hidden p-2 rounded-lg border-2 border-[#E5E7EB] bg-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden overflow-hidden bg-white border-t-2 border-[#E5E7EB]"
            data-testid="mobile-menu"
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`text-base font-semibold px-3 py-3 rounded-xl transition-colors ${
                    n.highlight
                      ? "text-[#FF6B00] bg-[#FFF4EC]"
                      : "text-[#0A0A0A] hover:bg-[#F8F9FA]"
                  }`}
                >
                  {n.label}
                </Link>
              ))}

              <div className="border-t border-[#F3F4F6] my-2" />

              <Link
                to="/tools/fastag-status"
                className="flex items-center gap-2 text-base font-semibold px-3 py-3 rounded-xl text-[#0A0A0A] hover:bg-[#F8F9FA]"
              >
                <ScanSearch className="w-4 h-4 text-[#FF6B00]" /> FASTag Status
              </Link>

              {user && (
                <>
                  <Link
                    to="/my-jobs"
                    className="flex items-center gap-2 text-base font-semibold px-3 py-3 rounded-xl text-[#0A0A0A] hover:bg-[#F8F9FA]"
                  >
                    <Briefcase className="w-4 h-4 text-[#FF6B00]" /> My Jobs
                  </Link>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 text-base font-semibold px-3 py-3 rounded-xl text-[#0A0A0A] hover:bg-[#F8F9FA]"
                  >
                    <LayoutDashboard className="w-4 h-4 text-[#FF6B00]" /> Dashboard
                  </Link>
                </>
              )}

              <div className="flex flex-col gap-2 mt-3">
                <Link
                  to="/find"
                  onClick={() => track("cta_find_sathi_click", { src: "mobile_menu" })}
                  data-testid="mobile-cta-find"
                  className="flex justify-center bg-[#FF6B00] text-white font-bold px-5 py-3 rounded-full shadow-[0_4px_0_#0A0A0A]"
                >
                  Find a Sathi
                </Link>
                {!user && (
                  <Link
                    to="/login?returnTo=%2Fdashboard"
                    data-testid="header-login"
                    className="flex justify-center items-center gap-2 border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold px-5 py-3 rounded-full"
                  >
                    <User className="w-4 h-4" /> Sathi Login
                  </Link>
                )}
                {user && (
                  <button
                    onClick={logout}
                    className="flex justify-center items-center gap-2 border-2 border-red-200 text-red-500 font-bold px-5 py-3 rounded-full"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
    </>
  );
}
