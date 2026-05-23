import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Siren, Radar, FileWarning, Plus, X } from "lucide-react";
import { track } from "@/lib/analytics";

const ACTIONS = [
  {
    icon: Siren,
    label: "SOS",
    color: "#DC2626",
    to: "/find?sos=1",
    description: "Emergency Sathi now",
    trackEvent: "hub_sos_click",
  },
  {
    icon: Radar,
    label: "Radar",
    color: "#FF6B00",
    to: "/find",
    description: "Sathis near me",
    trackEvent: "hub_radar_click",
  },
  {
    icon: FileWarning,
    label: "Dispute",
    color: "#F59E0B",
    to: "/tools/dispute-tracker",
    description: "Track my dispute",
    trackEvent: "hub_dispute_click",
  },
];

export default function ActionHub() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (a) => {
    track(a.trackEvent, { src: "action_hub" });
    setOpen(false);
    navigate(a.to);
  };

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
              onClick={() => handleAction(a)}
              data-testid={`hub-action-${a.label.toLowerCase()}`}
              className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.15)] rounded-full pl-4 pr-1 py-1 hover:scale-105 transition-transform cursor-pointer"
            >
              <div className="text-left">
                <div className="text-xs font-black text-[#0A0A0A] leading-none">{a.label}</div>
                <div className="text-[10px] text-[#4B5563] leading-none mt-0.5">{a.description}</div>
              </div>
              <span
                className="w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0"
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
