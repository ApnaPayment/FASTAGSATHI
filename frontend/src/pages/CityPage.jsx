import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO, { breadcrumbSchema, faqSchema, localBusinessSchema } from "@/components/seo/SEO";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import { CITIES, PLAZAS } from "@/data/seed";
import { citiesApi } from "@/lib/api";
import { MapPin, Users, AlertCircle, ChevronRight, Clock, Zap } from "lucide-react";
import { track } from "@/lib/analytics";

// ── Loading skeleton ──────────────────────────────────────────────────────────
function CityPageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="pt-40 pb-20 bg-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-4 w-32 bg-white/20 rounded mb-4" />
          <div className="h-12 w-80 bg-white/30 rounded mb-4" />
          <div className="h-5 w-96 bg-white/20 rounded" />
        </div>
      </div>
      <div className="py-10 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CityPage() {
  const { citySlug } = useParams();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [nearbyCities, setNearbyCities] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await citiesApi.get(citySlug);
        if (!cancelled) {
          setCity(res.data);
          // Fetch nearby cities from same state
          try {
            const stateRes = await citiesApi.list({ state: res.data.state, limit: 12 });
            const others = (stateRes.data || []).filter(c => c.slug !== citySlug).slice(0, 6);
            setNearbyCities(others);
          } catch (_) {}
        }
      } catch (_) {
        // Fallback to seed.js
        if (!cancelled) {
          const seed = CITIES.find(c => c.slug === citySlug);
          setCity(seed || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [citySlug]);

  useEffect(() => {
    if (city) track("city_view", { city: city.slug });
  }, [city]);

  if (loading) return <CityPageSkeleton />;

  if (!city)
    return (
      <section className="pt-40 pb-32 text-center">
        <h1 className="font-display font-black text-4xl">City not found</h1>
        <Link to="/coverage" className="mt-6 inline-block text-[#FF6B00] font-bold">
          ← View all coverage
        </Link>
      </section>
    );

  // Plazas from seed data (fast — no extra API call)
  const plazas = PLAZAS.filter(
    (p) => p.city && p.city.toLowerCase() === (city.name || "").toLowerCase()
  );

  const hasActiveSathis = (city.sathiCount || 0) > 0;
  const highways = city.nearby_highways || [];

  // FAQs — prefer API-provided faq_pairs, else generate template FAQs
  const faqs = (city.faq_pairs && city.faq_pairs.length > 0)
    ? city.faq_pairs.map(p => ({ q: p.q, a: p.a }))
    : [
        { q: `How many FASTag Sathis are in ${city.name}?`, a: `ApnaFastag currently has ${city.sathiCount || 0} verified Sathis across ${city.plazaCount || 0} toll plazas in and around ${city.name}. Coverage is expanding rapidly.` },
        { q: `Which toll plazas in ${city.name} have Sathis?`, a: `Sathis are stationed at the busiest toll plazas near ${city.name}. Use the Find a Sathi feature to see who's available at your specific plaza right now.` },
        { q: `What FASTag problems can a Sathi fix in ${city.name}?`, a: `Sathis in ${city.name} resolve FASTag mischarges, blacklisted tags, KYC pending, RC mismatch, recharge failures, and double deductions — usually in under 8 minutes.` },
        { q: `How do I find a Sathi at a ${city.name} toll plaza?`, a: `Open ApnaFastag, tap "Find a Sathi", select your toll plaza near ${city.name}, and a verified Sathi will respond within 90 seconds.` },
      ];

  // SEO description — prefer AI-generated
  const metaDesc = city.meta_description ||
    `${city.sathiCount || 0} verified Sathis across ${city.plazaCount || 0} toll plazas in ${city.name}. FASTag dispute, blacklist fix, KYC update — resolved on-spot in under 8 minutes.`;

  const stateName = city.state ? city.state.charAt(0).toUpperCase() + city.state.slice(1) : "";

  return (
    <>
      <SEO
        title={`FASTag help in ${city.name} — Sathis at ${city.plazaCount || 0} toll plazas`}
        description={metaDesc}
        path={`/city/${city.slug}`}
        keywords={`fastag help ${city.name}, fastag dispute ${city.name}, fastag blacklist fix ${city.name}, toll plaza ${city.name} sathi`}
        jsonLd={[
          breadcrumbSchema([
            { label: "Coverage", url: "/coverage" },
            { label: city.name, url: `/city/${city.slug}` },
          ]),
          faqSchema(faqs),
          localBusinessSchema && localBusinessSchema({
            name: `ApnaFastag — ${city.name}`,
            description: metaDesc,
            url: `/city/${city.slug}`,
            city: city.name,
            state: stateName,
            lat: city.lat,
            lng: city.lng,
          }),
        ].filter(Boolean)}
      />

      <PageHero
        eyebrow={stateName || city.state}
        title={
          <>
            FASTag help in <span className="text-[#FF6B00]">{city.name}</span>
          </>
        }
        sub={
          <>
            {hasActiveSathis
              ? `${city.sathiCount} verified Sathis across ${city.plazaCount || 0} toll plazas in ${city.name}. Stuck at a toll? Your Sathi arrives in 90 seconds.`
              : `We're expanding to ${city.name} soon. Be the first Sathi in this city.`
            }
            {highways.length > 0 && (
              <span className="mt-3 flex flex-wrap gap-2">
                {highways.map(h => (
                  <span key={h} className="inline-flex items-center gap-1 text-xs font-bold bg-white/10 border border-white/20 rounded-full px-2.5 py-1 text-white">
                    <MapPin className="w-3 h-3" /> {h}
                  </span>
                ))}
              </span>
            )}
          </>
        }
        breadcrumb={[
          { label: "Coverage", to: "/coverage" },
          ...(city.state ? [{ label: stateName, to: `/state/${city.state}` }] : []),
          { label: city.name },
        ]}
      />

      {/* Stats */}
      <section className="py-10 bg-[#F8F9FA] border-b-2 border-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Active Sathis", value: hasActiveSathis ? city.sathiCount : <span className="text-sm font-bold text-[#9CA3AF]">Coming soon</span> },
            { label: "Toll plazas covered", value: city.plazaCount || 0 },
            { label: "Avg Sathi response", value: "90 sec" },
            { label: "Avg issue resolution", value: "< 8 min" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display font-black text-3xl text-[#FF6B00]">{s.value}</div>
              <div className="text-xs text-[#6B7280] mt-1 font-medium uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* AI-generated content body */}
      {city.content_body && (
        <section className="py-14 bg-white">
          <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-12">
            <div
              className="prose prose-slate max-w-none prose-headings:font-display prose-headings:font-black prose-h2:text-2xl prose-h2:text-[#0A0A0A] prose-p:text-[#4B5563] prose-li:text-[#4B5563]"
              dangerouslySetInnerHTML={{ __html: city.content_body }}
            />
          </div>
        </section>
      )}

      {/* Plaza list */}
      {plazas.length > 0 && (
        <section className="py-14 bg-white">
          <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
            <h2 className="font-display font-black text-2xl md:text-3xl mb-2">
              Toll plazas in <span className="text-[#FF6B00]">{city.name}</span>
            </h2>
            <p className="text-[#4B5563] mb-8 text-sm">Verified Sathis stationed and available 24×7</p>
            <div className="grid md:grid-cols-2 gap-4">
              {plazas.map((p) => (
                <Link
                  key={p.slug}
                  to={`/toll/${p.slug}`}
                  className="flex items-center justify-between bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-5 hover:border-[#FF6B00] transition-colors group"
                >
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{p.name}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {p.highway} · Car ₹{p.carRate} · Truck ₹{p.truckRate}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#FF6B00] transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common issues */}
      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-8">
            FASTag issues Sathis fix in <span className="text-[#FF6B00]">{city.name}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { issue: "Mischarge & double deduction refund", link: "fastag-mischarge-timeline" },
              { issue: "FASTag blacklisted or hotlisted", link: "fastag-hotlisted" },
              { issue: "FASTag not scanning at boom barrier", link: "fastag-not-scanned" },
              { issue: "KYC pending or incomplete", link: "fastag-pan-aadhaar-link" },
              { issue: "Recharge not reflecting", link: "fastag-upi-recharge" },
              { issue: "RC / vehicle mismatch", link: "fastag-rc-linkage" },
            ].map((item) => (
              <Link
                key={item.issue}
                to={`/help/${item.link}`}
                className="flex items-start gap-3 bg-white border-2 border-[#0A0A0A] rounded-2xl p-4 hover:border-[#FF6B00] transition-colors group"
              >
                <AlertCircle className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-[#0A0A0A] group-hover:text-[#FF6B00] transition-colors">{item.issue}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-8 text-center">
            How to get help at a <span className="text-[#FF6B00]">{city.name}</span> toll
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Ping a Sathi", desc: `Open ApnaFastag, select your toll plaza near ${city.name}, and request help.` },
              { step: "2", title: "Sathi arrives", desc: "A verified local Sathi reaches you at the plaza within 90 seconds." },
              { step: "3", title: "Issue resolved", desc: "Your FASTag issue is fixed on-spot. You pay only after resolution (₹49–₹499)." },
            ].map((s) => (
              <div key={s.step} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6 text-center">
                <div className="w-12 h-12 bg-[#FF6B00] text-white font-display font-black text-xl rounded-full flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                <h3 className="font-bold text-[#0A0A0A] text-lg mb-2">{s.title}</h3>
                <p className="text-[#4B5563] text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby cities */}
      {nearbyCities.length > 0 && (
        <section className="py-12 bg-[#F8F9FA]">
          <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
            <h2 className="font-display font-black text-xl md:text-2xl mb-5">
              Other cities in <span className="text-[#FF6B00]">{stateName}</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {nearbyCities.map(c => (
                <Link
                  key={c.slug}
                  to={`/city/${c.slug}`}
                  className="inline-flex items-center gap-1.5 bg-white border-2 border-[#0A0A0A] rounded-full px-4 py-2 text-sm font-semibold text-[#0A0A0A] hover:border-[#FF6B00] hover:text-[#FF6B00] transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {c.name}
                </Link>
              ))}
              {city.state && (
                <Link
                  to={`/state/${city.state}`}
                  className="inline-flex items-center gap-1.5 bg-[#FF6B00] text-white border-2 border-[#FF6B00] rounded-full px-4 py-2 text-sm font-semibold hover:bg-[#e55f00] transition-colors"
                >
                  All {stateName} cities →
                </Link>
              )}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="py-14 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-8">
            FASTag help in {city.name} — FAQ
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-5 group open:border-[#FF6B00]">
                <summary className="font-bold cursor-pointer list-none flex items-center justify-between gap-3">
                  {faq.q}
                  <ChevronRight className="w-5 h-5 flex-shrink-0 text-[#6B7280] group-open:rotate-90 transition-transform" />
                </summary>
                <p className="mt-3 text-[#4B5563] text-sm leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA block */}
      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          {hasActiveSathis ? (
            <div className="bg-[#FF6B00] text-white rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-sm font-bold opacity-90">{city.sathiCount} Sathis in {city.name}</span>
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl">Stuck at a {city.name} toll?</h3>
                <p className="mt-2 text-white/90 max-w-md">A verified Sathi resolves your FASTag issue on-spot — usually in under 8 minutes. Pay only if fixed.</p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link to="/find" className="bg-[#0A0A0A] text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-[#1a1a1a] transition-colors">
                  Ping a Sathi now
                </Link>
                <Link to="/become-a-sathi" className="bg-white/20 text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-white/30 transition-colors border border-white/30">
                  Become a Sathi in {city.name}
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-[#0A0A0A] text-white rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-[#FF6B00]" />
                  <span className="text-sm font-bold text-[#FF6B00]">Expanding to {city.name}</span>
                </div>
                <h3 className="font-display font-black text-2xl md:text-3xl">Be the first Sathi in {city.name}</h3>
                <p className="mt-2 text-white/80 max-w-md">FASTag issues at toll plazas in {city.name} go unresolved every day. Join as a Sathi and build a business helping motorists.</p>
              </div>
              <div className="flex flex-col gap-3 flex-shrink-0">
                <Link to="/become-a-sathi" className="bg-[#FF6B00] text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-[#e55f00] transition-colors">
                  Become a Sathi in {city.name}
                </Link>
                <Link to="/find" className="bg-white/10 text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-white/20 transition-colors border border-white/20">
                  Explore all Sathis
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      <PageCTA />
    </>
  );
}
