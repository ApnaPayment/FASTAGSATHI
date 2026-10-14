import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { STATES } from "@/data/seed";
import { stateApi } from "@/lib/api";

// Home-page links into the plaza pages: every state (each lists its toll plazas) and the
// full sitemap. Starts from the seed list so the links are there before the API answers.
export default function BrowseByState() {
  const [states, setStates] = useState(STATES);

  useEffect(() => {
    stateApi.list().then((r) => { if (Array.isArray(r.data) && r.data.length) setStates(r.data); }).catch(() => {});
  }, []);

  const sorted = states.filter((s) => s.slug && s.name).slice().sort((a, b) => String(a.name).localeCompare(String(b.name)));
  return (
    <section data-testid="browse-by-state" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-3">Toll plazas near you</div>
        <h2 className="font-display font-black text-3xl md:text-5xl tracking-tighter mb-8">FASTag help by state</h2>
        <ul className="flex flex-wrap gap-2.5">
          {sorted.map((s) => (
            <li key={s.slug}>
              <Link
                to={`/state/${s.slug}`}
                className="inline-block px-4 py-2 rounded-full border border-[#E5E7EB] text-sm font-semibold text-[#0A0A0A] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors"
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-6 mt-8 text-sm font-bold">
          <Link to="/sitemap" className="inline-flex items-center gap-1.5 text-[#FF6B00] hover:underline">
            See all toll plazas <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/coverage" className="inline-flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#FF6B00]">
            Coverage map <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
