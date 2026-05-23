import React, { createContext, useContext, useEffect, useState } from "react";

export const SITE_DEFAULTS = {
  logo:            null,
  favicon:         null,
  siteName:        "ApnaFastag",
  tagline:         "अपना फास्टैग साथी",
  description:     "India's first real-time, peer-to-peer rescue network for FASTag chaos.",
  legalName:       "ApnaFastag Technologies Pvt. Ltd.",
  foundedYear:     "2024",
  supportEmail:    "help@apnafastag.com",
  hiringEmail:     "hiring@apnafastag.com",
  pressEmail:      "press@apnafastag.com",
  legalEmail:      "legal@apnafastag.com",
  helpline:        "1800-XXX-XXXX",
  whatsapp:        "+91 80000 00000",
  addressLine1:    "",
  addressCity:     "Pune",
  addressState:    "Maharashtra",
  addressPincode:  "",
  addressCountry:  "India",
  socialInstagram: "",
  socialTwitter:   "",
  socialYoutube:   "",
  socialFacebook:  "",
  socialLinkedin:  "",
  footerTagline:   "Made with chai on NH-48.",
  loading:         true,
};

// ── localStorage cache (stale-while-revalidate) ──────────────────────────────
// Key versioned so a schema change auto-invalidates old entries.
const CACHE_KEY = "apnafastag_branding_v2";

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or private browsing — silently skip
  }
}

// ── API response → context shape ─────────────────────────────────────────────
function mapApiToContext(d) {
  return {
    logo:            d.logo_url         || null,
    favicon:         d.favicon_url      || null,
    siteName:        d.site_name        || SITE_DEFAULTS.siteName,
    tagline:         d.tagline          || SITE_DEFAULTS.tagline,
    description:     d.description      || SITE_DEFAULTS.description,
    legalName:       d.legal_name       || SITE_DEFAULTS.legalName,
    foundedYear:     d.founded_year     || SITE_DEFAULTS.foundedYear,
    supportEmail:    d.support_email    || SITE_DEFAULTS.supportEmail,
    hiringEmail:     d.hiring_email     || SITE_DEFAULTS.hiringEmail,
    pressEmail:      d.press_email      || SITE_DEFAULTS.pressEmail,
    legalEmail:      d.legal_email      || SITE_DEFAULTS.legalEmail,
    helpline:        d.helpline         || SITE_DEFAULTS.helpline,
    whatsapp:        d.whatsapp         || SITE_DEFAULTS.whatsapp,
    addressLine1:    d.address_line1    || "",
    addressCity:     d.address_city     || SITE_DEFAULTS.addressCity,
    addressState:    d.address_state    || SITE_DEFAULTS.addressState,
    addressPincode:  d.address_pincode  || "",
    addressCountry:  d.address_country  || SITE_DEFAULTS.addressCountry,
    socialInstagram: d.social_instagram || "",
    socialTwitter:   d.social_twitter   || "",
    socialYoutube:   d.social_youtube   || "",
    socialFacebook:  d.social_facebook  || "",
    socialLinkedin:  d.social_linkedin  || "",
    footerTagline:   d.footer_tagline   || SITE_DEFAULTS.footerTagline,
    loading:         false,
  };
}

// ── Context ───────────────────────────────────────────────────────────────────
const BrandingContext = createContext({ ...SITE_DEFAULTS, reload: () => {} });

/**
 * Priority chain for the initial React state (all synchronous — zero network):
 *
 *  1. localStorage  — written by fetchBranding() after every API response;
 *                     also seeded into window.__BRANDING__ by the inline <script>
 *                     in index.html so it's available before React loads.
 *
 *  2. window.__BRANDING__ — injected into every HTML page by prerender.mjs at
 *                     build time. logo_url/favicon_url are proper HTTP URLs
 *                     (not base64), so they're included and preloaded too.
 *
 *  3. SITE_DEFAULTS — absolute last resort (dev mode, CI, empty cache).
 */
function getInitialState() {
  // 1. localStorage (most fresh — updated after every API call in the browser)
  const cached = readCache();
  if (cached) return { ...cached, loading: false };

  // 2. window.__BRANDING__ (baked into HTML by prerender or by inline script above)
  if (typeof window !== "undefined" && window.__BRANDING__) {
    return { ...mapApiToContext(window.__BRANDING__), loading: false };
  }

  // 3. SITE_DEFAULTS
  return { ...SITE_DEFAULTS }; // loading: true — fetchBranding() sets it false
}

export function BrandingProvider({ children }) {
  // Lazy initialiser — runs getInitialState exactly once, synchronously,
  // before the first render so no frame ever shows wrong data.
  const [site, setSite] = useState(getInitialState);

  const fetchBranding = async () => {
    try {
      const base = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${base}/api/branding`);
      if (!res.ok) throw new Error("branding fetch failed");
      const d = await res.json();
      const mapped = mapApiToContext(d);
      // Write to cache first so the next page load is instant
      writeCache(mapped);
      // Only trigger a re-render if something actually changed
      setSite((prev) => {
        const changed = Object.keys(mapped).some((k) => prev[k] !== mapped[k]);
        return changed ? mapped : prev;
      });
    } catch {
      // API unreachable — keep showing cached / default values; mark not loading
      setSite((b) => ({ ...b, loading: false }));
    }
  };

  // Fetch fresh data on every mount (stale-while-revalidate)
  useEffect(() => {
    fetchBranding();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Inject dynamic favicon whenever it changes
  useEffect(() => {
    if (!site.favicon) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = site.favicon;
  }, [site.favicon]);

  return (
    <BrandingContext.Provider value={{ ...site, reload: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
