#!/usr/bin/env node
/* eslint-disable */
/**
 * ApnaFastag — Static HTML prerenderer (SSG head injection)
 * ─────────────────────────────────────────────────────────
 * For every SEO-critical route, injects <title>, <meta>, canonical,
 * OG/Twitter tags, and JSON-LD structured data into the built HTML.
 *
 * Run automatically as part of `npm run build`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const TEMPLATE = path.join(BUILD_DIR, "index.html");

const SITE_URL = "https://www.apnafastag.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;
const DEFAULT_DESC = "India's first real-time peer-to-peer rescue network for FASTag chaos — disputes, KYC, recharge fails, emergency SOS. Verified Sathis at 60+ toll plazas.";

/* ─── Seed data (mirrors src/data/seed.js) ─── */

const STATES = [
  { slug:"maharashtra",  name:"Maharashtra", plazaCount:142, sathiCount:386, highways:["NH-48","NH-160","NH-66"] },
  { slug:"karnataka",    name:"Karnataka",   plazaCount:98,  sathiCount:221, highways:["NH-48","NH-44","NH-75"] },
  { slug:"haryana",      name:"Haryana",     plazaCount:67,  sathiCount:174, highways:["NH-44","NH-48","NH-19"] },
  { slug:"tamil-nadu",   name:"Tamil Nadu",  plazaCount:89,  sathiCount:198, highways:["NH-44","NH-32"] },
  { slug:"gujarat",      name:"Gujarat",     plazaCount:74,  sathiCount:156, highways:["NH-48","NH-27"] },
];

const PLAZAS = [
  { slug:"khalapur-nh48",        name:"Khalapur Plaza",        highway:"NH-48", state:"maharashtra", city:"Khalapur",  lat:18.81, lng:73.27, carRate:95,  truckRate:410, monthlyComplaints:1240 },
  { slug:"vashi-mmrda",          name:"Vashi MMRDA Plaza",     highway:"MMRDA", state:"maharashtra", city:"Vashi",     lat:19.07, lng:73.00, carRate:45,  truckRate:175, monthlyComplaints:890  },
  { slug:"lonavla-nh48",         name:"Lonavla Plaza",         highway:"NH-48", state:"maharashtra", city:"Lonavla",   lat:18.75, lng:73.41, carRate:95,  truckRate:410, monthlyComplaints:760  },
  { slug:"manesar-nh48",         name:"Manesar Plaza",         highway:"NH-48", state:"haryana",     city:"Manesar",   lat:28.36, lng:76.94, carRate:85,  truckRate:380, monthlyComplaints:1430 },
  { slug:"kherki-daula-nh48",    name:"Kherki Daula Plaza",    highway:"NH-48", state:"haryana",     city:"Gurugram",  lat:28.39, lng:76.93, carRate:27,  truckRate:145, monthlyComplaints:1180 },
  { slug:"zirakpur-nh44",        name:"Zirakpur Plaza",        highway:"NH-44", state:"haryana",     city:"Zirakpur",  lat:30.64, lng:76.82, carRate:110, truckRate:480, monthlyComplaints:540  },
  { slug:"athur-nh44",           name:"Athur Plaza",           highway:"NH-44", state:"tamil-nadu",  city:"Athur",     lat:12.59, lng:77.94, carRate:75,  truckRate:320, monthlyComplaints:410  },
  { slug:"electronic-city-nh44", name:"Electronic City Plaza", highway:"NH-44", state:"karnataka",   city:"Bengaluru", lat:12.84, lng:77.66, carRate:40,  truckRate:165, monthlyComplaints:680  },
  { slug:"vadodara-nh48",        name:"Vadodara Plaza",        highway:"NH-48", state:"gujarat",     city:"Vadodara",  lat:22.30, lng:73.20, carRate:95,  truckRate:410, monthlyComplaints:380  },
  { slug:"palwal-nh19",          name:"Palwal Plaza",          highway:"NH-19", state:"haryana",     city:"Palwal",    lat:28.14, lng:77.33, carRate:85,  truckRate:380, monthlyComplaints:510  },
];

const BANKS = [
  { slug:"sbi-fastag",   name:"SBI FASTag",        shortName:"SBI",   smsCode:"FTBAL",  helpline:"1800-11-0018"  },
  { slug:"paytm-fastag", name:"Paytm FASTag",      shortName:"Paytm", smsCode:"FT BAL", helpline:"1800-120-4210" },
  { slug:"icici-fastag", name:"ICICI FASTag",      shortName:"ICICI", smsCode:"FASTAG", helpline:"1800-2100-104" },
  { slug:"hdfc-fastag",  name:"HDFC FASTag",       shortName:"HDFC",  smsCode:"FASTAG", helpline:"1800-120-1243" },
  { slug:"axis-fastag",  name:"Axis FASTag",       shortName:"Axis",  smsCode:"FASTAG", helpline:"1860-419-8585" },
  { slug:"kotak-fastag", name:"Kotak FASTag",      shortName:"Kotak", smsCode:"FASTAG", helpline:"1800-209-0000" },
  { slug:"yes-fastag",   name:"Yes Bank FASTag",   shortName:"Yes",   smsCode:"FASTAG", helpline:"1800-1200"     },
  { slug:"idfc-fastag",  name:"IDFC First FASTag", shortName:"IDFC",  smsCode:"FASTAG", helpline:"1800-10-888"   },
];

const BLOG_POSTS = [
  { slug:"fastag-mischarge-refund-2026", title:"How to claim a FASTag mischarge refund in 2026 (step-by-step)",   excerpt:"The official NHAI dispute window is 7 days. Here's the exact process — and the 3 mistakes that get claims rejected.", date:"2026-01-14" },
  { slug:"fastag-blacklisted-fix",       title:"FASTag blacklisted? 4 reasons + the fastest fix at the plaza",   excerpt:"Low balance is just one of the four reasons. Two require a bank branch visit — unless your Sathi handles it on-spot.",   date:"2026-01-09" },
  { slug:"toll-charges-nh48-2026",       title:"All NH-48 toll charges (Mumbai → Bengaluru) — updated Jan 2026", excerpt:"Every plaza, every vehicle class, total trip cost. Bookmark this for every Mumbai-Pune-Bengaluru run.",                  date:"2026-01-03" },
  { slug:"how-to-become-fastag-sathi",   title:"Becoming a Fastag Sathi: ₹0 to ₹45,000/month in 60 days",       excerpt:"Real numbers from 12 Sathis at NH-48 plazas. Hours, payouts, what nobody tells you.",                                   date:"2025-12-28" },
];

const SATHIS = [
  { slug:"ravi-shinde-khalapur",   name:"Ravi Shinde",   city:"Khalapur",  state:"Maharashtra", plaza:"Khalapur Plaza",        rating:4.9, reviewCount:127 },
  { slug:"anil-bhau-lonavla",      name:"Anil Bhau",     city:"Lonavla",   state:"Maharashtra", plaza:"Lonavla Plaza",         rating:4.8, reviewCount:89  },
  { slug:"priya-pawar-vashi",      name:"Priya Pawar",   city:"Vashi",     state:"Maharashtra", plaza:"Vashi MMRDA Plaza",     rating:5.0, reviewCount:56  },
  { slug:"vikram-sharma-manesar",  name:"Vikram Sharma", city:"Manesar",   state:"Haryana",     plaza:"Manesar Plaza",         rating:4.7, reviewCount:203 },
  { slug:"lakshmi-iyer-bengaluru", name:"Lakshmi Iyer",  city:"Bengaluru", state:"Karnataka",   plaza:"Electronic City Plaza", rating:4.9, reviewCount:141 },
  { slug:"rajesh-kumar-zirakpur",  name:"Rajesh Kumar",  city:"Zirakpur",  state:"Haryana",     plaza:"Zirakpur Plaza",        rating:4.6, reviewCount:78  },
  { slug:"sanjana-rao-athur",      name:"Sanjana Rao",   city:"Athur",     state:"Tamil Nadu",  plaza:"Athur Plaza",           rating:4.9, reviewCount:63  },
  { slug:"deepak-patel-vadodara",  name:"Deepak Patel",  city:"Vadodara",  state:"Gujarat",     plaza:"Vadodara Plaza",        rating:4.7, reviewCount:45  },
];

// Known help slugs pre-rendered at build time
const HELP_SLUGS = [
  "what-is-fastag","fastag-mandatory","fastag-validity","fastag-wallet-balance",
  "fastag-negative-balance","fastag-not-scanned","fastag-deactivated",
  "fastag-linked-bank-change","fastag-sticker-position","nhai-helpline-number",
  "fastag-reissue-process","fastag-mischarge-timeline","fastag-refund-status-check",
  "fastag-hotlisted","fastag-autopay-setup","fastag-upi-recharge",
  "fastag-net-banking-recharge","fastag-transaction-history","fastag-expiry-renewal",
  "sbi-fastag-balance-check","sbi-fastag-dispute","sbi-fastag-blacklist-fix","sbi-fastag-kyc-update",
  "paytm-fastag-balance-check","paytm-fastag-dispute","paytm-fastag-blacklist-fix","paytm-fastag-kyc-update",
  "icici-fastag-balance-check","icici-fastag-dispute","icici-fastag-blacklist-fix",
  "hdfc-fastag-balance-check","hdfc-fastag-dispute","hdfc-fastag-blacklist-fix",
  "axis-fastag-balance-check","axis-fastag-dispute",
  "kotak-fastag-balance-check","yes-fastag-balance-check","idfc-fastag-balance-check",
  "maharashtra-fastag-dispute","maharashtra-fastag-blacklist","maharashtra-fastag-balance-check",
  "karnataka-fastag-dispute","karnataka-fastag-blacklist",
  "haryana-fastag-dispute","haryana-fastag-blacklist",
  "tamil-nadu-fastag-dispute","gujarat-fastag-dispute",
  "delhi-fastag-dispute","uttar-pradesh-fastag-dispute",
  "car-fastag-installation","truck-fastag-installation","bus-fastag-installation",
  "car-fastag-not-working","truck-fastag-not-working",
];

/* ─── Schema builders ─── */

const orgSchema = {
  "@context":"https://schema.org","@type":"Organization",
  name:"ApnaFastag", url:SITE_URL,
  logo:{ "@type":"ImageObject", url:`${SITE_URL}/logo.png`, width:200, height:60 },
  sameAs:["https://twitter.com/apnafastag","https://www.instagram.com/apnafastag","https://www.youtube.com/@apnafastag"],
  contactPoint:{ "@type":"ContactPoint", telephone:"+91-1800-000-0000", contactType:"customer support", areaServed:"IN", availableLanguage:["en","hi","mr","ta","te","kn"] },
  foundingDate:"2025", description:DEFAULT_DESC,
};

const websiteSchema = {
  "@context":"https://schema.org","@type":"WebSite",
  name:"ApnaFastag", url:SITE_URL, description:DEFAULT_DESC, inLanguage:"en-IN",
  potentialAction:{ "@type":"SearchAction", target:{ "@type":"EntryPoint", urlTemplate:`${SITE_URL}/help?search={search_term_string}` }, "query-input":"required name=search_term_string" },
};

const serviceSchema = {
  "@context":"https://schema.org","@type":"Service",
  name:"FASTag Rescue by Sathi", serviceType:"FASTag Issue Resolution", provider:orgSchema,
  areaServed:{ "@type":"Country", name:"India" },
  description:"Verified Sathis resolve FASTag disputes, KYC, blacklist, recharge failures, and SOS at toll plazas across India — usually in under 8 minutes.",
  offers:{ "@type":"Offer", price:"49", priceCurrency:"INR", description:"Pay only when your FASTag issue is resolved" },
};

const homepageFaqSchema = {
  "@context":"https://schema.org","@type":"FAQPage",
  mainEntity:[
    { "@type":"Question", name:"What is ApnaFastag?", acceptedAnswer:{ "@type":"Answer", text:"ApnaFastag is India's first peer-to-peer FASTag rescue network. Verified local experts called Sathis resolve FASTag disputes, KYC, blacklist, and recharge issues on-spot at toll plazas — usually in under 8 minutes." }},
    { "@type":"Question", name:"How much does it cost to use ApnaFastag?", acceptedAnswer:{ "@type":"Answer", text:"ApnaFastag charges ₹49 to ₹499 per job depending on the issue type. You only pay after your problem is resolved. No subscription fees." }},
    { "@type":"Question", name:"Which toll plazas are covered by ApnaFastag?", acceptedAnswer:{ "@type":"Answer", text:"ApnaFastag covers 60+ toll plazas across India on NH-48, NH-44, NH-19 and state highways in Maharashtra, Haryana, Karnataka, Gujarat, and Tamil Nadu." }},
    { "@type":"Question", name:"What FASTag issues can a Sathi resolve?", acceptedAnswer:{ "@type":"Answer", text:"Sathis resolve FASTag disputes and refunds, blacklist removal, KYC updates, RC mismatch, recharge failures, double deductions, and emergency SOS at toll plazas." }},
    { "@type":"Question", name:"How do I become a FASTag Sathi?", acceptedAnswer:{ "@type":"Answer", text:"Apply on the Become a Sathi page. You need to be near a toll plaza and pass a short verification. Sathis earn ₹25,000–₹60,000 per month." }},
  ],
};

function placeSchema(p, s) {
  return {
    "@context":"https://schema.org","@type":"Place",
    name:`${p.name} — Toll Plaza on ${p.highway}`,
    description:`${p.name} on ${p.highway} in ${p.city}${s?`, ${s.name}`:""}. Car toll ₹${p.carRate}, truck toll ₹${p.truckRate}.`,
    geo:{ "@type":"GeoCoordinates", latitude:p.lat, longitude:p.lng },
    address:{ "@type":"PostalAddress", addressLocality:p.city, addressRegion:s?.name||"India", addressCountry:"IN" },
    containedInPlace:{ "@type":"Road", name:p.highway },
    url:`${SITE_URL}/toll/${p.slug}`,
    hasMap:`https://www.google.com/maps?q=${p.lat},${p.lng}`,
  };
}

function articleSchema(post) {
  return {
    "@context":"https://schema.org","@type":"Article",
    headline:post.title, description:post.excerpt,
    image:DEFAULT_IMAGE, datePublished:post.date, dateModified:post.date,
    author:{ "@type":"Organization", name:"ApnaFastag", url:SITE_URL },
    publisher:{ "@type":"Organization", name:"ApnaFastag", logo:{ "@type":"ImageObject", url:`${SITE_URL}/logo.png` } },
    mainEntityOfPage:`${SITE_URL}/blog/${post.slug}`, inLanguage:"en-IN",
  };
}

function sathiSchema(s) {
  return {
    "@context":"https://schema.org","@type":"Person",
    name:s.name, jobTitle:"Verified FASTag Sathi",
    description:`${s.name} is a verified FASTag Sathi at ${s.plaza}, ${s.city}, ${s.state}. Rated ${s.rating}/5 from ${s.reviewCount} reviews.`,
    url:`${SITE_URL}/sathi/${s.slug}`, worksFor:orgSchema,
    address:{ "@type":"PostalAddress", addressLocality:s.city, addressRegion:s.state, addressCountry:"IN" },
    aggregateRating:{ "@type":"AggregateRating", ratingValue:s.rating, reviewCount:s.reviewCount, bestRating:5, worstRating:1 },
  };
}

function webAppSchema({ name, description, url }) {
  return { "@context":"https://schema.org","@type":"WebApplication", name, description, url, applicationCategory:"UtilityApplication", operatingSystem:"Any", inLanguage:"en-IN", offers:{ "@type":"Offer", price:"0", priceCurrency:"INR" } };
}

function breadcrumb(items) {
  return { "@context":"https://schema.org","@type":"BreadcrumbList", itemListElement:items.map((it,i)=>({ "@type":"ListItem", position:i+1, name:it.name, item:it.url })) };
}

/* ─── HTML head builder ─── */

function esc(s="") {
  return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function buildHead({ title, description=DEFAULT_DESC, canonical, image=DEFAULT_IMAGE, keywords, jsonLd=[] }) {
  const t = title.includes("ApnaFastag") ? title : `${title} · ApnaFastag`;
  const lds = jsonLd.map(ld=>`<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n    ");
  return `
    <!-- SSG prerendered -->
    <title>${esc(t)}</title>
    <meta name="description" content="${esc(description)}" />
    ${keywords?`<meta name="keywords" content="${esc(keywords)}" />`:""}
    <link rel="canonical" href="${canonical}" />
    <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="ApnaFastag" />
    <meta property="og:title" content="${esc(t)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:image" content="${image}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@apnafastag" />
    <meta name="twitter:title" content="${esc(t)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${image}" />
    ${lds}
  `.trim();
}

/* ─── Route manifest ─── */

const routes = [
  { path:"/", head: buildHead({
    title:"ApnaFastag — Stuck at a toll? Your Sathi arrives in 90 seconds.",
    description:DEFAULT_DESC, canonical:`${SITE_URL}/`,
    keywords:"fastag help, fastag dispute, fastag sathi, fastag rescue, toll plaza help india",
    jsonLd:[orgSchema, websiteSchema, serviceSchema, homepageFaqSchema],
  })},
  { path:"/find", head: buildHead({ title:"Find a FASTag Sathi near you — live map across India", description:"See verified FASTag Sathis around you on a live map. Pick by toll plaza or agent. Login with mobile OTP.", canonical:`${SITE_URL}/find`, keywords:"find fastag sathi near me, fastag help near me, toll plaza assistance" }) },
  { path:"/how-it-works", head: buildHead({ title:"How ApnaFastag works — from stuck to sorted in 8 minutes", canonical:`${SITE_URL}/how-it-works` }) },
  { path:"/features", head: buildHead({ title:"Features — FASTag dispute, KYC, SOS rescue at toll plazas", canonical:`${SITE_URL}/features` }) },
  { path:"/pricing", head: buildHead({ title:"Pricing — Pay only when your FASTag issue is fixed. From ₹49.", description:"ApnaFastag charges ₹49–₹499 per resolved issue. No subscription. No hidden fees.", canonical:`${SITE_URL}/pricing` }) },
  { path:"/become-a-sathi", head: buildHead({ title:"Become a FASTag Sathi — earn ₹25k–₹60k/month at your toll", description:"Join India's fastest-growing toll plaza network. Verify once, earn every day resolving FASTag issues.", canonical:`${SITE_URL}/become-a-sathi`, keywords:"become fastag sathi, fastag agent income, toll plaza job" }) },
  { path:"/coverage", head: buildHead({ title:"Coverage — 60+ toll plazas across India with verified Sathis", canonical:`${SITE_URL}/coverage` }) },
  { path:"/about", head: buildHead({ title:"About ApnaFastag — built by drivers, for drivers", canonical:`${SITE_URL}/about` }) },
  { path:"/blog", head: buildHead({ title:"Blog — FASTag fixes, toll rates, Sathi guides", canonical:`${SITE_URL}/blog` }) },
  { path:"/help", head: buildHead({ title:"FASTag Help Center — 1000+ guides & answers", description:"Find answers to every FASTag question — disputes, blacklist, KYC, recharge, balance check. Guides for all 8 banks and all states.", canonical:`${SITE_URL}/help`, keywords:"fastag help, fastag faq, fastag guide, fastag problems" }) },
  { path:"/contact", head: buildHead({ title:"Contact ApnaFastag", canonical:`${SITE_URL}/contact` }) },
  { path:"/careers", head: buildHead({ title:"Careers — build India's toll rescue layer", canonical:`${SITE_URL}/careers` }) },
  { path:"/press", head: buildHead({ title:"Press kit — logos, brand assets", canonical:`${SITE_URL}/press` }) },
  { path:"/privacy", head: buildHead({ title:"Privacy Policy", canonical:`${SITE_URL}/privacy` }) },
  { path:"/terms", head: buildHead({ title:"Terms of Service", canonical:`${SITE_URL}/terms` }) },
  { path:"/refund-policy", head: buildHead({ title:"Refund Policy", canonical:`${SITE_URL}/refund-policy` }) },
  { path:"/tools/fastag-balance-check", head: buildHead({ title:"FASTag balance check — free tool for all banks", description:"Check your FASTag balance instantly. Works for SBI, Paytm, ICICI, HDFC, Axis, Kotak, Yes Bank, IDFC. Free.", canonical:`${SITE_URL}/tools/fastag-balance-check`, keywords:"fastag balance check, sbi fastag balance, paytm fastag balance, icici fastag balance", jsonLd:[webAppSchema({ name:"FASTag Balance Checker", description:"Free FASTag balance lookup for all Indian banks", url:`${SITE_URL}/tools/fastag-balance-check` })] }) },
  { path:"/tools/toll-calculator", head: buildHead({ title:"Toll calculator India — estimate trip toll for any highway", description:"Estimate total toll charges for any route in India. Updated 2026 rates for NH-48, NH-44, NH-19.", canonical:`${SITE_URL}/tools/toll-calculator`, keywords:"toll calculator india, nh48 toll, highway toll rates 2026", jsonLd:[webAppSchema({ name:"Toll Calculator India", description:"Free highway toll cost estimator", url:`${SITE_URL}/tools/toll-calculator` })] }) },
  { path:"/tools/dispute-tracker", head: buildHead({ title:"FASTag dispute tracker — check NHAI refund status", description:"Track NHAI and bank FASTag dispute resolution in real-time using your reference number.", canonical:`${SITE_URL}/tools/dispute-tracker`, keywords:"fastag dispute tracker, nhai dispute status, fastag refund status", jsonLd:[webAppSchema({ name:"FASTag Dispute Tracker", description:"Real-time FASTag dispute and refund status tracker", url:`${SITE_URL}/tools/dispute-tracker` })] }) },
  { path:"/tools/fastag-status", head: buildHead({ title:"FASTag status check — active, blacklisted or blocked?", description:"Check your FASTag tag status instantly using your vehicle number. Free tool.", canonical:`${SITE_URL}/tools/fastag-status`, keywords:"fastag status check, fastag active check, fastag blacklist check", jsonLd:[webAppSchema({ name:"FASTag Status Checker", description:"Check if your FASTag is active, blacklisted or blocked", url:`${SITE_URL}/tools/fastag-status` })] }) },

  ...PLAZAS.map(p => {
    const s = STATES.find(x=>x.slug===p.state);
    return { path:`/toll/${p.slug}`, head: buildHead({
      title:`${p.name} (${p.highway}) toll rates 2026 — FASTag help & Sathi`,
      description:`${p.name} on ${p.highway} at ${p.city}: car ₹${p.carRate}, truck ₹${p.truckRate}. ${p.monthlyComplaints}+ monthly complaints. Verified Sathis available on-spot.`,
      canonical:`${SITE_URL}/toll/${p.slug}`,
      keywords:`${p.name} toll rate, ${p.highway} toll ${p.city}, fastag help ${p.city}`,
      jsonLd:[placeSchema(p,s), breadcrumb([{name:"Coverage",url:`${SITE_URL}/coverage`},{name:p.name}])],
    })};
  }),

  ...STATES.map(s => ({ path:`/state/${s.slug}`, head: buildHead({
    title:`${s.name} toll plazas 2026 — FASTag help & verified Sathis`,
    description:`${s.plazaCount} toll plazas across ${s.name} covered by ${s.sathiCount} verified Sathis on ${s.highways.join(", ")}. Resolve FASTag issues on-spot.`,
    canonical:`${SITE_URL}/state/${s.slug}`,
    keywords:`${s.name} toll plazas, fastag help ${s.name}, ${s.highways.join(" ")} toll rates`,
  })})),

  ...BANKS.map(b => ({ path:`/bank/${b.slug}`, head: buildHead({
    title:`${b.name} balance check, helpline & dispute help`,
    description:`${b.name}: check balance via SMS code ${b.smsCode}, call helpline ${b.helpline}, or get on-spot Sathi rescue at any toll plaza.`,
    canonical:`${SITE_URL}/bank/${b.slug}`,
    keywords:`${b.name} balance check, ${b.name} helpline, ${b.name} dispute, ${b.shortName} fastag customer care`,
  })})),

  ...BLOG_POSTS.map(post => ({ path:`/blog/${post.slug}`, head: buildHead({
    title:post.title, description:post.excerpt,
    canonical:`${SITE_URL}/blog/${post.slug}`, image:DEFAULT_IMAGE,
    jsonLd:[articleSchema(post), breadcrumb([{name:"Blog",url:`${SITE_URL}/blog`},{name:post.title}])],
  })})),

  ...SATHIS.map(s => ({ path:`/sathi/${s.slug}`, head: buildHead({
    title:`${s.name} — Verified FASTag Sathi at ${s.plaza}, ${s.city}`,
    description:`${s.name} is a verified FASTag Sathi at ${s.plaza}, ${s.city}, ${s.state}. Rated ${s.rating}/5 from ${s.reviewCount} reviews. Book for disputes, KYC, blacklist fix.`,
    canonical:`${SITE_URL}/sathi/${s.slug}`,
    keywords:`fastag sathi ${s.city}, fastag help ${s.plaza}, ${s.name} fastag`,
    jsonLd:[sathiSchema(s), breadcrumb([{name:"Find a Sathi",url:`${SITE_URL}/find`},{name:s.name}])],
  })})),

  ...HELP_SLUGS.map(slug => ({ path:`/help/${slug}`, head: buildHead({
    title:`${slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} — FASTag Guide`,
    description:`Complete guide for ${slug.replace(/-/g," ")}. Step-by-step instructions for Indian FASTag users, with Sathi rescue option at any toll plaza.`,
    canonical:`${SITE_URL}/help/${slug}`,
    keywords:`${slug.replace(/-/g," ")}, fastag guide, fastag help india`,
  })})),
];

/* ─── Emit ─── */

function emit() {
  if (!fs.existsSync(TEMPLATE)) {
    console.error(`❌ build/index.html not found. Run npm run build first.`);
    process.exit(1);
  }
  let template = fs.readFileSync(TEMPLATE, "utf8");
  template = template
    .replace(/<title>[^<]*<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+name="theme-color"[^>]*>/i, '<meta name="theme-color" content="#FF6B00" />');

  let count = 0;
  for (const { path: route, head } of routes) {
    const html = template.replace(/<\/head>/i, `${head}\n  </head>`);
    if (route === "/") {
      fs.writeFileSync(path.join(BUILD_DIR, "index.html"), html);
    } else {
      const outDir = path.join(BUILD_DIR, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
    }
    count++;
  }
  console.log(`✅ Prerendered ${count} routes → ${BUILD_DIR}`);
}

emit();
