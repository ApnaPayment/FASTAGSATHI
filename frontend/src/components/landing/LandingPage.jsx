import React, { useEffect, useRef } from "react";
import { track } from "@/lib/analytics";
import SEO, { orgSchema, websiteSchema, serviceSchema, faqSchema } from "@/components/seo/SEO";
import Hero from "./Hero";
import TrustBar from "./TrustBar";
import HowItWorks from "./HowItWorks";
import IssueTypes from "./IssueTypes";
import Features from "./Features";
import BecomeSathi from "./BecomeSathi";
import Testimonials from "./Testimonials";
import FAQ from "./FAQ";
import CTABanner from "./CTABanner";

export default function LandingPage() {
  const firedRef = useRef({ view: false, s50: false, s90: false });

  useEffect(() => {
    if (!firedRef.current.view) {
      track("landing_view", { path: window.location.pathname, referrer: document.referrer });
      firedRef.current.view = true;
    }
    const onScroll = () => {
      const doc = document.documentElement;
      const scrolled = (window.scrollY + window.innerHeight) / doc.scrollHeight;
      if (!firedRef.current.s50 && scrolled >= 0.5) { track("scroll_50"); firedRef.current.s50 = true; }
      if (!firedRef.current.s90 && scrolled >= 0.9) { track("scroll_90"); firedRef.current.s90 = true; }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div data-testid="home-page">
      <SEO
        title="ApnaFastag — Stuck at a toll? Your Sathi arrives in 90 seconds."
        description="India's first peer-to-peer FASTag rescue network. Verified Sathis resolve disputes, KYC, recharge failures and SOS at 60+ toll plazas — usually under 8 minutes. Pay only when fixed."
        path="/"
        keywords="fastag help, toll dispute, fastag mischarge refund, fastag sathi, toll plaza assistance, fastag blacklisted fix, nhai dispute, fastag recharge failed"
        jsonLd={[orgSchema, websiteSchema, serviceSchema, faqSchema([
          { q: "What is ApnaFastag?", a: "ApnaFastag is India's first peer-to-peer FASTag rescue network. Verified local experts called Sathis are stationed at toll plazas and resolve FASTag disputes, KYC, blacklist, and recharge issues on-spot — usually in under 8 minutes." },
          { q: "Is ApnaFastag affiliated with NHAI or any bank?", a: "No, ApnaFastag is an independent peer-to-peer assistance platform. We escalate to NHAI/banks on your behalf." },
          { q: "How much does it cost?", a: "Free to sign up. You pay ₹49–₹499 only when a Sathi successfully resolves your issue. No subscription fees." },
          { q: "Where are Sathis available?", a: "Currently live at 60+ toll plazas across NH-48, NH-44, NH-19 in Maharashtra, Haryana, Karnataka, Gujarat and Tamil Nadu. Expanding to 200+ plazas by Q2 2026." },
          { q: "What FASTag issues can a Sathi resolve?", a: "Sathis resolve FASTag disputes and refunds, blacklist removal, KYC updates, RC mismatch, recharge failures, double deductions, and emergency SOS at toll plazas." },
        ])]}
      />
      <Hero />
      <TrustBar />
      <HowItWorks />
      <IssueTypes />
      <Features />
      <BecomeSathi />
      <Testimonials />
      <FAQ />
      <CTABanner />
    </div>
  );
}
