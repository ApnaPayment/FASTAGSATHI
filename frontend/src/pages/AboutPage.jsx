import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { track } from "@/lib/analytics";

const TEAM = [
  { name: "Rohan Mehta", role: "Co-founder, CEO", bio: "8 yrs ops at Rapido. Filed his first FASTag dispute in 2019, never got a refund." },
  { name: "Anjali Singh", role: "Co-founder, CTO", bio: "Ex-Razorpay. Built the Sathi matching engine on Firebase." },
  { name: "Vikram Yadav", role: "Head of Sathi Network", bio: "Ex-OYO field. Personally onboarded the first 100 Sathis." },
  { name: "Lakshmi Iyer", role: "Head of Trust & Safety", bio: "Ex-Uber India. Owns KYC, fraud, dispute escalations." },
];

const MILESTONES = [
  { y: "Sep 2024", t: "First commit. Founders walk 11 toll plazas on NH-48 with Google Forms." },
  { y: "Jan 2025", t: "Seed round closed. First 10 Sathis onboarded at Khalapur and Lonavla." },
  { y: "Jun 2025", t: "Launched in MH, KA, HR. Crossed 10,000 resolved disputes." },
  { y: "Dec 2025", t: "₹1.2 Cr in mischarges reversed for commuters. 2,184 active Sathis." },
  { y: "Jan 2026", t: "Public launch of ApnaFastag.in. You are here." },
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
          <p>India crossed 7 crore active FASTag accounts in 2024. The infrastructure to issue tags scaled brilliantly. The infrastructure to fix tag problems did not.</p>
          <p>Helplines have 14-minute waits. Bank apps don't show real-time toll deductions. NHAI's complaint portal asks for documents most drivers don't carry. Plaza staff are paid to keep lanes moving, not to argue about ₹245.</p>
          <p>So we built a network of local people — tea vendors, mechanics, off-duty toll staff, agents — who already know the plaza, already speak the language, and now have the tools, training, and incentives to fix your problem in 8 minutes flat.</p>
          <p>That's it. That's the whole company.</p>
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
