import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, Radar, FileWarning, Plus, X } from "lucide-react";

const ACTIONS = [
  { icon: Siren, label: "SOS", color: "#DC2626" },
  { icon: Radar, label: "Radar", color: "#FF6B00" },
  { icon: FileWarning, label: "Dispute", color: "#F59E0B" },
];

export default function ActionHub() {
  const [open, setOpen] = useState(false);

  return (
    <div data-testid="action-hub" className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open &&
          ACTIONS.map((a, i) => (
            <motion.button
              key={a.label}
              initial={{ opacity: 0, x: 20, scale: 0.6 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.6 }}
              transition={{ delay: i * 0.06 }}
              data-testid={`hub-action-${a.label.toLowerCase()}`}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-full pl-3 pr-1 py-1"
            >
              <span className="text-xs font-bold text-[#0A0A0A]">{a.label}</span>
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: a.color }}
              >
                <a.icon className="w-5 h-5" />
              </span>
            </motion.button>
          ))}
      </AnimatePresence>

      <button
        onClick={() => setOpen(!open)}
        data-testid="action-hub-toggle"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        aria-expanded={open}
        className="w-14 h-14 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:scale-105 transition-transform relative"
      >
        <motion.span
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.span>
        {!open && (
          <span className="absolute inset-0 rounded-full border-2 border-[#FF6B00] animate-ping opacity-50" />
        )}
      </button>
    </div>
  );
}
