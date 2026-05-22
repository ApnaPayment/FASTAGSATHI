import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { FileWarning, Siren, IndianRupee, BadgeCheck, PhoneCall, Search, Smartphone } from "lucide-react";
import { track } from "@/lib/analytics";

const CATS = [
  { Icon: FileWarning, color: "#F59E0B", title: "Disputes & Mischarges", links: ["How to file a mischarge claim", "NHAI dispute timeline", "What evidence do I need?", "Refund tracking guide"] },
  { Icon: Siren,       color: "#DC2626", title: "Emergency SOS",         links: ["How does SOS work?", "What counts as an emergency?", "SOS response time SLAs", "If no Sathi is available"] },
  { Icon: IndianRupee, color: "#FF6B00", title: "Payments & Refunds",    links: ["Pricing breakdown", "When am I charged?", "Refund policy", "Premium plan details"] },
  { Icon: BadgeCheck,  color: "#059669", title: "Account & KYC",         links: ["Phone-number change", "Add a vehicle", "Aadhaar KYC for Sathis", "Delete my account"] },
  { Icon: PhoneCall,   color: "#FF6B00", title: "Calls & Privacy",       links: ["How masked calling works", "Is my number safe?", "Call recording access", "Block a Sathi"] },
  { Icon: Smartphone,  color: "#0A0A0A", title: "App troubleshooting",   links: ["GPS not detecting plaza", "Push notifications off", "Login OTP not arriving", "App crashing on Android 10"] },
];

export default function HelpCenterPage() {
  const [q, setQ] = useState("");
  useEffect(() => { track("page_view", { page: "help_center" }); }, []);
  return (
    <>
      <SEO
        title="Help Center — FASTag answers, fast · ApnaFastag"
        description="200+ help articles on disputes, SOS, payments, KYC, calls and app issues. 24×7 support in English, Hindi, Marathi, Tamil."
        path="/help"
        keywords="fastag help, fastag support, apnafastag faq, fastag customer care"
      />
      <PageHero
        eyebrow="Help Center"
        title={<>How can we <span className="text-[#FF6B00]">help?</span></>}
        sub="Search 200+ articles or jump straight to a category. Still stuck? Chat with us 24×7."
        breadcrumb={[{ label: "Help" }]}
      />

      <section className="py-12 bg-white border-b border-[#E5E7EB]">
        <div className="max-w-3xl mx-auto px-6 relative">
          <Search className="absolute left-9 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4B5563]" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search help articles…"
            data-testid="help-search"
            className="w-full bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-full pl-14 pr-6 py-4 font-medium outline-none transition-colors"
          />
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {CATS.map((c) => (
            <div key={c.title} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-6">
              <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{ backgroundColor: `${c.color}1f` }}>
                <c.Icon className="w-6 h-6" style={{ color: c.color }} />
              </div>
              <h3 className="font-display font-bold text-xl">{c.title}</h3>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-sm text-[#4B5563] hover:text-[#FF6B00]">→ {l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display font-black text-3xl">Still stuck?</h2>
          <p className="text-[#4B5563] mt-2">Our support team answers 24×7 in 4 languages.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/contact" className="bg-[#FF6B00] text-white font-bold px-7 py-3.5 rounded-full">Contact support</Link>
            <a href="https://wa.me/918000000000" className="border-2 border-[#0A0A0A] font-bold px-7 py-3.5 rounded-full">WhatsApp us</a>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
