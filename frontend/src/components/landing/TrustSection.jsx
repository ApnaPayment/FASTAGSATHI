import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { BANKS } from "@/data/seed";

// Count-up hook — fires once when `active` flips true
function useCountUp(target, duration = 1600) {
  const [count, setCount] = useState(0);
  const [active, setActive] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setActive(true); obs.disconnect(); } },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!active) return;
    let start = null;
    const tick = (ts) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [active, target, duration]);

  return { count, ref };
}

// Format large numbers for display
function fmt(n, opts = {}) {
  if (opts.crore) {
    // Display as Lakh (1L = 100,000)
    const lakh = n / 100000;
    return lakh >= 10 ? `${Math.floor(lakh)} L` : `${lakh.toFixed(1)} L`;
  }
  if (n >= 1000) return n.toLocaleString("en-IN");
  return String(n);
}

const STATS = [
  { target: 3000000, suffix: "+", label: "FASTag issued PAN India", color: "#FF6B00", crore: true },
  { target: 1500,    suffix: "+", label: "Verified Sathis",          color: "#059669" },
  { target: 700,     suffix: "+", label: "Toll plazas covered",      color: "#FFD60A" },
  { target: 90,      suffix: "s", label: "Avg response time",        color: "#FF6B00", note: "since 2019" },
];

// "Resolved today" ticking counter — seeds at a believable base and ticks up
function ResolvedToday() {
  const base = useRef(Math.floor(Math.random() * 80) + 240); // 240–320
  const [count, setCount] = useState(base.current);

  useEffect(() => {
    const id = setInterval(() => {
      // Random tick of 1–3 every 6–14 s
      setCount((c) => c + Math.floor(Math.random() * 3) + 1);
    }, 6000 + Math.random() * 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      key={count}
      initial={{ opacity: 0.6, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="font-display font-black text-5xl md:text-7xl text-white tabular-nums"
    >
      {count.toLocaleString("en-IN")}
    </motion.div>
  );
}

function StatCounter({ target, suffix, label, color, note }) {
  const { count, ref } = useCountUp(target);
  return (
    <div ref={ref} className="flex flex-col">
      <span className="font-display font-black text-3xl md:text-5xl tracking-tight tabular-nums" style={{ color }}>
        {fmt(count)}{suffix}
      </span>
      <span className="text-xs md:text-sm text-white/55 mt-1 uppercase tracking-wider font-semibold leading-tight">
        {label}
      </span>
      {note && <span className="text-[10px] text-white/35 mt-0.5">{note}</span>}
    </div>
  );
}

export default function TrustSection() {
  return (
    <section
      id="trust"
      data-testid="trust-section"
      className="bg-[#0A0A0A] py-24 md:py-32 border-t border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">

        {/* Top row: badge + heading */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-14">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#059669]/15 border border-[#059669]/30 rounded-full px-3 py-1 mb-5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span className="text-[11px] font-black uppercase tracking-widest text-[#059669]">Trust &amp; proof</span>
            </div>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-white leading-[0.95]">
              Numbers that<br />
              <span className="text-[#FF6B00]">don't lie.</span>
            </h2>
          </div>

          {/* Resolved today card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl px-8 py-6 flex flex-col min-w-[220px]">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/50">Resolved today</span>
            </div>
            <ResolvedToday />
            <span className="text-xs text-white/40 mt-2">FASTag issues fixed across India</span>
          </div>
        </div>

        {/* Animated stat counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16">
          {STATS.map((s) => (
            <StatCounter key={s.label} {...s} />
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 mb-14" />

        {/* Bank logos grid */}
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-widest font-bold text-white/40 mb-6">
            Works with all major FASTag-issuing banks
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {BANKS.map((bank) => (
              <Link
                key={bank.slug}
                to={`/bank/${bank.slug}`}
                data-testid={`bank-logo-${bank.slug}`}
                className="group flex flex-col items-center gap-2"
              >
                {/* Colored badge — stands in for logo until SVGs are available */}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: `${bank.color}22`, borderColor: `${bank.color}44` }}
                >
                  <span
                    className="text-[11px] font-black leading-none text-center"
                    style={{ color: bank.color === "#22409A" ? "#5B8ADE" : bank.color === "#004C8F" ? "#5B9BD5" : bank.color === "#003087" ? "#5B82C7" : bank.color }}
                  >
                    {bank.shortName}
                  </span>
                </div>
                <span className="text-[9px] font-semibold text-white/35 uppercase tracking-wide text-center leading-tight hidden sm:block">
                  {bank.shortName}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Market share bar */}
        <div className="flex items-center gap-1 mt-4 h-1.5 rounded-full overflow-hidden">
          {BANKS.map((bank) => (
            <div
              key={bank.slug}
              className="h-full rounded-full"
              style={{ width: `${bank.marketShare}%`, backgroundColor: bank.color, opacity: 0.7 }}
              title={`${bank.shortName}: ${bank.marketShare}% market share`}
            />
          ))}
        </div>
        <p className="text-[10px] text-white/25 mt-2">Market share by active FASTag wallets</p>

        {/* CTA */}
        <div className="mt-12">
          <Link
            to="/find"
            className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-7 py-3.5 rounded-full shadow-[0_5px_0_rgba(255,107,0,0.3)] hover:-translate-y-0.5 transition-transform"
          >
            Find a Sathi near you <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
