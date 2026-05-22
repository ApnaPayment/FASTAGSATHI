import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Siren, FileWarning, ScanLine, MessageSquare, Languages, PhoneCall, Radar, Globe2, BadgeCheck, Shield } from "lucide-react";
import { track } from "@/lib/analytics";

const FEATURES = [
  { Icon: Radar, color: "#FF6B00", title: "Journey Radar", desc: "Sweeping live radar visualises upcoming plazas + online Sathis on your route. Tap any to ping ahead." },
  { Icon: Siren, color: "#DC2626", title: "Emergency SOS", desc: "Hold the red button for 2s — GPS auto-shares with the 3 nearest Sathis. Priority dispatch even at 2 AM." },
  { Icon: ScanLine, color: "#FF6B00", title: "AI Receipt Scanner", desc: "Laser-style OCR over your toll receipt. Extracts plaza name, charged amount, timestamp in <2 seconds." },
  { Icon: FileWarning, color: "#F59E0B", title: "Dispute Manager", desc: "Mischarges filed with photo evidence. Auto-routes to bank + NHAI. Real-time status tracking." },
  { Icon: MessageSquare, color: "#059669", title: "Realtime Chat", desc: "Firebase-backed messaging between you and your Sathi. Stays open till the issue closes." },
  { Icon: PhoneCall, color: "#FF6B00", title: "Privacy-Masked Calls", desc: "Talk to your Sathi via a bridged virtual number. Real numbers never exposed." },
  { Icon: Languages, color: "#FFD60A", title: "4 Languages", desc: "English, Hindi, Marathi, Tamil — all flows. More on the way (Bengali, Telugu, Gujarati next)." },
  { Icon: BadgeCheck, color: "#059669", title: "Verified Sathi Badge", desc: "Aadhaar + selfie + 2-week shadowing + continuous rating checks. Every Sathi is real." },
  { Icon: Shield, color: "#0A0A0A", title: "Escrow Payments", desc: "Resolution fee held in Razorpay escrow. Released only on completion. Refunded if unresolved." },
  { Icon: Globe2, color: "#FF6B00", title: "Multi-plaza Coverage", desc: "Live at 60+ toll plazas. Expanding to 500+ by Q3 2026." },
];

export default function FeaturesPage() {
  useEffect(() => { track("page_view", { page: "features" }); }, []);
  return (
    <>
      <PageHero
        eyebrow="What's inside"
        title={<>Ten features. One job: <span className="text-[#FF6B00]">never get stuck.</span></>}
        sub="We rebuilt the toll experience from scratch. Each feature solves a specific friction moment we observed at India's busiest plazas."
        breadcrumb={[{ label: "Features" }]}
      />

      <section className="py-20 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} data-testid={`feature-card-${f.title.toLowerCase().replace(/\s+/g, "-")}`} className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-6 hover:-translate-y-1 transition-transform" style={{ boxShadow: `5px 5px 0 ${f.color}` }}>
              <div className="w-12 h-12 rounded-2xl mb-4 flex items-center justify-center" style={{ backgroundColor: `${f.color}1f` }}>
                <f.Icon className="w-6 h-6" style={{ color: f.color }} />
              </div>
              <h3 className="font-display font-bold text-xl text-[#0A0A0A]">{f.title}</h3>
              <p className="text-sm text-[#4B5563] mt-2 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <PageCTA />
    </>
  );
}
