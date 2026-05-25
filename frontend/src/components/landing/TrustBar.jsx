import React from "react";

const PLAZAS = [
  "Khalapur · NH-48",
  "Vashi · MMRDA",
  "Lonavla · NH-48",
  "Zirakpur · NH-44",
  "Manesar · NH-48",
  "Kherki Daula · NH-48",
  "Karad · NH-48",
  "Athur · NH-44",
  "Ulhas · MH-SH-79",
  "Palwal · NH-19",
  "Gurugram · NH-48",
  "Kamothe · MH",
];

const STATS = [
  { value: "30 Lakh+", label: "FASTag Issued", color: "#FF6B00" },
  { value: "1,500+", label: "Verified Sathis", color: "#059669" },
  { value: "700+", label: "Toll Plazas", color: "#0A0A0A" },
  { value: "90s", label: "Avg Response", color: "#FF6B00" },
];

export default function TrustBar() {
  return (
    <section data-testid="trust-bar" className="relative bg-[#0A0A0A] text-white py-10 md:py-14 overflow-hidden">
      <div className="absolute inset-0 dot-grid-dark opacity-30 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 mb-10">
          {STATS.map((s) => (
            <div key={s.label} data-testid={`stat-${s.label.replace(/\s+/g, '-').toLowerCase()}`} className="flex flex-col">
              <span className="font-display font-black text-3xl md:text-5xl tracking-tight" style={{ color: s.color === "#0A0A0A" ? "#FFD60A" : s.color }}>
                {s.value}
              </span>
              <span className="text-xs md:text-sm text-white/60 mt-1 uppercase tracking-wider font-semibold">
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="road-divider opacity-50 mb-6" style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFD60A 0,#FFD60A 24px,transparent 24px,transparent 44px)" }} />

        <div className="text-[11px] uppercase tracking-widest text-white/50 font-bold mb-3">
          Active at these toll plazas
        </div>
      </div>

      {/* Marquee */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#0A0A0A] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#0A0A0A] to-transparent z-10" />

        <div className="marquee-track flex gap-3 whitespace-nowrap w-max">
          {[...PLAZAS, ...PLAZAS].map((p, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold text-white/90"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              {p}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
