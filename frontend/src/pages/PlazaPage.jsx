import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { placeSchema, breadcrumbSchema } from "@/components/seo/SEO";
import { MapPin, Clock, AlertCircle, IndianRupee, ArrowRight } from "lucide-react";
import { PLAZAS, STATES } from "@/data/seed";
import { plazaApi, stateApi } from "@/lib/api";
import { track } from "@/lib/analytics";
import MapView from "@/components/map/MapView";

export default function PlazaPage() {
  const { plazaSlug } = useParams();
  const [plaza, setPlaza] = useState(null);
  const [state, setState] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await plazaApi.get(plazaSlug);
        const p = res.data;
        setPlaza(p);

        const [stateRes, nearbyRes] = await Promise.all([
          stateApi.get(p.state),
          plazaApi.byState(p.state),
        ]);
        setState(stateRes.data);
        setNearby((nearbyRes.data || []).filter((x) => x.slug !== plazaSlug).slice(0, 3));
      } catch (err) {
        const is404 = err?.response?.status === 404;
        const fallbackPlaza = PLAZAS.find((p) => p.slug === plazaSlug);
        if (fallbackPlaza) {
          setPlaza(fallbackPlaza);
          setState(STATES.find((s) => s.slug === fallbackPlaza.state) || null);
          setNearby(PLAZAS.filter((p) => p.state === fallbackPlaza.state && p.slug !== plazaSlug).slice(0, 3));
        } else if (is404) {
          // Plaza genuinely doesn't exist — noindex is correct
          setNotFound(true);
        }
        // Non-404 error (network/proxy issue) with no seed fallback:
        // leave plaza null but don't set notFound so we don't noindex
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [plazaSlug]);

  useEffect(() => {
    if (plaza) {
      track("plaza_view", { plaza: plaza.slug });
      document.title = `${plaza.name} (${plaza.highway}) toll rates · live Sathi at ${plaza.city}`;
    }
  }, [plaza]);

  if (loading) {
    return <section className="pt-40 pb-32 text-center"><p className="text-[#4B5563] text-lg">Loading…</p></section>;
  }

  if (notFound) {
    return (
      <section className="pt-40 pb-32 text-center px-6">
        <SEO title="Toll plaza not found · ApnaFastag" description="This toll plaza page does not exist." path={`/toll/${plazaSlug}`} noindex />
        <h1 className="font-display font-black text-4xl">Plaza not found</h1>
        <Link to="/coverage" className="text-[#FF6B00] font-bold mt-4 inline-block">Back to coverage →</Link>
      </section>
    );
  }

  if (!plaza) {
    return <section className="pt-40 pb-32 text-center"><p className="text-[#4B5563] text-lg">Loading…</p></section>;
  }

  return (
    <>
      <SEO
        title={`${plaza.name} (${plaza.highway}) toll rates 2026 · ApnaFastag`}
        description={`${plaza.name} on ${plaza.highway} at ${plaza.city}: live toll rates (car ₹${plaza.carRate}, truck ₹${plaza.truckRate}), top complaint trends, and verified Sathis ready to help on-spot.`}
        path={`/toll/${plaza.slug}`}
        keywords={`${plaza.name} toll, ${plaza.highway} toll rates, ${plaza.city} fastag help, ${plaza.name} dispute, ${plaza.name} mischarge`}
        jsonLd={[
          placeSchema(plaza, state),
          breadcrumbSchema([
            { label: "Coverage", url: "/coverage" },
            state && { label: state.name, url: `/state/${state.slug}` },
            { label: plaza.name, url: `/toll/${plaza.slug}` },
          ].filter(Boolean)),
        ]}
      />
      <PageHero
        eyebrow={`${plaza.highway} · ${plaza.city}`}
        title={<>{plaza.name}</>}
        hindi={`${plaza.city} टोल · हर लेन में साथी।`}
        sub={`Live toll rates, current complaint trends, and verified Sathis ready to help at ${plaza.name}.`}
        breadcrumb={[
          { label: "Coverage", to: "/coverage" },
          state && { label: state.name, to: `/state/${state.slug}` },
          { label: plaza.name },
        ].filter(Boolean)}
      />

      {/* Stats grid */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-4 gap-5">
          {[
            { Icon: IndianRupee, l: "Car rate", v: `₹${plaza.carRate}`, c: "#FF6B00" },
            { Icon: IndianRupee, l: "Truck rate", v: `₹${plaza.truckRate}`, c: "#0A0A0A" },
            { Icon: Clock, l: "Avg lane wait", v: plaza.avgWait || "—", c: "#059669" },
            { Icon: AlertCircle, l: "Monthly issues", v: (plaza.monthlyComplaints || 0).toLocaleString("en-IN"), c: "#DC2626" },
          ].map((s) => (
            <div key={s.l} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
              <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center" style={{ backgroundColor: `${s.c}1f` }}>
                <s.Icon className="w-5 h-5" style={{ color: s.c }} />
              </div>
              <div className="text-xs uppercase font-bold tracking-widest text-[#4B5563]">{s.l}</div>
              <div className="font-display font-black text-3xl mt-1" style={{ color: s.c }}>{s.v}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Top issue + map */}
      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <h2 className="font-display font-black text-3xl md:text-4xl mb-4">Most common issue at this plaza</h2>
            <div className="bg-white border-2 border-[#DC2626] rounded-2xl p-6 shadow-[5px_5px_0_#DC2626]">
              <div className="text-xs uppercase font-bold tracking-widest text-[#DC2626]">Top complaint</div>
              <div className="font-display font-bold text-2xl mt-2">{plaza.topIssue}</div>
              <p className="text-[#4B5563] mt-3">
                Of <strong>{(plaza.monthlyComplaints || 0).toLocaleString("en-IN")}</strong> issues reported here this month, the majority are tied to <em>{plaza.topIssue?.toLowerCase()}</em>. Our local Sathis are trained specifically on this plaza's escalation paths with NHAI and the issuing banks.
              </p>
              <Link to="/find" onClick={() => track("plaza_ping_sathi", { plaza: plaza.slug })} className="mt-5 inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-full shadow-[0_4px_0_#0A0A0A]">
                Ping a Sathi at {plaza.name} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="md:col-span-5">
            <MapView
              center={{ lat: plaza.lat, lng: plaza.lng }}
              plazas={[plaza]}
              height={420}
            />
            <p className="text-xs text-[#4B5563] mt-2 flex items-center gap-1">
              <MapPin className="w-3 h-3" />{plaza.lat?.toFixed(3)}°N, {plaza.lng?.toFixed(3)}°E · {plaza.highway}
            </p>
          </div>
        </div>
      </section>

      {/* Nearby plazas */}
      {nearby.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
            <h2 className="font-display font-black text-2xl md:text-3xl mb-6">Nearby plazas in {state?.name}</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {nearby.map((p) => (
                <Link key={p.slug} to={`/toll/${p.slug}`} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                  <div className="text-xs font-bold uppercase tracking-widest text-[#FF6B00]">{p.highway}</div>
                  <div className="font-display font-bold text-lg mt-1">{p.name}</div>
                  <div className="text-sm text-[#4B5563]">{p.city}</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <PageCTA note={`Free to install. Pay only when an issue at ${plaza.name} is fixed.`} />
    </>
  );
}
