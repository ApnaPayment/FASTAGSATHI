import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import api, { stateApi, plazaApi, banksApi, citiesApi, sathiApi } from "@/lib/api";
import GUIDES from "@/content/guides.json";

// Every toll plaza (grouped by state), highway, bank, city and Sathi on one page, so each is
// a click or two from the home page. server.js renders the same links for crawlers.
const TOOLS = [
  ["/tools/fastag-status", "FASTag status check"],
  ["/tools/fastag-balance-check", "FASTag balance check"],
  ["/tools/fastag-recharge", "FASTag recharge"],
  ["/tools/toll-calculator", "Toll calculator"],
  ["/tools/dispute-tracker", "Dispute tracker"],
  ["/buy-fastag", "Buy a FASTag"],
  ["/find", "Find a Sathi near you"],
];
const byName = (a, b) => String(a.name).localeCompare(String(b.name));
const data = (r) => (Array.isArray(r?.data) ? r.data : []);

function Section({ title, children }) {
  return (
    <section className="mb-12">
      <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight mb-5">{title}</h2>
      {children}
    </section>
  );
}

function LinkGrid({ items }) {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2 text-sm">
      {items.map(([to, label, note]) => (
        <li key={to}>
          <Link to={to} className="text-[#0A0A0A] hover:text-[#FF6B00] font-medium">{label}</Link>
          {note && <span className="text-[#6B7280]"> – {note}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function SitemapPage() {
  const [d, setD] = useState(null);

  useEffect(() => {
    Promise.allSettled([
      stateApi.list(), plazaApi.list(), api.get("/api/highways"), banksApi.list(),
      citiesApi.list({ limit: 500 }), sathiApi.list(),
    ]).then(([st, pl, hw, bk, ci, sa]) => {
      const v = (r) => (r.status === "fulfilled" ? r.value : null);
      setD({
        states: data(v(st)), plazas: data(v(pl)), highways: data(v(hw)),
        banks: (v(bk)?.data?.banks || data(v(bk))).filter((b) => b.slug && b.name),
        cities: data(v(ci)), sathis: data(v(sa)).filter((s) => s.verified && s.slug),
      });
    });
  }, []);

  const byState = useMemo(() => {
    const m = new Map();
    for (const p of d?.plazas || []) {
      if (!m.has(p.state)) m.set(p.state, []);
      m.get(p.state).push(p);
    }
    return m;
  }, [d]);

  const count = d?.plazas.length || "";
  return (
    <>
      <SEO
        title={`Sitemap — all ${count ? count + " " : ""}toll plazas, states, highways & FASTag guides · ApnaFastag`}
        description="Every page on ApnaFastag: toll plazas grouped by state, states, national highways, FASTag banks, cities and verified Sathis."
        path="/sitemap"
        jsonLd={[breadcrumbSchema([{ label: "Home", url: "/" }, { label: "Sitemap", url: "/sitemap" }])]}
      />
      <PageHero
        eyebrow="Sitemap"
        title={<>Every toll plaza, state and FASTag guide{count ? <> — <span className="text-[#FF6B00]">{count}</span> plazas</> : null}.</>}
        sub="Pick a state to see its toll plazas, or jump straight to a highway, bank, city or Sathi."
        breadcrumb={[{ label: "Sitemap" }]}
      />
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 py-14">
        {!d ? (
          <p className="text-[#6B7280]">Loading…</p>
        ) : (
          <>
            <Section title="FASTag guides"><LinkGrid items={GUIDES.map((g) => [`/guides/${g.slug}`, g.short || g.title])} /></Section>
            <Section title="Tools"><LinkGrid items={TOOLS} /></Section>
            {d.banks.length > 0 && (
              <Section title="FASTag banks">
                <LinkGrid items={d.banks.slice().sort(byName).map((b) => [`/bank/${b.slug}`, b.name])} />
              </Section>
            )}
            {d.highways.length > 0 && (
              <Section title="National highways">
                <LinkGrid items={d.highways.filter((h) => h.slug).map((h) => [`/highway/${h.slug}`, h.fullName || h.name])} />
              </Section>
            )}
            <Section title="Toll plazas by state">
              {d.states.slice().sort(byName).map((st) => {
                const pl = (byState.get(st.slug) || []).slice().sort(byName);
                return (
                  <div key={st.slug} className="mb-8">
                    <h3 className="font-bold text-lg mb-3">
                      <Link to={`/state/${st.slug}`} className="hover:text-[#FF6B00]">{st.name}</Link>
                      {pl.length > 0 && <span className="text-[#6B7280] font-normal"> ({pl.length})</span>}
                    </h3>
                    <LinkGrid items={pl.map((p) => [`/toll/${p.slug}`, p.name, p.city])} />
                  </div>
                );
              })}
              {(() => {
                // Plazas whose state isn't in the states list (bad data) are still linked.
                const known = new Set(d.states.map((s) => s.slug));
                const rest = d.plazas.filter((p) => !known.has(p.state)).sort(byName);
                return rest.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-lg mb-3">Other toll plazas</h3>
                    <LinkGrid items={rest.map((p) => [`/toll/${p.slug}`, p.name, p.city])} />
                  </div>
                );
              })()}
            </Section>
            {d.cities.length > 0 && (
              <Section title="Cities">
                <LinkGrid items={d.cities.slice().sort(byName).map((c) => [`/city/${c.slug}`, c.name])} />
              </Section>
            )}
            {d.sathis.length > 0 && (
              <Section title="Verified FASTag Sathis">
                <LinkGrid items={d.sathis.slice().sort(byName).map((s) => [`/sathi/${s.slug}`, s.name, s.city])} />
              </Section>
            )}
            <Section title="ApnaFastag">
              <LinkGrid items={[["/coverage", "Coverage"], ["/help", "Help Center"], ["/blog", "Blog"], ["/become-a-sathi", "Become a Sathi"],
                ["/how-it-works", "How it works"], ["/pricing", "Pricing"], ["/about", "About"], ["/contact", "Contact"]]} />
            </Section>
          </>
        )}
      </div>
    </>
  );
}
