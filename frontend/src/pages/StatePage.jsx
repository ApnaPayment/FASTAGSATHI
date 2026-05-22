import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import { ArrowRight } from "lucide-react";
import { STATES, PLAZAS } from "@/data/seed";
import { stateApi, plazaApi } from "@/lib/api";
import { track } from "@/lib/analytics";

export default function StatePage() {
  const { stateSlug } = useParams();
  const [state, setState] = useState(null);
  const [plazas, setPlazas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [stateRes, plazasRes] = await Promise.all([
          stateApi.get(stateSlug),
          plazaApi.byState(stateSlug),
        ]);
        setState(stateRes.data);
        setPlazas(plazasRes.data);
      } catch {
        const fallbackState = STATES.find((s) => s.slug === stateSlug);
        setState(fallbackState || null);
        setPlazas(PLAZAS.filter((p) => p.state === stateSlug));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [stateSlug]);

  useEffect(() => {
    if (state) {
      track("state_view", { state: state.slug });
      document.title = `${state.name} toll plazas · ApnaFastag`;
    }
  }, [state]);

  if (loading) {
    return <section className="pt-40 pb-32 text-center"><p className="text-[#4B5563] text-lg">Loading…</p></section>;
  }

  if (!state) {
    return (
      <section className="pt-40 pb-32 text-center">
        <h1 className="font-display font-black text-4xl">State not found</h1>
        <Link to="/coverage" className="text-[#FF6B00] font-bold mt-4 inline-block">Back to coverage →</Link>
      </section>
    );
  }

  return (
    <>
      <SEO
        title={`${state.name} toll plazas, FASTag help & Sathis · ApnaFastag`}
        description={`${state.plazaCount} toll plazas across ${state.name} covered by ${state.sathiCount} verified Sathis. Live on ${(state.highways || []).join(", ")}. Get on-spot help for mischarges, KYC, and recharge failures.`}
        path={`/state/${state.slug}`}
        keywords={`${state.name} toll plazas, ${state.name} fastag, ${state.name} toll rates, ${(state.highways || []).join(", ")} toll`}
        jsonLd={breadcrumbSchema([
          { label: "Coverage", url: "/coverage" },
          { label: state.name, url: `/state/${state.slug}` },
        ])}
      />
      <PageHero
        eyebrow="State coverage"
        title={<>FASTag help across <span className="text-[#FF6B00]">{state.name}</span></>}
        sub={`${state.plazaCount} toll plazas covered · ${state.sathiCount || 0} verified Sathis · Active on ${(state.highways || []).join(", ")}.`}
        breadcrumb={[{ label: "Coverage", to: "/coverage" }, { label: state.name }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-2">
            Toll plazas in {state.name}
            <span className="text-[#4B5563] font-sans font-normal text-base ml-3">{plazas.length} plazas</span>
          </h2>
          <p className="text-[#4B5563] mb-6">Tap any plaza for live rates and to ping a nearby Sathi.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {plazas.map((p) => (
              <Link key={p.slug} to={`/toll/${p.slug}`} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 shadow-[5px_5px_0_#FF6B00] hover:-translate-y-1 transition-transform">
                <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">{p.highway}</div>
                <div className="font-display font-bold text-lg mt-1">{p.name}</div>
                <div className="text-sm text-[#4B5563]">{p.city}</div>
                <div className="mt-3 text-xs text-[#4B5563]">Car ₹{p.carRate} · Truck ₹{p.truckRate}</div>
                <div className="mt-2 flex items-center gap-1 text-xs font-bold text-[#FF6B00]">View <ArrowRight className="w-3 h-3" /></div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
