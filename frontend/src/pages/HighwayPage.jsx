import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import SEO, { breadcrumbSchema, faqSchema } from "@/components/seo/SEO";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import { HIGHWAYS, PLAZAS } from "@/data/seed";
import { MapPin, Route, AlertCircle, ChevronRight, Clock } from "lucide-react";
import { track } from "@/lib/analytics";

export default function HighwayPage() {
  const { highwaySlug } = useParams();
  const highway = HIGHWAYS.find((h) => h.slug === highwaySlug);
  const plazas = PLAZAS.filter(
    (p) => p.highway && p.highway.toLowerCase().replace(/-/g, "") === (highway?.name || "").toLowerCase().replace(/-/g, "")
  );

  useEffect(() => {
    if (highway) track("highway_view", { highway: highway.slug });
  }, [highway]);

  if (!highway)
    return (
      <section className="pt-40 pb-32 text-center">
        <h1 className="font-display font-black text-4xl">Highway not found</h1>
        <Link to="/coverage" className="mt-6 inline-block text-[#FF6B00] font-bold">
          ← View all coverage
        </Link>
      </section>
    );

  const faqs = [
    { q: `How many toll plazas are on ${highway.name}?`, a: `${highway.name} (${highway.fullName}) has approximately ${highway.plazaCount} toll plazas. ApnaFastag has Sathis active at the busiest plazas on this corridor.` },
    { q: `What FASTag issues are most common on ${highway.name}?`, a: `Mischarge (double deduction), FASTag not scanning, blacklisted tags, and KYC pending are the top 4 issues reported on ${highway.name}. Sathis resolve most of these in under 8 minutes.` },
    { q: `How long is ${highway.name}?`, a: `${highway.fullName} spans ${highway.length}, passing through ${highway.states.join(", ")}.` },
    { q: `Can I get help on ${highway.name} at night?`, a: `Yes. ApnaFastag Sathis at ${highway.name} toll plazas are available 24×7. Ping a Sathi through the app and they respond within 90 seconds.` },
  ];

  return (
    <>
      <SEO
        title={`${highway.name} Toll Plazas — FASTag help, rates & Sathi rescue`}
        description={`Complete guide to ${highway.name} toll plazas: rates, FASTag dispute help, and on-spot Sathi rescue. ${highway.desc}`}
        path={`/highway/${highway.slug}`}
        keywords={`${highway.name} toll plaza, ${highway.name} toll rates, ${highway.name} fastag dispute, ${highway.name} fastag help`}
        jsonLd={[
          breadcrumbSchema([
            { label: "Coverage", url: "/coverage" },
            { label: highway.name, url: `/highway/${highway.slug}` },
          ]),
          faqSchema(faqs),
        ]}
      />

      <PageHero
        eyebrow="National Highway"
        title={
          <>
            {highway.name} <span className="text-[#FF6B00]">toll guide</span>
          </>
        }
        sub={highway.desc + " ApnaFastag has verified Sathis at the busiest plazas along this corridor."}
        breadcrumb={[
          { label: "Coverage", to: "/coverage" },
          { label: highway.name },
        ]}
      />

      {/* Stats bar */}
      <section className="py-10 bg-[#F8F9FA] border-b-2 border-[#0A0A0A]">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { label: "Total length", value: highway.length },
            { label: "Toll plazas", value: highway.plazaCount },
            { label: "States covered", value: highway.states.length },
            { label: "Avg resolution", value: "< 8 min" },
          ].map((s) => (
            <div key={s.label}>
              <div className="font-display font-black text-3xl text-[#FF6B00]">{s.value}</div>
              <div className="text-xs text-[#6B7280] mt-1 font-medium uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* States covered */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-6">
            States on <span className="text-[#FF6B00]">{highway.name}</span>
          </h2>
          <div className="flex flex-wrap gap-3">
            {highway.states.map((st) => (
              <span
                key={st}
                className="inline-flex items-center gap-1.5 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-full px-4 py-2 text-sm font-bold"
              >
                <MapPin className="w-3.5 h-3.5 text-[#FF6B00]" />
                {st}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Active Sathi plazas */}
      {plazas.length > 0 && (
        <section className="py-14 bg-[#F8F9FA]">
          <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
            <h2 className="font-display font-black text-2xl md:text-3xl mb-2">
              Active plazas on <span className="text-[#FF6B00]">{highway.name}</span>
            </h2>
            <p className="text-[#4B5563] mb-8 text-sm">Sathis stationed and verified at these toll plazas</p>
            <div className="grid md:grid-cols-2 gap-4">
              {plazas.map((p) => (
                <Link
                  key={p.slug}
                  to={`/toll/${p.slug}`}
                  className="flex items-center justify-between bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 hover:border-[#FF6B00] transition-colors group"
                >
                  <div>
                    <div className="font-bold text-[#0A0A0A]">{p.name}</div>
                    <div className="text-xs text-[#6B7280] mt-0.5">
                      {p.city} · Car ₹{p.carRate} · Truck ₹{p.truckRate}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#6B7280] group-hover:text-[#FF6B00] transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Common FASTag issues */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-8">
            Common FASTag issues on <span className="text-[#FF6B00]">{highway.name}</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { issue: "Mischarge / double deduction", link: "fastag-mischarge-timeline" },
              { issue: "FASTag blacklisted", link: "fastag-hotlisted" },
              { issue: "Tag not scanning at plaza", link: "fastag-not-scanned" },
              { issue: "KYC pending / incomplete", link: "fastag-pan-aadhaar-link" },
              { issue: "Recharge not reflecting", link: "fastag-upi-recharge" },
              { issue: "RC / vehicle mismatch", link: "fastag-rc-linkage" },
            ].map((item) => (
              <Link
                key={item.issue}
                to={`/help/${item.link}`}
                className="flex items-start gap-3 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-4 hover:border-[#FF6B00] transition-colors group"
              >
                <AlertCircle className="w-5 h-5 text-[#FF6B00] flex-shrink-0 mt-0.5" />
                <span className="text-sm font-semibold text-[#0A0A0A] group-hover:text-[#FF6B00] transition-colors">{item.issue}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 bg-[#F8F9FA]">
        <div className="max-w-3xl mx-auto px-6 md:px-10">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-8">
            Frequently asked — <span className="text-[#FF6B00]">{highway.name}</span>
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 group open:border-[#FF6B00]">
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

      {/* CTA */}
      <section className="py-14 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="bg-[#FF6B00] text-white rounded-3xl p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-bold opacity-90">Sathi arrives in 90 seconds</span>
              </div>
              <h3 className="font-display font-black text-2xl md:text-3xl">Stuck at a {highway.name} toll?</h3>
              <p className="mt-2 text-white/90 max-w-md">A verified Sathi at your plaza resolves FASTag issues on-spot — usually in under 8 minutes. Pay only if fixed.</p>
            </div>
            <div className="flex flex-col gap-3 flex-shrink-0">
              <Link to="/find" className="bg-[#0A0A0A] text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-[#1a1a1a] transition-colors">
                Ping a Sathi now
              </Link>
              <Link to="/become-a-sathi" className="bg-white/20 text-white font-bold px-8 py-3.5 rounded-full text-center whitespace-nowrap hover:bg-white/30 transition-colors border border-white/30">
                Become a Sathi on {highway.name}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
