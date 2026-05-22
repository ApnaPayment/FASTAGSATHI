import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { breadcrumbSchema } from "@/components/seo/SEO";
import { Phone, MessageSquare, AlertCircle } from "lucide-react";
import { BANKS } from "@/data/seed";
import { track } from "@/lib/analytics";

export default function BankPage() {
  const { bankSlug } = useParams();
  const bank = BANKS.find((b) => b.slug === bankSlug);
  useEffect(() => { if (bank) { track("bank_view", { bank: bank.slug }); document.title = `${bank.name} · balance check, helpline & dispute help`; } }, [bank]);

  if (!bank) return <section className="pt-40 pb-32 text-center"><h1 className="font-display font-black text-4xl">Bank not found</h1></section>;

  return (
    <>
      <SEO
        title={`${bank.name} balance check, helpline & dispute help · ApnaFastag`}
        description={`${bank.name} balance check via SMS code ${bank.smsCode}, 24×7 helpline ${bank.helpline}, and on-spot rescue for ${bank.name} users at any toll plaza.`}
        path={`/bank/${bank.slug}`}
        keywords={`${bank.name} balance check, ${bank.name} helpline, ${bank.name} dispute, ${bank.name} customer care, ${bank.name} mischarge`}
        jsonLd={breadcrumbSchema([
          { label: bank.name, url: `/bank/${bank.slug}` },
        ])}
      />
      <PageHero
        eyebrow="Bank guide"
        title={
          <span className="inline-flex items-center gap-4">
            {bank.logo && (
              <span className="inline-flex w-14 h-14 rounded-2xl bg-white border-2 border-white/20 items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                <img src={bank.logo} alt={bank.shortName} className="w-11 h-11 object-contain" />
              </span>
            )}
            {bank.name} <span className="text-[#FF6B00]">help center</span>
          </span>
        }
        sub={`Balance check, helpline, dispute filing and on-spot rescue for ${bank.name} users — managed by Sathis at the toll plaza.`}
        breadcrumb={[{ label: "Banks", to: "/" }, { label: bank.name }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-2 gap-6">
          <div className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
            <MessageSquare className="w-7 h-7 text-[#FF6B00] mb-3" />
            <h3 className="font-display font-bold text-xl">Check balance via SMS</h3>
            <p className="text-[#4B5563] mt-2 text-sm">Send SMS <code className="bg-white px-2 py-0.5 rounded font-mono text-[#0A0A0A]">{bank.smsCode}</code> from your registered mobile to the bank's FASTag SMS number to get your latest balance.</p>
          </div>
          <div className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6">
            <Phone className="w-7 h-7 text-[#059669] mb-3" />
            <h3 className="font-display font-bold text-xl">24×7 helpline</h3>
            <p className="text-[#4B5563] mt-2 text-sm">Customer care: <strong className="text-[#0A0A0A]">{bank.helpline}</strong></p>
            <p className="text-[#4B5563] text-xs mt-2">Average wait time: 8–14 minutes. Skip the queue — ping a Sathi instead.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 mt-10">
          <div className="bg-[#FF6B00] text-white rounded-3xl p-7 md:p-10 shadow-2xl">
            <AlertCircle className="w-8 h-8 mb-3" />
            <h3 className="font-display font-black text-2xl md:text-3xl">Stuck at a toll with {bank.name}?</h3>
            <p className="mt-2 text-white/90">Skip the helpline. A verified Sathi at your plaza can resolve {bank.name} mischarges, blacklist, or KYC issues on-spot — usually in under 8 minutes.</p>
            <Link to="/app/signup?role=commuter" className="mt-5 inline-flex items-center bg-[#0A0A0A] text-white font-bold px-6 py-3 rounded-full">Ping a Sathi now</Link>
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
