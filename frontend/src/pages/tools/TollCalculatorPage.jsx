import React, { useEffect, useMemo, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { webAppSchema } from "@/components/seo/SEO";
import { PLAZAS } from "@/data/seed";
import { Calculator, IndianRupee } from "lucide-react";
import { track } from "@/lib/analytics";

const CLASSES = [
  { id: "car", label: "Car / Jeep / Van", rateKey: "carRate" },
  { id: "lcv", label: "LCV / Mini-bus", rateKey: "carRate", mult: 1.6 },
  { id: "truck", label: "Truck / Bus", rateKey: "truckRate" },
  { id: "axle3", label: "3-axle commercial", rateKey: "truckRate", mult: 1.4 },
];

export default function TollCalculatorPage() {
  const [selected, setSelected] = useState([PLAZAS[0].slug, PLAZAS[2].slug]);
  const [klass, setKlass] = useState("car");
  useEffect(() => { track("page_view", { page: "tool_toll_calculator" }); }, []);

  const total = useMemo(() => {
    const cls = CLASSES.find((c) => c.id === klass);
    return selected.reduce((sum, slug) => {
      const p = PLAZAS.find((x) => x.slug === slug);
      if (!p) return sum;
      const base = p[cls.rateKey];
      return sum + Math.round(base * (cls.mult || 1));
    }, 0);
  }, [selected, klass]);

  const toggle = (slug) => {
    setSelected((s) => (s.includes(slug) ? s.filter((x) => x !== slug) : [...s, slug]));
    track("toll_calc_change", { plazas: selected.length, klass });
  };

  return (
    <>
      <SEO
        title="Toll calculator India — estimate your trip toll across NH-48, NH-44, NH-19"
        description="Estimate total toll charges for any route in India. Pick plazas, choose vehicle class (car / LCV / truck / 3-axle), get instant total."
        path="/tools/toll-calculator"
        keywords="toll calculator india, toll charges, nh48 toll calculator, mumbai pune toll cost, fastag toll calculator"
        jsonLd={webAppSchema({
          name: "Toll Calculator",
          description: "Free trip toll estimator for India's national highways.",
          url: "https://www.apnafastag.com/tools/toll-calculator",
        })}
      />
      <PageHero
        eyebrow="Free tool"
        title={<>Toll <span className="text-[#FF6B00]">calculator</span></>}
        sub="Estimate your total trip toll across India's highways. Pick the plazas you'll cross, choose your vehicle class, get the number."
        breadcrumb={[{ label: "Tools", to: "/" }, { label: "Toll calculator" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">Vehicle class</label>
            <div className="flex flex-wrap gap-2 mb-6">
              {CLASSES.map((c) => (
                <button key={c.id} onClick={() => setKlass(c.id)} data-testid={`class-${c.id}`} className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${klass === c.id ? "bg-[#0A0A0A] text-white border-[#0A0A0A]" : "bg-white text-[#0A0A0A] border-[#E5E7EB] hover:border-[#0A0A0A]"}`}>{c.label}</button>
              ))}
            </div>

            <label className="block text-sm font-semibold mb-2">Select plazas on your route</label>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {PLAZAS.map((p) => {
                const on = selected.includes(p.slug);
                return (
                  <button key={p.slug} onClick={() => toggle(p.slug)} data-testid={`toll-plaza-${p.slug}`} className={`w-full flex items-center justify-between border-2 rounded-2xl p-4 text-left transition-colors ${on ? "bg-[#FF6B00] text-white border-[#FF6B00]" : "bg-[#F8F9FA] border-[#E5E7EB] hover:border-[#0A0A0A]"}`}>
                    <div>
                      <div className="font-display font-bold">{p.name}</div>
                      <div className={`text-xs ${on ? "text-white/80" : "text-[#4B5563]"}`}>{p.highway} · {p.city}</div>
                    </div>
                    <div className="text-sm font-bold">{on ? "✓ added" : "+ add"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-1">
            <div className="bg-[#0A0A0A] text-white rounded-3xl p-7 sticky top-28">
              <Calculator className="w-7 h-7 text-[#FFD60A] mb-3" />
              <div className="text-xs uppercase tracking-widest text-[#FFD60A] font-bold">Estimated total</div>
              <div className="flex items-baseline gap-1 mt-2">
                <IndianRupee className="w-7 h-7 text-[#FF6B00]" />
                <span data-testid="toll-total" className="font-display font-black text-5xl">{total.toLocaleString("en-IN")}</span>
              </div>
              <div className="text-xs text-white/60 mt-2">Across {selected.length} toll plaza{selected.length !== 1 ? "s" : ""}.</div>
              <p className="text-xs text-white/50 mt-4">Demo calculation. Production wires to NHAI's official rate API.</p>
            </div>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
