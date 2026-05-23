import React, { createContext, useContext, useEffect, useState } from "react";

const BrandingContext = createContext({
  logo: null,
  favicon: null,
  siteName: "ApnaFastag",
  tagline: "अपना फास्टैग साथी",
  loading: true,
  reload: () => {},
});

export function BrandingProvider({ children }) {
  const [branding, setBranding] = useState({
    logo: null,
    favicon: null,
    siteName: "ApnaFastag",
    tagline: "अपना फास्टैग साथी",
    loading: true,
  });

  const fetchBranding = async () => {
    try {
      const base = process.env.REACT_APP_BACKEND_URL || "";
      const res = await fetch(`${base}/api/branding`);
      if (!res.ok) throw new Error("branding fetch failed");
      const d = await res.json();
      setBranding({
        logo: d.logo_url || null,
        favicon: d.favicon_url || null,
        siteName: d.site_name || "ApnaFastag",
        tagline: d.tagline || "अपना फास्टैग साथी",
        loading: false,
      });
    } catch {
      // Silently fall back to defaults — site still works
      setBranding((b) => ({ ...b, loading: false }));
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  // Inject dynamic favicon whenever favicon changes
  useEffect(() => {
    if (!branding.favicon) return;
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.favicon;
  }, [branding.favicon]);

  return (
    <BrandingContext.Provider value={{ ...branding, reload: fetchBranding }}>
      {children}
    </BrandingContext.Provider>
  );
}

export const useBranding = () => useContext(BrandingContext);
