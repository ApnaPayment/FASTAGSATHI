import React, { useEffect, useState, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import PageHero from "@/components/layout/PageHero";
import { helpApi } from "@/lib/api";
import { track } from "@/lib/analytics";
import { Search, Clock, ChevronRight, Loader2, BookOpen, CalendarDays } from "lucide-react";

function fmtDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return null; }
}

const CATEGORIES = ["All", "Disputes", "Balance", "KYC", "Blacklist", "Installation", "General"];

const CAT_COLORS = {
  Disputes:     "bg-red-100 text-red-700",
  Balance:      "bg-blue-100 text-blue-700",
  KYC:          "bg-purple-100 text-purple-700",
  Blacklist:    "bg-orange-100 text-orange-700",
  Installation: "bg-green-100 text-green-700",
  General:      "bg-gray-100 text-gray-700",
};

export default function HelpDirectoryPage() {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get("category") || "";
  const urlSearch   = searchParams.get("search") || "";
  const isFiltered  = !!(urlCategory || urlSearch);

  const [articles, setArticles] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [category, setCategory] = useState(urlCategory || "All");
  const [page, setPage]         = useState(1);
  const LIMIT = 20;

  useEffect(() => { track("page_view", { page: "help_directory" }); }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (category !== "All") params.category = category;
      if (debouncedSearch) params.search = debouncedSearch;
      const res = await helpApi.list(params);
      setArticles(res.data.articles || []);
      setTotal(res.data.total || 0);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }, [page, category, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <>
      <SEO
        title="FASTag Help Center — 1000+ guides & answers · ApnaFastag"
        description="Comprehensive FASTag help: disputes, balance check, KYC updates, blacklist fixes, installation guides and more. Every question answered by verified toll plaza experts."
        path="/help"
        keywords="FASTag help, FASTag dispute guide, FASTag balance check, FASTag KYC, FASTag blacklist fix, toll plaza help India"
        jsonLd={breadcrumbSchema([{ label: "Help Center", url: "/help" }])}
        noindex={isFiltered}
      />

      <PageHero
        eyebrow="Help Center"
        title={<>FASTag <span className="text-[#FF6B00]">answers</span></>}
        sub={`${total.toLocaleString("en-IN")}+ guides for every FASTag question — disputes, balance, KYC, blacklist fixes and more.`}
        breadcrumb={[{ label: "Help Center" }]}
      />

      <section className="py-10 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12">

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder="Search FASTag guides…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border-2 border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:border-[#FF6B00] transition-colors"
            />
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${
                  category === cat
                    ? "bg-[#0A0A0A] border-[#0A0A0A] text-white"
                    : "border-[#E5E7EB] text-[#4B5563] hover:border-[#0A0A0A]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Results count */}
          {!loading && (
            <p className="text-xs text-[#9CA3AF] mb-4">
              Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total.toLocaleString("en-IN")} articles
            </p>
          )}

          {/* Articles grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#FF6B00]" />
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-[#E5E7EB] mx-auto mb-3" />
              <p className="text-[#4B5563] font-medium">No articles found. Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              {articles.map((a) => (
                <Link
                  key={a.slug}
                  to={`/help/${a.slug}`}
                  className="group bg-white border-2 border-[#E5E7EB] rounded-2xl p-5 hover:border-[#FF6B00] hover:shadow-[4px_4px_0_#FF6B00] transition-all"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${CAT_COLORS[a.category] || "bg-gray-100 text-gray-700"}`}>
                      {a.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[#9CA3AF] flex-shrink-0">
                      <Clock className="w-3 h-3" />{a.read_min} min
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-[#0A0A0A] leading-snug mb-2 group-hover:text-[#FF6B00] transition-colors line-clamp-2">
                    {a.title}
                  </h3>
                  <p className="text-xs text-[#4B5563] line-clamp-2 leading-relaxed">{a.excerpt}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs font-bold text-[#FF6B00]">
                      Read guide <ChevronRight className="w-3 h-3" />
                    </div>
                    {fmtDate(a.updated_at || a.created_at) && (
                      <span className="flex items-center gap-1 text-[10px] text-[#9CA3AF]">
                        <CalendarDays className="w-3 h-3" />{fmtDate(a.updated_at || a.created_at)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border-2 border-[#E5E7EB] rounded-xl text-sm font-semibold disabled:opacity-40 hover:border-[#0A0A0A] transition-colors"
              >
                ← Previous
              </button>
              <span className="text-sm text-[#4B5563]">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border-2 border-[#E5E7EB] rounded-xl text-sm font-semibold disabled:opacity-40 hover:border-[#0A0A0A] transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
