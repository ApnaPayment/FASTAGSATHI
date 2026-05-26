/**
 * Lightweight production server for apnafastag.com (Railway frontend service).
 *
 * Responsibilities:
 *   1. Proxy /api/* → Railway backend (fastagsathi-production.up.railway.app)
 *      so sitemaps, logo images, and API calls all work on the main domain.
 *   2. Serve the React SPA static files from ./build/ with SPA fallback.
 *
 * Zero external dependencies — only Node.js built-ins.
 */

const http  = require("http");
const https = require("https");
const fs    = require("fs");
const path  = require("path");

const PORT      = process.env.PORT || 3000;
const BACKEND   = "fastagsathi-production.up.railway.app";
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

// ── Proxy handler ──────────────────────────────────────────────────────────────
function proxyToBackend(req, res) {
  const headers = { ...req.headers, host: BACKEND };
  delete headers["accept-encoding"]; // avoid compressed responses we can't pipe cleanly

  const options = {
    hostname: BACKEND,
    port: 443,
    path: req.url,
    method: req.method,
    headers,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on("error", (err) => {
    console.error("[proxy error]", err.message);
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

  // Directory → try index.html inside it
  try {
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
  } catch (_) {
    // File not found — fall through to SPA fallback below
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback: serve index.html for any unknown path
      fs.readFile(path.join(BUILD_DIR, "index.html"), (err2, html) => {
        if (err2) { res.writeHead(404); res.end("Not found"); return; }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(html);
      });
      return;
    }
    const ext  = path.extname(filePath).toLowerCase();
    const mime = MIME[ext] || "application/octet-stream";
    // Long-cache static assets (hashed filenames), short-cache HTML
    const cc = ext === ".html"
      ? "public, max-age=0, must-revalidate"
      : "public, max-age=31536000, immutable";
    res.writeHead(200, { "Content-Type": mime, "Cache-Control": cc });
    res.end(data);
  });
}

// ── Server ─────────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  if (req.url.startsWith("/api/")) {
    proxyToBackend(req, res);
  } else {
    serveStatic(req, res);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`   Static files → ${BUILD_DIR}`);
  console.log(`   /api/*       → https://${BACKEND}`);
});
