import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// Reusable inner-page hero strip. Used by every non-home page for visual consistency.
export default function PageHero({ eyebrow, title, hindi, sub, breadcrumb = [], variant = "light", cta }) {
  const isDark = variant === "dark";
  return (
    <section
      data-testid="page-hero"
      className={`relative pt-32 md:pt-40 pb-14 md:pb-20 overflow-hidden ${
        isDark ? "bg-[#0A0A0A] text-white" : "bg-[#F8F9FA] text-[#0A0A0A]"
      }`}
    >
      <div className={`absolute inset-0 pointer-events-none ${isDark ? "dot-grid-dark opacity-30" : "dot-grid opacity-60"}`} />
      <div className="absolute -top-20 -right-20 w-[420px] h-[420px] bg-[#FF6B00]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        {breadcrumb.length > 0 && (
          <nav data-testid="breadcrumb" className={`flex items-center gap-1.5 text-xs font-semibold mb-6 ${isDark ? "text-white/60" : "text-[#4B5563]"}`}>
            <Link to="/" className="hover:text-[#FF6B00]">Home</Link>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                <ChevronRight className="w-3 h-3" />
                {b.to ? (
                  <Link to={b.to} className="hover:text-[#FF6B00]">{b.label}</Link>
                ) : (
                  <span className={isDark ? "text-white" : "text-[#0A0A0A]"}>{b.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#FF6B00] text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5"
          >
            {eyebrow}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-display font-black text-4xl md:text-6xl lg:text-7xl tracking-tight leading-[0.95] max-w-4xl"
        >
          {title}
        </motion.h1>

        {hindi && <p className={`font-hindi font-semibold mt-3 text-lg ${isDark ? "text-[#FFD60A]" : "text-[#FF6B00]"}`}>{hindi}</p>}

        {sub && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`mt-5 text-lg md:text-xl max-w-2xl leading-relaxed ${isDark ? "text-white/70" : "text-[#4B5563]"}`}
          >
            {sub}
          </motion.p>
        )}

        {cta && <div className="mt-8 flex flex-wrap gap-3">{cta}</div>}
      </div>
    </section>
  );
}
