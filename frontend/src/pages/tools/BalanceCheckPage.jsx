import React, { useEffect, useState } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { webAppSchema } from "@/components/seo/SEO";
import { BANKS } from "@/data/seed";
import { MessageSquare, RefreshCw } from "lucide-react";
import { track } from "@/lib/analytics";

export default function BalanceCheckPage() {
  const [vehicle, setVehicle] = useState("");
  const [bank, setBank] = useState(BANKS[0].slug);
  const [balance, setBalance] = useState(null);
  useEffect(() => { track("page_view", { page: "tool_balance_check" }); }, []);

  const check = () => {
    if (!vehicle) return;
    // mocked output
    const fake = Math.round(Math.random() * 1800 + 50);
    setBalance(fake);
    track("balance_check_run", { bank, vehicle_len: vehicle.length });
  };

  return (
    <>
      <SEO
        title="FASTag balance check — free tool across all banks"
        description="Check your FASTag balance instantly. Works for SBI, Paytm, ICICI, HDFC, Axis. Enter vehicle number, get latest balance. No app install needed."
        path="/tools/fastag-balance-check"
        keywords="fastag balance check, fastag balance, sbi fastag balance, paytm fastag balance, icici fastag balance, hdfc fastag balance"
        jsonLd={webAppSchema({
          name: "FASTag Balance Checker",
          description: "Free FASTag balance lookup across all major Indian banks.",
          url: "https://apnafastag.com/tools/fastag-balance-check",
        })}
      />
      <PageHero
        eyebrow="Free tool"
        title={<>FASTag <span className="text-[#FF6B00]">balance check</span></>}
        sub="Quick lookup across all major issuing banks. Enter your vehicle number, pick your bank, get your balance — no app install needed."
        breadcrumb={[{ label: "Tools", to: "/" }, { label: "Balance check" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-7 md:p-10 shadow-[6px_6px_0_#FF6B00]">
            <label className="block text-sm font-semibold">Vehicle number
              <input value={vehicle} onChange={(e) => setVehicle(e.target.value.toUpperCase())} placeholder="MH 12 AB 4521" data-testid="balance-vehicle" className="mt-1 w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none uppercase font-mono" />
            </label>
            <label className="block text-sm font-semibold mt-4">Issuing bank
              <select value={bank} onChange={(e) => setBank(e.target.value)} data-testid="balance-bank" className="mt-1 w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none">
                {BANKS.map((b) => <option key={b.slug} value={b.slug}>{b.name}</option>)}
              </select>
            </label>
            <button onClick={check} data-testid="balance-check-btn" className="mt-6 w-full bg-[#FF6B00] text-white font-bold py-4 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Check balance
            </button>

            {balance !== null && (
              <div className="mt-6 bg-[#0A0A0A] text-white rounded-2xl p-6 text-center">
                <div className="text-xs uppercase tracking-widest text-[#FFD60A] font-bold">Latest balance · {BANKS.find(b=>b.slug===bank)?.name}</div>
                <div className="font-display font-black text-5xl mt-2">₹{balance.toLocaleString("en-IN")}</div>
                <p className="text-white/60 text-xs mt-2">This is a demo result. Real lookup wires to bank's official API in production.</p>
              </div>
            )}
          </div>

          <div className="mt-8 bg-[#FF6B00] text-white rounded-3xl p-7 flex items-start gap-4">
            <MessageSquare className="w-7 h-7 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-display font-bold text-xl">Tag blacklisted or balance not updating?</h3>
              <p className="text-white/90 mt-1 text-sm">A Sathi at your nearest toll can fix it in under 8 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      <PageCTA primary="Check FASTag status" secondary="Find a Sathi" primaryTo="/tools/fastag-status" secondaryTo="/find" note="Also check if your tag is active, blacklisted, or has a KYC issue." />
    </>
  );
}
