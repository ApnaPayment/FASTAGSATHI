// Sathi seed — used by FindSathiPage, SathiProfilePage, prerender, sitemap.
// In production this comes from Firestore /sathis collection.

export const SATHIS = [
  {
    slug: "ravi-shinde-khalapur", name: "Ravi Shinde", city: "Khalapur", state: "maharashtra",
    homePlaza: "khalapur-nh48", lat: 18.812, lng: 73.274,
    avatar: "https://images.unsplash.com/photo-1632999863880-034c5f73c779?w=400&q=70",
    verified: true, premium: true, rating: 4.9, reviewCount: 412, jobsResolved: 1180,
    avg_speed: 4.8, avg_communication: 4.7, avg_resolution: 4.9,
    avgResponseSec: 78, languages: ["Marathi", "Hindi", "English"],
    services: ["dispute", "kyc", "recharge", "sos"],
    banks: ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
    bio: "Born and raised next to NH-48. Spent 6 years as a toll lane supervisor at Khalapur before going independent. Specialises in mischarge reversal and night-time SOS.",
    activeHours: { mon: "5am-11pm", tue: "5am-11pm", wed: "5am-11pm", thu: "5am-11pm", fri: "5am-12am", sat: "5am-12am", sun: "6am-10pm" },
    contact: { phone: "+91 98XXX XX012", whatsapp: "+91 98XXX XX012" },
    reviews: [
      { author: "Suresh K.", date: "Jan 11 · 2026", stars: 5, speed: 5, communication: 5, resolution: 5, text: "₹450 mischarge reversed in 4 minutes. Ravi bhai literally walked into the plaza office with me." },
      { author: "Anjali T.", date: "Jan 02 · 2026", stars: 5, text: "Was stuck at 11pm with tag not reading. Sathi reached in 90 seconds, swapped me to manual lane, handled bank later." },
      { author: "Trucker AS Logistics", date: "Dec 28 · 2025", stars: 4, text: "Helped with KYC re-verification. Took 2 days but resolved. Honest about timeline." },
    ],
  },
  {
    slug: "anil-bhau-lonavla", name: "Anil Bhau", city: "Lonavla", state: "maharashtra",
    homePlaza: "lonavla-nh48", lat: 18.752, lng: 73.413,
    avatar: "https://images.unsplash.com/photo-1695395860103-38d172403a46?w=400&q=70",
    verified: true, premium: false, rating: 4.8, reviewCount: 287, jobsResolved: 690,
    avg_speed: 4.6, avg_communication: 4.9, avg_resolution: 4.7,
    avgResponseSec: 102, languages: ["Marathi", "Hindi"],
    services: ["dispute", "recharge", "sos"],
    banks: ["sbi-fastag", "paytm-fastag", "hdfc-fastag"],
    bio: "Tea-stall owner outside Lonavla Plaza for 12 years. Knows every plaza supervisor on first-name basis. Best for stuck trucks and lane reroutes.",
    activeHours: { mon: "6am-10pm", tue: "6am-10pm", wed: "6am-10pm", thu: "6am-10pm", fri: "6am-10pm", sat: "6am-11pm", sun: "Off" },
    contact: { phone: "+91 99XXX XX341", whatsapp: "+91 99XXX XX341" },
    reviews: [
      { author: "Priya N.", date: "Jan 08 · 2026", stars: 5, speed: 4, communication: 5, resolution: 5, text: "Truck driver husband had FASTag fail on Saturday night. Anil bhau was the only one who picked up and fixed it." },
      { author: "Sandeep G.", date: "Dec 19 · 2025", stars: 5, text: "Recharge was failing at the plaza. Sathi did UPI on the spot and got us moving." },
    ],
  },
  {
    slug: "priya-pawar-vashi", name: "Priya Pawar", city: "Vashi", state: "maharashtra",
    homePlaza: "vashi-mmrda", lat: 19.072, lng: 73.002,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=70",
    verified: true, premium: true, rating: 5.0, reviewCount: 156, jobsResolved: 412,
    avg_speed: 4.9, avg_communication: 5.0, avg_resolution: 5.0,
    avgResponseSec: 64, languages: ["Marathi", "Hindi", "English"],
    services: ["dispute", "kyc", "recharge"],
    banks: ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag"],
    bio: "Ex-bank operations executive who switched to Sathi work to be closer to home. Goes deep on bank-side escalations and class-mismatch disputes.",
    activeHours: { mon: "9am-7pm", tue: "9am-7pm", wed: "9am-7pm", thu: "9am-7pm", fri: "9am-7pm", sat: "10am-4pm", sun: "Off" },
    contact: { phone: "+91 97XXX XX204", whatsapp: "+91 97XXX XX204" },
    reviews: [
      { author: "Rohan M.", date: "Jan 05 · 2026", stars: 5, speed: 5, communication: 5, resolution: 5, text: "Car was being charged as LCV — Priya got the class-correction approved in 2 visits. Saved me ₹3,200/month on commute." },
      { author: "Fleet Op", date: "Dec 22 · 2025", stars: 5, text: "Handled 18 disputes for our fleet in one week. Professional, fast." },
    ],
  },
  {
    slug: "vikram-sharma-manesar", name: "Vikram Sharma", city: "Manesar", state: "haryana",
    homePlaza: "manesar-nh48", lat: 28.362, lng: 76.942,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&q=70",
    verified: true, premium: true, rating: 4.7, reviewCount: 340, jobsResolved: 980,
    avg_speed: 4.5, avg_communication: 4.8, avg_resolution: 4.7,
    avgResponseSec: 88, languages: ["Hindi", "English", "Haryanvi"],
    services: ["dispute", "kyc", "recharge", "sos"],
    banks: ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
    bio: "Was an Uber driver on NH-48 corridor for 5 years. Knows where every bank office is between Manesar and Jaipur. SOS specialist.",
    activeHours: { mon: "5am-12am", tue: "5am-12am", wed: "5am-12am", thu: "5am-12am", fri: "5am-12am", sat: "5am-12am", sun: "5am-12am" },
    contact: { phone: "+91 98XXX XX771", whatsapp: "+91 98XXX XX771" },
    reviews: [
      { author: "Manmeet K.", date: "Jan 10 · 2026", stars: 5, speed: 5, communication: 5, resolution: 4, text: "Was stranded at 2am with FASTag blacklisted. Vikram bhai came within 8 minutes." },
      { author: "Aman G.", date: "Dec 30 · 2025", stars: 4, text: "Solid. Took longer than expected for NHAI escalation but kept me updated." },
    ],
  },
  {
    slug: "lakshmi-iyer-bengaluru", name: "Lakshmi Iyer", city: "Bengaluru", state: "karnataka",
    homePlaza: "electronic-city-nh44", lat: 12.842, lng: 77.663,
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=70",
    verified: true, premium: false, rating: 4.8, reviewCount: 198, jobsResolved: 521,
    avg_speed: 4.7, avg_communication: 5.0, avg_resolution: 4.8,
    avgResponseSec: 92, languages: ["Kannada", "Tamil", "English", "Hindi"],
    services: ["dispute", "kyc", "recharge"],
    banks: ["sbi-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
    bio: "Bilingual tech-graduate who runs Sathi services part-time. Best for digital-first commuters who want WhatsApp updates throughout.",
    activeHours: { mon: "7am-9pm", tue: "7am-9pm", wed: "7am-9pm", thu: "7am-9pm", fri: "7am-9pm", sat: "8am-2pm", sun: "Off" },
    contact: { phone: "+91 99XXX XX842", whatsapp: "+91 99XXX XX842" },
    reviews: [
      { author: "Karthik R.", date: "Jan 12 · 2026", stars: 5, speed: 5, communication: 5, resolution: 5, text: "Resolved the mischarge over WhatsApp without me even leaving the car." },
    ],
  },
  {
    slug: "rajesh-kumar-zirakpur", name: "Rajesh Kumar", city: "Zirakpur", state: "haryana",
    homePlaza: "zirakpur-nh44", lat: 30.642, lng: 76.823,
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=70",
    verified: true, premium: false, rating: 4.6, reviewCount: 121, jobsResolved: 290,
    avg_speed: 4.3, avg_communication: 4.6, avg_resolution: 4.9,
    avgResponseSec: 134, languages: ["Punjabi", "Hindi", "English"],
    services: ["dispute", "recharge", "sos"],
    banks: ["sbi-fastag", "paytm-fastag", "icici-fastag"],
    bio: "Truck mechanic by day, Sathi at night. Best for vehicle-related FASTag issues (RC mismatch, class disputes).",
    activeHours: { mon: "10am-9pm", tue: "10am-9pm", wed: "10am-9pm", thu: "10am-9pm", fri: "10am-9pm", sat: "10am-9pm", sun: "11am-6pm" },
    contact: { phone: "+91 98XXX XX509", whatsapp: "+91 98XXX XX509" },
    reviews: [
      { author: "Jaspreet S.", date: "Dec 27 · 2025", stars: 5, speed: 4, communication: 5, resolution: 5, text: "Helped reverse RC mismatch which two other Sathis had given up on." },
    ],
  },
  {
    slug: "sanjana-rao-athur", name: "Sanjana Rao", city: "Athur", state: "tamil-nadu",
    homePlaza: "athur-nh44", lat: 12.592, lng: 77.943,
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=70",
    verified: true, premium: false, rating: 4.9, reviewCount: 87, jobsResolved: 198,
    avg_speed: 4.8, avg_communication: 4.9, avg_resolution: 4.9,
    avgResponseSec: 78, languages: ["Tamil", "English", "Kannada"],
    services: ["dispute", "kyc"],
    banks: ["sbi-fastag", "icici-fastag", "hdfc-fastag"],
    bio: "College senior who works Sathi shifts to fund engineering. Detail-oriented; ideal for KYC paperwork that needs a steady hand.",
    activeHours: { mon: "4pm-10pm", tue: "4pm-10pm", wed: "4pm-10pm", thu: "4pm-10pm", fri: "4pm-11pm", sat: "10am-10pm", sun: "11am-8pm" },
    contact: { phone: "+91 99XXX XX330", whatsapp: "+91 99XXX XX330" },
    reviews: [
      { author: "Murugan S.", date: "Jan 04 · 2026", stars: 5, speed: 5, communication: 5, resolution: 5, text: "Patient. Explained the process in Tamil, paperwork was correct first try." },
    ],
  },
  {
    slug: "deepak-patel-vadodara", name: "Deepak Patel", city: "Vadodara", state: "gujarat",
    homePlaza: "vadodara-nh48", lat: 22.302, lng: 73.203,
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=70",
    verified: true, premium: true, rating: 4.8, reviewCount: 264, jobsResolved: 712,
    avg_speed: 4.8, avg_communication: 4.9, avg_resolution: 4.8,
    avgResponseSec: 71, languages: ["Gujarati", "Hindi", "English"],
    services: ["dispute", "kyc", "recharge", "sos"],
    banks: ["sbi-fastag", "paytm-fastag", "icici-fastag", "hdfc-fastag", "axis-fastag"],
    bio: "Senior Sathi covering Vadodara-Bharuch corridor. Trained 18 other Sathis. Goes hard on fleet-grade disputes.",
    activeHours: { mon: "6am-10pm", tue: "6am-10pm", wed: "6am-10pm", thu: "6am-10pm", fri: "6am-10pm", sat: "6am-10pm", sun: "7am-6pm" },
    contact: { phone: "+91 98XXX XX918", whatsapp: "+91 98XXX XX918" },
    reviews: [
      { author: "Bharat T.", date: "Jan 07 · 2026", stars: 5, speed: 5, communication: 5, resolution: 5, text: "Fleet of 22 trucks. Deepak ji handles all our disputes. Reliable." },
    ],
  },
];

/** Look-up helper used across pages */
export function getSathiBySlug(slug) {
  return SATHIS.find((s) => s.slug === slug);
}

/** Sort by Euclidean distance from a point (good enough for short ranges). */
export function nearestSathis(lat, lng, limit = 6) {
  return [...SATHIS]
    .map((s) => ({ ...s, distKm: haversine(lat, lng, s.lat, s.lng) }))
    .sort((a, b) => a.distKm - b.distKm)
    .slice(0, limit);
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371; // km
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
