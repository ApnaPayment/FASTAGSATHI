import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { STATES, PLAZAS } from "@/data/seed";
import { stateApi, plazaApi } from "@/lib/api";
import { track } from "@/lib/analytics";

export default function CoveragePage() {
  const [q, setQ] = useState("");
  const [states, setStates] = useState(STATES);
  const [plazas, setPlazas] = useState(null); // null = loading, avoids flashing stale count
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    track("page_view", { page: "coverage" });
    async function load() {
      try {
        const [statesRes, plazasRes] = await Promise.all([
          stateApi.list(),
          plazaApi.list(),
        ]);
        if (statesRes.data?.length) setStates(statesRes.data);
        setPlazas(plazasRes.data?.length ? plazasRes.data : PLAZAS);
      } catch {
        setPlazas(PLAZAS); // fall back to seed on error
        setLoadError(true);
      }
    }
    load();
  }, []);

  const list = plazas || [];
  const filtered = list.filter((p) =>
    !q ||
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    p.city.toLowerCase().includes(q.toLowerCase()) ||
    p.highway.toLowerCase().includes(q.toLowerCase())
  );

  // Animated count display — shows skeleton while loading
  const CountDisplay = plazas === null
    ? <span className="inline-block w-24 h-10 bg-[#FF6B00]/20 rounded-lg animate-pulse align-middle" />
    : <span className="text-[#FF6B00]">{plazas.length}+</span>;

  return (
    <>
      <SEO
        title={`Coverage — ${plazas ? plazas.length + "+" : "689+"} toll plazas across India · ApnaFastag`}
        description="Browse every toll plaza covered by ApnaFastag. Live Sathi counts, current rates per vehicle class, and instant rescue at NH-48, NH-44, NH-19 and more."
        path="/coverage"
        keywords="toll plaza coverage, fastag help locations, all toll plazas india, nh48 toll, nh44 toll"
      />
      <PageHero
        eyebrow="Where we're live"
        title={<>Sathis at {CountDisplay} plazas across India — and growing weekly.</>}
        sub="Search any toll plaza, city or highway. We show live Sathi count, average response time, and current toll charges per vehicle class."
        breadcrumb={[{ label: "Coverage" }]}
      />

      {/* Search */}
      <section className="py-12 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="relative" data-testid="plaza-search">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search plaza, city or highway (e.g. Khalapur, NH-48)"
              data-testid="plaza-search-input"
              className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-full pl-14 pr-6 py-4 font-medium outline-none transition-colors"
            />
          </div>
        </div>
      </section>

      {/* States */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-4xl mb-8">Browse by state</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {states.map((s) => (
              <Link key={s.slug} to={`/state/${s.slug}`} data-testid={`state-card-${s.slug}`} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 hover:bg-[#0A0A0A] hover:text-white transition-colors group">
                <div className="text-xs text-[#4B5563] group-hover:text-[#FFD60A] font-bold uppercase tracking-widest">State</div>
                <div className="font-display font-bold text-xl mt-1">{s.name}</div>
                <div className="text-sm text-[#4B5563] group-hover:text-white/60 mt-2">{s.plazaCount} plazas · {s.sathiCount || 0} Sathis</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Plaza grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-4xl mb-2">
            Live toll plazas {q && <span className="text-[#4B5563] text-lg">({filtered.length} matches)</span>}
          </h2>
          <p className="text-[#4B5563] mb-8">Tap any plaza for current rates, complaint trends, and to ping a Sathi waiting at that lane.</p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => (
              <Link key={p.slug} to={`/toll/${p.slug}`} data-testid={`plaza-card-${p.slug}`} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 hover:-translate-y-1 transition-transform shadow-[5px_5px_0_#FF6B00]">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#FF6B00] font-bold uppercase tracking-widest">
                    <MapPin className="w-3 h-3" /> {p.highway}
                  </div>
                  <span className="bg-[#059669] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase">Live</span>
                </div>
                <h3 className="font-display font-bold text-lg text-[#0A0A0A] mt-2">{p.name}</h3>
                <p className="text-sm text-[#4B5563]">{p.city}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-[#4B5563]">Car: <strong className="text-[#0A0A0A]">₹{p.carRate}</strong></span>
                  <span className="text-[#4B5563]">Truck: <strong className="text-[#0A0A0A]">₹{p.truckRate}</strong></span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-bold text-[#FF6B00]">View plaza <ArrowRight className="w-3 h-3" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
