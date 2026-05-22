import React, { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BadgeCheck, IndianRupee, Calendar, TrendingUp } from "lucide-react";
import { track, debounce } from "@/lib/analytics";

export default function BecomeSathi() {
  const [hours, setHours] = useState(6);
  const [days, setDays] = useState(22);

  const earnings = useMemo(() => {
    // Avg ₹90 per resolution, ~3 resolutions/hr at busy plazas
    const perHour = 270;
    const monthly = hours * days * perHour;
    return monthly;
  }, [hours, days]);

  // Debounced calc-change event so we don't spam PostHog on drag.
  const trackCalcRef = useRef(
    debounce((payload) => track("earnings_calc_change", payload), 400)
  );
  useEffect(() => {
    trackCalcRef.current({ hours, days, estimate: hours * days * 270 });
  }, [hours, days]);

  return (
    <section
      id="sathi"
      data-testid="sathi-section"
      className="relative bg-[#0A0A0A] text-white py-24 md:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 dot-grid-dark opacity-40 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FF6B00]/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid lg:grid-cols-12 gap-12 items-center">
        {/* Left: copy */}
        <div className="lg:col-span-6">
          <span className="inline-flex items-center gap-2 bg-[#FF6B00] text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5">
            <BadgeCheck className="w-3 h-3" /> For Sathis
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight leading-[0.95]">
            Already at the toll? <br />
            <span className="text-[#FFD60A]">Get paid to help.</span>
          </h2>
          <p className="mt-5 text-lg text-white/70 max-w-xl">
            Tea vendors, mechanics, agents, off-duty toll staff — turn your local know-how into ₹25k–₹60k/month, on your own schedule.
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4 max-w-lg">
            {[
              { v: "₹0", l: "Joining Fee" },
              { v: "T+2", l: "Payouts" },
              { v: "Flex", l: "Hours" },
            ].map((b) => (
              <div key={b.l} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="font-display font-black text-2xl text-[#FFD60A]">{b.v}</div>
                <div className="text-xs text-white/60 mt-1">{b.l}</div>
              </div>
            ))}
          </div>

          <a
            href="/become-a-sathi#apply"
            data-testid="sathi-cta"
            onClick={() =>
              track("cta_become_sathi_click", {
                src: "sathi_section",
                hours,
                days,
                estimate: earnings,
              })
            }
            className="mt-8 inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-7 py-4 rounded-full hover:bg-[#E66000] transition-all shadow-[0_5px_0_#FFD60A] hover:-translate-y-0.5 hover:shadow-[0_7px_0_#FFD60A]"
          >
            Apply to be a Sathi
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>

        {/* Right: Earnings Calculator */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          data-testid="earnings-calculator"
          className="lg:col-span-6 bg-white text-[#0A0A0A] rounded-3xl p-7 md:p-9 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] uppercase tracking-widest text-[#4B5563] font-bold">
                Earnings Estimator
              </div>
              <h3 className="font-display font-black text-2xl md:text-3xl mt-1">
                What you could make
              </h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#059669]/15 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-[#059669]" />
            </div>
          </div>

          {/* Hours slider */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF6B00]" /> Hours per day
                </label>
                <span className="font-display font-black text-lg text-[#FF6B00]">{hours} hrs</span>
              </div>
              <input
                type="range"
                min="2"
                max="12"
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                data-testid="hours-slider"
                className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer accent-[#FF6B00]"
              />
              <div className="flex justify-between text-[10px] text-[#4B5563] mt-1 font-mono">
                <span>2h</span><span>12h</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#FF6B00]" /> Days per month
                </label>
                <span className="font-display font-black text-lg text-[#FF6B00]">{days} days</span>
              </div>
              <input
                type="range"
                min="10"
                max="30"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                data-testid="days-slider"
                className="w-full h-2 bg-[#E5E7EB] rounded-full appearance-none cursor-pointer accent-[#FF6B00]"
              />
              <div className="flex justify-between text-[10px] text-[#4B5563] mt-1 font-mono">
                <span>10d</span><span>30d</span>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="mt-8 bg-[#0A0A0A] text-white rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 dot-grid-dark opacity-30" />
            <div className="relative">
              <div className="text-[11px] uppercase tracking-widest text-[#FFD60A] font-bold">
                Estimated monthly income
              </div>
              <div className="flex items-baseline gap-1 mt-2">
                <IndianRupee className="w-7 h-7 text-[#FF6B00]" />
                <span data-testid="earnings-amount" className="font-display font-black text-5xl md:text-6xl tracking-tight">
                  {earnings.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-xs text-white/60 mt-1">
                Based on ~₹270/hr average across busy NH-48 plazas. Top Sathis earn 2× this.
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
