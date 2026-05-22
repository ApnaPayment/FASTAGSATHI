import React from "react";
import { motion } from "framer-motion";
import { Siren, FileWarning, ScanLine, MessageSquare, Languages, PhoneCall } from "lucide-react";

export default function Features() {
  return (
    <section id="features" data-testid="features-section" className="relative py-24 md:py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="inline-block bg-[#FF6B00] text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5">
              Built for the road
            </span>
            <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-[#0A0A0A] leading-[0.95]">
              Six superpowers <br /> in your glovebox.
            </h2>
          </div>
          <p className="text-[#4B5563] max-w-md text-lg">
            Every feature is built around a real moment of friction we observed at India's busiest plazas.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-6">
          {/* AI Scanner - large */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            data-testid="feature-ai-scanner"
            className="md:col-span-7 row-span-2 relative bg-[#0A0A0A] text-white rounded-3xl p-8 md:p-10 overflow-hidden min-h-[420px] group"
          >
            <div className="relative z-10 max-w-md">
              <div className="inline-flex items-center gap-2 bg-[#FF6B00]/20 border border-[#FF6B00]/40 rounded-full px-3 py-1 mb-5">
                <ScanLine className="w-3.5 h-3.5 text-[#FF6B00]" />
                <span className="text-[11px] uppercase tracking-widest font-bold text-[#FF6B00]">AI Receipt Scanner</span>
              </div>
              <h3 className="font-display font-black text-3xl md:text-5xl leading-tight tracking-tight">
                Snap. Scan. <span className="text-[#FFD60A]">Sorted.</span>
              </h3>
              <p className="mt-4 text-white/70 text-base md:text-lg">
                A laser-style OCR pass extracts plaza name, charge & timestamp from your toll receipt in under 2s — auto-files the dispute.
              </p>
            </div>

            {/* Mock receipt */}
            <div className="absolute right-6 bottom-6 top-20 w-[44%] max-w-[280px] hidden sm:block">
              <div className="relative h-full bg-white text-[#0A0A0A] rounded-xl p-5 shadow-2xl rotate-3 overflow-hidden">
                <div className="text-[10px] uppercase tracking-widest text-[#4B5563]">FASTag Receipt</div>
                <div className="font-display font-black text-lg mt-1">Khalapur Plaza</div>
                <div className="text-xs text-[#4B5563] mb-3">NH-48 · 14:22 IST</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span>Vehicle</span><span className="font-bold">MH 12 AB 4521</span></div>
                  <div className="flex justify-between"><span>Class</span><span className="font-bold">Car LMV</span></div>
                  <div className="flex justify-between"><span>Charged</span><span className="font-bold text-[#DC2626]">₹245</span></div>
                  <div className="flex justify-between"><span>Should be</span><span className="font-bold text-[#059669]">₹95</span></div>
                </div>
                <div className="mt-4 border-t-2 border-dashed border-[#E5E7EB] pt-3 text-[10px] text-[#4B5563]">
                  TXN-0098...
                </div>

                {/* Scanning laser */}
                <motion.div
                  className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FF6B00] to-transparent shadow-[0_0_24px_#FF6B00]"
                  animate={{ top: ["0%", "100%", "0%"] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
            </div>

            {/* Glow */}
            <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#FF6B00]/30 rounded-full blur-3xl" />
          </motion.div>

          {/* SOS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            data-testid="feature-sos"
            className="md:col-span-5 bg-[#DC2626] text-white rounded-3xl p-7 relative overflow-hidden min-h-[200px]"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                <Siren className="w-6 h-6" />
              </div>
              <motion.div
                className="w-3 h-3 rounded-full bg-white"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            </div>
            <h3 className="font-display font-black text-2xl md:text-3xl">Emergency SOS</h3>
            <p className="mt-2 text-white/80 text-sm md:text-base">
              One tap shares your GPS with the 3 nearest Sathis. Priority dispatch, even at 2 AM on NH-44.
            </p>
          </motion.div>

          {/* Dispute Manager */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            data-testid="feature-disputes"
            className="md:col-span-5 bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 relative shadow-[6px_6px_0_#FF6B00] min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#F59E0B]/15 flex items-center justify-center mb-4">
              <FileWarning className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h3 className="font-display font-black text-2xl md:text-3xl text-[#0A0A0A]">
              Dispute Manager
            </h3>
            <p className="mt-2 text-[#4B5563] text-sm md:text-base">
              File mischarges with photo evidence. Sathi handles NHAI / bank escalation. Track status in real-time.
            </p>
          </motion.div>

          {/* Chat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            data-testid="feature-chat"
            className="md:col-span-4 bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#059669]/15 flex items-center justify-center mb-4">
              <MessageSquare className="w-6 h-6 text-[#059669]" />
            </div>
            <h3 className="font-display font-black text-xl text-[#0A0A0A]">Real-time Chat</h3>
            <p className="mt-2 text-[#4B5563] text-sm">
              Firebase-backed instant messaging with image sharing. Stays open till your issue closes.
            </p>
          </motion.div>

          {/* Multi-language */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            data-testid="feature-language"
            className="md:col-span-4 bg-[#FFD60A] text-[#0A0A0A] rounded-3xl p-7 relative overflow-hidden min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#0A0A0A] flex items-center justify-center mb-4">
              <Languages className="w-6 h-6 text-[#FFD60A]" />
            </div>
            <h3 className="font-display font-black text-xl">4 Languages, 1 App</h3>
            <p className="mt-2 text-[#0A0A0A]/80 text-sm">
              English · <span className="font-hindi font-bold">हिन्दी</span> · <span className="font-hindi font-bold">मराठी</span> · தமிழ்
            </p>
            <p className="mt-1 text-[#0A0A0A]/70 text-xs">More on the way.</p>
          </motion.div>

          {/* Mask Calling */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            data-testid="feature-mask-calling"
            className="md:col-span-4 bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 min-h-[200px]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center mb-4">
              <PhoneCall className="w-6 h-6 text-[#FF6B00]" />
            </div>
            <h3 className="font-display font-black text-xl text-[#0A0A0A]">Privacy-Masked Calls</h3>
            <p className="mt-2 text-[#4B5563] text-sm">
              Talk to your Sathi without sharing phone numbers. Bridged via virtual line, auto-recorded for safety.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
