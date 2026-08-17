import React, { useEffect, useState, useCallback } from "react";
import PageCTA from "@/components/layout/PageCTA";
import SEO, { webAppSchema, faqSchema } from "@/components/seo/SEO";
import { track } from "@/lib/analytics";
import { toolsApi } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car, Search, RefreshCw, Zap, ChevronDown, Copy, CheckCircle2,
  Wallet, ArrowRight, Smartphone, AlertTriangle, Tag,
} from "lucide-react";

// Quick-select recharge amounts
const QUICK_AMOUNTS = [100, 200, 300, 500, 1000];

export default function RechargeTagPage() {
  const [vehicle, setVehicle]       = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [tagInfo, setTagInfo]       = useState(null);   // { vehicle, tags: [...] }
  const [selectedTag, setSelectedTag] = useState(null); // one tag from tagInfo.tags
  const [overrideBank, setOverrideBank] = useState(""); // user-chosen upi handle
  const [banks, setBanks]           = useState([]);
  const [amount, setAmount]         = useState("");
  const [copied, setCopied]         = useState(false);

  // Load bank list once on mount
  useEffect(() => {
    track("page_view", { page: "tool_fastag_recharge" });
    toolsApi.rechargeBanks().then(r => setBanks(r.data)).catch(() => {});
  }, []);

  const fetchTag = async (e) => {
    e.preventDefault();
    const v = vehicle.trim().replace(/\s+/g, "").toUpperCase();
    if (!/^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{1,4}$/.test(v)) {
      setError("Enter a valid vehicle number — e.g. MH12AB4521");
      return;
    }
    setError(null);
    setTagInfo(null);
    setSelectedTag(null);
    setOverrideBank("");
    setAmount("");
    setLoading(true);
    track("recharge_tag_lookup", { vehicle_len: v.length });
    try {
      const res = await toolsApi.rechargeTagInfo(v);
      const data = res.data;
      setTagInfo(data);
      if (data.tags.length > 0) {
        const active = data.tags.find(t => t.is_active) || data.tags[0];
        setSelectedTag(active);
        setOverrideBank(active.netc_upi || "");
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not fetch tag info. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Active UPI handle (override takes priority over auto-matched)
  const effectiveUpiHandle = overrideBank || selectedTag?.netc_upi || "";
  const tagId = selectedTag?.tag_id || "";
  const upiVpa = tagId && effectiveUpiHandle ? `netc.${tagId}@${effectiveUpiHandle}` : "";

  // Build UPI deep-link
  const buildUpiLink = useCallback(() => {
    if (!upiVpa || !amount) return "";
    const note = encodeURIComponent("FASTag Recharge");
    return `upi://pay?pa=${upiVpa}&pn=${note}&am=${amount}&cu=INR&mode=04&purpose=00`;
  }, [upiVpa, amount]);

  const handleRecharge = () => {
    if (!upiVpa || !amount) return;
    track("recharge_upi_intent", { amount: Number(amount) });
    const url = buildUpiLink();
    window.location.href = url;
  };

  const copyVpa = async () => {
    if (!upiVpa) return;
    try {
      await navigator.clipboard.writeText(upiVpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const reset = () => {
    setTagInfo(null);
    setSelectedTag(null);
    setOverrideBank("");
    setAmount("");
    setVehicle("");
    setError(null);
  };

  const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
  const amountNum = parseFloat(amount);
  const amountValid = amountNum >= 50 && amountNum <= 10000;
  const canPay = upiVpa && amountValid;

  return (
    <>
      <SEO
        title="FASTag recharge online — pay via any UPI app instantly"
        description="Recharge your FASTag using any UPI app in seconds. Enter your vehicle number, pick an amount, and pay via NETC UPI. Works for all NHAI-linked banks."
        path="/tools/fastag-recharge"
        keywords="fastag recharge online, fastag recharge upi, fastag balance add, netc fastag recharge"
        jsonLd={[
          webAppSchema({ name: "FASTag Recharge via UPI", description: "Recharge any FASTag wallet using NETC UPI payment method.", url: "https://apnafastag.com/tools/fastag-recharge" }),
          faqSchema([
            { q: "How do I recharge my FASTag online?", a: "Enter your vehicle number, check your linked FASTag tag info, enter the amount, and pay via any UPI app. Balance reflects within 2–4 hours." },
            { q: "Which UPI apps work for FASTag recharge?", a: "All NETC-enabled UPI apps: PhonePe, Google Pay, Paytm, BHIM, and your bank's UPI app. Just scan the QR or enter your FASTag VPA." },
            { q: "My FASTag recharge was deducted but balance didn't update. What should I do?", a: "Wait up to 4 hours for the balance to reflect. If it still hasn't updated, ping a Sathi at your nearest toll — recharge failures are resolved on-spot." },
            { q: "What is the minimum FASTag recharge amount?", a: "Most banks require a minimum ₹100 recharge. The minimum balance threshold to pass a toll (without blacklisting) varies by bank — usually ₹150–₹200." },
          ]),
        ]}
      />

      <section className="pt-28 pb-10 bg-[#F8F9FA]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Compact inline header */}
          <div className="mb-5">
            <span className="inline-block bg-[#FF6B00] text-white px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-3">Free tool</span>
            <h1 className="font-display font-black text-3xl sm:text-4xl mb-1">
              FASTag <span className="text-[#FF6B00]">recharge</span>
            </h1>
            <p className="text-sm text-[#4B5563]">Enter your vehicle number, pick an amount, pay via GPay / PhonePe / Paytm.</p>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 space-y-4">

          {/* Step 1 — Vehicle lookup */}
          <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0_#FF6B00]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B00]/15 flex items-center justify-center flex-shrink-0">
                <Car className="w-5 h-5 text-[#FF6B00]" />
              </div>
              <div>
                <h2 className="font-display font-black text-xl">Enter vehicle number</h2>
                <p className="text-xs text-[#4B5563]">We'll auto-fetch your FASTag ID</p>
              </div>
            </div>

            <form onSubmit={fetchTag} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors">
                <Car className="w-4 h-4 text-[#4B5563] flex-shrink-0" />
                <input
                  value={vehicle}
                  onChange={e => setVehicle(e.target.value.replace(/[^a-zA-Z0-9\s]/g, "").toUpperCase().slice(0, 13))}
                  placeholder="MH 12 AB 4521"
                  className="bg-transparent flex-1 outline-none font-mono text-lg uppercase tracking-wider"
                  autoComplete="off"
                  disabled={loading || !!tagInfo}
                />
              </div>
              {!tagInfo ? (
                <button
                  type="submit"
                  disabled={loading || !vehicle.trim()}
                  className="bg-[#FF6B00] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A] disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:translate-y-1 active:shadow-none w-full sm:w-auto"
                >
                  {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {loading ? "Fetching…" : "Fetch Tag"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={reset}
                  className="border-2 border-[#E5E7EB] text-[#4B5563] font-bold px-6 py-3 rounded-xl hover:border-[#FF6B00] hover:text-[#FF6B00] flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
                >
                  Change
                </button>
              )}
            </form>

            {error && (
              <p className="mt-3 text-sm text-[#DC2626] bg-[#FEF2F2] border border-[#DC2626] rounded-xl px-4 py-2">
                {error}
              </p>
            )}
          </div>

          {/* Results + payment */}
          <AnimatePresence>
            {tagInfo && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {tagInfo.tags.length === 0 ? (
                  <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-8 text-center">
                    <AlertTriangle className="w-12 h-12 text-[#F59E0B] mx-auto mb-3" />
                    <h3 className="font-display font-black text-xl">No FASTag found</h3>
                    <p className="text-sm text-[#4B5563] mt-2">
                      No FASTag is linked to <strong>{tagInfo.vehicle}</strong>. Please check the number or visit a plaza to get a new tag.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Step 2 — Tag & bank selection */}
                    <div className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-5 sm:p-7">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#059669]/15 flex items-center justify-center flex-shrink-0">
                          <Tag className="w-5 h-5 text-[#059669]" />
                        </div>
                        <div>
                          <h2 className="font-display font-black text-xl">Your FASTag</h2>
                          <p className="text-xs text-[#4B5563]">
                            {tagInfo.tags.length} tag{tagInfo.tags.length > 1 ? "s" : ""} found for {tagInfo.vehicle}
                          </p>
                        </div>
                      </div>

                      {/* Tag selector (if multiple) */}
                      {tagInfo.tags.length > 1 && (
                        <div className="mb-4 space-y-2">
                          {tagInfo.tags.map((tag, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSelectedTag(tag);
                                setOverrideBank(tag.netc_upi || "");
                              }}
                              className={`w-full text-left flex items-center gap-3 border-2 rounded-2xl px-4 py-3 transition-colors ${
                                selectedTag?.tag_id === tag.tag_id
                                  ? "border-[#FF6B00] bg-[#FFF7F0]"
                                  : "border-[#E5E7EB] hover:border-[#FF6B00]/50"
                              }`}
                            >
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${tag.is_active ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate">{tag.bank}</div>
                                <div className="font-mono text-xs text-[#4B5563] truncate">{tag.tag_id}</div>
                              </div>
                              <div className={`text-xs font-bold px-2 py-1 rounded-full ${tag.is_active ? "bg-[#F0FDF4] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                                {tag.status}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Single tag details */}
                      {selectedTag && tagInfo.tags.length === 1 && (
                        <div className="flex items-center gap-3 bg-[#F8F9FA] rounded-2xl px-4 py-3 mb-4">
                          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${selectedTag.is_active ? "bg-[#059669]" : "bg-[#DC2626]"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-sm">{selectedTag.bank}</div>
                            <div className="font-mono text-xs text-[#4B5563] truncate">{selectedTag.tag_id}</div>
                          </div>
                          <div className={`text-xs font-bold px-2 py-1 rounded-full ${selectedTag.is_active ? "bg-[#F0FDF4] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                            {selectedTag.status}
                          </div>
                        </div>
                      )}

                      {/* Bank selector */}
                      {selectedTag && (
                        <div>
                          <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-widest mb-1.5">
                            FASTag bank for UPI payment
                          </label>
                          <div className="relative">
                            <select
                              value={overrideBank}
                              onChange={e => setOverrideBank(e.target.value)}
                              className="w-full appearance-none bg-[#F8F9FA] border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 pr-10 font-medium text-sm outline-none transition-colors"
                            >
                              <option value="">— Select issuing bank —</option>
                              {banks.map(b => (
                                <option key={b.upi} value={b.upi}>{b.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF] pointer-events-none" />
                          </div>
                          {selectedTag.netc_upi && overrideBank === selectedTag.netc_upi && (
                            <p className="mt-1.5 text-xs text-[#059669] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Auto-matched from your tag data
                            </p>
                          )}
                          {!selectedTag.netc_upi && (
                            <p className="mt-1.5 text-xs text-[#F59E0B]">
                              We could not auto-detect your bank — please select manually above.
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Step 3 — Amount + pay */}
                    {selectedTag && effectiveUpiHandle && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border-2 border-[#0A0A0A] rounded-3xl p-5 sm:p-7 shadow-[6px_6px_0_#059669]"
                      >
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-10 h-10 rounded-2xl bg-[#059669]/15 flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-5 h-5 text-[#059669]" />
                          </div>
                          <div>
                            <h2 className="font-display font-black text-xl">Choose amount</h2>
                            <p className="text-xs text-[#4B5563]">Min ₹50 · Max ₹10,000 per transaction</p>
                          </div>
                        </div>

                        {/* Quick-select pills */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {QUICK_AMOUNTS.map(a => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => setAmount(String(a))}
                              className={`px-4 py-2 rounded-full border-2 font-bold text-sm transition-all ${
                                amount === String(a)
                                  ? "border-[#FF6B00] bg-[#FF6B00] text-white"
                                  : "border-[#E5E7EB] text-[#4B5563] hover:border-[#FF6B00]"
                              }`}
                            >
                              ₹{a}
                            </button>
                          ))}
                        </div>

                        {/* Custom amount */}
                        <div className="flex items-center gap-2 bg-[#F8F9FA] border-2 border-[#E5E7EB] focus-within:border-[#FF6B00] rounded-xl px-4 py-3 transition-colors mb-5">
                          <span className="font-bold text-[#4B5563]">₹</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            min="50"
                            max="10000"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            placeholder="Custom amount"
                            className="bg-transparent flex-1 outline-none font-bold text-lg"
                          />
                        </div>

                        {/* UPI VPA preview */}
                        {upiVpa && (
                          <div className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-2xl px-4 py-3 flex items-center gap-3 mb-5">
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-0.5">UPI VPA</div>
                              <div className="font-mono text-sm font-bold text-[#0A0A0A] truncate">{upiVpa}</div>
                            </div>
                            <button
                              type="button"
                              onClick={copyVpa}
                              className="flex-shrink-0 text-[#4B5563] hover:text-[#FF6B00] transition-colors"
                              title="Copy UPI address"
                            >
                              {copied ? <CheckCircle2 className="w-5 h-5 text-[#059669]" /> : <Copy className="w-5 h-5" />}
                            </button>
                          </div>
                        )}

                        {/* Pay button */}
                        {isMobile ? (
                          <button
                            type="button"
                            disabled={!canPay}
                            onClick={handleRecharge}
                            className="w-full bg-[#FF6B00] text-white font-black text-lg py-4 rounded-2xl hover:bg-[#E66000] shadow-[0_5px_0_#0A0A0A] disabled:opacity-40 disabled:shadow-none flex items-center justify-center gap-3 transition-all active:translate-y-1 active:shadow-none"
                          >
                            <Zap className="w-6 h-6" />
                            {canPay ? `Pay ₹${amount} via UPI` : "Enter valid amount"}
                          </button>
                        ) : (
                          /* Desktop: show copyable UPI string + instructions */
                          <div className="space-y-3">
                            <div className="bg-[#0A0A0A] text-white rounded-2xl p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <Smartphone className="w-5 h-5 text-[#FF6B00]" />
                                <span className="font-bold text-sm">Open your UPI app on your phone</span>
                              </div>
                              <ol className="text-sm text-white/70 space-y-2 list-none">
                                <li className="flex gap-2"><span className="text-[#FF6B00] font-bold">1.</span> Open GPay, PhonePe, Paytm, or any BHIM app</li>
                                <li className="flex gap-2"><span className="text-[#FF6B00] font-bold">2.</span> Go to "Pay by UPI ID" or "Send Money"</li>
                                <li className="flex gap-2"><span className="text-[#FF6B00] font-bold">3.</span> Enter the UPI address shown above</li>
                                <li className="flex gap-2"><span className="text-[#FF6B00] font-bold">4.</span> Enter ₹{amount || "…"} and confirm payment</li>
                              </ol>
                            </div>
                            <button
                              type="button"
                              disabled={!canPay}
                              onClick={copyVpa}
                              className="w-full border-2 border-[#FF6B00] text-[#FF6B00] font-bold py-3 rounded-2xl hover:bg-[#FFF7F0] disabled:opacity-40 flex items-center justify-center gap-2 transition-colors"
                            >
                              {copied ? <CheckCircle2 className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                              {copied ? "Copied!" : "Copy UPI address"}
                            </button>
                          </div>
                        )}

                        <p className="mt-4 text-xs text-[#9CA3AF] text-center">
                          Payments are processed directly via NPCI NETC UPI rails — ApnaFastag does not handle your money.
                        </p>
                      </motion.div>
                    )}

                    {/* Warn if bank not matched */}
                    {selectedTag && !effectiveUpiHandle && (
                      <div className="bg-[#FFFBEB] border-2 border-[#F59E0B] rounded-2xl px-5 py-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#F59E0B] flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-[#92400E]">
                          Select your FASTag issuing bank above to generate the correct UPI payment address.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* How it works */}
          {!tagInfo && !loading && (
            <div className="bg-white border-2 border-[#E5E7EB] rounded-3xl p-4 sm:p-5">
              <h3 className="font-display font-black text-base mb-3">How it works</h3>
              <div className="space-y-3">
                {[
                  { icon: Car,    step: "1", title: "Enter vehicle number", desc: "We look up your FASTag ID and issuing bank automatically from the NHAI portal." },
                  { icon: Wallet, step: "2", title: "Choose recharge amount", desc: "Pick any amount from ₹50 to ₹10,000. Quick-select buttons for common amounts." },
                  { icon: Zap,    step: "3", title: "Pay via UPI",           desc: "Tap the Pay button to open your UPI app. Your FASTag wallet is credited instantly." },
                ].map(({ icon: Icon, step, title, desc }) => (
                  <div key={step} className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B00] text-white font-black text-sm flex items-center justify-center flex-shrink-0">
                      {step}
                    </div>
                    <div>
                      <div className="font-bold text-sm">{title}</div>
                      <div className="text-xs text-[#4B5563] mt-0.5">{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <PageCTA
        primary="Find a Sathi near you"
        secondary="Check FASTag status"
        primaryTo="/find"
        secondaryTo="/tools/fastag-status"
        note="A Sathi can help with blacklisting, KYC issues, and mischarged tolls on the spot."
      />
    </>
  );
}
