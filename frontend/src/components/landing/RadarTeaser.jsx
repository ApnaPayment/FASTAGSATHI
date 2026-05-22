import React from "react";
import { motion } from "framer-motion";

const PINGS = [
  { top: "28%", left: "62%", delay: 0.4, label: "Khalapur" },
  { top: "55%", left: "30%", delay: 0.9, label: "Pune Toll" },
  { top: "70%", left: "70%", delay: 1.4, label: "Lonavla" },
  { top: "40%", left: "78%", delay: 1.9, label: "Vashi" },
];

export default function RadarTeaser() {
  return (
    <div
      data-testid="radar-teaser"
      className="relative aspect-square w-full max-w-md mx-auto bg-white border-2 border-[#0A0A0A] rounded-3xl overflow-hidden shadow-[8px_8px_0_#0A0A0A]"
    >
      {/* Inner dark scope */}
      <div className="absolute inset-3 rounded-2xl bg-gradient-to-br from-[#0B1220] via-[#0A0A0A] to-[#1a0f00] overflow-hidden">
        {/* Concentric circles */}
        {[0.25, 0.5, 0.75, 1].map((s, i) => (
          <div
            key={i}
            className="absolute top-1/2 left-1/2 rounded-full border border-[#FF6B00]/25"
            style={{
              width: `${s * 100}%`,
              height: `${s * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
        ))}

        {/* Crosshair lines */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-[#FF6B00]/15" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#FF6B00]/15" />

        {/* Sweeping cone */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-[140%] h-[140%] radar-sweep"
          style={{ transformOrigin: "center", translateX: "-50%", translateY: "-50%" }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        />

        {/* Center dot (user) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-[#FF6B00] border-2 border-white" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-[#FF6B00]"
              animate={{ scale: [1, 2.4], opacity: [0.7, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </div>

        {/* Pings */}
        {PINGS.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: p.delay, duration: 0.5 }}
            className="absolute z-10"
            style={{ top: p.top, left: p.left }}
            data-testid={`radar-ping-${i}`}
          >
            <div className="relative">
              <div className="w-3 h-3 rounded-full bg-[#059669] border-2 border-white shadow-[0_0_12px_#059669]" />
              <motion.div
                className="absolute inset-0 rounded-full border border-[#059669]"
                animate={{ scale: [1, 3], opacity: [0.6, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.3 }}
              />
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-[#FFD60A] whitespace-nowrap bg-black/60 px-1.5 py-0.5 rounded">
                {p.label}
              </div>
            </div>
          </motion.div>
        ))}

        {/* HUD top label */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center text-[10px] font-mono text-[#FF6B00]/80 tracking-widest">
          <span>JOURNEY RADAR</span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-center text-[10px] font-mono text-white/40 tracking-widest">
          <span>NH-48 · 19.123 N</span>
          <span>72.876 E</span>
        </div>
      </div>
    </div>
  );
}
