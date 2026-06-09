import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import SEO, { orgSchema } from "@/components/seo/SEO";
import { MapPin, Search, Compass, AlertCircle, Star, BadgeCheck, ArrowRight, Milestone, Siren } from "lucide-react";
import { motion } from "framer-motion";
import MapView from "@/components/map/MapView";
import useGeolocation from "@/hooks/useGeolocation";
import { SATHIS } from "@/data/sathis";
import { PLAZAS } from "@/data/seed";
import { haversineKm, formatDistance } from "@/lib/geo";
import { track } from "@/lib/analytics";
import { sathiApi, plazaApi } from "@/lib/api";

const BACKEND = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000";
const fullUrl = (url) => { if (!url) return ""; if (url.startsWith("http") || url.startsWith("data:")) return url; if (BACKEND.includes("localhost") && !window.location.hostname.includes("localhost")) return ""; return `${BACKEND}${url}`; };

const CITY_FALLBACKS = [
  { label: "Mumbai",    lat: 19.07, lng: 72.87 },
  { label: "Pune",      lat: 18.52, lng: 73.85 },
  { label: "Delhi",     lat: 28.61, lng: 77.21 },
  { label: "Bengaluru", lat: 12.97, lng: 77.59 },
  { label: "Chennai",   lat: 13.08, lng: 80.27 },
  { label: "Vadodara",  lat: 22.31, lng: 73.18 },
];

export default function FindSathiPage() {
  const [searchParams] = useSearchParams();
  const isSOS = searchParams.get("sos") === "1";
  const geo = useGeolocation();
  const [tab, setTab] = useState("sathi");
  const [allSathis, setAllSathis] = useState(SATHIS);
  const [allPlazas, setAllPlazas] = useState(PLAZAS);

  useEffect(() => {
    track("page_view", { page: "find_sathi" });
    sathiApi.list()
      .then((r) => { if (r.data?.length) setAllSathis(r.data); })
      .catch(() => {});
    plazaApi.list()
      .then((r) => { if (r.data?.length) setAllPlazas(r.data); })
      .catch(() => {});
  }, []);

  const center = geo.coords;

  const nearbySathis = center
    ? allSathis
        .map((s) => ({ ...s, distKm: haversineKm(center.lat, center.lng, s.lat, s.lng) }))
        .filter((s) => s.distKm <= 50)
        .sort((a, b) => a.distKm - b.distKm)
    : [];

  const nearbyPlazas = center
    ? allPlazas
        .map((p) => ({ ...p, distKm: haversineKm(center.lat, center.lng, p.lat, p.lng) }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 6)
    : [];

  return (
    <>
      <SEO
        title="Find a Sathi near you"
        description="See verified Fastag Sathis around your location on a live map. Pick by plaza or directly by agent. Login with mobile OTP to start contacting."
        path="/find"
        jsonLd={[
          orgSchema,
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: "https://apnafastag.com",
            potentialAction: {
              "@type": "SearchAction",
              target: { "@type": "EntryPoint", urlTemplate: "https://apnafastag.com/find?q={search_term_string}" },
              "query-input": "required name=search_term_string",
            },
          },
        ]}
      />

      <PageHero
        eyebrow={isSOS ? "🚨 Emergency" : "Live"}
        title={isSOS
          ? <><span className="text-[#DC2626]">SOS —</span> Sathi on the way.</>
          : <>Find a <span className="text-[#FF6B00]">Sathi near you.</span></>
        }
        sub={isSOS
          ? "Share your location below and we'll connect you with the nearest available Sathi immediately. Average response: under 90 seconds."
          : "We use your phone's GPS to show verified Sathis and toll plazas within 25 km. Pick by plaza or tap any Sathi marker."
        }
        breadcrumb={[{ label: isSOS ? "SOS" : "Find a Sathi" }]}
      />

      {isSOS && (
        <div className="bg-[#DC2626] text-white px-6 py-3 flex items-center justify-center gap-3 text-sm font-bold">
          <Siren className="w-4 h-4 animate-pulse flex-shrink-0" />
          SOS mode active — nearest available Sathis shown first
          <Siren className="w-4 h-4 animate-pulse flex-shrink-0" />
        </div>
      )}

      <section className="py-12 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">

          {!center && <LocationGate state={geo} fallbacks={CITY_FALLBACKS} />}

          {center && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 lg:sticky lg:top-24 self-start">
                <MapView
                  center={center}
                  userPos={center}
                  sathis={nearbySathis}
                  plazas={nearbyPlazas}
                  radiusKm={25}
                  height={560}
                  onSathiClick={(s) => track("map_sathi_pin_click", { slug: s.slug })}
                  onPlazaClick={(p) => track("map_plaza_pin_click", { slug: p.slug })}
                />
                <p className="text-xs text-[#4B5563] mt-3 flex items-center gap-2">
                  <Compass className="w-3 h-3" />
                  Centered on <strong className="text-[#0A0A0A] ml-1">{center.label || `${center.lat.toFixed(3)}°N, ${center.lng.toFixed(3)}°E`}</strong>
                </p>
              </div>

              <div className="lg:col-span-5">
                <div className="flex bg-white border-2 border-[#0A0A0A] rounded-full p-1 w-fit mb-5">
                  {[
                    { id: "sathi", label: "Nearby Sathis" },
                    { id: "plaza", label: "Toll Plazas" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setTab(t.id); track("find_tab_switch", { tab: t.id }); }}
                      data-testid={`find-tab-${t.id}`}
                      className={`px-4 py-2 text-sm font-bold rounded-full transition-all ${tab === t.id ? "bg-[#0A0A0A] text-white" : "text-[#4B5563]"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tab === "sathi" ? (
                  <div className="space-y-3" data-testid="sathi-results">
                    {nearbySathis.length === 0
                      ? <div className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-8 text-center text-[#4B5563]">
                          <MapPin className="w-8 h-8 mx-auto mb-2 text-[#E5E7EB]" />
                          <p className="font-bold text-[#0A0A0A]">No Sathis within 50 km</p>
                          <p className="text-sm mt-1">We're expanding coverage — check back soon.</p>
                        </div>
                      : nearbySathis.map((s) => <SathiCard key={s.slug} s={s} />)
                    }
                  </div>
                ) : (
                  <div className="space-y-3" data-testid="plaza-results">
                    {nearbyPlazas.map((p) => <PlazaCard key={p.slug} p={p} />)}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </section>
    </>
  );
}

function LocationGate({ state, fallbacks }) {
  return (
    <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-8 md:p-12 shadow-[8px_8px_0_#FF6B00] max-w-3xl mx-auto text-center">
      <div className="w-16 h-16 rounded-full bg-[#FF6B00]/15 flex items-center justify-center mx-auto mb-4">
        <MapPin className="w-8 h-8 text-[#FF6B00]" />
      </div>
      <h2 className="font-display font-black text-3xl md:text-4xl">Where are you right now?</h2>
      <p className="text-[#4B5563] mt-2 max-w-md mx-auto">Share your location once — we'll find the nearest verified Sathis and toll plazas.</p>

      {state.status === "denied" && (
        <div className="mt-4 mx-auto max-w-md bg-[#FEF2F2] border border-[#DC2626] text-[#DC2626] text-sm rounded-2xl p-4 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span><strong>Location denied.</strong> No problem — pick your city below to continue.</span>
        </div>
      )}

      <button
        onClick={state.request}
        data-testid="find-share-location"
        disabled={state.status === "prompting"}
        className="mt-6 inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-7 py-4 rounded-full shadow-[0_5px_0_#0A0A0A] hover:-translate-y-0.5 transition-transform disabled:opacity-60"
      >
        <Compass className="w-5 h-5" />
        {state.status === "prompting" ? "Locating you…" : "Share my location"}
      </button>

      <div className="mt-8">
        <div className="text-xs uppercase tracking-widest text-[#4B5563] font-bold mb-3">Or pick a city</div>
        <div className="flex flex-wrap gap-2 justify-center">
          {fallbacks.map((f) => (
            <button
              key={f.label}
              data-testid={`find-fallback-${f.label.toLowerCase()}`}
              onClick={() => { state.setFallback(f.lat, f.lng, f.label); track("find_city_fallback", { city: f.label }); }}
              className="px-4 py-2 bg-white border-2 border-[#E5E7EB] hover:border-[#0A0A0A] rounded-full text-sm font-bold"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SathiCard({ s }) {
  return (
    <Link
      to={`/sathi/${s.slug}`}
      data-testid={`sathi-result-${s.slug}`}
      onClick={() => track("find_sathi_card_click", { slug: s.slug })}
      className="group block bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 hover:-translate-y-1 transition-transform shadow-[4px_4px_0_#0A0A0A] hover:shadow-[6px_6px_0_#FF6B00]"
    >
      <div className="flex items-center gap-4">
        {/* Avatar — use relative container + absolute img so flex never squishes it */}
        <div className="w-14 h-14 rounded-full border-2 border-[#0A0A0A] flex-shrink-0 bg-[#FF6B00]/20 relative overflow-hidden">
          {fullUrl(s.avatar) ? (
            <img
              src={fullUrl(s.avatar)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover block"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
          ) : null}
          <div className="absolute inset-0 flex items-center justify-center font-display font-black text-xl text-[#FF6B00]"
            style={{ display: fullUrl(s.avatar) ? "none" : "flex" }}>
            {(s.name || "S")[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display font-bold text-lg text-[#0A0A0A]">{s.name}</h3>
            {s.verified && <BadgeCheck className="w-4 h-4 text-[#059669]" />}
            {s.premium && <span className="text-[9px] font-black uppercase tracking-widest bg-[#FF6B00] text-white px-1.5 py-0.5 rounded">Pro</span>}
          </div>
          <div className="text-xs text-[#4B5563] flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-[#F59E0B] text-[#F59E0B]" />{s.rating} · {s.reviewCount}</span>
            <span>{s.jobsResolved} jobs</span>
          </div>
          <div className="text-xs text-[#4B5563] mt-1">{s.languages.slice(0, 3).join(" · ")}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-black text-lg text-[#FF6B00]">{formatDistance(s.distKm)}</div>
          <div className="text-xs text-[#4B5563]">away</div>
          <ArrowRight className="w-4 h-4 mt-1 text-[#0A0A0A] group-hover:translate-x-1 transition-transform inline-block" />
        </div>
      </div>
    </Link>
  );
}

function PlazaCard({ p }) {
  return (
    <Link
      to={`/toll/${p.slug}`}
      data-testid={`plaza-result-${p.slug}`}
      onClick={() => track("find_plaza_card_click", { slug: p.slug })}
      className="group block bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 hover:-translate-y-1 transition-transform shadow-[4px_4px_0_#FFD60A]"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#FFD60A] border-2 border-[#0A0A0A] flex items-center justify-center flex-shrink-0">
          <Milestone className="w-7 h-7 text-[#0A0A0A]" strokeWidth={2.5} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-[#0A0A0A]">{p.name}</h3>
          <div className="text-xs text-[#4B5563]">{p.highway} · {p.city}</div>
          <div className="text-xs text-[#4B5563] mt-1">Car ₹{p.carRate} · Truck ₹{p.truckRate}</div>
        </div>
        <div className="text-right">
          <div className="font-display font-black text-lg text-[#FF6B00]">{formatDistance(p.distKm)}</div>
          <div className="text-xs text-[#4B5563]">away</div>
        </div>
      </div>
    </Link>
  );
}
