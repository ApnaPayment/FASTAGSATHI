// Seed data for programmatic SEO + Coverage page. Replace with real Firestore /tollPlazas later.

export const STATES = [
  { slug: "maharashtra", name: "Maharashtra", plazaCount: 142, sathiCount: 386, highways: ["NH-48", "NH-160", "NH-66"] },
  { slug: "karnataka",   name: "Karnataka",   plazaCount: 98,  sathiCount: 221, highways: ["NH-48", "NH-44", "NH-75"] },
  { slug: "haryana",     name: "Haryana",     plazaCount: 67,  sathiCount: 174, highways: ["NH-44", "NH-48", "NH-19"] },
  { slug: "tamil-nadu",  name: "Tamil Nadu",  plazaCount: 89,  sathiCount: 198, highways: ["NH-44", "NH-32"] },
  { slug: "gujarat",     name: "Gujarat",     plazaCount: 74,  sathiCount: 156, highways: ["NH-48", "NH-27"] },
];

export const PLAZAS = [
  { slug: "khalapur-nh48",        name: "Khalapur Plaza",        highway: "NH-48", state: "maharashtra", city: "Khalapur",      lat: 18.81, lng: 73.27, carRate: 95,  truckRate: 410, monthlyComplaints: 1240, avgWait: "4 min", topIssue: "Mischarge double-deduction" },
  { slug: "vashi-mmrda",          name: "Vashi MMRDA Plaza",     highway: "MMRDA", state: "maharashtra", city: "Vashi",         lat: 19.07, lng: 73.00, carRate: 45,  truckRate: 175, monthlyComplaints: 890,  avgWait: "3 min", topIssue: "Tag not reading" },
  { slug: "lonavla-nh48",         name: "Lonavla Plaza",         highway: "NH-48", state: "maharashtra", city: "Lonavla",       lat: 18.75, lng: 73.41, carRate: 95,  truckRate: 410, monthlyComplaints: 760,  avgWait: "5 min", topIssue: "Low balance failure" },
  { slug: "pune-nh48",            name: "Pune Toll Plaza",        highway: "NH-48", state: "maharashtra", city: "Pune",          lat: 18.52, lng: 73.86, carRate: 95,  truckRate: 410, monthlyComplaints: 890,  avgWait: "5 min", topIssue: "Mischarge double-deduction" },
  { slug: "manesar-nh48",         name: "Manesar Plaza",         highway: "NH-48", state: "haryana",     city: "Manesar",       lat: 28.36, lng: 76.94, carRate: 85,  truckRate: 380, monthlyComplaints: 1430, avgWait: "6 min", topIssue: "Tag blacklisted" },
  { slug: "kherki-daula-nh48",    name: "Kherki Daula Plaza",    highway: "NH-48", state: "haryana",     city: "Gurugram",      lat: 28.39, lng: 76.93, carRate: 27,  truckRate: 145, monthlyComplaints: 1180, avgWait: "5 min", topIssue: "Mischarge" },
  { slug: "zirakpur-nh44",        name: "Zirakpur Plaza",        highway: "NH-44", state: "haryana",     city: "Zirakpur",      lat: 30.64, lng: 76.82, carRate: 110, truckRate: 480, monthlyComplaints: 540,  avgWait: "4 min", topIssue: "Recharge failure" },
  { slug: "athur-nh44",           name: "Athur Plaza",           highway: "NH-44", state: "tamil-nadu",  city: "Athur",         lat: 12.59, lng: 77.94, carRate: 75,  truckRate: 320, monthlyComplaints: 410,  avgWait: "3 min", topIssue: "Tag not reading" },
  { slug: "electronic-city-nh44", name: "Electronic City Plaza", highway: "NH-44", state: "karnataka",   city: "Bengaluru",     lat: 12.84, lng: 77.66, carRate: 40,  truckRate: 165, monthlyComplaints: 680,  avgWait: "4 min", topIssue: "Mischarge" },
  { slug: "vadodara-nh48",        name: "Vadodara Plaza",        highway: "NH-48", state: "gujarat",     city: "Vadodara",      lat: 22.30, lng: 73.20, carRate: 95,  truckRate: 410, monthlyComplaints: 380,  avgWait: "3 min", topIssue: "KYC pending" },
  { slug: "palwal-nh19",          name: "Palwal Plaza",          highway: "NH-19", state: "haryana",     city: "Palwal",        lat: 28.14, lng: 77.33, carRate: 85,  truckRate: 380, monthlyComplaints: 510,  avgWait: "5 min", topIssue: "Tag blacklisted" },
  { slug: "kolkata-nh12",         name: "Kolkata NH-12 Toll Plaza", highway: "NH-12", state: "west-bengal", city: "Kolkata",       lat: 22.57, lng: 88.43, carRate: 75,  truckRate: 310, monthlyComplaints: 620,  avgWait: "4 min", topIssue: "Mischarge double-deduction" },
];

export const BANKS = [
  { slug: "sbi-fastag",   name: "SBI FASTag",        shortName: "SBI",   color: "#22409A", logo: "/banks/sbi.svg",   smsCode: "FTBAL",  helpline: "1800-11-0018",  marketShare: 18 },
  { slug: "paytm-fastag", name: "Paytm FASTag",       shortName: "Paytm", color: "#00BAF2", logo: "/banks/paytm.svg", smsCode: "FT BAL", helpline: "1800-120-4210", marketShare: 28 },
  { slug: "icici-fastag", name: "ICICI FASTag",       shortName: "ICICI", color: "#F58220", logo: "/banks/icici.svg", smsCode: "FASTAG", helpline: "1800-2100-104", marketShare: 14 },
  { slug: "hdfc-fastag",  name: "HDFC FASTag",        shortName: "HDFC",  color: "#004C8F", logo: "/banks/hdfc.svg",  smsCode: "FASTAG", helpline: "1800-120-1243", marketShare: 12 },
  { slug: "axis-fastag",  name: "Axis FASTag",        shortName: "Axis",  color: "#97144D", logo: "/banks/axis.svg",  smsCode: "FASTAG", helpline: "1860-419-8585", marketShare: 9  },
  { slug: "kotak-fastag", name: "Kotak FASTag",       shortName: "Kotak", color: "#ED1C24", logo: "/banks/kotak.svg", smsCode: "FASTAG", helpline: "1800-209-0000", marketShare: 6  },
  { slug: "yes-fastag",   name: "Yes Bank FASTag",    shortName: "Yes",   color: "#003087", logo: "/banks/yes.svg",   smsCode: "FASTAG", helpline: "1800-1200",     marketShare: 5  },
  { slug: "idfc-fastag",  name: "IDFC First FASTag",  shortName: "IDFC",  color: "#6B2D8B", logo: "/banks/idfc.svg",  smsCode: "FASTAG", helpline: "1800-10-888",   marketShare: 4  },
  { slug: "bajaj-fastag", name: "Bajaj Finserv FASTag", shortName: "Bajaj", color: "#1B4AA3", logo: "/banks/bajaj.svg", smsCode: "FASTAG", helpline: "1800-209-7070", marketShare: 4  },
];

export const HIGHWAYS = [
  { slug:"nh-48", name:"NH-48", fullName:"National Highway 48 (Delhi–Mumbai)", length:"1428 km", states:["Delhi","Haryana","Rajasthan","Gujarat","Maharashtra"], plazaCount:67, desc:"India's busiest highway connecting Delhi to Mumbai via Gurugram, Jaipur, Vadodara, and Surat." },
  { slug:"nh-44", name:"NH-44", fullName:"National Highway 44 (Srinagar–Kanyakumari)", length:"3745 km", states:["J&K","Punjab","Haryana","Delhi","UP","MP","Maharashtra","Telangana","AP","Tamil Nadu"], plazaCount:112, desc:"India's longest highway, connecting Srinagar in the north to Kanyakumari in the south." },
  { slug:"nh-19", name:"NH-19", fullName:"National Highway 19 (Delhi–Kolkata)", length:"1435 km", states:["Delhi","UP","Bihar","Jharkhand","West Bengal"], plazaCount:58, desc:"Connects Delhi to Kolkata via Agra, Kanpur, Varanasi, and Patna." },
  { slug:"nh-27", name:"NH-27", fullName:"National Highway 27 (Porbandar–Silchar)", length:"3187 km", states:["Gujarat","Rajasthan","MP","UP","Bihar","West Bengal","Assam"], plazaCount:89, desc:"One of India's longest east-west highways, connecting Porbandar in Gujarat to Silchar in Assam." },
  { slug:"nh-66", name:"NH-66", fullName:"National Highway 66 (Panvel–Kanyakumari)", length:"1622 km", states:["Maharashtra","Goa","Karnataka","Kerala","Tamil Nadu"], plazaCount:74, desc:"Runs along India's western coast, passing through Mumbai, Goa, Mangalore, and Calicut." },
  { slug:"nh-16", name:"NH-16", fullName:"National Highway 16 (Kolkata–Chennai)", length:"1711 km", states:["West Bengal","Odisha","Andhra Pradesh","Tamil Nadu"], plazaCount:64, desc:"Connects Kolkata to Chennai along the eastern coast through Bhubaneswar and Visakhapatnam." },
  { slug:"nh-8",  name:"NH-8",  fullName:"National Highway 8 (Mumbai–Pune Expressway)", length:"94 km", states:["Maharashtra"], plazaCount:8, desc:"Mumbai-Pune Expressway — one of India's busiest expressways with multiple toll plazas." },
];

export const CITIES = [
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

export const BLOG_POSTS = [
  { slug: "fastag-mischarge-refund-2026", title: "How to claim a FASTag mischarge refund in 2026 (step-by-step)", excerpt: "The official NHAI dispute window is 7 days. Here's the exact process — and the 3 mistakes that get claims rejected.", date: "Jan 14, 2026", readMin: 6, category: "Disputes", cover: "https://images.unsplash.com/photo-1466875603152-be5267bd180e?crop=entropy&cs=srgb&fm=jpg&q=70&w=800" },
  { slug: "fastag-blacklisted-fix",       title: "FASTag blacklisted? 4 reasons + the fastest fix at the plaza",       excerpt: "Low balance is just one of the four reasons. Two of them require a bank branch visit — unless your Sathi handles it on-spot.", date: "Jan 09, 2026", readMin: 5, category: "Troubleshooting", cover: "https://images.unsplash.com/photo-1466875603152-be5267bd180e?crop=entropy&cs=srgb&fm=jpg&q=70&w=800" },
  { slug: "toll-charges-nh48-2026",       title: "All NH-48 toll charges (Mumbai → Bengaluru) — updated Jan 2026",     excerpt: "Every plaza, every vehicle class, total trip cost. Bookmark this for every Mumbai-Pune-Bengaluru run.", date: "Jan 03, 2026", readMin: 8, category: "Toll Rates", cover: "https://images.unsplash.com/photo-1466875603152-be5267bd180e?crop=entropy&cs=srgb&fm=jpg&q=70&w=800" },
  { slug: "how-to-become-fastag-sathi",   title: "Becoming a Fastag Sathi: ₹0 to ₹45,000/month in 60 days",            excerpt: "Real numbers from 12 Sathis at NH-48 plazas. Hours, payouts, what nobody tells you.", date: "Dec 28, 2025", readMin: 7, category: "Sathi Stories", cover: "https://images.unsplash.com/photo-1695395860103-38d172403a46?crop=entropy&cs=srgb&fm=jpg&q=70&w=800" },
];
