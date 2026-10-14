import React from "react";
import { Link, useParams } from "react-router-dom";
import { ChevronRight, ArrowRight, ExternalLink, ShieldCheck, AlertTriangle } from "lucide-react";
import SEO, { breadcrumbSchema, faqSchema } from "@/components/seo/SEO";
import GUIDES from "@/content/guides.json";
import { inline, plain } from "@/lib/guideText";
import NotFoundPage from "@/pages/NotFoundPage";

// One long-form FASTag guide. Visual language: highway signage — a green NH-style
// signboard for the title over an asphalt band, a yellow km-sign "quick answer",
// steps as milestones along a lane line, toll-receipt tips and notice-style rules.
// server.js renders the same content for crawlers (renderGuide).

const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function Block({ b }) {
  switch (b.type) {
    case "p":
      return <p className="text-[17px] leading-[1.75] text-[#1F2937]">{inline(b.text)}</p>;
    case "list":
      return (
        <ul className="grid gap-2.5 pl-1">
          {b.items.map((t, i) => (
            <li key={i} className="flex gap-3 text-[17px] leading-[1.7] text-[#1F2937]">
              <span aria-hidden="true" className="mt-[11px] w-2.5 h-2.5 flex-shrink-0 rotate-45 bg-[#FF6B00]" />
              <span>{inline(t)}</span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="relative grid gap-6 pl-12">
          <span aria-hidden="true" className="absolute left-[17px] top-2 bottom-2 road-divider-vertical" />
          {b.items.map((s, i) => (
            <li key={i} className="relative">
              <span aria-hidden="true" className="absolute -left-12 top-0 w-9 h-11 bg-white border-2 border-[#0A0A0A] rounded-t-[18px] overflow-hidden flex flex-col">
                <span className="h-3.5 bg-[#FF6B00]" />
                <span className="flex-1 grid place-items-center font-display font-black text-sm">{i + 1}</span>
              </span>
              <h4 className="font-display font-bold text-lg leading-snug">{s.title}</h4>
              <p className="mt-1 text-[16px] leading-[1.7] text-[#374151]">{inline(s.text)}</p>
            </li>
          ))}
        </ol>
      );
    case "table":
      return (
        <div className="overflow-x-auto border-2 border-[#0A0A0A] rounded-xl bg-white">
          <table className={`w-full text-[15px] ${b.head.length > 2 ? "min-w-[560px]" : ""}`}>
            <thead>
              <tr className="bg-[#0A0A0A] text-white">
                {b.head.map((h, i) => <th key={i} className="text-left font-display font-bold px-4 py-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i} className="border-t border-[#E5E7EB] align-top">
                  {r.map((c, j) => <td key={j} className={`px-4 py-3 ${j === 0 ? "font-semibold text-[#0A0A0A]" : "text-[#374151]"}`}>{inline(c)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          {b.note && <p className="px-4 py-2.5 text-[13px] text-[#4B5563] border-t border-[#E5E7EB] bg-[#F8F9FA]">{inline(b.note)}</p>}
        </div>
      );
    case "plaza":
      return (
        <aside className="guide-receipt relative bg-white border-x-2 border-[#0A0A0A] px-5 py-5 font-mono text-[14.5px] leading-relaxed text-[#1F2937]">
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#4B5563] border-b border-dashed border-[#9CA3AF] pb-2 mb-3">At the toll plaza · {b.title}</p>
          <p>{inline(b.text)}</p>
        </aside>
      );
    case "rule":
      return (
        <aside className="relative bg-[#EFF6F1] border-l-[6px] border-[#0B6B3A] rounded-r-xl px-5 py-4">
          <p className="flex items-center gap-2 text-[11px] font-black tracking-[0.18em] uppercase text-[#0B6B3A]"><ShieldCheck className="w-4 h-4" /> Official rule</p>
          <p className="mt-1.5 text-[16px] leading-[1.7] text-[#123524]">{inline(b.text)}</p>
          {b.source && (
            <a href={b.source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0B6B3A] underline underline-offset-2">
              {b.source.title} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </aside>
      );
    case "warn":
      return (
        <aside className="flex gap-3 bg-[#FFF7E6] border-2 border-[#F59E0B] rounded-xl px-5 py-4">
          <AlertTriangle className="w-5 h-5 text-[#B45309] flex-shrink-0 mt-1" />
          <p className="text-[16px] leading-[1.7] text-[#5B3A06]">{inline(b.text)}</p>
        </aside>
      );
    case "figure":
      return (
        <figure className="border-2 border-[#0A0A0A] rounded-xl bg-white overflow-hidden">
          <div className="p-4 md:p-6 grid place-items-center [&_svg]:w-full [&_svg]:h-auto [&_svg]:max-w-[640px]" dangerouslySetInnerHTML={{ __html: b.svg }} />
          {b.caption && <figcaption className="px-4 py-2.5 text-[13px] text-[#4B5563] border-t border-[#E5E7EB] bg-[#F8F9FA]">{b.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
}

export default function GuidePage() {
  const { slug } = useParams();
  const g = GUIDES.find((x) => x.slug === slug);
  if (!g) return <NotFoundPage />;
  const related = (g.related || []).map((s) => GUIDES.find((x) => x.slug === s)).filter(Boolean);
  const path = `/guides/${g.slug}`;

  const article = {
    "@context": "https://schema.org", "@type": "Article",
    headline: g.title, description: g.description, inLanguage: "en-IN",
    datePublished: g.published, dateModified: g.updated,
    author: { "@type": "Organization", name: "ApnaFastag", url: "https://apnafastag.com" },
    publisher: { "@type": "Organization", name: "ApnaFastag", logo: { "@type": "ImageObject", url: "https://apnafastag.com/logo.png" } },
    mainEntityOfPage: `https://apnafastag.com${path}`,
  };

  return (
    <article data-testid="guide-page" className="bg-[#F8F9FA]">
      <SEO
        title={g.metaTitle || g.title}
        description={g.description}
        path={path}
        jsonLd={[
          article,
          breadcrumbSchema([{ label: "Home", url: "/" }, { label: "Guides", url: "/guides" }, { label: g.short || g.title, url: path }]),
          ...(g.faqs?.length ? [faqSchema(g.faqs.map((f) => ({ q: f.q, a: plain(f.a) })))] : []),
        ]}
      />

      {/* Asphalt band with the signboard title */}
      <header className="relative bg-[#161616] pt-28 md:pt-36 pb-12 md:pb-16 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 bottom-6 road-divider opacity-70"
             style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFD60A 0,#FFD60A 28px,transparent 28px,transparent 52px)" }} />
        <div className="relative max-w-4xl mx-auto px-5 md:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white/60 mb-6">
            <Link to="/" className="hover:text-[#FFD60A]">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/guides" className="hover:text-[#FFD60A]">Guides</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/90">{g.short || g.title}</span>
          </nav>
          <div className="km-sign inline-flex items-center gap-2 px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded-md mb-5">
            {g.category} · {g.readMins} min read
          </div>
          <div className="bg-[#0B6B3A] rounded-2xl p-[6px] shadow-[0_18px_40px_rgba(0,0,0,0.45)]">
            <div className="border-[3px] border-white rounded-xl px-5 md:px-8 py-6 md:py-8">
              <h1 className="font-display font-black text-white text-3xl md:text-5xl leading-[1.04] tracking-tight" style={{ textWrap: "balance" }}>{g.title}</h1>
              <p className="mt-4 text-white/85 text-base md:text-lg leading-relaxed max-w-2xl">{g.lede}</p>
            </div>
          </div>
          <p className="mt-5 text-[13px] text-white/60">Updated {fmtDate(g.updated)} · Checked against {g.checkedAgainst}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 md:px-8 py-10 md:py-14 grid gap-10">
        {/* Quick answer: the km-sign sticker */}
        <section aria-label="Quick answer" className="km-sign rounded-xl px-5 md:px-7 py-5">
          <p className="text-[11px] font-black uppercase tracking-[0.2em]">Quick answer</p>
          <p className="mt-2 text-[17px] md:text-[18px] leading-[1.65] font-medium">{inline(g.quickAnswer)}</p>
        </section>

        {g.sections.length > 2 && (
          <nav aria-label="On this page" className="flex flex-wrap gap-2">
            {g.sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="inline-flex items-center gap-1.5 bg-white border-2 border-[#0A0A0A] rounded-full px-3.5 py-1.5 text-[13px] font-semibold hover:bg-[#0A0A0A] hover:text-white transition-colors">
                <ArrowRight className="w-3.5 h-3.5" /> {s.heading}
              </a>
            ))}
          </nav>
        )}

        {g.sections.map((s) => (
          <section key={s.id} id={s.id} className="grid gap-5 scroll-mt-28">
            <h2 className="font-display font-black text-2xl md:text-[32px] leading-tight tracking-tight">{s.heading}</h2>
            {s.blocks.map((b, i) => <Block key={i} b={b} />)}
          </section>
        ))}

        {g.faqs?.length > 0 && (
          <section id="faq" className="grid gap-4">
            <h2 className="font-display font-black text-2xl md:text-[32px] leading-tight tracking-tight">Questions drivers ask</h2>
            <div className="grid gap-3">
              {g.faqs.map((f, i) => (
                <details key={i} className="group bg-white border-2 border-[#0A0A0A] rounded-xl px-5 py-4 open:shadow-[4px_4px_0_#0A0A0A]">
                  <summary className="cursor-pointer list-none flex justify-between gap-4 font-display font-bold text-[17px]">
                    {f.q}<span aria-hidden="true" className="text-[#FF6B00] group-open:rotate-45 transition-transform">+</span>
                  </summary>
                  <p className="mt-3 text-[16px] leading-[1.7] text-[#374151]">{inline(f.a)}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        {g.tools?.length > 0 && (
          <section className="bg-[#0A0A0A] text-white rounded-2xl p-6 md:p-8 grid gap-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FFD60A]">Do it now</p>
            <div className="flex flex-wrap gap-3">
              {g.tools.map((t) => (
                <Link key={t.to} to={t.to} className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold rounded-full px-5 py-2.5 text-sm">
                  {t.label} <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {g.sources?.length > 0 && (
          <section className="grid gap-3">
            <h2 className="font-display font-bold text-lg">Sources we checked</h2>
            <ul className="grid gap-1.5 text-[14px] text-[#4B5563]">
              {g.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-[#0A0A0A]">{s.title}</a>
                  {s.date && <span> · {s.date}</span>}
                </li>
              ))}
            </ul>
            <p className="text-[13px] text-[#6B7280]">FASTag rules change often. If something here no longer matches what you see at the plaza or in your bank app, tell us at the <Link to="/contact" className="underline">contact page</Link>.</p>
          </section>
        )}

        {related.length > 0 && (
          <section className="grid gap-4">
            <h2 className="font-display font-black text-2xl tracking-tight">Next on this route</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {related.map((r) => (
                <Link key={r.slug} to={`/guides/${r.slug}`} className="group bg-[#0B6B3A] rounded-xl p-[4px] hover:-translate-y-0.5 transition-transform">
                  <span className="flex items-center justify-between gap-3 border-2 border-white rounded-lg px-4 py-3.5 text-white">
                    <span className="font-display font-bold leading-snug">{r.short || r.title}</span>
                    <ArrowRight className="w-5 h-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
