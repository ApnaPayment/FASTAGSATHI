import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { Languages, Menu, X, User, LogOut, LayoutDashboard, ScanSearch, ChevronUp, Briefcase } from "lucide-react";
import { track } from "@/lib/analytics";
import { useAuth } from "@/contexts/AuthContext";
import { useBranding } from "@/contexts/BrandingContext";

const NAV = [
  { label: "How it Works", to: "/how-it-works" },
  { label: "Features",     to: "/features" },
  { label: "Pricing",      to: "/pricing" },
  { label: "Coverage",     to: "/coverage" },
  { label: "Become a Sathi", to: "/become-a-sathi" },
  { label: "Help",         to: "/help" },
];

const LANGS = ["EN", "हिं", "मरा", "தமி"];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [lang, setLang] = useState("EN");
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const { logo, siteName, tagline } = useBranding();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
    <motion.header
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      data-testid="site-header"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-[#E5E7EB] shadow-[0_4px_24px_rgba(0,0,0,0.04)]"
          : "bg-white/40 backdrop-blur-md"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 h-16 md:h-20 flex items-center justify-between gap-4">

        {/* Left: logo */}
        <div className="flex items-center">
          <Link to="/" data-testid="brand-logo" className="flex items-center gap-2 group">
            {logo ? (
              <img
                src={logo}
                alt={siteName}
                className="h-9 md:h-10 w-auto max-w-[160px] object-contain"
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
        </div>

        {/* Center: nav */}
        <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
          {NAV.map((n) => {
            const active = pathname === n.to || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                data-testid={`nav-link-${n.label.replace(/\s+/g, "-").toLowerCase()}`}
                className={`text-sm font-semibold transition-colors relative group ${active ? "text-[#FF6B00]" : "text-[#0A0A0A] hover:text-[#FF6B00]"}`}
              >
                {n.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6B00] transition-all duration-300 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
              </Link>
            );
          })}
        </nav>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* FASTag Status button */}
          <Link
            to="/tools/fastag-status"
            data-testid="header-cta-status"
            onClick={() => track("cta_fastag_status_click", { src: "header" })}
            className="hidden md:inline-flex items-center gap-1.5 border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold text-xs px-3 py-2 rounded-full hover:bg-[#0A0A0A] hover:text-white transition-all"
          >
            <ScanSearch className="w-3.5 h-3.5" /> FASTag Status
          </Link>

          <Link
            to="/find"
            data-testid="header-cta-find"
            onClick={() => track("cta_find_sathi_click", { src: "header" })}
            className="hidden md:inline-flex items-center bg-[#FF6B00] text-white font-bold text-sm px-5 py-2.5 rounded-full hover:bg-[#E66000] transition-all shadow-[0_4px_0_#0A0A0A] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#0A0A0A]"
          >
            Find a Sathi
          </Link>

          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/my-jobs"
                title="My Bookings"
                className="inline-flex items-center gap-1.5 bg-[#0A0A0A]/5 text-[#0A0A0A] font-bold text-xs px-3 py-2 rounded-full hover:bg-[#0A0A0A]/10 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5" /> My Jobs
              </Link>
              <Link
                to="/dashboard"
                title="Sathi Dashboard"
                className="inline-flex items-center gap-1.5 bg-[#FF6B00]/10 text-[#FF6B00] font-bold text-xs px-3 py-2 rounded-full hover:bg-[#FF6B00]/20 transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <button
                onClick={logout}
                data-testid="header-logout"
                title={`Logout (${user.phone})`}
                className="inline-flex items-center gap-1.5 bg-[#059669]/15 text-[#059669] font-bold text-xs px-3 py-2 rounded-full hover:bg-[#059669]/25 transition-colors"
              >
                <User className="w-3.5 h-3.5" /> ··{user.phone.slice(-4)}
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <Link
              to="/login?returnTo=%2Fdashboard"
              data-testid="header-login"
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold text-[#0A0A0A] hover:text-[#FF6B00] px-3 transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Sathi Login
            </Link>
          )}

          <button
            data-testid="mobile-menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden p-2 rounded-lg border-2 border-[#E5E7EB] bg-white"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          className="lg:hidden bg-white border-t-2 border-[#E5E7EB]"
          data-testid="mobile-menu"
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="text-base font-semibold text-[#0A0A0A]">
                {n.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/my-jobs"
                className="inline-flex items-center gap-2 text-base font-semibold text-[#0A0A0A]"
              >
                <Briefcase className="w-4 h-4" /> My Jobs
              </Link>
            )}
            <Link
              to="/tools/fastag-status"
              className="inline-flex items-center gap-2 border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold px-5 py-3 rounded-full"
            >
              <ScanSearch className="w-4 h-4" /> FASTag Status
            </Link>
            <Link
              to="/find"
              data-testid="mobile-cta-find"
              onClick={() => track("cta_find_sathi_click", { src: "mobile_menu" })}
              className="inline-flex justify-center bg-[#FF6B00] text-white font-bold px-5 py-3 rounded-full"
            >
              Find a Sathi
            </Link>
          </div>
        </motion.div>
      )}
    </motion.header>

    {/* Floating language toggle - bottom-left, fixed */}
    <div
      data-testid="language-toggle"
      className="fixed bottom-5 left-5 z-50 flex items-center gap-1 bg-white border-2 border-[#0A0A0A] rounded-full px-2 py-1.5 shadow-[4px_4px_0_#0A0A0A]"
    >
      <Languages className="w-3.5 h-3.5 text-[#4B5563] ml-1 mr-0.5" />
      {LANGS.map((l) => (
        <button
          key={l}
          data-testid={`lang-btn-${l}`}
          onClick={() => { setLang(l); track("lang_toggle_change", { lang: l, src: "floating" }); }}
          className={`px-2.5 py-1 text-xs font-bold rounded-full transition-all ${lang === l ? "bg-[#0A0A0A] text-white" : "text-[#4B5563] hover:text-[#0A0A0A]"}`}
        >
          {l}
        </button>
      ))}
    </div>
    </>
  );
}
