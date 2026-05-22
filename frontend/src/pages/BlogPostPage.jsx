import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { articleSchema, breadcrumbSchema } from "@/components/seo/SEO";
import { Calendar, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/data/seed";
import { track } from "@/lib/analytics";

export default function BlogPostPage() {
  const { slug } = useParams();
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  useEffect(() => { if (post) { track("blog_post_view", { slug }); document.title = `${post.title} · ApnaFastag`; } }, [post, slug]);

  if (!post) return <section className="pt-40 pb-32 text-center"><h1 className="font-display font-black text-4xl">Post not found</h1><Link to="/blog" className="text-[#FF6B00] font-bold mt-4 inline-block">All posts →</Link></section>;

  return (
    <>
      <SEO
        title={`${post.title} · ApnaFastag Blog`}
        description={post.excerpt}
        path={`/blog/${post.slug}`}
        image={post.cover}
        jsonLd={[
          articleSchema(post),
          breadcrumbSchema([
            { label: "Blog", url: "/blog" },
            { label: post.title, url: `/blog/${post.slug}` },
          ]),
        ]}
      />
      <PageHero
        eyebrow={post.category}
        title={post.title}
        sub={post.excerpt}
        breadcrumb={[{ label: "Blog", to: "/blog" }, { label: post.title.slice(0, 40) + "…" }]}
      />

      <section className="py-12 bg-white">
        <div className="max-w-3xl mx-auto px-6 md:px-10 lg:px-12">
          <div className="flex gap-4 text-sm text-[#4B5563] font-semibold mb-6">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{post.date}</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{post.readMin} min read</span>
          </div>

          <article className="prose-like space-y-5 text-lg text-[#0A0A0A] leading-relaxed">
            <p className="text-xl font-semibold">{post.excerpt}</p>
            <p>This is a placeholder article body. The production CMS (Sanity / Notion / Markdown-in-Git) will populate full long-form content here — typically 1,500–2,500 words optimised around the article's primary SEO query.</p>
            <h2 className="font-display font-black text-3xl pt-4">Why this matters</h2>
            <p>For drivers stuck at toll plazas with a {post.category.toLowerCase()} issue, the difference between knowing the right escalation path and not is often ₹500+ in their pocket — and 30–90 minutes of life back.</p>
            <h2 className="font-display font-black text-3xl pt-4">The step-by-step</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Open the ApnaFastag app and select the issue type.</li>
              <li>Confirm your location — Journey Radar pings nearest Sathis.</li>
              <li>Once a Sathi accepts, share your toll receipt via the AI scanner.</li>
              <li>Sathi files the dispute / handles the resolution live.</li>
              <li>Pay only if resolved; rate the Sathi.</li>
            </ol>
            <h2 className="font-display font-black text-3xl pt-4">Common mistakes drivers make</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Filing the dispute after the 7-day NHAI window — automatic rejection.</li>
              <li>Sharing the original receipt without backing up a copy.</li>
              <li>Calling the bank helpline first instead of escalating in parallel.</li>
            </ul>
          </article>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
