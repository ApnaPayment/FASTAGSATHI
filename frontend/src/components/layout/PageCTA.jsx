import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics";

// Footer-style strip that appears at the bottom of every inner page.
export default function PageCTA({ primary = "Find a Sathi Now", secondary = "Become a Sathi", primaryTo = "/find", secondaryTo = "/become-a-sathi", note }) {
  return (
    <section data-testid="page-cta" className="relative bg-[#FF6B00] py-16 md:py-20 overflow-hidden">
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-2 opacity-30" style={{ backgroundImage: "repeating-linear-gradient(90deg,#fff 0,#fff 40px,transparent 40px,transparent 80px)" }} />
      <div className="relative max-w-5xl mx-auto px-6 md:px-10 lg:px-12 text-center">
        <h2 className="font-display font-black text-3xl md:text-5xl text-white tracking-tight leading-[0.95]">
          Stop arguing at the toll booth.
        </h2>
        {note && <p className="text-white/90 mt-3 max-w-xl mx-auto">{note}</p>}
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={primaryTo}
            onClick={() => track("cta_find_sathi_click", { src: "page_cta" })}
            data-testid="page-cta-primary"
            className="inline-flex items-center justify-center gap-2 bg-[#0A0A0A] text-white font-bold px-7 py-4 rounded-full shadow-[0_5px_0_#FFD60A] hover:-translate-y-0.5 transition-transform"
          >
            {primary} <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to={secondaryTo}
            onClick={() => track("cta_become_sathi_click", { src: "page_cta" })}
            data-testid="page-cta-secondary"
            className="inline-flex items-center justify-center gap-2 bg-white text-[#0A0A0A] font-bold px-7 py-4 rounded-full border-2 border-[#0A0A0A] hover:-translate-y-0.5 transition-transform"
          >
            {secondary}
          </Link>
        </div>
      </div>
    </section>
  );
}
