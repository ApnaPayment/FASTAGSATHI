import { useEffect } from "react";

const SITE = {
  name: "ApnaFastag",
  url: "https://apnafastag.in",
  defaultDescription: "India's first real-time peer-to-peer rescue network for FASTag chaos — disputes, KYC, recharge fails, emergency SOS. Verified Sathis at 60+ toll plazas.",
  defaultImage: "https://apnafastag.in/og-default.png",
  twitter: "@apnafastag",
};

// Helper: ensure a <meta name|property> tag exists with the given content.
function upsertMeta({ name, property, content }) {
  if (!content) return null;
  const sel = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let el = document.head.querySelector(sel);
  if (!el) {
    el = document.createElement("meta");
    if (name) el.setAttribute("name", name);
    if (property) el.setAttribute("property", property);
    el.setAttribute("data-seo", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
  return el;
}

function upsertLink(rel, href) {
  if (!href) return null;
  let el = document.head.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    el.setAttribute("data-seo", "true");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
  return el;
}

/**
 * SEO — vanilla, library-free, React-19-safe meta + JSON-LD manager.
 * Manages title, description, canonical, OG/Twitter tags, JSON-LD scripts.
 *
 * Each instance tracks the JSON-LD scripts it added so they're cleanly removed
 * on unmount / route change.
 */
export default function SEO({
  title,
  description = SITE.defaultDescription,
  path = "/",
  image = SITE.defaultImage,
  noindex = false,
  jsonLd,
  keywords,
}) {
  const fullTitle = title
    ? title.includes("ApnaFastag")
      ? title
      : `${title} · ApnaFastag`
    : "ApnaFastag — Stuck at a toll? Your Sathi arrives in 90 seconds.";
  const canonical = `${SITE.url}${path === "/" ? "" : path}`;
  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  useEffect(() => {
    document.title = fullTitle;
    upsertMeta({ name: "description", content: description });
    if (keywords) upsertMeta({ name: "keywords", content: keywords });
    upsertLink("canonical", canonical);

    // robots
    upsertMeta({ name: "robots", content: noindex ? "noindex,nofollow" : "index,follow,max-image-preview:large" });

    // OG
    upsertMeta({ property: "og:type", content: "website" });
    upsertMeta({ property: "og:site_name", content: SITE.name });
    upsertMeta({ property: "og:title", content: fullTitle });
    upsertMeta({ property: "og:description", content: description });
    upsertMeta({ property: "og:url", content: canonical });
    upsertMeta({ property: "og:image", content: image });
    upsertMeta({ property: "og:locale", content: "en_IN" });

    // Twitter
    upsertMeta({ name: "twitter:card", content: "summary_large_image" });
    upsertMeta({ name: "twitter:site", content: SITE.twitter });
    upsertMeta({ name: "twitter:title", content: fullTitle });
    upsertMeta({ name: "twitter:description", content: description });
    upsertMeta({ name: "twitter:image", content: image });

    // JSON-LD — append, track for cleanup
    const added = [];
    ldArray.forEach((ld) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo", "true");
      s.text = JSON.stringify(ld);
      document.head.appendChild(s);
      added.push(s);
    });

    return () => {
      // Remove only the JSON-LD scripts this instance added — meta tags
      // get overwritten by the next page's SEO, which is the correct behavior.
      added.forEach((s) => { if (s.parentNode) s.parentNode.removeChild(s); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, description, canonical, image, noindex, keywords, JSON.stringify(ldArray)]);

  return null;
}

// Reusable schema builders ---------------------------------------------------

export const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ApnaFastag",
  url: SITE.url,
  logo: `${SITE.url}/logo.png`,
  sameAs: [
    "https://twitter.com/apnafastag",
    "https://www.instagram.com/apnafastag",
    "https://www.youtube.com/@apnafastag",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-1800-000-0000",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["en", "hi", "mr", "ta"],
  },
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ApnaFastag",
  url: SITE.url,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE.url}/coverage?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export function placeSchema(plaza, state) {
  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: `${plaza.name} — Toll Plaza on ${plaza.highway}`,
    description: `${plaza.name} is a toll plaza on ${plaza.highway} in ${plaza.city}${state ? `, ${state.name}` : ""}. Car toll ₹${plaza.carRate}, truck toll ₹${plaza.truckRate}. ApnaFastag has verified Sathis ready to help on-spot.`,
    geo: {
      "@type": "GeoCoordinates",
      latitude: plaza.lat,
      longitude: plaza.lng,
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: plaza.city,
      addressRegion: state?.name || "India",
      addressCountry: "IN",
    },
    containedInPlace: {
      "@type": "Road",
      name: plaza.highway,
    },
    url: `${SITE.url}/toll/${plaza.slug}`,
  };
}

export function articleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: post.cover,
    datePublished: post.date,
    author: { "@type": "Organization", name: "ApnaFastag" },
    publisher: {
      "@type": "Organization",
      name: "ApnaFastag",
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: `${SITE.url}/blog/${post.slug}`,
  };
}

export function webAppSchema({ name, description, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name,
    description,
    url,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
  };
}

export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.label,
      item: it.url ? `${SITE.url}${it.url}` : undefined,
    })),
  };
}

export function faqSchema(qa) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
