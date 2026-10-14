import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import GUIDES from "@/content/guides.json";

// Guides hub: every guide as a green direction sign, grouped by the problem a driver has.
// server.js renders the same list for crawlers (renderGuidesHub).
export default function GuidesHubPage() {
  const groups = [];
  for (const g of GUIDES) {
    let grp = groups.find((x) => x.name === g.category);
    if (!grp) groups.push((grp = { name: g.category, items: [] }));
    grp.items.push(g);
  }

  return (
    <div data-testid="guides-hub" className="bg-[#F8F9FA]">
      <SEO
        title="FASTag guides — rules, fixes and how-tos checked against NHAI and NPCI"
        description="Plain-language FASTag guides: where to stick the tag, Annual Pass, KYV, blacklisted tags, wrong deductions, replacement, closing a tag and toll rules — checked against official NHAI, NPCI and bank sources."
        path="/guides"
        jsonLd={[
          breadcrumbSchema([{ label: "Home", url: "/" }, { label: "Guides", url: "/guides" }]),
          { "@context": "https://schema.org", "@type": "ItemList", itemListElement: GUIDES.map((g, i) => ({ "@type": "ListItem", position: i + 1, url: `https://apnafastag.com/guides/${g.slug}`, name: g.title })) },
        ]}
      />
      <header className="relative bg-[#161616] pt-28 md:pt-36 pb-14 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-6 road-divider opacity-70"
             style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFD60A 0,#FFD60A 28px,transparent 28px,transparent 52px)" }} />
        <div className="relative max-w-6xl mx-auto px-5 md:px-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-semibold text-white/60 mb-6">
            <Link to="/" className="hover:text-[#FFD60A]">Home</Link><ChevronRight className="w-3 h-3" /><span className="text-white/90">Guides</span>
          </nav>
          <h1 className="font-display font-black text-white text-4xl md:text-6xl tracking-tight leading-[0.98] max-w-3xl" style={{ textWrap: "balance" }}>
            FASTag guides for the road ahead
          </h1>
          <p className="mt-5 text-white/75 text-lg max-w-2xl leading-relaxed">
            What the rules actually say and what to do at the plaza, written plainly. Every guide is checked against NHAI, NPCI and bank sources, and dated.
          </p>
          <p className="mt-6 inline-flex km-sign px-3 py-1 rounded-md text-[11px] font-black uppercase tracking-widest">{GUIDES.length} guides · updated {new Date(GUIDES.map((g) => g.updated).sort().pop() + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 md:px-8 py-12 md:py-16 grid gap-12">
        {groups.map((grp) => (
          <section key={grp.name} className="grid gap-5">
            <h2 className="font-display font-black text-2xl md:text-3xl tracking-tight">{grp.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {grp.items.map((g) => (
                <Link key={g.slug} to={`/guides/${g.slug}`} className="group bg-[#0B6B3A] rounded-2xl p-[5px] hover:-translate-y-1 transition-transform shadow-[0_10px_24px_rgba(11,107,58,0.25)]">
                  <span className="flex flex-col h-full border-[3px] border-white rounded-xl px-5 py-5 text-white">
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-display font-black text-xl leading-snug">{g.short || g.title}</span>
                      <ArrowUpRight className="w-6 h-6 flex-shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                    <span className="mt-3 text-[14.5px] leading-relaxed text-white/80">{g.card}</span>
                    <span className="mt-auto pt-4 text-[12px] font-bold uppercase tracking-widest text-[#FFD60A]">{g.readMins} min read</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <p className="text-[14px] text-[#4B5563]">
          Looking for a specific toll plaza or bank? Browse <Link to="/sitemap" className="underline font-semibold">all toll plazas</Link> or the <Link to="/help" className="underline font-semibold">Help Center</Link>.
        </p>
      </div>
    </div>
  );
}
