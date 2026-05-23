import { useEffect } from "react";

const SITE = {
  name: "ApnaFastag",
  url: "https://www.apnafastag.com",
  defaultDescription: "India's first real-time peer-to-peer rescue network for FASTag chaos — disputes, KYC, recharge fails, emergency SOS. Verified Sathis at 60+ toll plazas.",
  defaultImage: "https://www.apnafastag.com/og-default.png",
  twitter: "@apnafastag",
};

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

    // JSON-LD
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
      added.forEach((s) => { if (s.parentNode) s.parentNode.removeChild(s); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullTitle, description, canonical, image, noindex, keywords, JSON.stringify(ldArray)]);

  return null;
}

// ── Schema builders ──────────────────────────────────────────────────────────

export const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "ApnaFastag",
  url: SITE.url,
  logo: {
    "@type": "ImageObject",
    url: `${SITE.url}/logo.png`,
    width: 200,
    height: 60,
  },
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
    availableLanguage: ["en", "hi", "mr", "ta", "te", "kn"],
  },
  foundingDate: "2025",
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  description: SITE.defaultDescription,
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "ApnaFastag",
  url: SITE.url,
  description: SITE.defaultDescription,
  inLanguage: "en-IN",
  potentialAction: [
    {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE.url}/help?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  ],
};

// Service schema for the Sathi rescue service
export const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "FASTag Rescue by Sathi",
  serviceType: "FASTag Issue Resolution",
  provider: orgSchema,
  areaServed: {
    "@type": "Country",
    name: "India",
  },
  description: "Verified Sathis resolve FASTag disputes, KYC, blacklist, recharge failures, and SOS at toll plazas across India — usually in under 8 minutes.",
  offers: {
    "@type": "Offer",
    price: "49",
    priceCurrency: "INR",
    priceSpecification: {
      "@type": "PriceSpecification",
      minPrice: "49",
      maxPrice: "499",
      priceCurrency: "INR",
    },
    description: "Pay only when your FASTag issue is resolved",
  },
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "FASTag Services",
    itemListElement: [
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "FASTag Dispute & Refund" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "FASTag Blacklist Fix" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "FASTag KYC Update" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "FASTag Recharge Assistance" } },
      { "@type": "Offer", itemOffered: { "@type": "Service", name: "Emergency SOS at Toll" } },
    ],
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
    containedInPlace: { "@type": "Road", name: plaza.highway },
    url: `${SITE.url}/toll/${plaza.slug}`,
    hasMap: `https://www.google.com/maps?q=${plaza.lat},${plaza.lng}`,
  };
}

export function articleSchema(post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt || post.meta_description,
    image: post.cover || SITE.defaultImage,
    datePublished: post.date || post.created_at,
    dateModified: post.updated_at || post.date || post.created_at,
    author: { "@type": "Organization", name: "ApnaFastag", url: SITE.url },
    publisher: {
      "@type": "Organization",
      name: "ApnaFastag",
      logo: { "@type": "ImageObject", url: `${SITE.url}/logo.png` },
    },
    mainEntityOfPage: `${SITE.url}${post.slug ? `/help/${post.slug}` : `/blog/${post.slug}`}`,
    inLanguage: "en-IN",
    about: { "@type": "Thing", name: "FASTag" },
    keywords: post.meta_keywords || post.category,
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
    inLanguage: "en-IN",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    provider: orgSchema,
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
  if (!qa || qa.length === 0) return null;
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

export function howToSchema({ name, description, steps }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    inLanguage: "en-IN",
    step: steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export function localBusinessSchema({ name, city, state, lat, lng, url }) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
    url,
    address: {
      "@type": "PostalAddress",
      addressLocality: city,
      addressRegion: state,
      addressCountry: "IN",
    },
    geo: lat && lng ? { "@type": "GeoCoordinates", latitude: lat, longitude: lng } : undefined,
    priceRange: "₹49–₹499",
    openingHours: "Mo-Su 00:00-23:59",
    telephone: "+91-1800-000-0000",
    areaServed: { "@type": "Country", name: "India" },
  };
}

export const SITE_URL = SITE.url;
