// Analytics — fires both PostHog (session recording) and GA4 (reporting)
// PostHog is loaded via index.html script tag.
// GA4 is loaded via index.html only when REACT_APP_GA4_ID is set.

const ph = () => (typeof window !== "undefined" ? window.posthog : null);
const ga = () => (typeof window !== "undefined" && typeof window.gtag === "function" ? window.gtag : null);

// GA4 recommended event name mappings + parameter shaping
const GA4_MAP = {
  // Navigation / CTAs
  cta_find_sathi_click:   (p) => ["find_sathi",        { source: p.src }],
  cta_become_sathi_click: (p) => ["become_sathi",      { source: p.src }],
  cta_buy_fastag_click:   (p) => ["buy_fastag",        { source: p.src }],
  cta_buy_fastag_bank:    (p) => ["select_bank",       { bank: p.bank }],

  // ActionHub
  hub_sos_click:          ()  => ["sos_activated",     { method: "action_hub" }],
  hub_radar_click:        ()  => ["radar_opened",      { method: "action_hub" }],
  hub_dispute_click:      ()  => ["dispute_opened",    { method: "action_hub" }],

  // Contact
  whatsapp_click:         (p) => ["contact",           { method: "whatsapp", source: p.src }],
  call_click:             (p) => ["contact",           { method: "phone",    source: p.src }],
  email_click:            (p) => ["contact",           { method: "email",    source: p.src }],
  contact_form_submit:    (p) => ["generate_lead",     { topic: p.topic }],

  // Tools
  fastag_status_check:    (p) => ["tool_use",          { tool: "fastag_status",  vehicle_len: p.vehicle_len }],
  balance_check_run:      (p) => ["tool_use",          { tool: "balance_check",  bank: p.bank }],
  dispute_check_run:      (p) => ["tool_use",          { tool: "dispute_tracker" }],

  // Booking / payment
  booking_initiated:      (p) => ["begin_checkout",    { sathi: p.sathi_slug, value: p.amount, currency: "INR" }],
  booking_paid:           (p) => ["purchase",          { transaction_id: p.job_id, value: p.amount, currency: "INR" }],
  booking_completed:      (p) => ["purchase",          { transaction_id: p.job_id, value: p.amount, currency: "INR" }],

  // Sathi application
  sathi_application_submit: () => ["sign_up",          { method: "sathi_application" }],

  // Engagement
  scroll_50:              ()  => ["scroll",            { percent_scrolled: 50 }],
  scroll_90:              ()  => ["scroll",            { percent_scrolled: 90 }],
  review_submitted:       (p) => ["rate_item",         { item_id: p.sathi_slug, rating: p.stars }],
};

export function track(event, props = {}) {
  // PostHog
  try {
    const p = ph();
    if (p && typeof p.capture === "function") {
      p.capture(event, props);
    }
  } catch (e) {
    console.warn("analytics.track (posthog) failed:", e);
  }

  // GA4
  try {
    const gtag = ga();
    if (!gtag) return;

    const mapper = GA4_MAP[event];
    if (mapper) {
      const [gaEvent, gaParams] = mapper(props);
      gtag("event", gaEvent, gaParams);
    } else {
      // Pass unknown events through as-is so nothing is lost
      gtag("event", event, props);
    }
  } catch (e) {
    console.warn("analytics.track (ga4) failed:", e);
  }
}

// Fire a GA4 page_view manually (call on route change)
export function trackPageView(path, title) {
  try {
    const gtag = ga();
    if (!gtag) return;
    gtag("event", "page_view", {
      page_location: `https://apnafastag.com${path}`,
      page_title: title || document.title,
    });
  } catch (e) {
    console.warn("analytics.trackPageView failed:", e);
  }
}

export function debounce(fn, wait = 350) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}
