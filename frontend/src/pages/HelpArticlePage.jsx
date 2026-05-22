import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import SEO, { articleSchema, faqSchema, breadcrumbSchema } from "@/components/seo/SEO";
import { helpApi } from "@/lib/api";
import { ChevronDown, Clock, Tag, Building2, MapPin, ArrowRight } from "lucide-react";

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
        document.title = `${r.data.title} · ApnaFastag`;
      })
      .catch(() => setNotFound(true))
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
      { label: article.category, url: `/help?category=${article.category}` },
      { label: article.title },
    ]),
    ...(article.faq_pairs && article.faq_pairs.length > 0
      ? [faqSchema(article.faq_pairs)]
      : []),
  ];

  return (
    <>
      <SEO
        title={`${article.title} · ApnaFastag Help`}
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
      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          {/* Body HTML */}
          <div
            className="prose prose-lg prose-headings:font-display prose-headings:font-black prose-h2:text-2xl prose-h3:text-xl prose-a:text-[#FF6B00] prose-a:no-underline hover:prose-a:underline prose-strong:text-[#0A0A0A] prose-code:bg-[#F3F4F6] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono prose-pre:bg-[#0A0A0A] prose-pre:text-white prose-blockquote:border-l-4 prose-blockquote:border-[#FF6B00] prose-blockquote:pl-4 prose-li:text-[#4B5563] max-w-none"
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
