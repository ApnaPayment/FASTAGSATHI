/**
 * Lightweight production server for apnafastag.com (Railway frontend service).
 *
 * Responsibilities:
 *   1. Proxy /api/* → Railway backend (fastagsathi-production.up.railway.app)
 *   2. Serve the React SPA static files from ./build/ with SPA fallback.
 *   3. Bot-aware OG tag injection for /sathi/:slug and /help/:slug links
 *      so WhatsApp, Telegram, Facebook etc. show rich link previews.
 *
 * Zero external dependencies — only Node.js built-ins.
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT      = process.env.PORT || 3000;
const BACKEND   = "fastagsathi-production.up.railway.app";
const SITE      = "https://apnafastag.com";
const BUILD_DIR = path.join(__dirname, "build");

const MIME = {
  ".html":  "text/html; charset=utf-8",
  ".js":    "text/javascript",
  ".css":   "text/css",
  ".json":  "application/json",
  ".xml":   "application/xml",
  ".png":   "image/png",
  ".jpg":   "image/jpeg",
  ".jpeg":  "image/jpeg",
  ".svg":   "image/svg+xml",
  ".ico":   "image/x-icon",
  ".woff":  "font/woff",
  ".woff2": "font/woff2",
  ".txt":   "text/plain",
  ".webp":  "image/webp",
};

// Headers that must NOT be forwarded between proxy hops (RFC 2616 §13.5.1)
const HOP_BY_HOP = new Set([
  "connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
  "te", "trailers", "transfer-encoding", "upgrade",
]);

// Bot user-agents that need server-side OG tags (don't run JS)
const BOT_RE = /whatsapp|facebookexternalhit|twitterbot|telegrambot|linkedinbot|slackbot|discordbot|googlebot|bingbot|applebot|pinterest|redditbot|vkshare|w3c_validator/i;

const isBot = (ua) => BOT_RE.test(ua || "");

// ── Fetch JSON from backend API ───────────────────────────────────────────────
function fetchBackend(apiPath) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      { hostname: BACKEND, port: 443, path: apiPath, method: "GET",
        headers: { "accept": "application/json" }, timeout: 5000 },
      (res) => {
        let body = "";
        res.on("data", (c) => body += c);
        res.on("end", () => {
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

// ── HTML escaping for meta tag values ─────────────────────────────────────────
function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Build OG meta block from a key→value map ─────────────────────────────────
function ogTags({ title, description, image, url, type = "website" }) {
  const d = esc(description);
  const t = esc(title);
  const i = esc(image);
  const u = esc(url);
  return `
    <title>${t}</title>
    <meta name="description" content="${d}" />
    <meta property="og:type"        content="${esc(type)}" />
    <meta property="og:title"       content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image"       content="${i}" />
    <meta property="og:url"         content="${u}" />
    <meta property="og:site_name"   content="ApnaFastag" />
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image"       content="${i}" />`.trim();
}

// Default fallback OG image
const DEFAULT_OG_IMAGE = `${SITE}/og-default.png`;

// ── Build OG tags for a Sathi profile ─────────────────────────────────────────
async function sathiOgTags(slug) {
  const s = await fetchBackend(`/api/sathis/${slug}`);
  if (!s || !s.name) return null;

  const stars   = s.rating   ? `⭐ ${s.rating}` : "";
  const reviews = s.reviewCount ? `(${s.reviewCount} reviews)` : "";
  const jobs    = s.jobsResolved ? `${s.jobsResolved}+ jobs resolved` : "";
  const loc     = [s.city, s.state ? s.state.charAt(0).toUpperCase() + s.state.slice(1) : ""]
                    .filter(Boolean).join(", ");
  const verified = s.verified ? "✅ Verified" : "";

  const title = `${s.name} — FASTag Sathi ${stars} ${reviews}`.trim();

  const descParts = [verified, jobs, loc ? `Based in ${loc}` : "", s.bio || s.tagline || ""].filter(Boolean);
  const description = descParts.join(" · ").slice(0, 200) ||
    "Verified FASTag Sathi — disputes, KYC, recharge & SOS resolved at toll plazas.";

  // data: URLs are invalid for OG images — must be an absolute HTTP URL
  const rawImg = s.avatar || s.photo || "";
  const image  = rawImg.startsWith("http") ? rawImg : DEFAULT_OG_IMAGE;
  const url   = `${SITE}/sathi/${slug}`;

  return ogTags({ title, description, image, url, type: "profile" });
}

// ── Build OG tags for a Highway page ─────────────────────────────────────────
async function highwayOgTags(slug) {
  const h = await fetchBackend(`/api/highways/${slug}`);
  if (!h || !h.name) return null;
  const title = `${h.name} toll plazas, rates & FASTag help · ApnaFastag`;
  const description = `${h.fullName || h.name}: ${h.plazaCount || "all"} toll plazas, live rates, FASTag dispute & Sathi help across ${(h.states || []).join(", ")}.`.slice(0, 200);
  return ogTags({ title, description, image: DEFAULT_OG_IMAGE, url: `${SITE}/highway/${slug}` });
}

// ── Build OG tags for a Bank page ─────────────────────────────────────────────
async function bankOgTags(slug) {
  const b = await fetchBackend(`/api/banks/${slug}`);
  if (!b || !b.name) return null;
  const title = `${b.name} FASTag — balance check, helpline & dispute help · ApnaFastag`;
  const description = `${b.name} FASTag balance check, customer care helpline, dispute filing, blacklist fix and recharge guide. Verified Sathis available 24×7.`.slice(0, 200);
  return ogTags({ title, description, image: DEFAULT_OG_IMAGE, url: `${SITE}/bank/${slug}` });
}

// ── Build OG tags for a Plaza/Toll page ──────────────────────────────────────
async function plazaOgTags(slug) {
  const p = await fetchBackend(`/api/plazas/${slug}`);
  if (!p || !p.name) return null;

  const title = `${p.name} (${p.highway || ""}) toll rates 2026 — FASTag help · ApnaFastag`.trim();
  const description = `${p.name} on ${p.highway || "highway"} at ${p.city || ""}: toll rates (car ₹${p.carRate || "—"}, truck ₹${p.truckRate || "—"}), FASTag disputes & verified Sathis on-spot.`.trim();
  return ogTags({ title, description, image: DEFAULT_OG_IMAGE, url: `${SITE}/toll/${slug}` });
}

// ── Build OG tags for a State page ───────────────────────────────────────────
async function stateOgTags(slug) {
  const s = await fetchBackend(`/api/states/${slug}`);
  if (!s || !s.name) return null;

  const title = `${s.name} toll plazas, FASTag help & Sathis · ApnaFastag`;
  const description = `FASTag help across ${s.plazaCount || "all"} toll plazas in ${s.name}. ${s.sathiCount || ""} verified Sathis resolve disputes, blacklists & KYC on-spot.`.trim();
  return ogTags({ title, description, image: DEFAULT_OG_IMAGE, url: `${SITE}/state/${slug}` });
}

// ── Build OG tags for a City page ─────────────────────────────────────────────
async function cityOgTags(slug) {
  const c = await fetchBackend(`/api/cities/${slug}`);
  if (!c || !c.name) return null;

  const stateName = c.state ? c.state.charAt(0).toUpperCase() + c.state.slice(1) : "";
  const sathis    = c.sathiCount  ? `${c.sathiCount} Sathis` : "Expanding soon";
  const plazas    = c.plazaCount  ? `, ${c.plazaCount} toll plazas` : "";
  const title     = `FASTag help in ${c.name} — ${sathis}${plazas}`;
  const description = (c.meta_description ||
    `Resolve FASTag disputes, blacklisting and KYC issues in ${c.name}${stateName ? `, ${stateName}` : ""}. Verified Sathis available 24×7.`
  ).slice(0, 200);

  return ogTags({ title, description, image: DEFAULT_OG_IMAGE, url: `${SITE}/city/${slug}` });
}

// ── Build OG tags for a Help article ──────────────────────────────────────────
async function helpOgTags(slug) {
  const a = await fetchBackend(`/api/help/${slug}`);
  if (!a || !a.title) return null;

  const title       = `${a.title} — ApnaFastag Help`;
  const description = (a.meta_description || a.excerpt || "").slice(0, 200);
  const image       = a.cover || DEFAULT_OG_IMAGE;
  const url         = `${SITE}/help/${slug}`;

  return ogTags({ title, description, image, url, type: "article" });
}

// ── Inject OG block into index.html ──────────────────────────────────────────
function injectOg(html, ogBlock) {
  let out = html;

  // 1. Replace <title>…</title> with ours
  out = out.replace(/<title>[^<]*<\/title>/i, "");

  // 2. Strip ALL existing og: and twitter: meta tags and generic description
  out = out.replace(/<meta\s[^>]*property="og:[^"]*"[^>]*\/?>/gi, "");
  out = out.replace(/<meta\s[^>]*name="twitter:[^"]*"[^>]*\/?>/gi, "");
  out = out.replace(/<meta\s[^>]*name="description"[^>]*\/?>/gi, "");

  // 3. Insert our block right after <head> (case-insensitive)
  out = out.replace(/<head>/i, `<head>\n  ${ogBlock}`);

  return out;
}

// ── Serve index.html with optional OG injection ───────────────────────────────
async function serveWithOg(req, res, ogBuilder) {
  const indexPath = path.join(BUILD_DIR, "index.html");
  fs.readFile(indexPath, "utf8", async (err, html) => {
    if (err) { res.writeHead(404); res.end("Not found"); return; }

    let finalHtml = html;
    try {
      const og = await ogBuilder();
      if (og) finalHtml = injectOg(html, og);
    } catch (e) {
      console.error("[og injection error]", e.message);
    }

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    });
    res.end(finalHtml);
  });
}

// ── Proxy handler ──────────────────────────────────────────────────────────────
function proxyToBackend(req, res) {
  const headers = { host: BACKEND };
  for (const [k, v] of Object.entries(req.headers)) {
    // Skip host — we already set it to BACKEND above; forwarding the original
    // "apnafastag.com" host would cause Railway to route the request back to
    // the frontend service, creating an infinite loop → 502/503 timeouts.
    if (k.toLowerCase() === "host") continue;
    if (!HOP_BY_HOP.has(k.toLowerCase()) && k.toLowerCase() !== "accept-encoding") {
      headers[k] = v;
    }
  }

  const options = {
    hostname: BACKEND, port: 443, path: req.url, method: req.method,
    headers, timeout: 30000,
  };

  const proxyReq = https.request(options, (proxyRes) => {
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

// ── Static file handler ────────────────────────────────────────────────────────
function serveStatic(req, res) {
  const pathname = req.url.split("?")[0].split("#")[0];
  let filePath = path.join(BUILD_DIR, pathname);

  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch (_) {}

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(BUILD_DIR, "index.html"), (err2, html) => {
        if (err2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      });
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    // robots.txt and sitemap index must never be long-cached
    const noCache = ["/robots.txt", "/sitemap.xml"].includes(pathname);
    const cc = (ext === ".html" || noCache)
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": cc });
    res.end(data);
  });
}

// ── Server ─────────────────────────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const pathname = req.url.split("?")[0];
  const ua       = req.headers["user-agent"] || "";

  // 1. API proxy
  if (pathname.startsWith("/api/")) {
    proxyToBackend(req, res);
    return;
  }

  // 1b. Redirect old sitemap sub-paths (without /api/) to correct /api/ paths
  // Google may have cached the wrong URLs from the old static sitemap.xml
  const sitemapRedirect = pathname.match(/^\/(sitemap-[a-z0-9-]+\.xml)$/);
  if (sitemapRedirect) {
    res.writeHead(301, { "Location": `/api/${sitemapRedirect[1]}`, "Cache-Control": "public, max-age=86400" });
    res.end();
    return;
  }

  // 2. Bot OG injection for Sathi profiles: /sathi/:slug
  const sathiMatch = pathname.match(/^\/sathi\/([^/]+)\/?$/);
  if (sathiMatch && isBot(ua)) {
    const slug = sathiMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /sathi/${slug}`);
    await serveWithOg(req, res, () => sathiOgTags(slug));
    return;
  }

  // 3. Bot OG injection for Help articles: /help/:slug
  const helpMatch = pathname.match(/^\/help\/([^/]+)\/?$/);
  if (helpMatch && isBot(ua)) {
    const slug = helpMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /help/${slug}`);
    await serveWithOg(req, res, () => helpOgTags(slug));
    return;
  }

  // 4. Bot OG injection for Highway pages: /highway/:slug
  const highwayMatch = pathname.match(/^\/highway\/([^/]+)\/?$/);
  if (highwayMatch && isBot(ua)) {
    const slug = highwayMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /highway/${slug}`);
    await serveWithOg(req, res, () => highwayOgTags(slug));
    return;
  }

  // 4b. Bot OG injection for Bank pages: /bank/:slug
  const bankMatch = pathname.match(/^\/bank\/([^/]+)\/?$/);
  if (bankMatch && isBot(ua)) {
    const slug = bankMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /bank/${slug}`);
    await serveWithOg(req, res, () => bankOgTags(slug));
    return;
  }

  // 4c. Bot OG injection for Plaza/Toll pages: /toll/:slug
  const tollMatch = pathname.match(/^\/toll\/([^/]+)\/?$/);
  if (tollMatch && isBot(ua)) {
    const slug = tollMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /toll/${slug}`);
    await serveWithOg(req, res, () => plazaOgTags(slug));
    return;
  }

  // 5. Bot OG injection for State pages: /state/:slug
  const stateMatch = pathname.match(/^\/state\/([^/]+)\/?$/);
  if (stateMatch && isBot(ua)) {
    const slug = stateMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /state/${slug}`);
    await serveWithOg(req, res, () => stateOgTags(slug));
    return;
  }

  // 6. Bot OG injection for City pages: /city/:slug
  const cityMatch = pathname.match(/^\/city\/([^/]+)\/?$/);
  if (cityMatch && isBot(ua)) {
    const slug = cityMatch[1];
    console.log(`[og] bot=${ua.slice(0,40)} → /city/${slug}`);
    await serveWithOg(req, res, () => cityOgTags(slug));
    return;
  }

  // 7. Static OG injection for /mlff and /fastag-e-notice (bots)
  if (pathname === "/mlff" && isBot(ua)) {
    await serveWithOg(req, res, () => ogTags({
      title: "MLFF India — Multi-Lane Free Flow Tolling Explained 2025 · ApnaFastag",
      description: "MLFF lets vehicles pass toll plazas at full speed — no stopping, no queues. Learn how GNSS and ANPR gantries work, pilot locations, and what it means for your FASTag wallet.",
      image: DEFAULT_OG_IMAGE,
      url: `${SITE}/mlff`,
    }));
    return;
  }
  if (pathname === "/fastag-e-notice" && isBot(ua)) {
    await serveWithOg(req, res, () => ogTags({
      title: "FASTag e-Notice — Pay, Dispute & Avoid Penalties 2025 · ApnaFastag",
      description: "Received a FASTag e-Notice? Learn why NHAI issues them, how the 2× penalty works, and how to pay or dispute in minutes — not weeks.",
      image: DEFAULT_OG_IMAGE,
      url: `${SITE}/fastag-e-notice`,
    }));
    return;
  }
  if (pathname === "/join" && isBot(ua)) {
    await serveWithOg(req, res, () => ogTags({
      title: "Become a FASTag Sathi — Earn ₹15,000–₹50,000/Month · ApnaFastag",
      description: "Join India's fastest-growing FASTag partner network. Issue & recharge FASTag for SBI, IDFC First Bank and Bajaj Finance. Zero investment. Apply free in 2 minutes.",
      image: DEFAULT_OG_IMAGE,
      url: `${SITE}/join`,
    }));
    return;
  }

  // 8. Normal static serving (browsers, etc.)
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Static files → ${BUILD_DIR}`);
  console.log(`   /api/*       → https://${BACKEND}`);
  console.log(`   OG injection → /sathi /help /highway /bank /toll /state /city (bots only)`);
});
