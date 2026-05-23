#!/usr/bin/env node
/* eslint-disable */
/**
 * ApnaFastag — Full SSG prerenderer
 * Injects <head> meta + JSON-LD AND visible <body> HTML for all crawlers.
 * Also writes /build/sitemap.xml with all URLs.
 * Runs automatically as part of `npm run build`.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const BUILD_DIR = path.join(ROOT, "build");
const TEMPLATE  = path.join(BUILD_DIR, "index.html");

const SITE_URL    = "https://apnafastag.com";
const DEFAULT_IMG = `${SITE_URL}/og-default.png`;
const DEFAULT_DESC= "India's first real-time peer-to-peer rescue network for FASTag chaos — disputes, KYC, recharge fails, emergency SOS. Verified Sathis at 60+ toll plazas.";

/* ─── DATA ─── */

const STATES = [
  { slug:"maharashtra",       name:"Maharashtra",       plazaCount:142, sathiCount:386, highways:["NH-48","NH-160","NH-66"] },
  { slug:"uttar-pradesh",     name:"Uttar Pradesh",     plazaCount:168, sathiCount:421, highways:["NH-19","NH-27","NH-44"] },
  { slug:"rajasthan",         name:"Rajasthan",         plazaCount:89,  sathiCount:201, highways:["NH-48","NH-58","NH-27"] },
  { slug:"gujarat",           name:"Gujarat",           plazaCount:74,  sathiCount:156, highways:["NH-48","NH-27"] },
  { slug:"karnataka",         name:"Karnataka",         plazaCount:98,  sathiCount:221, highways:["NH-48","NH-44","NH-75"] },
  { slug:"tamil-nadu",        name:"Tamil Nadu",        plazaCount:89,  sathiCount:198, highways:["NH-44","NH-32"] },
  { slug:"telangana",         name:"Telangana",         plazaCount:67,  sathiCount:143, highways:["NH-44","NH-65"] },
  { slug:"andhra-pradesh",    name:"Andhra Pradesh",    plazaCount:78,  sathiCount:167, highways:["NH-16","NH-44"] },
  { slug:"west-bengal",       name:"West Bengal",       plazaCount:56,  sathiCount:123, highways:["NH-12","NH-16"] },
  { slug:"madhya-pradesh",    name:"Madhya Pradesh",    plazaCount:93,  sathiCount:187, highways:["NH-44","NH-46","NH-30"] },
  { slug:"kerala",            name:"Kerala",            plazaCount:48,  sathiCount:109, highways:["NH-66","NH-183"] },
  { slug:"punjab",            name:"Punjab",            plazaCount:52,  sathiCount:134, highways:["NH-44","NH-7"] },
  { slug:"haryana",           name:"Haryana",           plazaCount:67,  sathiCount:174, highways:["NH-44","NH-48","NH-19"] },
  { slug:"bihar",             name:"Bihar",             plazaCount:61,  sathiCount:132, highways:["NH-19","NH-28","NH-31"] },
  { slug:"odisha",            name:"Odisha",            plazaCount:54,  sathiCount:118, highways:["NH-16","NH-57"] },
  { slug:"jharkhand",         name:"Jharkhand",         plazaCount:43,  sathiCount:96,  highways:["NH-33","NH-75"] },
  { slug:"assam",             name:"Assam",             plazaCount:38,  sathiCount:84,  highways:["NH-15","NH-37"] },
  { slug:"himachal-pradesh",  name:"Himachal Pradesh",  plazaCount:29,  sathiCount:63,  highways:["NH-21","NH-22"] },
  { slug:"uttarakhand",       name:"Uttarakhand",       plazaCount:34,  sathiCount:72,  highways:["NH-58","NH-74"] },
  { slug:"chhattisgarh",      name:"Chhattisgarh",      plazaCount:47,  sathiCount:98,  highways:["NH-30","NH-43"] },
  { slug:"goa",               name:"Goa",               plazaCount:12,  sathiCount:34,  highways:["NH-66","NH-748"] },
  { slug:"delhi",             name:"Delhi",             plazaCount:24,  sathiCount:89,  highways:["NH-48","NH-44","NH-19"] },
  { slug:"jammu-kashmir",     name:"Jammu & Kashmir",   plazaCount:21,  sathiCount:47,  highways:["NH-44","NH-1"] },
  { slug:"tripura",           name:"Tripura",           plazaCount:14,  sathiCount:31,  highways:["NH-8"] },
  { slug:"meghalaya",         name:"Meghalaya",         plazaCount:11,  sathiCount:24,  highways:["NH-6"] },
  { slug:"manipur",           name:"Manipur",           plazaCount:9,   sathiCount:19,  highways:["NH-2"] },
  { slug:"nagaland",          name:"Nagaland",          plazaCount:8,   sathiCount:17,  highways:["NH-29"] },
  { slug:"arunachal-pradesh", name:"Arunachal Pradesh", plazaCount:7,   sathiCount:14,  highways:["NH-13"] },
  { slug:"sikkim",            name:"Sikkim",            plazaCount:5,   sathiCount:11,  highways:["NH-10"] },
];

const PLAZAS = [
  // Maharashtra
  { slug:"khalapur-nh48",        name:"Khalapur Plaza",        highway:"NH-48", state:"maharashtra", city:"Khalapur",   lat:18.81, lng:73.27, carRate:95,  truckRate:410, complaints:1240 },
  { slug:"vashi-mmrda",          name:"Vashi MMRDA Plaza",     highway:"MMRDA", state:"maharashtra", city:"Vashi",      lat:19.07, lng:73.00, carRate:45,  truckRate:175, complaints:890  },
  { slug:"lonavla-nh48",         name:"Lonavla Plaza",         highway:"NH-48", state:"maharashtra", city:"Lonavla",    lat:18.75, lng:73.41, carRate:95,  truckRate:410, complaints:760  },
  { slug:"pune-nh48",            name:"Pune Toll Plaza",       highway:"NH-48", state:"maharashtra", city:"Pune",       lat:18.52, lng:73.85, carRate:80,  truckRate:355, complaints:980  },
  { slug:"nashik-nh60",          name:"Nashik Plaza",          highway:"NH-60", state:"maharashtra", city:"Nashik",     lat:20.00, lng:73.78, carRate:75,  truckRate:320, complaints:540  },
  { slug:"nagpur-nh44",          name:"Nagpur Plaza",          highway:"NH-44", state:"maharashtra", city:"Nagpur",     lat:21.14, lng:79.08, carRate:85,  truckRate:370, complaints:620  },
  { slug:"aurangabad-nh52",      name:"Aurangabad Plaza",      highway:"NH-52", state:"maharashtra", city:"Aurangabad", lat:19.87, lng:75.34, carRate:70,  truckRate:305, complaints:430  },
  // Haryana
  { slug:"manesar-nh48",         name:"Manesar Plaza",         highway:"NH-48", state:"haryana",     city:"Manesar",    lat:28.36, lng:76.94, carRate:85,  truckRate:380, complaints:1430 },
  { slug:"kherki-daula-nh48",    name:"Kherki Daula Plaza",    highway:"NH-48", state:"haryana",     city:"Gurugram",   lat:28.39, lng:76.93, carRate:27,  truckRate:145, complaints:1180 },
  { slug:"zirakpur-nh44",        name:"Zirakpur Plaza",        highway:"NH-44", state:"haryana",     city:"Zirakpur",   lat:30.64, lng:76.82, carRate:110, truckRate:480, complaints:540  },
  { slug:"palwal-nh19",          name:"Palwal Plaza",          highway:"NH-19", state:"haryana",     city:"Palwal",     lat:28.14, lng:77.33, carRate:85,  truckRate:380, complaints:510  },
  { slug:"panipat-nh44",         name:"Panipat Plaza",         highway:"NH-44", state:"haryana",     city:"Panipat",    lat:29.39, lng:76.97, carRate:90,  truckRate:395, complaints:460  },
  { slug:"kundli-nh44",          name:"Kundli Plaza",          highway:"NH-44", state:"haryana",     city:"Kundli",     lat:28.87, lng:77.10, carRate:75,  truckRate:330, complaints:390  },
  // Karnataka
  { slug:"electronic-city-nh44", name:"Electronic City Plaza", highway:"NH-44", state:"karnataka",   city:"Bengaluru",  lat:12.84, lng:77.66, carRate:40,  truckRate:165, complaints:680  },
  { slug:"bengaluru-mysuru-nh275",name:"Bengaluru-Mysuru Plaza",highway:"NH-275",state:"karnataka",  city:"Bengaluru",  lat:12.92, lng:77.58, carRate:65,  truckRate:280, complaints:580  },
  { slug:"hubli-nh67",           name:"Hubli Plaza",           highway:"NH-67", state:"karnataka",   city:"Hubli",      lat:15.35, lng:75.13, carRate:75,  truckRate:325, complaints:320  },
  // Tamil Nadu
  { slug:"athur-nh44",           name:"Athur Plaza",           highway:"NH-44", state:"tamil-nadu",  city:"Athur",      lat:12.59, lng:77.94, carRate:75,  truckRate:320, complaints:410  },
  { slug:"chennai-nh48",         name:"Chennai Outer Ring",    highway:"NH-48", state:"tamil-nadu",  city:"Chennai",    lat:13.08, lng:80.27, carRate:60,  truckRate:260, complaints:720  },
  { slug:"coimbatore-nh544",     name:"Coimbatore Plaza",      highway:"NH-544",state:"tamil-nadu",  city:"Coimbatore", lat:11.00, lng:76.96, carRate:70,  truckRate:300, complaints:380  },
  // Gujarat
  { slug:"vadodara-nh48",        name:"Vadodara Plaza",        highway:"NH-48", state:"gujarat",     city:"Vadodara",   lat:22.30, lng:73.20, carRate:95,  truckRate:410, complaints:380  },
  { slug:"surat-nh48",           name:"Surat Plaza",           highway:"NH-48", state:"gujarat",     city:"Surat",      lat:21.17, lng:72.83, carRate:90,  truckRate:390, complaints:420  },
  { slug:"ahmedabad-nh48",       name:"Ahmedabad Plaza",       highway:"NH-48", state:"gujarat",     city:"Ahmedabad",  lat:23.02, lng:72.57, carRate:85,  truckRate:370, complaints:510  },
  // Uttar Pradesh
  { slug:"agra-nh19",            name:"Agra Plaza",            highway:"NH-19", state:"uttar-pradesh",city:"Agra",      lat:27.17, lng:78.01, carRate:80,  truckRate:350, complaints:760  },
  { slug:"kanpur-nh19",          name:"Kanpur Plaza",          highway:"NH-19", state:"uttar-pradesh",city:"Kanpur",    lat:26.44, lng:80.33, carRate:85,  truckRate:370, complaints:690  },
  { slug:"lucknow-nh27",         name:"Lucknow Plaza",         highway:"NH-27", state:"uttar-pradesh",city:"Lucknow",   lat:26.84, lng:80.94, carRate:75,  truckRate:325, complaints:580  },
  { slug:"noida-nh24",           name:"Noida DND Plaza",       highway:"NH-24", state:"uttar-pradesh",city:"Noida",     lat:28.57, lng:77.32, carRate:30,  truckRate:130, complaints:920  },
  // Rajasthan
  { slug:"jaipur-nh48",          name:"Jaipur Plaza",          highway:"NH-48", state:"rajasthan",   city:"Jaipur",     lat:26.91, lng:75.78, carRate:80,  truckRate:350, complaints:540  },
  { slug:"jodhpur-nh62",         name:"Jodhpur Plaza",         highway:"NH-62", state:"rajasthan",   city:"Jodhpur",    lat:26.29, lng:73.02, carRate:75,  truckRate:325, complaints:310  },
  // Delhi
  { slug:"delhi-meerut-nh58",    name:"Delhi-Meerut Expressway",highway:"NH-58",state:"delhi",       city:"Delhi",      lat:28.71, lng:77.38, carRate:55,  truckRate:235, complaints:1100 },
  { slug:"toll-plaza-delhi-nh44",name:"NH-44 Delhi Plaza",     highway:"NH-44", state:"delhi",       city:"Delhi",      lat:28.65, lng:77.20, carRate:65,  truckRate:280, complaints:880  },
  // Telangana
  { slug:"hyderabad-nh44",       name:"Hyderabad Outer Ring",  highway:"NH-44", state:"telangana",   city:"Hyderabad",  lat:17.38, lng:78.48, carRate:50,  truckRate:215, complaints:760  },
  // West Bengal
  { slug:"kolkata-nh12",         name:"Kolkata Plaza",         highway:"NH-12", state:"west-bengal", city:"Kolkata",    lat:22.57, lng:88.36, carRate:70,  truckRate:300, complaints:640  },
  // Madhya Pradesh
  { slug:"bhopal-nh46",          name:"Bhopal Plaza",          highway:"NH-46", state:"madhya-pradesh",city:"Bhopal",   lat:23.25, lng:77.40, carRate:75,  truckRate:325, complaints:390  },
  { slug:"indore-nh52",          name:"Indore Plaza",          highway:"NH-52", state:"madhya-pradesh",city:"Indore",   lat:22.71, lng:75.85, carRate:80,  truckRate:350, complaints:420  },
  // Punjab
  { slug:"amritsar-nh44",        name:"Amritsar Plaza",        highway:"NH-44", state:"punjab",      city:"Amritsar",   lat:31.63, lng:74.87, carRate:90,  truckRate:390, complaints:380  },
  { slug:"ludhiana-nh44",        name:"Ludhiana Plaza",        highway:"NH-44", state:"punjab",      city:"Ludhiana",   lat:30.90, lng:75.85, carRate:85,  truckRate:370, complaints:350  },
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

const HIGHWAYS = [
  { slug:"nh-48", name:"NH-48", fullName:"National Highway 48 (Delhi–Mumbai)", length:"1428 km", states:["Delhi","Haryana","Rajasthan","Gujarat","Maharashtra"], plazaCount:67, desc:"NH-48 is India's busiest highway connecting Delhi to Mumbai via Gurugram, Jaipur, Vadodara, and Surat." },
  { slug:"nh-44", name:"NH-44", fullName:"National Highway 44 (Srinagar–Kanyakumari)", length:"3745 km", states:["J&K","Punjab","Haryana","Delhi","UP","MP","Maharashtra","Telangana","AP","Tamil Nadu"], plazaCount:112, desc:"NH-44 is India's longest highway, connecting Srinagar in the north to Kanyakumari in the south." },
  { slug:"nh-19", name:"NH-19", fullName:"National Highway 19 (Delhi–Kolkata)", length:"1435 km", states:["Delhi","UP","Bihar","Jharkhand","West Bengal"], plazaCount:58, desc:"NH-19 connects Delhi to Kolkata via Agra, Kanpur, Varanasi, and Patna." },
  { slug:"nh-27", name:"NH-27", fullName:"National Highway 27 (Porbandar–Silchar)", length:"3187 km", states:["Gujarat","Rajasthan","MP","UP","Bihar","West Bengal","Assam"], plazaCount:89, desc:"NH-27 is one of India's longest east-west highways, connecting Porbandar in Gujarat to Silchar in Assam." },
  { slug:"nh-66", name:"NH-66", fullName:"National Highway 66 (Panvel–Kanyakumari)", length:"1622 km", states:["Maharashtra","Goa","Karnataka","Kerala","Tamil Nadu"], plazaCount:74, desc:"NH-66 runs along India's western coast, passing through Mumbai, Goa, Mangalore, and Calicut." },
  { slug:"nh-16", name:"NH-16", fullName:"National Highway 16 (Kolkata–Chennai)", length:"1711 km", states:["West Bengal","Odisha","Andhra Pradesh","Tamil Nadu"], plazaCount:64, desc:"NH-16 connects Kolkata to Chennai along the eastern coast through Bhubaneswar and Visakhapatnam." },
  { slug:"nh-8",  name:"NH-8",  fullName:"National Highway 8 (Mumbai–Pune Expressway)", length:"94 km", states:["Maharashtra"], plazaCount:8, desc:"NH-8 Mumbai-Pune Expressway is one of India's busiest expressways with multiple toll plazas." },
];

const CITIES = [
  { slug:"mumbai",    name:"Mumbai",    state:"Maharashtra", plazaCount:8,  sathiCount:42 },
  { slug:"delhi",     name:"Delhi",     state:"Delhi",       plazaCount:12, sathiCount:67 },
  { slug:"bengaluru", name:"Bengaluru", state:"Karnataka",   plazaCount:6,  sathiCount:38 },
  { slug:"pune",      name:"Pune",      state:"Maharashtra", plazaCount:5,  sathiCount:29 },
  { slug:"hyderabad", name:"Hyderabad", state:"Telangana",   plazaCount:7,  sathiCount:35 },
  { slug:"chennai",   name:"Chennai",   state:"Tamil Nadu",  plazaCount:5,  sathiCount:27 },
  { slug:"ahmedabad", name:"Ahmedabad", state:"Gujarat",     plazaCount:4,  sathiCount:22 },
  { slug:"kolkata",   name:"Kolkata",   state:"West Bengal", plazaCount:4,  sathiCount:19 },
  { slug:"jaipur",    name:"Jaipur",    state:"Rajasthan",   plazaCount:3,  sathiCount:17 },
  { slug:"lucknow",   name:"Lucknow",   state:"UP",          plazaCount:3,  sathiCount:16 },
  { slug:"surat",     name:"Surat",     state:"Gujarat",     plazaCount:3,  sathiCount:14 },
  { slug:"nagpur",    name:"Nagpur",    state:"Maharashtra", plazaCount:3,  sathiCount:13 },
  { slug:"gurugram",  name:"Gurugram",  state:"Haryana",     plazaCount:4,  sathiCount:24 },
  { slug:"noida",     name:"Noida",     state:"UP",          plazaCount:3,  sathiCount:18 },
  { slug:"chandigarh",name:"Chandigarh",state:"Punjab",      plazaCount:3,  sathiCount:15 },
  { slug:"indore",    name:"Indore",    state:"MP",          plazaCount:2,  sathiCount:11 },
  { slug:"bhopal",    name:"Bhopal",    state:"MP",          plazaCount:2,  sathiCount:10 },
  { slug:"vadodara",  name:"Vadodara",  state:"Gujarat",     plazaCount:2,  sathiCount:10 },
  { slug:"nashik",    name:"Nashik",    state:"Maharashtra", plazaCount:2,  sathiCount:9  },
  { slug:"agra",      name:"Agra",      state:"UP",          plazaCount:2,  sathiCount:9  },
];

const BLOG_POSTS = [
  { slug:"fastag-mischarge-refund-2026", title:"How to claim a FASTag mischarge refund in 2026 (step-by-step)", excerpt:"The official NHAI dispute window is 7 days. Here's the exact process — and the 3 mistakes that get claims rejected.", date:"2026-01-14" },
  { slug:"fastag-blacklisted-fix",       title:"FASTag blacklisted? 4 reasons + the fastest fix at the plaza",  excerpt:"Low balance is just one of the four reasons. Two require a bank branch visit — unless your Sathi handles it on-spot.",  date:"2026-01-09" },
  { slug:"toll-charges-nh48-2026",       title:"All NH-48 toll charges (Mumbai–Bengaluru) — updated Jan 2026",  excerpt:"Every plaza, every vehicle class, total trip cost. Bookmark this for every Mumbai-Pune-Bengaluru run.",                 date:"2026-01-03" },
  { slug:"how-to-become-fastag-sathi",   title:"Becoming a Fastag Sathi: ₹0 to ₹45,000/month in 60 days",      excerpt:"Real numbers from 12 Sathis at NH-48 plazas. Hours, payouts, what nobody tells you.",                                  date:"2025-12-28" },
];

const SATHIS = [
  { slug:"ravi-shinde-khalapur",   name:"Ravi Shinde",   city:"Khalapur",  state:"Maharashtra", plaza:"Khalapur Plaza",        rating:4.9, rc:127 },
  { slug:"anil-bhau-lonavla",      name:"Anil Bhau",     city:"Lonavla",   state:"Maharashtra", plaza:"Lonavla Plaza",         rating:4.8, rc:89  },
  { slug:"priya-pawar-vashi",      name:"Priya Pawar",   city:"Vashi",     state:"Maharashtra", plaza:"Vashi MMRDA Plaza",     rating:5.0, rc:56  },
  { slug:"vikram-sharma-manesar",  name:"Vikram Sharma", city:"Manesar",   state:"Haryana",     plaza:"Manesar Plaza",         rating:4.7, rc:203 },
  { slug:"lakshmi-iyer-bengaluru", name:"Lakshmi Iyer",  city:"Bengaluru", state:"Karnataka",   plaza:"Electronic City Plaza", rating:4.9, rc:141 },
  { slug:"rajesh-kumar-zirakpur",  name:"Rajesh Kumar",  city:"Zirakpur",  state:"Haryana",     plaza:"Zirakpur Plaza",        rating:4.6, rc:78  },
  { slug:"sanjana-rao-athur",      name:"Sanjana Rao",   city:"Athur",     state:"Tamil Nadu",  plaza:"Athur Plaza",           rating:4.9, rc:63  },
  { slug:"deepak-patel-vadodara",  name:"Deepak Patel",  city:"Vadodara",  state:"Gujarat",     plaza:"Vadodara Plaza",        rating:4.7, rc:45  },
];

const HELP_SLUGS = [
  "what-is-fastag","fastag-mandatory","fastag-validity","fastag-wallet-balance",
  "fastag-negative-balance","fastag-not-scanned","fastag-deactivated",
  "fastag-linked-bank-change","fastag-sticker-position","nhai-helpline-number",
  "fastag-reissue-process","fastag-mischarge-timeline","fastag-refund-status-check",
  "fastag-hotlisted","fastag-autopay-setup","fastag-upi-recharge",
  "fastag-net-banking-recharge","fastag-transaction-history","fastag-expiry-renewal",
  "fastag-pan-aadhaar-link","fastag-rc-linkage","fastag-vehicle-sold",
  "fastag-monthly-pass","fastag-gstin-invoice","fastag-cashback-offers",
  "fastag-fleet-management","fastag-balance-transfer","fastag-class-fee-dispute",
  "sbi-fastag-balance-check","sbi-fastag-dispute","sbi-fastag-blacklist-fix","sbi-fastag-kyc-update","sbi-fastag-recharge","sbi-fastag-helpline",
  "paytm-fastag-balance-check","paytm-fastag-dispute","paytm-fastag-blacklist-fix","paytm-fastag-kyc-update","paytm-fastag-recharge",
  "icici-fastag-balance-check","icici-fastag-dispute","icici-fastag-blacklist-fix","icici-fastag-kyc-update",
  "hdfc-fastag-balance-check","hdfc-fastag-dispute","hdfc-fastag-blacklist-fix","hdfc-fastag-kyc-update",
  "axis-fastag-balance-check","axis-fastag-dispute","axis-fastag-blacklist-fix",
  "kotak-fastag-balance-check","kotak-fastag-dispute","yes-fastag-balance-check","idfc-fastag-balance-check",
  "maharashtra-fastag-dispute","maharashtra-fastag-blacklist","maharashtra-fastag-balance-check","maharashtra-fastag-kyc-guide",
  "karnataka-fastag-dispute","karnataka-fastag-blacklist","karnataka-fastag-balance-check",
  "haryana-fastag-dispute","haryana-fastag-blacklist","haryana-fastag-balance-check",
  "tamil-nadu-fastag-dispute","tamil-nadu-fastag-blacklist",
  "gujarat-fastag-dispute","gujarat-fastag-blacklist",
  "delhi-fastag-dispute","delhi-fastag-blacklist",
  "uttar-pradesh-fastag-dispute","uttar-pradesh-fastag-blacklist",
  "telangana-fastag-dispute","rajasthan-fastag-dispute","punjab-fastag-dispute",
  "car-fastag-installation","truck-fastag-installation","bus-fastag-installation",
  "car-fastag-not-working","truck-fastag-not-working","car-fastag-dispute-guide",
  "motorcycle-fastag","suv-fastag-installation","lcv-fastag-installation",
];

/* ─── SCHEMAS ─── */

const orgSchema = {
  "@context":"https://schema.org","@type":"Organization",
  name:"ApnaFastag", url:SITE_URL,
  logo:{ "@type":"ImageObject", url:`${SITE_URL}/logo.png`, width:200, height:60 },
  sameAs:["https://twitter.com/apnafastag","https://www.instagram.com/apnafastag","https://www.youtube.com/@apnafastag"],
  contactPoint:{ "@type":"ContactPoint", telephone:"+91-1800-000-0000", contactType:"customer support", areaServed:"IN", availableLanguage:["en","hi","mr","ta","te","kn"] },
  foundingDate:"2025", description:DEFAULT_DESC,
};

const websiteSchema = {
  "@context":"https://schema.org","@type":"WebSite", name:"ApnaFastag", url:SITE_URL,
  potentialAction:{ "@type":"SearchAction", target:{ "@type":"EntryPoint", urlTemplate:`${SITE_URL}/help?search={search_term_string}` }, "query-input":"required name=search_term_string" },
};

const serviceSchema = {
  "@context":"https://schema.org","@type":"Service",
  name:"FASTag Rescue by Sathi", serviceType:"FASTag Issue Resolution", provider:orgSchema,
  areaServed:{ "@type":"Country", name:"India" },
  description:"Verified Sathis resolve FASTag disputes, KYC, blacklist, recharge failures, and SOS at toll plazas — usually in under 8 minutes.",
  offers:{ "@type":"Offer", price:"49", priceCurrency:"INR" },
};

const homepageFaq = {
  "@context":"https://schema.org","@type":"FAQPage",
  mainEntity:[
    { "@type":"Question", name:"What is ApnaFastag?", acceptedAnswer:{ "@type":"Answer", text:"ApnaFastag is India's first peer-to-peer FASTag rescue network. Verified Sathis at toll plazas resolve FASTag disputes, KYC, blacklist, and recharge issues — usually in under 8 minutes." }},
    { "@type":"Question", name:"How much does it cost?", acceptedAnswer:{ "@type":"Answer", text:"₹49 to ₹499 per issue. You only pay after your problem is resolved. No subscription." }},
    { "@type":"Question", name:"Which toll plazas are covered?", acceptedAnswer:{ "@type":"Answer", text:"60+ toll plazas across India on NH-48, NH-44, NH-19 in Maharashtra, Haryana, Karnataka, Gujarat and Tamil Nadu. Expanding to 200+ by Q2 2026." }},
    { "@type":"Question", name:"What FASTag issues can be resolved?", acceptedAnswer:{ "@type":"Answer", text:"Disputes, refunds, blacklist removal, KYC updates, RC mismatch, recharge failures, double deductions, and emergency SOS." }},
    { "@type":"Question", name:"How to become a FASTag Sathi?", acceptedAnswer:{ "@type":"Answer", text:"Apply on the Become a Sathi page. Be near a toll plaza, pass verification. Sathis earn ₹25,000–₹60,000/month." }},
  ],
};

function articleSchema(post) {
  return { "@context":"https://schema.org","@type":"Article", headline:post.title, description:post.excerpt, image:DEFAULT_IMG, datePublished:post.date, dateModified:post.date, author:{ "@type":"Organization", name:"ApnaFastag", url:SITE_URL }, publisher:{ "@type":"Organization", name:"ApnaFastag", logo:{ "@type":"ImageObject", url:`${SITE_URL}/logo.png` } }, mainEntityOfPage:`${SITE_URL}/blog/${post.slug}`, inLanguage:"en-IN" };
}
function sathiSchema(s) {
  return { "@context":"https://schema.org","@type":"Person", name:s.name, jobTitle:"Verified FASTag Sathi", url:`${SITE_URL}/sathi/${s.slug}`, worksFor:orgSchema, address:{ "@type":"PostalAddress", addressLocality:s.city, addressRegion:s.state, addressCountry:"IN" }, aggregateRating:{ "@type":"AggregateRating", ratingValue:s.rating, reviewCount:s.rc, bestRating:5, worstRating:1 } };
}
function placeSchema(p, s) {
  return { "@context":"https://schema.org","@type":"Place", name:`${p.name} — Toll Plaza on ${p.highway}`, geo:{ "@type":"GeoCoordinates", latitude:p.lat, longitude:p.lng }, address:{ "@type":"PostalAddress", addressLocality:p.city, addressRegion:s?.name||"India", addressCountry:"IN" }, url:`${SITE_URL}/toll/${p.slug}`, hasMap:`https://www.google.com/maps?q=${p.lat},${p.lng}` };
}
function webAppSchema(name, desc, url) {
  return { "@context":"https://schema.org","@type":"WebApplication", name, description:desc, url, applicationCategory:"UtilityApplication", operatingSystem:"Any", offers:{ "@type":"Offer", price:"0", priceCurrency:"INR" } };
}
function breadcrumb(items) {
  return { "@context":"https://schema.org","@type":"BreadcrumbList", itemListElement:items.map((it,i)=>({ "@type":"ListItem", position:i+1, name:it.name, item:it.url })) };
}

/* ─── BODY HTML GENERATORS ─── */

function bodyLanding() {
  return `<main style="font-family:sans-serif;max-width:900px;margin:0 auto;padding:40px 20px">
    <h1 style="font-size:2.5rem;font-weight:900;color:#0A0A0A">Stuck at a toll? Your Sathi arrives in 90 seconds.</h1>
    <p style="font-size:1.1rem;color:#4B5563;margin:16px 0 32px">India's first peer-to-peer FASTag rescue network. Verified Sathis resolve disputes, KYC, recharge failures and SOS at 60+ toll plazas — pay only when fixed.</p>
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:40px">
      <a href="/find" style="background:#FF6B00;color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;text-decoration:none;font-size:1rem">Find a Sathi near me</a>
      <a href="/become-a-sathi" style="border:2px solid #0A0A0A;color:#0A0A0A;padding:14px 28px;border-radius:50px;font-weight:700;text-decoration:none;font-size:1rem">Earn ₹45k/month as Sathi</a>
    </div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:20px;margin-bottom:48px">
      <div style="background:#F8F9FA;border-radius:16px;padding:20px;text-align:center"><div style="font-size:2rem;font-weight:900;color:#FF6B00">60+</div><div style="color:#4B5563;font-size:.9rem">Toll Plazas</div></div>
      <div style="background:#F8F9FA;border-radius:16px;padding:20px;text-align:center"><div style="font-size:2rem;font-weight:900;color:#FF6B00">8 min</div><div style="color:#4B5563;font-size:.9rem">Avg Resolution Time</div></div>
      <div style="background:#F8F9FA;border-radius:16px;padding:20px;text-align:center"><div style="font-size:2rem;font-weight:900;color:#FF6B00">₹49</div><div style="color:#4B5563;font-size:.9rem">Starting Price</div></div>
      <div style="background:#F8F9FA;border-radius:16px;padding:20px;text-align:center"><div style="font-size:2rem;font-weight:900;color:#FF6B00">4.8★</div><div style="color:#4B5563;font-size:.9rem">Average Rating</div></div>
    </div>
    <h2 style="font-size:1.6rem;font-weight:800;margin-bottom:16px">FASTag issues we resolve at the toll</h2>
    <ul style="color:#374151;line-height:2;columns:2;padding-left:20px">
      <li>FASTag dispute &amp; mischarge refund</li><li>FASTag blacklisted or blocked</li>
      <li>KYC update &amp; RC mismatch fix</li><li>Balance recharge failure</li>
      <li>Double deduction refund</li><li>Emergency SOS at toll</li>
      <li>FASTag not reading at toll</li><li>Lost or damaged FASTag replacement</li>
    </ul>
    <h2 style="font-size:1.6rem;font-weight:800;margin:32px 0 16px">FASTag banks we support</h2>
    <p style="color:#4B5563">SBI FASTag, Paytm FASTag, ICICI FASTag, HDFC FASTag, Axis FASTag, Kotak FASTag, Yes Bank FASTag, IDFC First FASTag — all banks supported at every toll plaza.</p>
    <h2 style="font-size:1.6rem;font-weight:800;margin:32px 0 16px">States covered</h2>
    <p style="color:#4B5563">Maharashtra, Haryana, Karnataka, Gujarat, Tamil Nadu, Telangana, Delhi, Uttar Pradesh, Rajasthan, Punjab and 19 more states. <a href="/coverage" style="color:#FF6B00">View full coverage →</a></p>
  </main>`;
}

function bodyHelp(slug) {
  const title = slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const isBank = BANKS.find(b => slug.startsWith(b.slug.replace("-fastag","")));
  const isState = STATES.find(s => slug.startsWith(s.slug));
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <a href="/help" style="color:#FF6B00">Help Center</a> › <span>${title}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:16px">${title}</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px">Complete step-by-step guide for <strong>${title.toLowerCase()}</strong> in India. This guide covers the official process, common errors, and how to get on-spot help from a verified Sathi at your nearest toll plaza.</p>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">Quick steps</h2>
    <ol style="color:#374151;line-height:2;padding-left:20px">
      <li>Note your FASTag ID, vehicle number, and transaction ID</li>
      <li>Contact your FASTag bank's helpline or use the bank app</li>
      <li>If unresolved in 24 hours, file an NHAI complaint at 1033</li>
      <li>For instant resolution at the toll — ping a verified Sathi via ApnaFastag</li>
    </ol>
    ${isBank ? `<h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">Bank helpline</h2><p style="color:#374151">Call <strong>${isBank.helpline}</strong> or SMS <strong>${isBank.smsCode}</strong> from your registered mobile.</p>` : ""}
    ${isState ? `<h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">Sathi coverage in ${isState.name}</h2><p style="color:#374151">${isState.sathiCount}+ verified Sathis across ${isState.plazaCount} toll plazas in ${isState.name} on ${isState.highways.join(", ")}.</p>` : ""}
    <div style="background:#FF6B00;border-radius:16px;padding:28px;margin-top:32px;color:#fff">
      <h3 style="font-size:1.3rem;font-weight:900;margin-bottom:8px">Stuck at the toll right now?</h3>
      <p style="opacity:.9;margin-bottom:16px">A verified Sathi at your plaza can resolve this in under 8 minutes. Skip the helpline queue.</p>
      <a href="/find" style="background:#0A0A0A;color:#fff;padding:12px 24px;border-radius:50px;font-weight:700;text-decoration:none">Find a Sathi →</a>
    </div>
  </article>`;
}

function bodyPlaza(p, s) {
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <a href="/coverage" style="color:#FF6B00">Coverage</a> › <span>${p.name}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:8px">${p.name}</h1>
    <p style="color:#9CA3AF;font-size:.9rem;margin-bottom:24px">${p.highway} · ${p.city}${s?`, ${s.name}`:""}</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px">
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">₹${p.carRate}</div><div style="color:#4B5563;font-size:.85rem">Car / Single Axle</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">₹${p.truckRate}</div><div style="color:#4B5563;font-size:.85rem">Truck / Multi Axle</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${p.complaints}+</div><div style="color:#4B5563;font-size:.85rem">Monthly FASTag Issues</div></div>
    </div>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">Common FASTag issues at ${p.name}</h2>
    <ul style="color:#374151;line-height:2;padding-left:20px">
      <li>FASTag mischarge / double deduction</li><li>Tag not reading at the barrier</li>
      <li>Blacklisted due to low balance</li><li>KYC mismatch causing delay</li>
    </ul>
    <h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">Sathi at ${p.name}</h2>
    <p style="color:#4B5563">Verified ApnaFastag Sathis are available at ${p.name} to resolve FASTag issues on-spot. Average resolution time is under 8 minutes.</p>
    <a href="/find" style="display:inline-block;background:#FF6B00;color:#fff;padding:12px 24px;border-radius:50px;font-weight:700;text-decoration:none;margin-top:16px">Find a Sathi at ${p.city} →</a>
  </article>`;
}

function bodyState(s) {
  const statePlazas = PLAZAS.filter(p=>p.state===s.slug);
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <a href="/coverage" style="color:#FF6B00">Coverage</a> › <span>${s.name}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:12px">${s.name} — FASTag Help & Toll Plaza Sathis</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px">${s.plazaCount} toll plazas across ${s.name} covered by <strong>${s.sathiCount}+ verified Sathis</strong> on ${s.highways.join(", ")}. Get on-spot FASTag help at any toll.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px">
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${s.plazaCount}</div><div style="color:#4B5563;font-size:.85rem">Toll Plazas</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${s.sathiCount}+</div><div style="color:#4B5563;font-size:.85rem">Verified Sathis</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${s.highways.length}</div><div style="color:#4B5563;font-size:.85rem">Major Highways</div></div>
    </div>
    ${statePlazas.length > 0 ? `<h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">Toll plazas in ${s.name}</h2><ul style="color:#374151;line-height:2;padding-left:20px">${statePlazas.map(p=>`<li><a href="/toll/${p.slug}" style="color:#FF6B00">${p.name}</a> (${p.highway}, ${p.city}) — Car ₹${p.carRate}</li>`).join("")}</ul>` : ""}
    <h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">FASTag help in ${s.name}</h2>
    <ul style="color:#374151;line-height:2;padding-left:20px">
      <li><a href="/help/${s.slug}-fastag-dispute" style="color:#FF6B00">FASTag dispute &amp; refund in ${s.name}</a></li>
      <li><a href="/help/${s.slug}-fastag-blacklist" style="color:#FF6B00">FASTag blacklist fix in ${s.name}</a></li>
      <li><a href="/help/${s.slug}-fastag-balance-check" style="color:#FF6B00">FASTag balance check in ${s.name}</a></li>
    </ul>
  </article>`;
}

function bodyBank(b) {
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <span>${b.name}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:12px">${b.name} — Balance Check, Helpline &amp; Dispute Help</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px">Complete guide for ${b.name} users — check balance, contact helpline, file disputes, and get on-spot Sathi rescue at any toll plaza.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:32px">
      <div style="background:#F8F9FA;border-radius:12px;padding:20px">
        <h3 style="font-weight:700;margin-bottom:8px;font-size:1rem">Balance check via SMS</h3>
        <p style="color:#4B5563;font-size:.9rem">Send SMS <strong>${b.smsCode}</strong> from your registered mobile to get your ${b.shortName} FASTag balance instantly.</p>
      </div>
      <div style="background:#F8F9FA;border-radius:12px;padding:20px">
        <h3 style="font-weight:700;margin-bottom:8px;font-size:1rem">24×7 Helpline</h3>
        <p style="color:#4B5563;font-size:.9rem">Call <strong>${b.helpline}</strong> for ${b.name} customer support. Average wait: 8–14 minutes.</p>
      </div>
    </div>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">Common ${b.shortName} FASTag issues</h2>
    <ul style="color:#374151;line-height:2;padding-left:20px">
      <li><a href="/help/${b.slug}-balance-check" style="color:#FF6B00">${b.name} balance check guide</a></li>
      <li><a href="/help/${b.slug}-dispute" style="color:#FF6B00">${b.name} dispute &amp; refund process</a></li>
      <li><a href="/help/${b.slug}-blacklist-fix" style="color:#FF6B00">${b.name} blacklist fix</a></li>
      <li><a href="/help/${b.slug}-kyc-update" style="color:#FF6B00">${b.name} KYC update</a></li>
    </ul>
    <div style="background:#FF6B00;border-radius:16px;padding:28px;margin-top:32px;color:#fff">
      <h3 style="font-size:1.2rem;font-weight:900;margin-bottom:8px">Stuck at a toll with ${b.name}?</h3>
      <p style="opacity:.9;margin-bottom:16px">Skip the helpline. A Sathi at your plaza resolves ${b.shortName} issues in under 8 minutes.</p>
      <a href="/find" style="background:#0A0A0A;color:#fff;padding:12px 24px;border-radius:50px;font-weight:700;text-decoration:none">Ping a Sathi now →</a>
    </div>
  </article>`;
}

function bodyHighway(h) {
  const hwPlazas = PLAZAS.filter(p=>p.highway===h.name);
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <a href="/coverage" style="color:#FF6B00">Coverage</a> › <span>${h.name}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:8px">${h.fullName}</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px">${h.desc} Total length: ${h.length}. ${h.plazaCount}+ toll plazas with FASTag collection.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px">
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${h.length}</div><div style="color:#4B5563;font-size:.85rem">Highway Length</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${h.plazaCount}+</div><div style="color:#4B5563;font-size:.85rem">Toll Plazas</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${h.states.length}</div><div style="color:#4B5563;font-size:.85rem">States Covered</div></div>
    </div>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">States on ${h.name}</h2>
    <p style="color:#4B5563">${h.states.join(" · ")}</p>
    ${hwPlazas.length>0?`<h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">Toll plazas on ${h.name}</h2><ul style="color:#374151;line-height:2;padding-left:20px">${hwPlazas.map(p=>`<li><a href="/toll/${p.slug}" style="color:#FF6B00">${p.name}</a>, ${p.city} — Car ₹${p.carRate} | Truck ₹${p.truckRate}</li>`).join("")}</ul>`:""}
    <div style="background:#FF6B00;border-radius:16px;padding:28px;margin-top:32px;color:#fff">
      <h3 style="font-size:1.2rem;font-weight:900;margin-bottom:8px">FASTag issue on ${h.name}?</h3>
      <p style="opacity:.9;margin-bottom:16px">Find a verified Sathi at the nearest plaza on ${h.name} for instant FASTag help.</p>
      <a href="/find" style="background:#0A0A0A;color:#fff;padding:12px 24px;border-radius:50px;font-weight:700;text-decoration:none">Find a Sathi →</a>
    </div>
  </article>`;
}

function bodyCity(c) {
  const cityPlazas = PLAZAS.filter(p=>p.city.toLowerCase()===c.name.toLowerCase());
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <nav style="font-size:.85rem;color:#9CA3AF;margin-bottom:20px"><a href="/" style="color:#FF6B00">Home</a> › <a href="/find" style="color:#FF6B00">Find a Sathi</a> › <span>${c.name}</span></nav>
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:12px">FASTag Help in ${c.name} — Verified Sathis at Toll Plazas</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px"><strong>${c.sathiCount}+ verified Sathis</strong> across ${c.plazaCount} toll plazas in ${c.name}, ${c.state}. Resolve FASTag disputes, blacklist, KYC, and recharge issues on-spot — usually in under 8 minutes.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px;margin-bottom:32px">
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${c.sathiCount}+</div><div style="color:#4B5563;font-size:.85rem">Verified Sathis</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">${c.plazaCount}</div><div style="color:#4B5563;font-size:.85rem">Toll Plazas</div></div>
      <div style="background:#F8F9FA;border-radius:12px;padding:16px;text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#FF6B00">8 min</div><div style="color:#4B5563;font-size:.85rem">Avg Resolution</div></div>
    </div>
    ${cityPlazas.length>0?`<h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">Toll plazas in ${c.name}</h2><ul style="color:#374151;line-height:2;padding-left:20px">${cityPlazas.map(p=>`<li><a href="/toll/${p.slug}" style="color:#FF6B00">${p.name}</a> (${p.highway}) — Car ₹${p.carRate}</li>`).join("")}</ul>`:""}
    <h2 style="font-size:1.3rem;font-weight:800;margin:24px 0 12px">Common FASTag issues in ${c.name}</h2>
    <ul style="color:#374151;line-height:2;padding-left:20px">
      <li>FASTag mischarge at ${c.name} toll plazas</li>
      <li>FASTag blacklisted on way through ${c.name}</li>
      <li>KYC pending causing toll lane hold-up in ${c.name}</li>
      <li>Recharge not reflecting at ${c.name} plaza</li>
    </ul>
    <a href="/find" style="display:inline-block;background:#FF6B00;color:#fff;padding:14px 28px;border-radius:50px;font-weight:700;text-decoration:none;margin-top:24px">Find Sathi in ${c.name} →</a>
  </article>`;
}

function bodyTool(name, desc, steps) {
  return `<article style="font-family:sans-serif;max-width:800px;margin:0 auto;padding:40px 20px">
    <h1 style="font-size:2rem;font-weight:900;color:#0A0A0A;margin-bottom:12px">${name}</h1>
    <p style="color:#4B5563;font-size:1.05rem;line-height:1.7;margin-bottom:28px">${desc}</p>
    <div id="root-tool-placeholder" style="background:#F8F9FA;border-radius:16px;padding:32px;text-align:center;margin-bottom:32px">
      <p style="color:#4B5563;font-size:.95rem">Loading tool... (requires JavaScript)</p>
    </div>
    <h2 style="font-size:1.3rem;font-weight:800;margin-bottom:12px">How to use</h2>
    <ol style="color:#374151;line-height:2;padding-left:20px">${steps.map(s=>`<li>${s}</li>`).join("")}</ol>
    <p style="color:#4B5563;margin-top:24px">Need help at the toll? <a href="/find" style="color:#FF6B00;font-weight:700">Find a Sathi near you →</a></p>
  </article>`;
}

/* ─── HEAD builder ─── */

function esc(s="") { return String(s).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

function buildHead({ title, description=DEFAULT_DESC, canonical, image=DEFAULT_IMG, keywords, jsonLd=[] }) {
  const t = title.includes("ApnaFastag") ? title : `${title} · ApnaFastag`;
  const lds = jsonLd.map(ld=>`<script type="application/ld+json">${JSON.stringify(ld)}</script>`).join("\n    ");
  return `<!-- SSG prerendered -->
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
    ${lds}`;
}

/* ─── ROUTE MANIFEST ─── */

const routes = [
  { path:"/", head:buildHead({ title:"ApnaFastag — Stuck at a toll? Your Sathi arrives in 90 seconds.", description:DEFAULT_DESC, canonical:`${SITE_URL}/`, keywords:"fastag help, fastag dispute, fastag sathi, fastag rescue, toll plaza help india, fastag mischarge refund, nhai fastag", jsonLd:[orgSchema,websiteSchema,serviceSchema,homepageFaq] }), body:bodyLanding() },

  { path:"/find",          head:buildHead({ title:"Find a FASTag Sathi near you — live map across India", description:"See verified FASTag Sathis around you on a live map. Login with mobile OTP to book instantly.", canonical:`${SITE_URL}/find`, keywords:"find fastag sathi near me, fastag help near me, toll plaza assistance" }) },
  { path:"/how-it-works",  head:buildHead({ title:"How ApnaFastag works — from stuck to sorted in 8 minutes", canonical:`${SITE_URL}/how-it-works` }) },
  { path:"/features",      head:buildHead({ title:"Features — FASTag dispute, KYC, SOS rescue at toll plazas", canonical:`${SITE_URL}/features` }) },
  { path:"/pricing",       head:buildHead({ title:"Pricing — Pay only when your FASTag issue is fixed. From ₹49.", description:"₹49–₹499 per resolved issue. No subscription. No hidden fees.", canonical:`${SITE_URL}/pricing` }) },
  { path:"/become-a-sathi",head:buildHead({ title:"Become a FASTag Sathi — earn ₹25k–₹60k/month at your toll", description:"Join India's fastest-growing toll plaza network. Verify once, earn every day resolving FASTag issues.", canonical:`${SITE_URL}/become-a-sathi`, keywords:"become fastag sathi, fastag agent income, toll plaza job" }) },
  { path:"/coverage",      head:buildHead({ title:"Coverage — 60+ toll plazas across India with verified Sathis", canonical:`${SITE_URL}/coverage` }) },
  { path:"/about",         head:buildHead({ title:"About ApnaFastag — built by drivers, for drivers", canonical:`${SITE_URL}/about` }) },
  { path:"/blog",          head:buildHead({ title:"Blog — FASTag fixes, toll rates, Sathi guides", canonical:`${SITE_URL}/blog` }) },
  { path:"/help",          head:buildHead({ title:"FASTag Help Center — 1000+ guides & answers", description:"Every FASTag question answered — disputes, blacklist, KYC, recharge, balance check. All 8 banks, all states.", canonical:`${SITE_URL}/help`, keywords:"fastag help, fastag faq, fastag guide, fastag problems solutions" }) },
  { path:"/contact",       head:buildHead({ title:"Contact ApnaFastag", canonical:`${SITE_URL}/contact` }) },
  { path:"/careers",       head:buildHead({ title:"Careers — build India's toll rescue layer", canonical:`${SITE_URL}/careers` }) },
  { path:"/press",         head:buildHead({ title:"Press kit — logos, brand assets", canonical:`${SITE_URL}/press` }) },
  { path:"/privacy",       head:buildHead({ title:"Privacy Policy — ApnaFastag", canonical:`${SITE_URL}/privacy` }) },
  { path:"/terms",         head:buildHead({ title:"Terms of Service — ApnaFastag", canonical:`${SITE_URL}/terms` }) },
  { path:"/refund-policy", head:buildHead({ title:"Refund Policy — ApnaFastag", canonical:`${SITE_URL}/refund-policy` }) },

  // Tools
  { path:"/tools/fastag-balance-check", body:bodyTool("FASTag Balance Check — Free Tool for All Banks","Check your FASTag balance instantly for SBI, Paytm, ICICI, HDFC, Axis, Kotak, Yes Bank, and IDFC First. Free, no login required.",["Enter your vehicle number or FASTag ID","Select your bank","Click Check Balance","Balance is displayed instantly"]), head:buildHead({ title:"FASTag balance check — free tool for all banks (SBI, Paytm, ICICI, HDFC)", description:"Check FASTag balance instantly. Works for all 8 FASTag banks. Free, no login.", canonical:`${SITE_URL}/tools/fastag-balance-check`, keywords:"fastag balance check, sbi fastag balance, paytm fastag balance, icici fastag balance, hdfc fastag balance", jsonLd:[webAppSchema("FASTag Balance Checker","Free FASTag balance lookup for all Indian banks",`${SITE_URL}/tools/fastag-balance-check`)] }) },
  { path:"/tools/toll-calculator", body:bodyTool("Toll Calculator India — Estimate Trip Toll for Any Highway","Estimate total toll charges for any highway route in India. Updated 2026 rates for all NHAI plazas.",["Enter your origin city","Enter your destination city","Select vehicle type","See estimated toll charges for the route"]), head:buildHead({ title:"Toll calculator India — estimate trip toll for any highway 2026", description:"Estimate total toll charges for any route in India. Updated 2026 NHAI rates.", canonical:`${SITE_URL}/tools/toll-calculator`, keywords:"toll calculator india, nh48 toll rate, highway toll estimate 2026, road trip toll cost", jsonLd:[webAppSchema("Toll Calculator India","Free highway toll cost estimator India",`${SITE_URL}/tools/toll-calculator`)] }) },
  { path:"/tools/dispute-tracker", body:bodyTool("FASTag Dispute Tracker — Check NHAI Refund Status","Track your FASTag dispute and refund status in real-time using your reference number.",["Enter your dispute reference number","Select the bank or NHAI portal","Click Track Status","See current stage of your dispute"]), head:buildHead({ title:"FASTag dispute tracker — check NHAI refund status real-time", description:"Track FASTag dispute resolution in real-time using your reference number.", canonical:`${SITE_URL}/tools/dispute-tracker`, keywords:"fastag dispute tracker, nhai dispute status, fastag refund status check", jsonLd:[webAppSchema("FASTag Dispute Tracker","Real-time FASTag dispute and refund status tracker",`${SITE_URL}/tools/dispute-tracker`)] }) },
  { path:"/tools/fastag-status", body:bodyTool("FASTag Status Check — Active, Blacklisted or Blocked?","Check your FASTag tag status instantly using your vehicle number.",["Enter your vehicle number (e.g. MH12AB1234)","Click Check Status","See if your FASTag is Active, Blacklisted, or Inactive","Get recommended action"]), head:buildHead({ title:"FASTag status check — is your tag active, blacklisted or blocked?", description:"Check your FASTag status instantly using vehicle number. Free tool.", canonical:`${SITE_URL}/tools/fastag-status`, keywords:"fastag status check, fastag active or not, fastag blacklist check vehicle number", jsonLd:[webAppSchema("FASTag Status Checker","Check FASTag active/blacklisted/blocked status",`${SITE_URL}/tools/fastag-status`)] }) },

  // Plazas
  ...PLAZAS.map(p => {
    const s = STATES.find(x=>x.slug===p.state);
    return { path:`/toll/${p.slug}`, body:bodyPlaza(p,s), head:buildHead({ title:`${p.name} (${p.highway}) toll rates 2026 — FASTag help & Sathi`, description:`${p.name} on ${p.highway} at ${p.city}: car ₹${p.carRate}, truck ₹${p.truckRate}. ${p.complaints}+ monthly FASTag issues. Verified Sathis on-spot.`, canonical:`${SITE_URL}/toll/${p.slug}`, keywords:`${p.name} toll rate, ${p.highway} toll ${p.city}, fastag help ${p.city}, fastag dispute ${p.name}`, jsonLd:[placeSchema(p,s), breadcrumb([{name:"Coverage",url:`${SITE_URL}/coverage`},{name:p.name,url:`${SITE_URL}/toll/${p.slug}`}])] }) };
  }),

  // All 29 states
  ...STATES.map(s => ({ path:`/state/${s.slug}`, body:bodyState(s), head:buildHead({ title:`${s.name} toll plazas 2026 — FASTag help & ${s.sathiCount}+ verified Sathis`, description:`${s.plazaCount} toll plazas across ${s.name} covered by ${s.sathiCount}+ verified Sathis on ${s.highways.join(", ")}. Resolve FASTag issues on-spot.`, canonical:`${SITE_URL}/state/${s.slug}`, keywords:`${s.name} toll plazas, fastag help ${s.name}, ${s.highways.join(" ")} toll rates, fastag dispute ${s.name}` }) })),

  // All 8 banks
  ...BANKS.map(b => ({ path:`/bank/${b.slug}`, body:bodyBank(b), head:buildHead({ title:`${b.name} balance check, helpline & dispute help`, description:`${b.name}: check balance via SMS ${b.smsCode}, call helpline ${b.helpline}, or get on-spot Sathi rescue at any toll plaza.`, canonical:`${SITE_URL}/bank/${b.slug}`, keywords:`${b.name} balance check, ${b.name} helpline, ${b.name} dispute, ${b.shortName} fastag customer care, ${b.shortName} fastag blacklist` }) })),

  // Highways
  ...HIGHWAYS.map(h => ({ path:`/highway/${h.slug}`, body:bodyHighway(h), head:buildHead({ title:`${h.fullName} — toll rates, FASTag help & plaza guide 2026`, description:`${h.desc} Complete toll rates, FASTag dispute help, and verified Sathis at every plaza on ${h.name}.`, canonical:`${SITE_URL}/highway/${h.slug}`, keywords:`${h.name} toll rates, ${h.name} fastag help, ${h.fullName} toll plaza 2026` }) })),

  // Cities
  ...CITIES.map(c => ({ path:`/city/${c.slug}`, body:bodyCity(c), head:buildHead({ title:`FASTag help in ${c.name} — ${c.sathiCount}+ verified Sathis at toll plazas`, description:`${c.sathiCount}+ verified FASTag Sathis across ${c.plazaCount} toll plazas in ${c.name}, ${c.state}. Resolve disputes, blacklist, KYC in under 8 minutes.`, canonical:`${SITE_URL}/city/${c.slug}`, keywords:`fastag help ${c.name}, fastag sathi ${c.name}, toll plaza ${c.name} fastag, fastag dispute ${c.name}` }) })),

  // Blog posts
  ...BLOG_POSTS.map(post => ({ path:`/blog/${post.slug}`, head:buildHead({ title:post.title, description:post.excerpt, canonical:`${SITE_URL}/blog/${post.slug}`, image:DEFAULT_IMG, jsonLd:[articleSchema(post), breadcrumb([{name:"Blog",url:`${SITE_URL}/blog`},{name:post.title,url:`${SITE_URL}/blog/${post.slug}`}])] }) })),

  // Sathi profiles
  ...SATHIS.map(s => ({ path:`/sathi/${s.slug}`, head:buildHead({ title:`${s.name} — Verified FASTag Sathi at ${s.plaza}, ${s.city}`, description:`${s.name} is a verified FASTag Sathi at ${s.plaza}, ${s.city}, ${s.state}. Rated ${s.rating}/5 from ${s.rc} reviews.`, canonical:`${SITE_URL}/sathi/${s.slug}`, keywords:`fastag sathi ${s.city}, fastag help ${s.plaza}, ${s.name} fastag`, jsonLd:[sathiSchema(s)] }) })),

  // Help articles
  ...HELP_SLUGS.map(slug => ({ path:`/help/${slug}`, body:bodyHelp(slug), head:buildHead({ title:`${slug.replace(/-/g," ").replace(/\b\w/g,c=>c.toUpperCase())} — FASTag Guide 2026`, description:`Complete guide: ${slug.replace(/-/g," ")} in India. Step-by-step, with on-spot Sathi rescue option at any toll plaza.`, canonical:`${SITE_URL}/help/${slug}`, keywords:`${slug.replace(/-/g," ")}, fastag guide india, fastag help` }) })),
];

/* ─── SITEMAP GENERATOR ─── */

function buildSitemap() {
  const today = new Date().toISOString().split("T")[0];
  const priorities = { "/":1.0, "/find":0.95, "/tools/fastag-balance-check":0.95, "/tools/toll-calculator":0.9, "/tools/dispute-tracker":0.9, "/tools/fastag-status":0.9, "/help":0.9, "/coverage":0.85, "/how-it-works":0.8, "/features":0.8, "/pricing":0.8, "/become-a-sathi":0.85, "/blog":0.8 };
  const urls = routes.map(r => {
    const p = priorities[r.path] || (r.path.startsWith("/toll/")||r.path.startsWith("/state/")||r.path.startsWith("/highway/")||r.path.startsWith("/city/") ? 0.8 : r.path.startsWith("/bank/") ? 0.75 : r.path.startsWith("/help/") ? 0.7 : r.path.startsWith("/blog/") ? 0.7 : r.path.startsWith("/sathi/") ? 0.65 : 0.5);
    const cf = r.path==="/" ? "daily" : r.path.startsWith("/help/")||r.path.startsWith("/blog/") ? "weekly" : "monthly";
    return `  <url><loc>${SITE_URL}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${cf}</changefreq><priority>${p.toFixed(1)}</priority></url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
}

/* ─── EMIT ─── */

async function emit() {
  if (!fs.existsSync(TEMPLATE)) { console.error("❌ build/index.html not found. Run npm run build first."); process.exit(1); }
  let template = fs.readFileSync(TEMPLATE, "utf8");
  template = template
    .replace(/<title>[^<]*<\/title>/i, "")
    .replace(/<meta\s+name="description"[^>]*>/i, "")
    .replace(/<meta\s+name="theme-color"[^>]*>/i, '<meta name="theme-color" content="#FF6B00" />');

  // ── Fetch live branding from the API at build time ──────────────────────────
  // Injected as window.__BRANDING__ into every page so BrandingContext can
  // initialise with correct data on frame-1 (zero flash on first visit).
  // logo_url / favicon_url are now proper HTTP URLs (not base64), so they're
  // safe to include — tiny strings, cached by the browser, preload-able.
  let brandingSnippet = "";
  try {
    const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://fastagsathi-production.up.railway.app";
    const res = await fetch(`${backendUrl}/api/branding`, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const d = await res.json();
      // logo_url and favicon_url are now proper HTTP URLs (not base64) — safe to include.
      // Escape </script> sequences to prevent HTML injection.
      const json = JSON.stringify(d).replace(/<\//g, "<\\/");
      // Use || so localStorage (seeded by the inline script in index.html) always wins
      brandingSnippet = `<script>window.__BRANDING__=window.__BRANDING__||${json};</script>`;
      // Preload the logo so the browser fetches it while HTML is still parsing —
      // the image is in browser cache by the time React mounts, zero flash.
      if (d.logo_url) {
        brandingSnippet += `\n<link rel="preload" as="image" href="${d.logo_url}">`;
      }
      console.log("✅ Branding fetched and will be injected into every page");
    }
  } catch (e) {
    console.log(`⚠  Branding fetch skipped (${e.message}) — pages will load branding via API on first visit`);
  }

  let count = 0;
  for (const { path: route, head, body } of routes) {
    // Inject branding snippet + head meta right before </head>
    const headWithBranding = brandingSnippet ? `${brandingSnippet}\n${head}` : head;
    let html = template.replace(/<\/head>/i, `${headWithBranding}\n  </head>`);
    // Inject body content for all crawlers (SSG body)
    if (body) {
      html = html.replace('<div id="root"></div>', `<div id="root" data-ssg="1">${body}</div>`);
    }
    if (route === "/") {
      fs.writeFileSync(path.join(BUILD_DIR, "index.html"), html);
    } else {
      const outDir = path.join(BUILD_DIR, route);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, "index.html"), html);
    }
    count++;
  }

  // Write sitemap
  const sitemapPath = path.join(BUILD_DIR, "sitemap.xml");
  fs.writeFileSync(sitemapPath, buildSitemap());
  console.log(`✅ Prerendered ${count} routes with body content → ${BUILD_DIR}`);
  console.log(`✅ Sitemap written → ${sitemapPath} (${count} URLs)`);
}

emit().catch(e => { console.error(e); process.exit(1); });
