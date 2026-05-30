import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { track } from "@/lib/analytics";

const TEAM = [
  { name: "Mukesh Choudhary", role: "Co-founder & Director", bio: "Director at ApnaPayment. Built payment infrastructure for thousands of businesses across India before turning his focus to fixing India's FASTag ecosystem." },
  { name: "Ankit Sharma", role: "Co-founder & Director", bio: "Director at ApnaPayment. Leads product, technology and Sathi network operations — on a mission to make every toll plaza dispute resolvable in 90 seconds." },
];

const MILESTONES = [
  { y: "2019", t: "Apna Payment Services founded in Jaipur. Started offering FASTag issuance services across Rajasthan toll plazas." },
  { y: "2021", t: "Incorporated as Pvt. Ltd. (RoC Jaipur). Became authorised partner of IDFC First Bank and Kotak Mahindra Bank for FASTag issuance." },
  { y: "2022", t: "ICICI Bank and Bajaj Finserv partnerships added. Crossed 10 lakh FASTag issuances across PAN India." },
  { y: "2023", t: "Network expanded to 700+ toll plazas. 1,500+ verified Sathis active across India." },
  { y: "2024", t: "Crossed 30 lakh (3 million) FASTag issuances PAN India. Largest independent FASTag Sathi network in India." },
  { y: "2025", t: "Launched ApnaFastag — turning our Sathi network into India's first peer-to-peer FASTag rescue service." },
  { y: "Jan 2026", t: "ApnaFastag.in goes public. Building India's biggest FASTag Sathi network. You are here." },
];

export default function AboutPage() {
  useEffect(() => { track("page_view", { page: "about" }); }, []);
  return (
    <>
      <SEO
        title="About ApnaFastag — built by drivers, for drivers"
        description="Why we built India's peer-to-peer FASTag rescue network. The story, the team, and the mission to reverse ₹100Cr of toll mischarges by 2027."
        path="/about"
      />
      <PageHero
        eyebrow="Our story"
        title={<>Built by drivers, <br />for drivers.</>}
        sub="ApnaFastag started with a single ₹450 mischarge that nobody at the toll, the bank, or NHAI could fix in time. We built the system that should have existed."
        breadcrumb={[{ label: "About" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 md:px-10 lg:px-12 space-y-5 text-lg text-[#0A0A0A] leading-relaxed">
          <p>Since 2019, Apna Payment Services has been at the heart of India's FASTag ecosystem. We've issued over 30 lakh FASTag cards across PAN India as an authorised partner of IDFC First Bank, Kotak Mahindra Bank, ICICI Bank, and Bajaj Finserv.</p>
          <p>We didn't just issue tags — we stationed agents at toll plazas. Over six years, those agents became our Sathis: 1,500+ verified people across 700+ toll plazas who know every lane supervisor, every bank escalation number, and every shortcut to getting your FASTag fixed fast.</p>
          <p>Helplines have 14-minute waits. Bank apps don't show real-time deductions. NHAI's complaint portal asks for documents most drivers don't carry. So we built ApnaFastag — turning our existing Sathi network into India's first peer-to-peer FASTag rescue service.</p>
          <p>One tap, 90 seconds, problem solved. That's it.</p>
        </div>
      </section>

      <section className="py-16 bg-[#F8F9FA]">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-3xl md:text-5xl mb-10">Milestones</h2>
          <div className="space-y-4">
            {MILESTONES.map((m) => (
              <div key={m.y} className="flex items-start gap-5 bg-white border-2 border-[#0A0A0A] rounded-2xl p-5">
                <div className="font-display font-black text-xl text-[#FF6B00] w-28 flex-shrink-0">{m.y}</div>
                <div className="text-[#0A0A0A] font-medium">{m.t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
          <h2 className="font-display font-black text-3xl md:text-5xl mb-10">The team</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TEAM.map((t) => (
              <div key={t.name} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
                <div className="w-16 h-16 rounded-full bg-[#FF6B00] flex items-center justify-center text-white font-display font-black text-2xl">{t.name.split(" ").map(n => n[0]).join("")}</div>
                <h3 className="font-display font-bold text-lg mt-4">{t.name}</h3>
                <p className="text-xs uppercase tracking-widest font-bold text-[#FF6B00] mt-1">{t.role}</p>
                <p className="text-sm text-[#4B5563] mt-2">{t.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
