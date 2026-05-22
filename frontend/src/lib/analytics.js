// Lightweight PostHog wrapper used across the landing page.
// PostHog is already loaded by the script in public/index.html, so we
// reference window.posthog defensively (in case it failed to load).

const ph = () => (typeof window !== "undefined" ? window.posthog : null);

export function track(event, props = {}) {
  try {
    const p = ph();
    if (p && typeof p.capture === "function") {
      p.capture(event, props);
    }
  } catch (e) {
    // analytics must never break the UI
    // eslint-disable-next-line no-console
    console.warn("analytics.track failed:", e);
  }
}

// Debounce helper for slider-style events.
export function debounce(fn, wait = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
