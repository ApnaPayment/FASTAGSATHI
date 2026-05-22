import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, Smartphone } from "lucide-react";
import { track } from "@/lib/analytics";

export default function CTABanner() {
  return (
    <section id="find" data-testid="cta-banner" className="relative py-20 md:py-28 bg-[#FF6B00] overflow-hidden">
      {/* Road markings overlay */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-3 opacity-30"
           style={{ backgroundImage: "repeating-linear-gradient(90deg,#ffffff 0,#ffffff 60px,transparent 60px,transparent 120px)" }} />
      <div className="absolute -top-32 -right-20 w-[400px] h-[400px] bg-[#FFD60A]/30 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display font-black text-4xl md:text-6xl text-white tracking-tight leading-[0.95]"
          >
            Next toll trip? <br />
            <span className="text-[#0A0A0A]">Drive with a Sathi.</span>
          </motion.h2>
          <p className="mt-5 text-lg text-white/90 max-w-lg">
            Free to install. Free to sign up. You only pay when an issue is actually fixed.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="#"
            data-testid="cta-banner-android"
            onClick={() => track("app_store_click", { platform: "android", src: "cta_banner" })}
            className="flex items-center gap-3 bg-[#0A0A0A] text-white rounded-2xl px-6 py-4 hover:-translate-y-1 transition-transform shadow-xl"
          >
            <Smartphone className="w-8 h-8" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-[#FFD60A]">Get it on</div>
              <div className="font-display font-black text-xl leading-none">Play Store</div>
            </div>
          </a>
          <a
            href="#"
            data-testid="cta-banner-ios"
            onClick={() => track("app_store_click", { platform: "ios", src: "cta_banner" })}
            className="flex items-center gap-3 bg-white text-[#0A0A0A] rounded-2xl px-6 py-4 hover:-translate-y-1 transition-transform shadow-xl border-2 border-[#0A0A0A]"
          >
            <Smartphone className="w-8 h-8" />
            <div className="text-left">
              <div className="text-[10px] uppercase tracking-widest text-[#4B5563]">Download on</div>
              <div className="font-display font-black text-xl leading-none">App Store</div>
            </div>
          </a>
        </div>
      </div>
    </section>
  );
}
