import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, MapPin, Zap, Star } from "lucide-react";
import { track } from "@/lib/analytics";
import RadarTeaser from "./RadarTeaser";

export default function Hero() {
  return (
    <section
      id="top"
      data-testid="hero-section"
      className="relative pt-28 md:pt-36 pb-16 md:pb-24 overflow-hidden bg-[#F8F9FA]"
    >
      {/* Background texture */}
      <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-[420px] h-[420px] bg-[#FF6B00]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-20 w-[520px] h-[520px] bg-[#059669]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left: copy */}
        <div className="lg:col-span-7">
          {/* Pill badge */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            data-testid="hero-badge"
            className="inline-flex items-center gap-2 bg-white border-2 border-[#0A0A0A] rounded-full pl-2 pr-4 py-1.5 mb-6 shadow-[3px_3px_0_#FF6B00]"
          >
            <span className="bg-[#FF6B00] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Live
            </span>
            <span className="text-xs font-semibold text-[#0A0A0A]">
              <span className="inline-block w-2 h-2 rounded-full bg-[#059669] mr-1.5 animate-pulse" />
              2,184 Sathis online across India
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display font-black text-[44px] leading-[0.95] sm:text-6xl lg:text-[78px] lg:leading-[0.92] tracking-tight text-[#0A0A0A]"
          >
            Stuck at a toll?{" "}
            <span className="relative inline-block">
              <span className="relative z-10">Your Sathi</span>
              <svg
                className="absolute -bottom-1 left-0 w-full"
                viewBox="0 0 300 12"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M2 9C50 3 120 3 180 6C240 9 290 7 298 5"
                  stroke="#FF6B00"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>{" "}
            arrives in <span className="text-[#FF6B00]">90 seconds.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg md:text-xl text-[#4B5563] max-w-2xl leading-relaxed"
          >
            India's first real-time, peer-to-peer rescue network for FASTag chaos —{" "}
            <span className="font-semibold text-[#0A0A0A]">disputes, KYC, recharge fails, SOS.</span>{" "}
            <span className="font-hindi text-[#0A0A0A] font-semibold">हर टोल पर एक साथी।</span>
          </motion.p>

          {/* Dual CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            id="cta"
            className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <a
              href="/find"
              data-testid="hero-cta-find-sathi"
              onClick={() => track("cta_find_sathi_click", { src: "hero" })}
              className="group inline-flex items-center justify-center gap-2 bg-[#FF6B00] text-white font-bold text-base px-7 py-4 rounded-full hover:bg-[#E66000] transition-all shadow-[0_5px_0_#0A0A0A] hover:-translate-y-0.5 hover:shadow-[0_7px_0_#0A0A0A]"
            >
              Find a Sathi Now
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="/become-a-sathi"
              data-testid="hero-cta-become-sathi"
              onClick={() => track("cta_become_sathi_click", { src: "hero" })}
              className="group inline-flex items-center justify-center gap-2 bg-white border-2 border-[#0A0A0A] text-[#0A0A0A] font-bold text-base px-7 py-4 rounded-full hover:bg-[#0A0A0A] hover:text-white transition-all"
            >
              Become a Sathi · Earn ₹40k/mo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          {/* Mini trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <div className="flex items-center gap-2" data-testid="trust-verified">
              <ShieldCheck className="w-5 h-5 text-[#059669]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">100% verified Sathis</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#FF6B00]" />
              <span className="text-sm font-semibold text-[#0A0A0A]">~90s response</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <span className="text-sm font-semibold text-[#0A0A0A]">4.9 · 8,200 reviews</span>
            </div>
          </motion.div>
        </div>

        {/* Right: Radar Teaser */}
        <div className="lg:col-span-5 relative">
          <RadarTeaser />

          {/* Floating cards */}
          <motion.div
            initial={{ opacity: 0, x: 30, y: -10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="absolute -top-4 -left-4 md:-left-12 bg-white border-2 border-[#0A0A0A] rounded-2xl p-3 pr-4 shadow-[4px_4px_0_#FF6B00] hidden sm:flex items-center gap-3"
            data-testid="floating-card-sathi"
          >
            <div className="w-10 h-10 rounded-full bg-[#059669] flex items-center justify-center text-white font-black">
              R
            </div>
            <div>
              <div className="text-xs text-[#4B5563]">Sathi assigned</div>
              <div className="font-bold text-sm text-[#0A0A0A]">Ravi · 800m away</div>
            </div>
            <div className="ml-2 px-2 py-1 bg-[#059669] text-white text-[10px] font-black rounded-full uppercase">
              ETA 2m
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30, y: 10 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="absolute -bottom-2 -right-2 md:-right-8 bg-[#0A0A0A] text-white rounded-2xl p-4 shadow-2xl hidden sm:block"
            data-testid="floating-card-resolved"
          >
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[#FF6B00]" />
              <span className="text-[11px] uppercase tracking-wider text-[#FF6B00] font-bold">
                Just resolved
              </span>
            </div>
            <div className="font-bold text-sm">
              Mischarge ₹245 reversed · <span className="text-[#FFD60A]">Khalapur Toll</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
