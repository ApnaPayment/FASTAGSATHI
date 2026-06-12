import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO, { articleSchema, faqSchema, breadcrumbSchema } from "@/components/seo/SEO";
import { helpApi } from "@/lib/api";
import { ChevronDown, Clock, Tag, Building2, MapPin, ArrowRight, CalendarDays } from "lucide-react";

const CAT_COLORS = {
  Disputes:     "bg-red-100 text-red-700 border-red-200",
  Balance:      "bg-blue-100 text-blue-700 border-blue-200",
  KYC:          "bg-purple-100 text-purple-700 border-purple-200",
  Blacklist:    "bg-orange-100 text-orange-700 border-orange-200",
  Installation: "bg-green-100 text-green-700 border-green-200",
  General:      "bg-gray-100 text-gray-700 border-gray-200",
};

function FaqAccordion({ pairs }) {
  const [open, setOpen] = useState(null);
  if (!pairs || pairs.length === 0) return null;
  return (
    <div className="mt-10">
      <h2 className="font-display font-black text-2xl text-[#0A0A0A] mb-4">Frequently Asked Questions</h2>
      <div className="space-y-2">
        {pairs.map((item, i) => (
          <div key={i} className="border-2 border-[#E5E7EB] rounded-2xl overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left font-semibold text-[#0A0A0A] hover:bg-[#F8F9FA] transition-colors"
            >
              <span>{item.q}</span>
              <ChevronDown className={`w-5 h-5 text-[#4B5563] flex-shrink-0 ml-3 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-[#4B5563] text-sm leading-relaxed border-t border-[#E5E7EB] pt-4">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HelpArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    helpApi.get(slug)
      .then((r) => {
        if (!r.data || !r.data.is_published) { setNotFound(true); return; }
        setArticle(r.data);
        document.title = `${r.data.meta_title || r.data.title} · ApnaFastag`;
      })
      .catch((err) => {
        // Only noindex on genuine 404 — network errors shouldn't hide the page
        if (err?.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section className="pt-40 pb-32 text-center">
        <div className="w-8 h-8 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="pt-40 pb-32 text-center max-w-lg mx-auto px-6">
        <h1 className="font-display font-black text-4xl text-[#0A0A0A] mb-4">Article not found</h1>
        <p className="text-[#4B5563] mb-8">The page you're looking for doesn't exist or has been removed.</p>
        <Link to="/help" className="inline-flex items-center gap-2 bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-full hover:bg-[#E55A00] transition-colors">
          Browse all articles <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    );
  }

  const catColor = CAT_COLORS[article.category] || CAT_COLORS.General;
  const metaDesc = article.meta_description || article.excerpt;

  const jsonLd = [
    articleSchema({
      title: article.title,
      excerpt: article.excerpt,
      cover: article.cover,
      date: article.created_at ? new Date(article.created_at).toISOString() : new Date().toISOString(),
      slug: article.slug,
    }),
    breadcrumbSchema([
      { label: "Help Center", url: "/help" },
      { label: article.category, url: `/help#${article.category.toLowerCase()}` },
      { label: article.title },
    ]),
    ...(article.faq_pairs && article.faq_pairs.length > 0
      ? [faqSchema(article.faq_pairs)]
      : []),
  ];

  return (
    <>
      <SEO
        title={`${article.meta_title || article.title} · ApnaFastag Help`}
        description={metaDesc}
        path={`/help/${article.slug}`}
        keywords={article.meta_keywords || `${article.category} FASTag, ${article.title}`}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="bg-[#0A0A0A] pt-32 pb-14 px-6">
        <div className="max-w-3xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-white/50 mb-6 flex-wrap">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
            <span>/</span>
            <span className="text-white/70">{article.category}</span>
          </nav>

          {/* Category badge */}
          <span className={`inline-flex items-center gap-1.5 border text-xs font-bold px-3 py-1 rounded-full mb-4 ${catColor}`}>
            <Tag className="w-3 h-3" />
            {article.category}
          </span>

          <h1 className="font-display font-black text-3xl md:text-4xl lg:text-5xl text-white leading-tight mb-4">
            {article.title}
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-6">{article.excerpt}</p>

          {/* Meta chips */}
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1.5 text-white/50">
              <Clock className="w-4 h-4" />
              {article.read_min} min read
            </span>
            {(article.updated_at || article.created_at) && (
              <span className="inline-flex items-center gap-1.5 text-white/50">
                <CalendarDays className="w-4 h-4" />
                {new Date(article.updated_at || article.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {article.related_bank && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold text-white">
                <Building2 className="w-3 h-3 text-[#FFD60A]" />
                {article.related_bank.replace("-fastag", "").toUpperCase()} FASTag
              </span>
            )}
            {article.related_state && (
              <span className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-bold text-white">
                <MapPin className="w-3 h-3 text-[#FFD60A]" />
                {article.related_state.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="py-12 bg-white overflow-x-hidden">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 overflow-x-hidden">
          {/* Scoped styles for AI-generated HTML blocks */}
          <style>{`
            /* ── Base layout ── */
            .article-body {
              overflow-wrap: break-word;
              word-break: break-word;
              max-width: 100%;
            }

            /* ── Typography ── */
            .article-body p {
              margin: 0 0 1.1rem 0;
              line-height: 1.8;
              color: #374151;
              font-size: 1rem;
            }
            .article-body h2 {
              font-size: 1.45rem;
              font-weight: 900;
              color: #0A0A0A;
              margin: 2.5rem 0 0.9rem;
              line-height: 1.3;
              padding-top: 0.5rem;
              border-top: 3px solid #F3F4F6;
            }
            .article-body h2:first-of-type { border-top: none; margin-top: 0; }
            .article-body h3 {
              font-size: 1.1rem;
              font-weight: 700;
              color: #111827;
              margin: 1.6rem 0 0.5rem;
            }
            .article-body ul, .article-body ol {
              padding-left: 1.4rem;
              margin: 0.5rem 0 1.1rem;
            }
            .article-body li {
              margin-bottom: 0.45rem;
              color: #4B5563;
              line-height: 1.75;
            }
            .article-body ul > li { list-style-type: disc; }
            .article-body ol > li { list-style-type: decimal; }
            .article-body strong { color: #0A0A0A; font-weight: 700; }
            .article-body em { color: #374151; font-style: italic; }
            .article-body a { color: #FF6B00; text-decoration: none; }
            .article-body a:hover { text-decoration: underline; }
            .article-body code {
              background: #F3F4F6; padding: 2px 6px;
              border-radius: 4px; font-size: 0.875rem; font-family: monospace;
            }

            /* ── Quick Answer (Featured Snippet target) ── */
            .article-body .quick-answer {
              background: #FFF7ED;
              border-left: 4px solid #FF6B00;
              border-radius: 0 12px 12px 0;
              padding: 14px 18px;
              margin: 1.25rem 0 1.5rem;
              font-size: 0.95rem;
              color: #1F2937;
              line-height: 1.7;
            }
            .article-body .quick-answer strong { color: #C2410C; }

            /* ── Table of Contents ── */
            .article-body nav.toc {
              background: #F8F9FA;
              border: 2px solid #E5E7EB;
              border-radius: 14px;
              padding: 16px 20px;
              margin: 0 0 2rem 0;
            }
            .article-body nav.toc h2 {
              font-size: 0.65rem !important;
              text-transform: uppercase !important;
              letter-spacing: 0.12em !important;
              color: #9CA3AF !important;
              font-weight: 700 !important;
              margin: 0 0 10px 0 !important;
              padding: 0 !important;
              border: none !important;
            }
            .article-body nav.toc ul {
              list-style: none !important;
              padding: 0 !important;
              margin: 0 !important;
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .article-body nav.toc li {
              list-style: none !important;
              margin: 0 !important;
              padding: 0 !important;
              display: flex;
              align-items: center;
              gap: 6px;
            }
            .article-body nav.toc li::before {
              content: "→";
              color: #FF6B00;
              font-size: 0.75rem;
              flex-shrink: 0;
            }
            .article-body nav.toc a {
              color: #374151 !important;
              text-decoration: none !important;
              font-size: 0.875rem;
              font-weight: 500;
              line-height: 1.5;
            }
            .article-body nav.toc a:hover { color: #FF6B00 !important; }

            /* ── Comparison / data table ── */
            .article-body .table-wrap {
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              margin: 1.5rem 0;
              border-radius: 10px;
              border: 1px solid #E5E7EB;
              box-shadow: 0 1px 4px rgba(0,0,0,0.05);
            }
            .article-body table {
              width: 100%;
              min-width: 540px;
              border-collapse: collapse;
              font-size: 0.875rem;
              margin: 0;
            }
            .article-body thead tr { background: #0A0A0A; }
            .article-body thead th {
              color: #fff;
              padding: 11px 14px;
              text-align: left;
              font-weight: 700;
              font-size: 0.78rem;
              letter-spacing: 0.03em;
              white-space: nowrap;
            }
            .article-body tbody td {
              padding: 10px 14px;
              border-bottom: 1px solid #F3F4F6;
              color: #374151;
              vertical-align: top;
              line-height: 1.6;
            }
            .article-body tbody tr:last-child td { border-bottom: none; }
            .article-body tbody tr:nth-child(even) td { background: #F9FAFB; }
            .article-body tbody tr:hover td { background: #FFF7ED; transition: background 0.15s; }

            /* Bare table without wrapper (fallback) */
            .article-body > table {
              display: block;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              margin: 1.5rem 0;
              border-radius: 10px;
              border: 1px solid #E5E7EB;
            }
          `}</style>

          {/* Body HTML */}
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.body }}
          />

          {/* FAQ Accordion */}
          <FaqAccordion pairs={article.faq_pairs} />

          {/* CTA block */}
          <div className="mt-12 bg-[#FF6B00] rounded-3xl p-8 md:p-10 text-white">
            <h3 className="font-display font-black text-2xl md:text-3xl mb-3">
              Stuck at a toll plaza?
            </h3>
            <p className="text-white/90 mb-6 leading-relaxed">
              Skip the 8-minute helpline wait. A verified Sathi at your plaza can resolve
              {article.related_bank
                ? ` ${article.related_bank.replace("-fastag", "").toUpperCase()} FASTag`
                : " FASTag"} issues on the spot — usually in under 8 minutes.
            </p>
            <Link
              to="/find"
              className="inline-flex items-center gap-2 bg-[#0A0A0A] text-white font-bold px-6 py-3 rounded-full hover:bg-white hover:text-[#0A0A0A] transition-colors"
            >
              Find a Sathi near me <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Back link */}
          <div className="mt-8 border-t border-[#E5E7EB] pt-6">
            <Link to="/help" className="inline-flex items-center gap-2 text-[#FF6B00] font-semibold hover:underline text-sm">
              ← Back to Help Center
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
