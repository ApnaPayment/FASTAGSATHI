import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, Radar, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const STEP_KEYS = [
  { num: "01", icon: AlertCircle, color: "#DC2626", titleKey: "how.step1.title", descKey: "how.step1.desc" },
  { num: "02", icon: Radar,       color: "#FF6B00", titleKey: "how.step2.title", descKey: "how.step2.desc" },
  { num: "03", icon: CheckCircle2,color: "#059669", titleKey: "how.step3.title", descKey: "how.step3.desc" },
];

export default function HowItWorks() {
  const { t } = useLanguage();
  return (
    <section
      id="how"
      data-testid="how-section"
      className="relative py-24 md:py-32 bg-[#F8F9FA] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="max-w-2xl mb-16">
          <span className="inline-block km-sign px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5">
            {t("how.badge")}
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-[#0A0A0A] leading-[0.95]">
            {t("how.h2a")} <br />
            <span className="text-[#FF6B00]">{t("how.h2b")}</span>
          </h2>
          <p className="mt-5 text-lg text-[#4B5563] max-w-xl">
            {t("how.sub")}
          </p>
        </div>

        {/* Steps with road */}
        <div className="relative grid md:grid-cols-3 gap-6 md:gap-8">
          {/* Connecting road dashes (desktop) */}
          <div className="hidden md:block absolute top-16 left-[16%] right-[16%] road-divider opacity-40" />

          {STEP_KEYS.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              data-testid={`step-${i + 1}`}
              className="relative bg-white border-2 border-[#0A0A0A] rounded-2xl p-7 shadow-[6px_6px_0_#0A0A0A] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0_#0A0A0A] transition-all"
            >
              {/* Number */}
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: `${s.color}15` }}
                >
                  <s.icon className="w-7 h-7" style={{ color: s.color }} />
                </div>
                <span className="font-display font-black text-5xl text-[#0A0A0A]/10 leading-none">
                  {s.num}
                </span>
              </div>
              <h3 className="font-display font-bold text-2xl text-[#0A0A0A]">{t(s.titleKey)}</h3>
              <p className="text-[#4B5563] leading-relaxed">{t(s.descKey)}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
