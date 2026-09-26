/**
 * Production server for apnafastag.com (systemd apnafastag-frontend on the GV Partner host).
 *
 * Responsibilities:
 *   1. Proxy /api/* and /uploads/* to the FastAPI backend.
 *   2. Serve the React build from ./build/.
 *   3. Send every visitor, crawler or not, HTML that already contains the page's own content:
 *        - prerendered pages (build/<path>/index.html) as they are;
 *        - data pages (/help, /toll, /city, /state, /sathi, …) rendered here from the same
 *          API data the React page loads, so the first HTML is never the homepage;
 *        - unknown paths get a real 404, and redirect-only SPA routes get a 301.
 *      React then takes over the page as before.
 *
 * Zero external dependencies — only Node.js built-ins.
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT      = process.env.PORT || 3000;
// Bind address — set HOST=127.0.0.1 when nginx on the same host is the only client.
const HOST      = process.env.HOST || undefined;
// Backend origin — env-configurable so the same code runs on the server or locally.
const BACKEND        = process.env.BACKEND_HOST   || "127.0.0.1";
const BACKEND_PORT   = parseInt(process.env.BACKEND_PORT || "8000", 10);
const BACKEND_SCHEME = process.env.BACKEND_SCHEME || "http";
const backendLib     = BACKEND_SCHEME === "http" ? http : https;
const SITE      = "https://apnafastag.com";
const BUILD_DIR = path.join(__dirname, "build");
const DEFAULT_OG_IMAGE = `${SITE}/og-default.png`;

const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "text/javascript",
  ".css":   "text/css",
  ".json":  "application/json",
  ".xml":   "application/xml",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".gif":   "image/gif",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".txt":   "text/plain",
  ".webp":  "image/webp",
  ".map":   "application/json",
};

// Headers that must NOT be forwarded between proxy hops (RFC 2616 §13.5.1)
const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailers", "transfer-encoding", "upgrade",
]);

// ── Fetch JSON from backend API ───────────────────────────────────────────────
// Resolves: parsed JSON on 200, NOT_FOUND on a definitive backend 404, and
// null on transient failures (timeout, network error, 5xx). Callers must not
// treat null as "does not exist" — only NOT_FOUND is a safe 404 signal.
const NOT_FOUND = Symbol("not-found");
function fetchBackend(apiPath) {
  return new Promise((resolve) => {
    const req = backendLib.request(
      { hostname: BACKEND, port: BACKEND_PORT, path: apiPath, method: "GET",
        headers: { "accept": "application/json" }, timeout: 5000 },
      (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => {
          if (res.statusCode === 404) { resolve(NOT_FOUND); return; }
          try { resolve(res.statusCode === 200 ? JSON.parse(body) : null); }
          catch { resolve(null); }
        });
      }
    );
    req.on("timeout", () => { req.destroy(); resolve(null); });
    req.on("error",   () => resolve(null));
    req.end();
  });
}

// Small TTL cache so crawls don't hit the backend for every page view.
// Only definitive answers (data or NOT_FOUND) are cached; failures are retried.
const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX    = 5000;
const cache = new Map();
async function api(apiPath) {
  const hit = cache.get(apiPath);
  if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.v;
  const v = await fetchBackend(apiPath);
  if (v !== null) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
    cache.set(apiPath, { t: Date.now(), v });
  }
  return v;
}
const ok = (v) => v && v !== NOT_FOUND;

// ── HTML helpers ──────────────────────────────────────────────────────────────
function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
const titleCase = (s) => String(s || "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const clip = (s, n) => { s = String(s || "").replace(/\s+/g, " ").trim(); return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s; };
const stripTags = (h) => String(h || "").replace(/<[^>]+>/g, " ");
const jsonLd = (o) => `<script type="application/ld+json">${JSON.stringify(o).replace(/</g, "\\u003c")}</script>`;

function headTags({ title, description, url, robots = "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1",
                    type = "website", image = DEFAULT_OG_IMAGE, ld = [] }) {
  const t = esc(title), d = esc(description), u = esc(url), i = esc(image);
  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <link rel="canonical" href="${u}" />
    <meta name="robots" content="${esc(robots)}" />
    <meta property="og:type" content="${esc(type)}" />
    <meta property="og:site_name" content="ApnaFastag" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:url" content="${u}" />
    <meta property="og:image" content="${i}" />
    <meta property="og:locale" content="en_IN" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${i}" />
    ${ld.filter(Boolean).map(jsonLd).join("\n    ")}`;
}

const breadcrumbLd = (items) => ({
  "@context": "https://schema.org", "@type": "BreadcrumbList",
  itemListElement: items.map(([name, url], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE}${url}` })),
});

// Plain, readable markup; React replaces it with the designed page once it loads.
const A = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`;
function layout(crumbs, inner) {
  const trail = crumbs.map(([name, url], i) => i === crumbs.length - 1 ? `<span>${esc(name)}</span>` : A(url, name)).join(" › ");
  return `<div style="font-family:system-ui,sans-serif;max-width:820px;margin:0 auto;padding:32px 20px;color:#1F2937;line-height:1.65">
  <header><nav>${A("/", "ApnaFastag")} · ${A("/find", "Find a Sathi")} · ${A("/help", "Help Center")} · ${A("/coverage", "Coverage")} · ${A("/tools/fastag-status", "FASTag status")} · ${A("/buy-fastag", "Buy FASTag")}</nav>
  <nav aria-label="Breadcrumb" style="font-size:.85rem;margin:16px 0">${trail}</nav></header>
  <main>${inner}</main>
  <footer style="margin-top:40px;font-size:.85rem"><nav>${A("/about", "About")} · ${A("/pricing", "Pricing")} · ${A("/become-a-sathi", "Become a Sathi")} · ${A("/blog", "Blog")} · ${A("/contact", "Contact")} · ${A("/privacy", "Privacy")} · ${A("/terms", "Terms")}</nav></footer>
</div>`;
}
const list = (items) => items.length ? `<ul>${items.map((x) => `<li>${x}</li>`).join("")}</ul>` : "";
const rupees = (v) => (Number(v) > 0 ? `₹${Number(v).toLocaleString("en-IN")}` : "—");
const kmText = (km) => (km < 1 ? "less than 1 km" : `${Math.round(km)} km`);

// ── Page shell ────────────────────────────────────────────────────────────────
// build/shell.html is the built index.html without any page's head or body (written by
// scripts/prerender.mjs). Older builds don't have it, so derive it from index.html.
let SHELL = null;
function shell() {
  if (SHELL) return SHELL;
  try {
    SHELL = fs.readFileSync(path.join(BUILD_DIR, "shell.html"), "utf8");
  } catch {
    const idx = fs.readFileSync(path.join(BUILD_DIR, "index.html"), "utf8");
    SHELL = idx
      .replace(/<!-- SSG prerendered -->[\s\S]*?(?=<\/head>)/i, "")
      .replace(/<div id="root" data-ssg="1">[\s\S]*?<\/main><\/div>/, '<div id="root"></div>');
  }
  return SHELL;
}
function renderPage(head, body) {
  return shell()
    .replace(/<\/head>/i, () => `${head}\n  </head>`)
    .replace('<div id="root"></div>', () => `<div id="root" data-ssg="1">${body}</div>`);
}
function sendHtml(res, status, html, extra = {}) {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "public, max-age=0, must-revalidate",
    ...extra,
  });
  res.end(html);
}
function sendNotFound(res, pathname) {
  const head = headTags({ title: "Page not found · ApnaFastag", description: "This page does not exist on ApnaFastag.",
                          url: `${SITE}${pathname}`, robots: "noindex,follow" });
  const body = layout([["Home", "/"], ["Not found", pathname]],
    `<h1>Page not found</h1><p>This page does not exist. Try the ${A("/help", "Help Center")}, ${A("/coverage", "toll plaza coverage")} or ${A("/", "the home page")}.</p>`);
  sendHtml(res, 404, renderPage(head, body));
}

// ── Page renderers (data comes from the same API the React pages use) ─────────

async function renderHelp(slug) {
  const a = await api(`/api/help/${encodeURIComponent(slug)}`);
  if (!ok(a)) return a;
  const url = `${SITE}/help/${slug}`;
  const faqs = (a.faq_pairs || []).filter((f) => f && f.q && f.a);
  const desc = clip(a.meta_description || a.excerpt || stripTags(a.body), 160);
  const related = [];
  if (a.related_bank)  related.push(A(`/bank/${a.related_bank}`, `${a.related_bank.replace(/-fastag$/, "").toUpperCase()} FASTag`));
  if (a.related_state) related.push(A(`/state/${a.related_state}`, `${titleCase(a.related_state)} toll plazas`));
  const head = headTags({
    title: `${a.meta_title || a.title} · ApnaFastag Help`, description: desc, url, type: "article", image: a.cover || DEFAULT_OG_IMAGE,
    ld: [
      { "@context": "https://schema.org", "@type": "Article", headline: clip(a.title, 110), description: desc,
        datePublished: a.created_at, dateModified: a.updated_at || a.created_at, mainEntityOfPage: url,
        author: { "@type": "Organization", name: "ApnaFastag" }, publisher: { "@type": "Organization", name: "ApnaFastag", url: SITE } },
      faqs.length ? { "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } : null,
      breadcrumbLd([["Home", "/"], ["Help Center", "/help"], [a.title, `/help/${slug}`]]),
    ],
  });
  const body = layout([["Home", "/"], ["Help Center", "/help"], [a.title, `/help/${slug}`]],
    `<article><h1>${esc(a.title)}</h1>
     ${a.excerpt ? `<p><strong>${esc(a.excerpt)}</strong></p>` : ""}
     ${a.body || ""}
     ${faqs.length ? `<h2>Frequently asked questions</h2>${faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("")}` : ""}
     ${related.length ? `<h2>Related</h2>${list(related)}` : ""}
     <p>${A("/help", "Browse all FASTag guides")} · ${A("/find", "Find a Sathi")}</p></article>`);
  return { head, body };
}

async function renderToll(slug) {
  const p = await api(`/api/plazas/${encodeURIComponent(slug)}`);
  if (!ok(p)) return p;
  const near = await api(`/api/plazas/${encodeURIComponent(slug)}/nearby`);
  const st = p.state ? await api(`/api/states/${encodeURIComponent(p.state)}`) : null;
  const stateName = ok(st) ? st.name : (p.state_name || titleCase(p.state));
  const known = p.ratesKnown !== false;
  const url = `${SITE}/toll/${slug}`;
  const where = [p.city, stateName].filter(Boolean).join(", ");
  const crumbs = [["Home", "/"], ["Coverage", "/coverage"], ...(p.state ? [[stateName, `/state/${p.state}`]] : []), [p.name, `/toll/${slug}`]];
  const head = headTags({
    title: `${p.name} (${p.highway || "NHAI"}) toll rates 2026 · ApnaFastag`,
    description: known
      ? `${p.name} on ${p.highway || "highway"} at ${p.city}: car ₹${p.carRate}, truck ₹${p.truckRate}, FASTag dispute help and nearby toll plazas.`
      : `${p.name} toll plaza near ${where}: location, FASTag help guides, and the nearest toll plazas.`,
    url,
    ld: [
      { "@context": "https://schema.org", "@type": "Place", name: `${p.name} toll plaza`, url,
        address: { "@type": "PostalAddress", addressLocality: p.city, addressRegion: stateName, postalCode: p.pin_code, addressCountry: "IN" },
        ...(typeof p.lat === "number" ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lng } } : {}) },
      breadcrumbLd(crumbs),
    ],
  });
  const facts = [
    `<li>Location: ${esc(where)}${p.pin_code ? ` – PIN ${esc(p.pin_code)}` : ""}</li>`,
    `<li>Highway / operator: ${esc(p.highway || "—")}</li>`,
    known ? `<li>Car, jeep, van: ${rupees(p.carRate)} per crossing</li><li>Truck / bus: ${rupees(p.truckRate)} per crossing</li>` : `<li>Rates: check the board at the plaza</li>`,
    typeof p.lat === "number" ? `<li>Coordinates: ${p.lat.toFixed(4)}° N, ${p.lng.toFixed(4)}° E</li>` : "",
  ].join("");
  const guides = ok(near) ? (near.guides || []) : [];
  const nearby = ok(near) ? (near.plazas || []) : [];
  const sathis = ok(near) ? (near.sathis || []).filter((s) => s.km <= 50) : [];
  const body = layout(crumbs,
    `<h1>${esc(p.name)}</h1><p>${esc([p.highway, where].filter(Boolean).join(" · "))}</p>
     <h2>At a glance</h2><ul>${facts}</ul>
     ${guides.length ? `<h2>FASTag help at ${esc(p.name)}</h2>${list(guides.map((g) => A(`/help/${g.slug}`, g.title)))}` : ""}
     ${sathis.length ? `<h2>Verified Sathis nearby</h2>${list(sathis.map((s) => `${A(`/sathi/${s.slug}`, s.name)} – ${esc(s.city || "")}, ${kmText(s.km)}`))}` : ""}
     ${nearby.length ? `<h2>Toll plazas near ${esc(p.name)}</h2>${list(nearby.map((n) => `${A(`/toll/${n.slug}`, n.name)} – ${esc(n.city || "")}, ${kmText(n.km)}`))}` : ""}
     ${p.state ? `<p>${A(`/state/${p.state}`, `All toll plazas in ${stateName}`)}</p>` : ""}`);
  return { head, body };
}

async function renderState(slug) {
  const s = await api(`/api/states/${encodeURIComponent(slug)}`);
  if (!ok(s)) return s;
  const [plazas, sathis] = await Promise.all([api(`/api/plazas?state=${encodeURIComponent(slug)}`), api(`/api/sathis`)]);
  const pl = ok(plazas) ? plazas.slice().sort((a, b) => String(a.name).localeCompare(b.name)) : [];
  const sa = ok(sathis) ? sathis.filter((x) => x.verified && x.state === slug) : [];
  const url = `${SITE}/state/${slug}`;
  const crumbs = [["Home", "/"], ["Coverage", "/coverage"], [s.name, `/state/${slug}`]];
  const head = headTags({
    title: `${s.name} toll plazas, FASTag help & Sathis · ApnaFastag`,
    description: `${pl.length || s.plazaCount || "All"} toll plazas in ${s.name}${(s.highways || []).length ? ` on ${s.highways.join(", ")}` : ""}: FASTag dispute, blacklist and recharge help, plaza by plaza.`,
    url, ld: [breadcrumbLd(crumbs)],
  });
  const body = layout(crumbs,
    `<h1>${esc(s.name)} — FASTag help &amp; toll plazas</h1>
     <p>${pl.length} toll plazas listed in ${esc(s.name)}${sa.length ? `, ${sa.length} verified Sathi${sa.length === 1 ? "" : "s"}` : ""}.</p>
     ${sa.length ? `<h2>Verified Sathis in ${esc(s.name)}</h2>${list(sa.map((x) => `${A(`/sathi/${x.slug}`, x.name)} – ${esc(x.city || "")}`))}` : ""}
     <h2>FASTag guides for ${esc(s.name)}</h2>
     ${list([["fastag-dispute", "FASTag dispute & refund"], ["fastag-blacklist", "Blacklist fix"], ["fastag-recharge", "Recharge options"], ["fastag-kyc-guide", "KYC update"]]
        .map(([k, l]) => A(`/help/${slug}-${k}`, `${l} in ${s.name}`)))}
     ${pl.length ? `<h2>Toll plazas in ${esc(s.name)}</h2>${list(pl.map((p) => `${A(`/toll/${p.slug}`, p.name)} – ${esc(p.city || "")}`))}` : ""}`);
  return { head, body };
}

async function renderCity(slug) {
  const c = await api(`/api/cities/${encodeURIComponent(slug)}`);
  if (!ok(c)) return c;
  const plazas = c.state ? await api(`/api/plazas?state=${encodeURIComponent(c.state)}`) : null;
  const cityName = String(c.name || "").toLowerCase();
  const inCity = ok(plazas) ? plazas.filter((p) => String(p.city || "").toLowerCase() === cityName) : [];
  const stateName = titleCase(c.state);
  const url = `${SITE}/city/${slug}`;
  const crumbs = [["Home", "/"], ["Coverage", "/coverage"], ...(c.state ? [[stateName, `/state/${c.state}`]] : []), [c.name, `/city/${slug}`]];
  const head = headTags({
    title: `FASTag help in ${c.name} — Sathis at ${c.plazaCount || 0} toll plazas`,
    description: clip(c.meta_description || `FASTag disputes, blacklist and KYC help in ${c.name}${c.state ? `, ${stateName}` : ""}, with the toll plazas around the city.`, 160),
    url, ld: [breadcrumbLd(crumbs)],
  });
  const body = layout(crumbs,
    `<h1>FASTag help in ${esc(c.name)}</h1>
     ${c.content_body || `<p>FASTag disputes, blacklist and KYC help for drivers in and around ${esc(c.name)}.</p>`}
     ${inCity.length ? `<h2>Toll plazas in ${esc(c.name)}</h2>${list(inCity.map((p) => A(`/toll/${p.slug}`, p.name)))}` : ""}
     ${c.state ? `<p>${A(`/state/${c.state}`, `All toll plazas in ${stateName}`)}</p>` : ""}`);
  return { head, body };
}

async function renderBank(slug) {
  const b = await api(`/api/banks/${encodeURIComponent(slug)}`);
  if (!ok(b)) return b;
  if (!b.name) return NOT_FOUND;
  const url = `${SITE}/bank/${slug}`;
  const crumbs = [["Home", "/"], [b.name, `/bank/${slug}`]];
  const head = headTags({
    title: `${b.name} balance check, helpline & dispute help · ApnaFastag`,
    description: `${b.name}: ${b.smsCode ? `balance by SMS ${b.smsCode}, ` : ""}${b.helpline ? `helpline ${b.helpline}, ` : ""}dispute and blacklist guides.`,
    url, ld: [breadcrumbLd(crumbs)],
  });
  const topics = [["balance-check", "Check balance"], ["recharge", "Recharge"], ["dispute", "File a dispute"], ["blacklist-fix", "Fix a blacklisted tag"],
                  ["kyc-update", "KYC update"], ["rc-mismatch", "RC mismatch"], ["lost-fastag", "Lost FASTag"], ["helpline", "Customer care"]];
  const body = layout(crumbs,
    `<h1>${esc(b.name)} — balance check, helpline &amp; dispute help</h1>
     <ul>${b.helpline ? `<li>Customer care: ${esc(b.helpline)}</li>` : ""}${b.smsCode ? `<li>Balance by SMS: ${esc(b.smsCode)}</li>` : ""}<li>NHAI helpline: 1033</li></ul>
     <h2>${esc(b.name)} guides</h2>${list(topics.map(([k, l]) => A(`/help/${slug}-${k}`, `${l} – ${b.name}`)))}`);
  return { head, body };
}

async function renderHighway(slug) {
  const h = await api(`/api/highways/${encodeURIComponent(slug)}`);
  if (!ok(h)) return h;
  const url = `${SITE}/highway/${slug}`;
  const crumbs = [["Home", "/"], ["Coverage", "/coverage"], [h.name, `/highway/${slug}`]];
  const head = headTags({
    title: `${h.name} Toll Plazas — FASTag help, rates & Sathi rescue`,
    description: clip(`${h.fullName || h.name}: toll plazas, FASTag dispute help and Sathi rescue. ${h.desc || ""}`, 160),
    url, ld: [breadcrumbLd(crumbs)],
  });
  const body = layout(crumbs,
    `<h1>${esc(h.fullName || h.name)}</h1><p>${esc(h.desc || "")}</p>
     <ul>${h.length ? `<li>Length: ${esc(h.length)}</li>` : ""}${(h.states || []).length ? `<li>States: ${esc(h.states.join(", "))}</li>` : ""}</ul>`);
  return { head, body };
}

async function renderSathi(slug) {
  const s = await api(`/api/sathis/${encodeURIComponent(slug)}`);
  if (!ok(s)) return s;
  const url = `${SITE}/sathi/${slug}`;
  const stateName = titleCase(s.state);
  const crumbs = [["Home", "/"], ["Find a Sathi", "/find"], [s.name, `/sathi/${slug}`]];
  const head = headTags({
    title: `${s.name} · Verified Fastag Sathi at ${s.city || stateName}`,
    description: clip(`${s.name} — FASTag Sathi in ${[s.city, stateName].filter(Boolean).join(", ")}. ${s.bio || ""}`, 160),
    url, type: "profile", image: String(s.avatar || "").startsWith("http") ? s.avatar : DEFAULT_OG_IMAGE,
    ld: [breadcrumbLd(crumbs)],
  });
  const body = layout(crumbs,
    `<h1>${esc(s.name)}</h1><p>FASTag Sathi in ${esc([s.city, stateName].filter(Boolean).join(", "))}</p>
     ${s.bio ? `<p>${esc(s.bio)}</p>` : ""}
     <ul>${(s.services || []).length ? `<li>Helps with: ${esc(s.services.join(", "))}</li>` : ""}${(s.languages || []).length ? `<li>Languages: ${esc(s.languages.join(", "))}</li>` : ""}</ul>
     ${s.homePlaza ? `<p>${A(`/toll/${s.homePlaza}`, "Home toll plaza")}</p>` : ""}
     ${s.state ? `<p>${A(`/state/${s.state}`, `FASTag help in ${stateName}`)}</p>` : ""}`);
  return { head, body };
}

const DYNAMIC = [
  // [pattern, renderer, prefer the prerendered file when one exists]
  [/^\/help\/([^/]+)$/,    renderHelp,    false],
  [/^\/toll\/([^/]+)$/,    renderToll,    false],
  [/^\/state\/([^/]+)$/,   renderState,   false],
  [/^\/city\/([^/]+)$/,    renderCity,    false],
  [/^\/sathi\/([^/]+)$/,   renderSathi,   false],
  [/^\/bank\/([^/]+)$/,    renderBank,    true],   // prerendered bank pages carry the full hand-written guide
  [/^\/highway\/([^/]+)$/, renderHighway, true],
];

// SPA routes that only redirect in the browser — answer them with a real 301.
const ALIASES = {
  "/home": "/", "/index.html": "/", "/sathi": "/become-a-sathi", "/partner": "/become-a-sathi", "/signup": "/login",
  "/find-sathi-near-me": "/find", "/find-a-sathi": "/find", "/toll-rates": "/tools/toll-calculator",
  "/fastag-balance": "/tools/fastag-balance-check", "/dispute": "/tools/dispute-tracker",
};

// Other SPA routes without a prerendered file: served as the app shell with their own head.
const APP_ROUTES = {
  "/buy-fastag":          { title: "Buy FASTag online · ApnaFastag", description: "Order a new FASTag online for your car, jeep or truck and track the order." },
  "/buy-fastag/track":    { title: "Track your FASTag order · ApnaFastag", description: "Track the status of your ApnaFastag FASTag order." },
  "/mlff":                { title: "MLFF India — Multi-Lane Free Flow Tolling Explained · ApnaFastag", description: "How barrier-free MLFF tolling works with GNSS and ANPR gantries, where it is being piloted, and what it means for your FASTag." },
  "/fastag-e-notice":     { title: "FASTag e-Notice — Pay, Dispute & Avoid Penalties · ApnaFastag", description: "Why NHAI issues FASTag e-notices, how the penalty works, and how to pay or dispute one." },
  "/join":                { title: "Become a FASTag Sathi — Earn at your toll plaza · ApnaFastag", description: "Join the ApnaFastag partner network: issue and recharge FASTags and resolve issues at your toll plaza." },
  "/tools/fastag-recharge": { title: "FASTag recharge — all banks · ApnaFastag", description: "Recharge a FASTag from any issuing bank using your vehicle number." },
  "/find":                { title: "Find a FASTag Sathi near you · ApnaFastag", description: "Verified FASTag Sathis on a live map." },
  "/login":               { title: "Log in · ApnaFastag", description: "Log in to ApnaFastag.", noindex: true },
  "/admin":               { title: "Admin · ApnaFastag", description: "ApnaFastag admin.", noindex: true },
  "/dashboard":           { title: "Sathi dashboard · ApnaFastag", description: "ApnaFastag Sathi dashboard.", noindex: true },
  "/my-jobs":             { title: "My jobs · ApnaFastag", description: "Your ApnaFastag jobs.", noindex: true },
  // Already known to Google, so it stays indexable.
  "/buy-fastag/order":    { title: "Order a FASTag · ApnaFastag", description: "Choose your vehicle and FASTag and place the order online." },
};

function prerenderedFile(pathname) {
  if (pathname === "/") return path.join(BUILD_DIR, "index.html");
  const f = path.join(BUILD_DIR, pathname, "index.html");
  if (!f.startsWith(BUILD_DIR + path.sep)) return null;
  try { return fs.statSync(f).isFile() ? f : null; } catch { return null; }
}
function sendFile(res, file) {
  fs.readFile(file, (err, html) => {
    if (err) { res.writeHead(500); res.end("Error"); return; }
    sendHtml(res, 200, html);
  });
}

function redirect(req, res, to) {
  const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  res.writeHead(301, { "Location": to + query, "Cache-Control": "public, max-age=86400" });
  res.end();
}

async function handlePage(req, res, pathname) {
  if (ALIASES[pathname]) { redirect(req, res, ALIASES[pathname]); return; }

  let decoded = pathname;
  try { decoded = decodeURIComponent(pathname); } catch { sendNotFound(res, pathname); return; }

  // Every data-page slug is lowercase; old links like /state/Haryana go to the real page.
  const upper = decoded.match(/^\/(help|toll|state|city|sathi|bank|highway)\/([^/]*[A-Z][^/]*)$/);
  if (upper) { redirect(req, res, `/${upper[1]}/${upper[2].toLowerCase()}`); return; }

  for (const [re, render, preferFile] of DYNAMIC) {
    const m = decoded.match(re);
    if (!m) continue;
    const file = prerenderedFile(decoded);
    if (preferFile && file) { sendFile(res, file); return; }
    let out = null;
    try { out = await render(m[1]); } catch (e) { console.error("[ssr]", decoded, e.message); }
    if (out && out !== NOT_FOUND) { sendHtml(res, 200, renderPage(out.head, out.body)); return; }
    // Keep every URL that has a prerendered page alive, even if the API no longer knows it.
    if (file) { sendFile(res, file); return; }
    // Blog posts were once linked as /help/<slug>; send those to the post.
    if (out === NOT_FOUND && decoded.startsWith("/help/") && prerenderedFile(`/blog/${m[1]}`)) {
      redirect(req, res, `/blog/${m[1]}`); return;
    }
    if (out === NOT_FOUND) { sendNotFound(res, decoded); return; }
    // Backend unreachable: let the app load and fetch for itself rather than claim 404.
    const head = headTags({ title: "ApnaFastag", description: "FASTag help at toll plazas across India.", url: `${SITE}${decoded}` });
    sendHtml(res, 200, renderPage(head, ""), { "Cache-Control": "no-store" });
    return;
  }

  const file = prerenderedFile(decoded);
  if (file) { sendFile(res, file); return; }

  const route = APP_ROUTES[decoded];
  if (route) {
    const head = headTags({ title: route.title, description: route.description, url: `${SITE}${decoded}`,
                            robots: route.noindex ? "noindex,follow" : undefined });
    const body = route.noindex ? "" : layout([["Home", "/"], [route.title.split(" · ")[0], decoded]],
      `<h1>${esc(route.title.split(" · ")[0])}</h1><p>${esc(route.description)}</p>`);
    sendHtml(res, 200, renderPage(head, body));
    return;
  }

  sendNotFound(res, decoded);
}

// ── Proxy handler ──────────────────────────────────────────────────────────────
function proxyToBackend(req, res) {
  const headers = { host: BACKEND };
  for (const [k, v] of Object.entries(req.headers)) {
    // Skip host — we already set it to BACKEND above.
    if (k.toLowerCase() === "host") continue;
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "accept-encoding") {
      headers[k] = v;
    }
  }

  const options = {
    hostname: BACKEND, port: BACKEND_PORT, path: req.url, method: req.method,
    headers, timeout: 30000,
  };

  const proxyReq = backendLib.request(options, (proxyRes) => {
    const fwdHeaders = {};
    for (const [k, v] of Object.entries(proxyRes.headers)) {
      if (!HOP_BY_HOP.has(k.toLowerCase())) fwdHeaders[k] = v;
    }
    res.writeHead(proxyRes.statusCode, fwdHeaders);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("timeout", () => {
    proxyReq.destroy();
    if (!res.headersSent) { res.writeHead(504); res.end("Gateway Timeout"); }
  });
  proxyReq.on("error", (err) => {
    console.error("[proxy error]", req.url, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("Bad Gateway");
    }
  });

  req.pipe(proxyReq, { end: true });
}

// ── Static file handler (assets only; pages go through handlePage) ────────────
function serveAsset(req, res, pathname) {
  const filePath = path.join(BUILD_DIR, pathname);
  if (!filePath.startsWith(BUILD_DIR + path.sep)) { res.writeHead(404); res.end("Not found"); return; }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
      res.end("Not found");
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    // robots.txt, sitemaps and html must never be long-cached; hashed build assets can be
    const noCache = ext === ".html" || ext === ".xml" || pathname === "/robots.txt";
    const cc = noCache ? "public, max-age=0, must-revalidate"
      : pathname.startsWith("/static/") ? "public, max-age=31536000, immutable"
      : "public, max-age=86400";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": cc });
    res.end(data);
  });
}

// The sitemap index is built from the live article count. The build-time copy depended on
// the build machine reaching the API; when it couldn't, 1,000 help URLs fell out of the index.
const SITEMAP_PARTS = ["static", "plazas", "states", "banks", "highways", "cities", "sathis"];
async function serveSitemapIndex(req, res) {
  const r = await fetchBackend("/api/help?limit=1");
  const total = ok(r) ? Number(r.total) : NaN;
  if (!(total > 0)) { serveAsset(req, res, "/sitemap.xml"); return; }   // backend down: build copy
  const files = [...SITEMAP_PARTS.map((p) => `sitemap-${p}.xml`),
                 ...Array.from({ length: Math.ceil(total / 1000) }, (_, i) => `sitemap-help-${i + 1}.xml`)];
  res.writeHead(200, { "Content-Type": "application/xml", "Cache-Control": "public, max-age=0, must-revalidate" });
  res.end(`<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + files.map((f) => `  <sitemap><loc>${SITE}/${f}</loc></sitemap>`).join("\n") + "\n</sitemapindex>");
}

const ASSET_RE = /\.(js|css|map|json|xml|txt|png|jpe?g|gif|svg|ico|webp|woff2?)$/i;

// ── Server ─────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const pathname = req.url.split("?")[0].split("#")[0];

  // 1. API proxy, and uploaded assets (sathi avatars, gallery) that live on the backend's disk
  if (pathname.startsWith("/api/") || pathname.startsWith("/uploads/")) {
    proxyToBackend(req, res);
    return;
  }

  // 1b. Sitemap sub-files come from the backend (live data), served at the root path.
  const sitemapProxy = pathname.match(/^\/(sitemap-[a-z0-9-]+\.xml)$/);
  if (sitemapProxy) {
    req.url = `/api/${sitemapProxy[1]}`;
    proxyToBackend(req, res);
    return;
  }

  // 1c. Normalize trailing slashes — /city/jaipur/ and /city/jaipur would otherwise be duplicates.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const query = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    res.writeHead(301, { "Location": pathname.replace(/\/+$/, "") + query, "Cache-Control": "public, max-age=86400" });
    res.end();
    return;
  }

  if (pathname === "/sitemap.xml") {
    await serveSitemapIndex(req, res);
    return;
  }

  // 2. Files (build assets, robots.txt, images)
  if (ASSET_RE.test(pathname)) {
    serveAsset(req, res, pathname);
    return;
  }

  // 3. Pages
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Allow": "GET, HEAD" });
    res.end();
    return;
  }
  try {
    await handlePage(req, res, pathname);
  } catch (e) {
    console.error("[page error]", pathname, e.message);
    if (!res.headersSent) { res.writeHead(500); res.end("Error"); }
  }
});

server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on ${HOST || "*"}:${PORT}`);
  console.log(`   Static files → ${BUILD_DIR}`);
  console.log(`   /api/*       → ${BACKEND_SCHEME}://${BACKEND}:${BACKEND_PORT}`);
});
