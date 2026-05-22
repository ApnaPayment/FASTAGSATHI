import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Download, ExternalLink } from "lucide-react";
import { track } from "@/lib/analytics";

const ASSETS = [
  { name: "Logo pack (SVG + PNG)", size: "1.4 MB" },
  { name: "Brand guidelines (PDF)", size: "3.8 MB" },
  { name: "Founder photos (4)", size: "12 MB" },
  { name: "Hero screenshots (12)", size: "28 MB" },
];

const MENTIONS = [
  { src: "Economic Times",     headline: "ApnaFastag's peer-rescue model takes on NHAI's toll chaos", date: "Dec 2025" },
  { src: "YourStory",          headline: "Pune startup turns toll vendors into ₹40k-a-month rescuers", date: "Nov 2025" },
  { src: "Inc42",              headline: "Why every truck driver has Khalapur's Sathi on speed-dial", date: "Oct 2025" },
];

export default function PressPage() {
  useEffect(() => { track("page_view", { page: "press" }); }, []);
  return (
    <>
      <SEO
        title="Press kit — logos, founder photos, brand assets · ApnaFastag"
        description="Everything journalists need to write about ApnaFastag — logos, founder photos, screenshots, brand guidelines, and recent coverage."
        path="/press"
      />
      <PageHero
        eyebrow="Press kit"
        title={<>Writing about <span className="text-[#FF6B00]">ApnaFastag</span>?</>}
        sub="Logos, founder photos, screenshots, brand guidelines and quick facts — all in one place."
        breadcrumb={[{ label: "Press" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-2xl md:text-3xl mb-6">Downloadable assets</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ASSETS.map((a) => (
              <a key={a.name} href="#" className="flex items-center justify-between bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div>
                  <div className="font-display font-bold">{a.name}</div>
                  <div className="text-xs text-[#4B5563]">{a.size}</div>
                </div>
                <Download className="w-5 h-5 text-[#FF6B00]" />
              </a>
            ))}
          </div>

          <h2 className="font-display font-black text-2xl md:text-3xl mt-14 mb-6">Recent coverage</h2>
          <div className="space-y-3">
            {MENTIONS.map((m) => (
              <a key={m.headline} href="#" className="flex items-center justify-between bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 hover:bg-[#0A0A0A] hover:text-white transition-colors group">
                <div>
                  <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold">{m.src} · {m.date}</div>
                  <div className="font-display font-bold mt-1">{m.headline}</div>
                </div>
                <ExternalLink className="w-5 h-5 text-[#FF6B00] group-hover:text-white" />
              </a>
            ))}
          </div>

          <div className="mt-14 bg-[#0A0A0A] text-white rounded-3xl p-7">
            <h3 className="font-display font-black text-2xl">Press contact</h3>
            <p className="text-white/70 mt-2">Anjali Singh · <a className="text-[#FFD60A] underline" href="mailto:press@apnafastag.in">press@apnafastag.in</a></p>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
