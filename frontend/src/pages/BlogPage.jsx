import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { BLOG_POSTS } from "@/data/seed";
import { track } from "@/lib/analytics";

export default function BlogPage() {
  useEffect(() => { track("page_view", { page: "blog" }); }, []);
  return (
    <>
      <SEO
        title="Blog — FASTag fixes, toll stories, Sathi guides · ApnaFastag"
        description="Tactical FASTag and toll guides written by Sathis, drivers, and ops. New post every Friday: mischarge refunds, blacklist fixes, NH toll rates, Sathi earnings."
        path="/blog"
        keywords="fastag blog, toll plaza guide, fastag dispute guide, nh toll rates blog"
      />
      <PageHero
        eyebrow="Field notes"
        title={<>Real fixes from the <span className="text-[#FF6B00]">road.</span></>}
        sub="Tactical guides written by Sathis, drivers, and our ops team. New post every Friday."
        breadcrumb={[{ label: "Blog" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 gap-6">
          {BLOG_POSTS.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} data-testid={`blog-card-${p.slug}`} className="group bg-white border-2 border-[#0A0A0A] rounded-3xl overflow-hidden hover:-translate-y-1 transition-transform shadow-[6px_6px_0_#FF6B00]">
              <div className="aspect-[16/9] bg-[#0A0A0A] overflow-hidden">
                <img src={p.cover} alt={p.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" loading="lazy" />
              </div>
              <div className="p-6">
                <div className="flex gap-3 text-xs text-[#4B5563] font-semibold">
                  <span className="bg-[#FFD60A] text-[#0A0A0A] px-2 py-0.5 rounded">{p.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{p.date}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{p.readMin} min</span>
                </div>
                <h3 className="font-display font-bold text-2xl mt-3 text-[#0A0A0A] leading-snug">{p.title}</h3>
                <p className="text-[#4B5563] mt-2 text-sm">{p.excerpt}</p>
                <div className="mt-4 flex items-center gap-1 text-sm font-bold text-[#FF6B00]">Read post <ArrowRight className="w-4 h-4" /></div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <PageCTA />
    </>
  );
}
