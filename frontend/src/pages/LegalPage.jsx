import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import SEO from "@/components/seo/SEO";
import { track } from "@/lib/analytics";

export default function LegalPage({ kind }) {
  useEffect(() => { track("page_view", { page: kind }); document.title = `${kind} · ApnaFastag`; }, [kind]);

  const meta = {
    privacy: { title: "Privacy Policy", eyebrow: "Legal · Privacy", updated: "Last updated: Jan 10, 2026" },
    terms:   { title: "Terms of Service", eyebrow: "Legal · Terms",  updated: "Last updated: Jan 10, 2026" },
    refund:  { title: "Refund Policy",    eyebrow: "Legal · Refunds", updated: "Last updated: Jan 10, 2026" },
  }[kind] || { title: "Legal", eyebrow: "Legal" };

  return (
    <>
      <SEO
        title={`${meta.title} · ApnaFastag`}
        description={`${meta.title} for ApnaFastag — last updated January 2026.`}
        path={`/${kind === "refund" ? "refund-policy" : kind}`}
        noindex={false}
      />
      <PageHero eyebrow={meta.eyebrow} title={meta.title} sub={meta.updated} breadcrumb={[{ label: meta.title }]} />

      <section className="py-16 bg-white">
        <article className="max-w-3xl mx-auto px-6 md:px-10 lg:px-12 space-y-5 text-[#0A0A0A] leading-relaxed">
          <p className="text-lg"><strong>This is placeholder legal content.</strong> Production deployment requires this page to be replaced with policy text reviewed by your counsel and aligned with India's DPDP Act 2023, Consumer Protection Act 2019, and IT Rules 2021.</p>

          <h2 className="font-display font-black text-2xl pt-4">1. Scope</h2>
          <p>ApnaFastag Technologies Pvt. Ltd. ("we", "us") operates an assistance marketplace connecting commuters with verified Sathis. This {meta.title.toLowerCase()} governs your use of our website, mobile app, and APIs.</p>

          <h2 className="font-display font-black text-2xl pt-4">2. {kind === "privacy" ? "Data we collect" : kind === "terms" ? "User obligations" : "Refund eligibility"}</h2>
          <p>{kind === "privacy" ? "Name, phone number, vehicle number, payment metadata, GPS location during active bookings, chat content with Sathis (retained for safety review). We never sell personal data." : kind === "terms" ? "Provide accurate vehicle information. Do not misuse the SOS feature. Respect Sathis. Pay resolution fees promptly when an issue is resolved." : "Resolution fees are refundable in full if the Sathi could not resolve the issue. Premium subscription is refundable pro-rata within the first 14 days."}</p>

          <h2 className="font-display font-black text-2xl pt-4">3. {kind === "privacy" ? "Third parties" : kind === "terms" ? "Platform liability" : "How refunds work"}</h2>
          <p>{kind === "privacy" ? "Firebase (auth, data), Razorpay (payments), Twilio/Exotel (masked calling), Sentry (error logs). Each operates under their own privacy policy and is processed under DPA contracts." : kind === "terms" ? "ApnaFastag is an intermediary. We do not guarantee NHAI / bank resolution outcomes; we guarantee that a verified Sathi will attempt resolution within agreed SLAs." : "Refunds initiated within 24 hours of dispute close. Credit reflects in source account within 5–7 business days via Razorpay."}</p>

          <h2 className="font-display font-black text-2xl pt-4">4. Contact</h2>
          <p>Reach <a className="text-[#FF6B00] underline" href="mailto:legal@apnafastag.com">legal@apnafastag.com</a> for any clarifications, data-deletion requests, or grievance redressal under the IT Rules 2021.</p>
        </article>
      </section>
    </>
  );
}
