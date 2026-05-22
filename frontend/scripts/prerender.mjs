#!/usr/bin/env node
/* eslint-disable */
/**
 * ApnaFastag — Static HTML prerenderer
 * ------------------------------------
 * For every SEO-critical route in the site, this script:
 *   1) reads the SPA's built `build/index.html` template
 *   2) injects route-specific <title>, <meta>, <link rel="canonical">,
 *      Open Graph / Twitter tags, and JSON-LD structured data
 *   3) writes the result to `build/<route>/index.html`
 *
 * Why this matters
 * ----------------
 * Googlebot/Bingbot execute JavaScript, but FB / Twitter / LinkedIn
 * link-preview scrapers do NOT. With this prerender step, every social
 * share now gets a proper card without needing full SSR.
 *
 * Usage
 * -----
 *   yarn build            # standard CRA build → /build
 *   node scripts/prerender.mjs    # → emits /build/<route>/index.html for all routes
 *
 * Production note
 * ---------------
 * This is a CRA-compatible "head-only" prerender. For full body SSG +
 * crawl-budget gains across 3,500 pSEO pages, migrate to Vite SSG —
 * see /app/plan/06_SSG_IMPLEMENTATION.md.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const TEMPLATE = path.join(BUILD_DIR, "index.html");

const SITE_URL = "https://apnafastag.in";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_DESC = "India's first peer-to-peer FASTag rescue network. Verified Sathis resolve disputes, KYC, recharge failures and SOS at 60+ toll plazas.";

/* ─── Route data (mirror of src/data/seed.js — kept inline for ESM-without-config) ─── */

const STATES = [
  { slug: "maharashtra", name: "Maharashtra", plazaCount: 142, sathiCount: 386, highways: ["NH-48","NH-160","NH-66"] },
  { slug: "karnataka",   name: "Karnataka",   plazaCount: 98,  sathiCount: 221, highways: ["NH-48","NH-44","NH-75"] },
  { slug: "haryana",     name: "Haryana",     plazaCount: 67,  sathiCount: 174, highways: ["NH-44","NH-48","NH-19"] },
  { slug: "tamil-nadu",  name: "Tamil Nadu",  plazaCount: 89,  sathiCount: 198, highways: ["NH-44","NH-32"] },
  { slug: "gujarat",     name: "Gujarat",     plazaCount: 74,  sathiCount: 156, highways: ["NH-48","NH-27"] },
];

const PLAZAS = [
  { slug:"khalapur-nh48",       name:"Khalapur Plaza",       highway:"NH-48", state:"maharashtra", city:"Khalapur",   lat:18.81, lng:73.27, carRate:95,  truckRate:410 },
  { slug:"vashi-mmrda",         name:"Vashi MMRDA Plaza",    highway:"MMRDA", state:"maharashtra", city:"Vashi",      lat:19.07, lng:73.00, carRate:45,  truckRate:175 },
  { slug:"lonavla-nh48",        name:"Lonavla Plaza",        highway:"NH-48", state:"maharashtra", city:"Lonavla",    lat:18.75, lng:73.41, carRate:95,  truckRate:410 },
  { slug:"manesar-nh48",        name:"Manesar Plaza",        highway:"NH-48", state:"haryana",     city:"Manesar",    lat:28.36, lng:76.94, carRate:85,  truckRate:380 },
  { slug:"kherki-daula-nh48",   name:"Kherki Daula Plaza",   highway:"NH-48", state:"haryana",     city:"Gurugram",   lat:28.39, lng:76.93, carRate:27,  truckRate:145 },
  { slug:"zirakpur-nh44",       name:"Zirakpur Plaza",       highway:"NH-44", state:"haryana",     city:"Zirakpur",   lat:30.64, lng:76.82, carRate:110, truckRate:480 },
  { slug:"athur-nh44",          name:"Athur Plaza",          highway:"NH-44", state:"tamil-nadu",  city:"Athur",      lat:12.59, lng:77.94, carRate:75,  truckRate:320 },
  { slug:"electronic-city-nh44",name:"Electronic City Plaza",highway:"NH-44", state:"karnataka",   city:"Bengaluru",  lat:12.84, lng:77.66, carRate:40,  truckRate:165 },
  { slug:"vadodara-nh48",       name:"Vadodara Plaza",       highway:"NH-48", state:"gujarat",     city:"Vadodara",   lat:22.30, lng:73.20, carRate:95,  truckRate:410 },
  { slug:"palwal-nh19",         name:"Palwal Plaza",         highway:"NH-19", state:"haryana",     city:"Palwal",     lat:28.14, lng:77.33, carRate:85,  truckRate:380 },
];

const BANKS = [
  { slug:"sbi-fastag",   name:"SBI FASTag",   smsCode:"FTBAL",  helpline:"1800-11-0018" },
  { slug:"paytm-fastag", name:"Paytm FASTag", smsCode:"FT BAL", helpline:"1800-120-4210" },
  { slug:"icici-fastag", name:"ICICI FASTag", smsCode:"FASTAG", helpline:"1800-2100-104" },
  { slug:"hdfc-fastag",  name:"HDFC FASTag",  smsCode:"FASTAG", helpline:"1800-120-1243" },
  { slug:"axis-fastag",  name:"Axis FASTag",  smsCode:"FASTAG", helpline:"1860-419-8585" },
];

const BLOG_POSTS = [
  { slug:"fastag-mischarge-refund-2026", title:"How to claim a FASTag mischarge refund in 2026 (step-by-step)", excerpt:"The official NHAI dispute window is 7 days. Here's the exact process — and the 3 mistakes that get claims rejected.", date:"2026-01-14", cover:`${SITE_URL}/og-default.png` },
  { slug:"fastag-blacklisted-fix",       title:"FASTag blacklisted? 4 reasons + the fastest fix at the plaza",       excerpt:"Low balance is just one of the four reasons. Two require a bank branch visit — unless your Sathi handles it on-spot.", date:"2026-01-09", cover:`${SITE_URL}/og-default.png` },
  { slug:"toll-charges-nh48-2026",       title:"All NH-48 toll charges (Mumbai → Bengaluru) — updated Jan 2026",     excerpt:"Every plaza, every vehicle class, total trip cost. Bookmark this for every Mumbai-Pune-Bengaluru run.", date:"2026-01-03", cover:`${SITE_URL}/og-default.png` },
  { slug:"how-to-become-fastag-sathi",   title:"Becoming a Fastag Sathi: ₹0 to ₹45,000/month in 60 days",            excerpt:"Real numbers from 12 Sathis at NH-48 plazas. Hours, payouts, what nobody tells you.", date:"2025-12-28", cover:`${SITE_URL}/og-default.png` },
];

// Mirror of /app/frontend/src/data/sathis.js (slug + name + city + plaza only — enough for SEO head)
const SATHIS = [
  { slug:"ravi-shinde-khalapur",      name:"Ravi Shinde",   city:"Khalapur",  state:"Maharashtra", plaza:"Khalapur Plaza" },
  { slug:"anil-bhau-lonavla",         name:"Anil Bhau",     city:"Lonavla",   state:"Maharashtra", plaza:"Lonavla Plaza" },
  { slug:"priya-pawar-vashi",         name:"Priya Pawar",   city:"Vashi",     state:"Maharashtra", plaza:"Vashi MMRDA Plaza" },
  { slug:"vikram-sharma-manesar",     name:"Vikram Sharma", city:"Manesar",   state:"Haryana",     plaza:"Manesar Plaza" },
  { slug:"lakshmi-iyer-bengaluru",    name:"Lakshmi Iyer",  city:"Bengaluru", state:"Karnataka",   plaza:"Electronic City Plaza" },
  { slug:"rajesh-kumar-zirakpur",     name:"Rajesh Kumar",  city:"Zirakpur",  state:"Haryana",     plaza:"Zirakpur Plaza" },
  { slug:"sanjana-rao-athur",         name:"Sanjana Rao",   city:"Athur",     state:"Tamil Nadu",  plaza:"Athur Plaza" },
  { slug:"deepak-patel-vadodara",     name:"Deepak Patel",  city:"Vadodara",  state:"Gujarat",     plaza:"Vadodara Plaza" },
];

/* ─── HTML head builder ─── */

function escape(s = "") {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHead({ title, description = DEFAULT_DESC, canonical, image = DEFAULT_IMAGE, keywords, jsonLd = [] }) {
  const t = title.includes("ApnaFastag") ? title : `${title} · ApnaFastag`;
  const lds = jsonLd.map((ld) => `<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n    ");
  return `
    <!-- SSG: prerendered head -->
    <title>${escape(t)}</title>
    <meta name="description" content="${escape(description)}" />
    ${keywords ? `<meta name="keywords" content="${escape(keywords)}" />` : ""}
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ApnaFastag" />
    <meta property="og:title" content="${escape(t)}" />
    <meta property="og:description" content="${escape(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@apnafastag" />
    <meta name="twitter:title" content="${escape(t)}" />
    <meta name="twitter:description" content="${escape(description)}" />
    <meta name="twitter:image" content="${image}" />
    ${lds}
  `.trim();
}

/* ─── Schema builders (mirror src/components/seo/SEO.jsx) ─── */

const orgSchema = {
  "@context":"https://schema.org","@type":"Organization",
  name:"ApnaFastag", url:SITE_URL, logo:`${SITE_URL}/logo.png`,
  sameAs:["https://twitter.com/apnafastag","https://www.instagram.com/apnafastag","https://www.youtube.com/@apnafastag"],
  contactPoint:{ "@type":"ContactPoint", telephone:"+91-1800-000-0000", contactType:"customer support", areaServed:"IN", availableLanguage:["en","hi","mr","ta"] },
};

const websiteSchema = {
  "@context":"https://schema.org","@type":"WebSite",
  name:"ApnaFastag", url:SITE_URL,
  potentialAction:{ "@type":"SearchAction", target:`${SITE_URL}/coverage?q={search_term_string}`, "query-input":"required name=search_term_string" },
};

function placeSchema(p, s) {
  return {
    "@context":"https://schema.org","@type":"Place",
    name:`${p.name} — Toll Plaza on ${p.highway}`,
    description:`${p.name} is a toll plaza on ${p.highway} in ${p.city}${s ? `, ${s.name}` : ""}. Car toll ₹${p.carRate}, truck toll ₹${p.truckRate}.`,
    geo:{ "@type":"GeoCoordinates", latitude:p.lat, longitude:p.lng },
    address:{ "@type":"PostalAddress", addressLocality:p.city, addressRegion:s?.name || "India", addressCountry:"IN" },
    containedInPlace:{ "@type":"Road", name:p.highway },
    url:`${SITE_URL}/toll/${p.slug}`,
  };
}

function articleSchema(post) {
  return {
    "@context":"https://schema.org","@type":"Article",
    headline:post.title, description:post.excerpt, image:post.cover, datePublished:post.date,
    author:{ "@type":"Organization", name:"ApnaFastag" },
    publisher:{ "@type":"Organization", name:"ApnaFastag", logo:{ "@type":"ImageObject", url:`${SITE_URL}/logo.png` } },
    mainEntityOfPage:`${SITE_URL}/blog/${post.slug}`,
  };
}

function webAppSchema({ name, description, url }) {
  return { "@context":"https://schema.org","@type":"WebApplication", name, description, url, applicationCategory:"UtilityApplication", operatingSystem:"Any", offers:{ "@type":"Offer", price:"0", priceCurrency:"INR" } };
}

/* ─── Route manifest ─── */

const routes = [
  { path:"/", head: buildHead({ title:"ApnaFastag — Stuck at a toll? Your Sathi arrives in 90 seconds.", description:DEFAULT_DESC, canonical:`${SITE_URL}/`, jsonLd:[orgSchema, websiteSchema] }) },
  { path:"/find", head: buildHead({
      title:"Find a Sathi near you — live map across India",
      description:"See verified Fastag Sathis around you on a live map. Pick by toll plaza or directly by agent. Login with mobile OTP to start contacting.",
      canonical:`${SITE_URL}/find`,
      keywords:"find fastag sathi near me, fastag help near me, toll plaza assistance near me",
    }) },
  { path:"/login", head: buildHead({
      title:"Login with mobile OTP",
      description:"Quick 4-digit OTP login. We use this to hide Sathi contact details from bots.",
      canonical:`${SITE_URL}/login`,
    }) },
  { path:"/how-it-works",  head: buildHead({ title:"How ApnaFastag works — from stuck to sorted in 8 minutes",                          canonical:`${SITE_URL}/how-it-works` }) },
  { path:"/features",      head: buildHead({ title:"Features — Journey Radar, AI Receipt Scanner, SOS, Masked Calls",                  canonical:`${SITE_URL}/features` }) },
  { path:"/pricing",       head: buildHead({ title:"Pricing — Pay only when your FASTag issue is fixed",                                canonical:`${SITE_URL}/pricing` }) },
  { path:"/become-a-sathi",head: buildHead({ title:"Become a Fastag Sathi — earn ₹25k–₹60k/month at your local toll",                  canonical:`${SITE_URL}/become-a-sathi` }) },
  { path:"/coverage",      head: buildHead({ title:"Coverage — 60+ toll plazas across India",                                          canonical:`${SITE_URL}/coverage` }) },
  { path:"/about",         head: buildHead({ title:"About ApnaFastag — built by drivers, for drivers",                                 canonical:`${SITE_URL}/about` }) },
  { path:"/blog",          head: buildHead({ title:"Blog — FASTag fixes, toll stories, Sathi guides",                                  canonical:`${SITE_URL}/blog` }) },
  { path:"/help",          head: buildHead({ title:"Help Center — FASTag answers, fast",                                               canonical:`${SITE_URL}/help` }) },
  { path:"/contact",       head: buildHead({ title:"Contact ApnaFastag — talk to a real human",                                        canonical:`${SITE_URL}/contact` }) },
  { path:"/careers",       head: buildHead({ title:"Careers — build the rescue layer for India's roads",                               canonical:`${SITE_URL}/careers` }) },
  { path:"/press",         head: buildHead({ title:"Press kit — logos, founder photos, brand assets",                                  canonical:`${SITE_URL}/press` }) },
  { path:"/privacy",       head: buildHead({ title:"Privacy Policy",     canonical:`${SITE_URL}/privacy` }) },
  { path:"/terms",         head: buildHead({ title:"Terms of Service",   canonical:`${SITE_URL}/terms` }) },
  { path:"/refund-policy", head: buildHead({ title:"Refund Policy",      canonical:`${SITE_URL}/refund-policy` }) },

  { path:"/tools/fastag-balance-check", head: buildHead({
      title:"FASTag balance check — free tool across all banks",
      description:"Check your FASTag balance instantly. Works for SBI, Paytm, ICICI, HDFC, Axis.",
      canonical:`${SITE_URL}/tools/fastag-balance-check`,
      keywords:"fastag balance check, sbi fastag balance, paytm fastag balance",
      jsonLd:[webAppSchema({ name:"FASTag Balance Checker", description:"Free FASTag balance lookup", url:`${SITE_URL}/tools/fastag-balance-check` })],
    }) },
  { path:"/tools/toll-calculator", head: buildHead({
      title:"Toll calculator India — estimate your trip toll across NH-48, NH-44, NH-19",
      description:"Estimate total toll charges for any route in India.",
      canonical:`${SITE_URL}/tools/toll-calculator`,
      jsonLd:[webAppSchema({ name:"Toll Calculator", description:"Free trip toll estimator", url:`${SITE_URL}/tools/toll-calculator` })],
    }) },
  { path:"/tools/dispute-tracker", head: buildHead({
      title:"FASTag dispute tracker — see your refund status in real-time",
      description:"Track NHAI + bank dispute resolution stages with one ref number.",
      canonical:`${SITE_URL}/tools/dispute-tracker`,
      jsonLd:[webAppSchema({ name:"FASTag Dispute Tracker", description:"Real-time dispute status", url:`${SITE_URL}/tools/dispute-tracker` })],
    }) },

  // Programmatic
  ...PLAZAS.map((p) => {
    const s = STATES.find((x) => x.slug === p.state);
    return { path:`/toll/${p.slug}`, head: buildHead({
      title:`${p.name} (${p.highway}) toll rates 2026`,
      description:`${p.name} on ${p.highway} at ${p.city}: live toll rates (car ₹${p.carRate}, truck ₹${p.truckRate}), complaint trends, verified Sathis on-spot.`,
      canonical:`${SITE_URL}/toll/${p.slug}`,
      keywords:`${p.name} toll, ${p.highway} toll rates, ${p.city} fastag help`,
      jsonLd:[placeSchema(p, s)],
    })};
  }),
  ...STATES.map((s) => ({ path:`/state/${s.slug}`, head: buildHead({
    title:`${s.name} toll plazas, FASTag help & Sathis`,
    description:`${s.plazaCount} toll plazas across ${s.name} covered by ${s.sathiCount} Sathis on ${s.highways.join(", ")}.`,
    canonical:`${SITE_URL}/state/${s.slug}`,
  })})),
  ...BANKS.map((b) => ({ path:`/bank/${b.slug}`, head: buildHead({
    title:`${b.name} balance check, helpline & dispute help`,
    description:`${b.name} balance check via SMS ${b.smsCode}, helpline ${b.helpline}, and on-spot rescue at any toll plaza.`,
    canonical:`${SITE_URL}/bank/${b.slug}`,
    keywords:`${b.name} balance check, ${b.name} helpline, ${b.name} dispute`,
  })})),
  ...BLOG_POSTS.map((post) => ({ path:`/blog/${post.slug}`, head: buildHead({
    title:`${post.title} · ApnaFastag Blog`,
    description:post.excerpt,
    canonical:`${SITE_URL}/blog/${post.slug}`,
    image:post.cover,
    jsonLd:[articleSchema(post)],
  })})),
];

/* ─── Emit ─── */

function emit() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`❌ build/index.html not found at ${TEMPLATE}`);
    console.error(`   Run "yarn build" first.`);
    process.exit(1);
  }
  let template = fs.readFileSync(TEMPLATE, "utf8");

  // Strip the CRA template's default title + description so our injected ones
  // are the only ones in the head (cleaner for crawlers).
  template = template
    .replace(/<title>[^<]*<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+name="theme-color"[^>]*>/i, '<meta name="theme-color" content="#FF6B00" />');

  let count = 0;
  for (const { path: route, head } of routes) {
    const html = template.replace(/<\/head>/i, `${head}\n  </head>`);
    const outDir = route === "/" ? BUILD_DIR : path.join(BUILD_DIR, route);
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, "index.html");
    if (route === "/") {
      fs.writeFileSync(path.join(BUILD_DIR, "index.html"), html);
    } else {
      fs.writeFileSync(outFile, html);
    }
    count++;
  }
  console.log(`✅ Prerendered ${count} routes`);
  console.log(`   Static HTML written under: ${BUILD_DIR}`);
  console.log(`   Sample: ${path.join(BUILD_DIR, "toll", "khalapur-nh48", "index.html")}`);
}

emit();
