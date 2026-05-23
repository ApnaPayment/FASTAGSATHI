import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, ChevronRight, ChevronLeft, Loader2, AlertCircle,
  CreditCard, Car, User, MapPin, ShieldCheck,
} from "lucide-react";
import SEO from "@/components/seo/SEO";
import { fastagOrderApi } from "@/lib/api";
import { BANKS as SEED_BANKS } from "@/data/seed";
import { track } from "@/lib/analytics";

/* global Cashfree */ // populated by Cashfree SDK script tag at runtime

const VEHICLE_TYPES = [
  "Car / Jeep / Van",
  "SUV / MUV",
  "LCV (Mini-truck)",
  "Bus",
  "Truck / HCV",
  "MAV / Earth Mover",
  "3-Wheeler",
  "2-Wheeler",
];

const STEPS = [
  { id: "bank",     label: "Bank",     Icon: CreditCard },
  { id: "vehicle",  label: "Vehicle",  Icon: Car },
  { id: "personal", label: "Details",  Icon: User },
  { id: "review",   label: "Pay",      Icon: ShieldCheck },
];

function StepIndicator({ current }) {
  const idx = STEPS.findIndex((s) => s.id === current);
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${i <= idx ? "bg-[#FF6B00] text-white" : "bg-[#E5E7EB] text-[#9CA3AF]"}`}>
              {i < idx ? <CheckCircle2 className="w-5 h-5" /> : <s.Icon className="w-4 h-4" />}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${i <= idx ? "text-[#FF6B00]" : "text-[#9CA3AF]"}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-0.5 w-10 mx-1 mb-5 transition-colors ${i < idx ? "bg-[#FF6B00]" : "bg-[#E5E7EB]"}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function Field({ label, error, children, required }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#374151] mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
  );
}

const inputCls = "w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] focus:outline-none transition-colors uppercase";
const inputClsNormal = "w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] focus:outline-none transition-colors";

export default function BuyFasTagOrderPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState("bank");
  const [prices, setPrices] = useState([]);
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Form state
  const [bankSlug, setBankSlug] = useState(searchParams.get("bank") || "");
  const [vehicle, setVehicle] = useState({ type: "", number: "", chassis_last6: "" });
  const [personal, setPersonal] = useState({ name: "", phone: "", email: "", address: "", city: "", state: "", pincode: "" });
  const [errors, setErrors] = useState({});

  // Payment state
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  useEffect(() => {
    track("page_view", { page: "buy_fastag_order" });
    fastagOrderApi.prices()
      .then((r) => {
        const available = r.data.filter((p) => p.is_available !== false);
        setPrices(available);
        // If bank pre-selected from URL and available, jump to step 2
        if (searchParams.get("bank") && available.find((p) => p.bank_slug === searchParams.get("bank"))) {
          setStep("vehicle");
        }
      })
      .catch(() => {})
      .finally(() => setLoadingPrices(false));
  }, []);

  const selectedPrice = prices.find((p) => p.bank_slug === bankSlug);
  const bankMeta = SEED_BANKS.find((b) => b.slug === bankSlug);

  // Load Cashfree SDK
  useEffect(() => {
    if (document.getElementById("cf-sdk")) return;
    const s = document.createElement("script");
    s.id = "cf-sdk";
    s.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    document.body.appendChild(s);
  }, []);

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateVehicle = () => {
    const e = {};
    if (!vehicle.type) e.type = "Select vehicle type";
    if (!vehicle.number.trim()) e.number = "Enter vehicle registration number";
    if (!/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/i.test(vehicle.number.trim().replace(/\s/g, "")))
      e.number = "Enter valid RC number (e.g. MH01AB1234)";
    if (!vehicle.chassis_last6.trim() || vehicle.chassis_last6.trim().length < 4)
      e.chassis_last6 = "Enter last 4–6 digits of chassis number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePersonal = () => {
    const e = {};
    if (!personal.name.trim()) e.name = "Enter your name";
    if (!/^\d{10}$/.test(personal.phone.trim())) e.phone = "Enter valid 10-digit mobile number";
    if (!personal.address.trim()) e.address = "Enter delivery address";
    if (!personal.city.trim()) e.city = "Enter city";
    if (!personal.state.trim()) e.state = "Enter state";
    if (!/^\d{6}$/.test(personal.pincode.trim())) e.pincode = "Enter valid 6-digit pincode";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Navigation ───────────────────────────────────────────────────────────

  const goNext = () => {
    if (step === "bank") {
      if (!bankSlug) { setErrors({ bank: "Please select a bank" }); return; }
      setErrors({}); setStep("vehicle");
    } else if (step === "vehicle") {
      if (validateVehicle()) setStep("personal");
    } else if (step === "personal") {
      if (validatePersonal()) setStep("review");
    }
  };

  const goBack = () => {
    setErrors({});
    if (step === "vehicle") setStep("bank");
    else if (step === "personal") setStep("vehicle");
    else if (step === "review") setStep("personal");
  };

  // ─── Payment ──────────────────────────────────────────────────────────────

  const handlePay = async () => {
    setPaying(true);
    setPayError("");
    try {
      const res = await fastagOrderApi.create({
        bank_slug:       bankSlug,
        customer_name:   personal.name.trim(),
        customer_phone:  personal.phone.trim(),
        customer_email:  personal.email.trim(),
        vehicle_type:    vehicle.type,
        vehicle_number:  vehicle.number.trim().toUpperCase(),
        chassis_last6:   vehicle.chassis_last6.trim().toUpperCase(),
        delivery_address: personal.address.trim(),
        delivery_city:   personal.city.trim(),
        delivery_state:  personal.state.trim(),
        delivery_pincode: personal.pincode.trim(),
      });

      const { order_id, payment_session_id } = res.data;
      track("fastag_order_created", { bank: bankSlug, amount: selectedPrice?.price });

      // Launch Cashfree drop-in
      const cashfree = Cashfree({ mode: process.env.REACT_APP_CF_ENV === "production" ? "production" : "sandbox" });
      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });
    } catch (e) {
      setPayError(e?.response?.data?.detail || "Payment initiation failed. Please try again.");
    } finally {
      setPaying(false);
    }
  };

  // ─── Render helpers ───────────────────────────────────────────────────────

  const renderBank = () => (
    <div>
      <h2 className="text-2xl font-black text-[#0A0A0A] mb-2">Choose your bank</h2>
      <p className="text-sm text-[#6B7280] mb-8">All prices include FASTag card + security deposit + Sathi activation fee.</p>
      {errors.bank && <p className="text-sm text-red-500 mb-4 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.bank}</p>}
      {loadingPrices ? (
        <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {prices.map((p) => {
            const meta = SEED_BANKS.find((b) => b.slug === p.bank_slug) || {};
            const selected = bankSlug === p.bank_slug;
            return (
              <button
                key={p.bank_slug}
                onClick={() => { setBankSlug(p.bank_slug); setErrors({}); }}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                  selected ? "border-[#FF6B00] bg-[#FFF7F0]" : "border-[#E5E7EB] hover:border-[#FF6B00]/50"
                }`}
              >
                {meta.logo ? (
                  <img src={meta.logo} alt={meta.name} className="h-10 w-14 object-contain flex-shrink-0" />
                ) : (
                  <div className="w-12 h-10 rounded-lg flex items-center justify-center text-white font-black text-xs flex-shrink-0"
                    style={{ background: meta.color || "#6B7280" }}>
                    {meta.shortName?.slice(0, 2) || "??"}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-black text-[#0A0A0A] text-sm">{meta.name || p.bank_slug}</p>
                  <p className="text-xs text-[#6B7280]">{p.security_info}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-black text-[#0A0A0A] text-lg">₹{p.price}</p>
                  {selected && <CheckCircle2 className="w-5 h-5 text-[#FF6B00] ml-auto" />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderVehicle = () => (
    <div>
      <h2 className="text-2xl font-black text-[#0A0A0A] mb-2">Vehicle details</h2>
      <p className="text-sm text-[#6B7280] mb-8">FASTag will be linked to this vehicle's RC. Make sure the details match your Registration Certificate.</p>
      <div className="space-y-5">
        <Field label="Vehicle type" error={errors.type} required>
          <select
            className={inputClsNormal}
            value={vehicle.type}
            onChange={(e) => setVehicle((v) => ({ ...v, type: e.target.value }))}
          >
            <option value="">Select vehicle type</option>
            {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <Field label="Vehicle registration number (RC)" error={errors.number} required>
          <input
            className={inputCls}
            placeholder="MH01AB1234"
            value={vehicle.number}
            onChange={(e) => setVehicle((v) => ({ ...v, number: e.target.value.toUpperCase() }))}
            maxLength={12}
          />
          <p className="text-[11px] text-[#9CA3AF] mt-1">As shown on your RC card, no spaces</p>
        </Field>
        <Field label="Last 4–6 digits of chassis number" error={errors.chassis_last6} required>
          <input
            className={inputCls}
            placeholder="ABC123"
            value={vehicle.chassis_last6}
            onChange={(e) => setVehicle((v) => ({ ...v, chassis_last6: e.target.value.toUpperCase() }))}
            maxLength={6}
          />
          <p className="text-[11px] text-[#9CA3AF] mt-1">Found on your RC. Used for bank KYC verification.</p>
        </Field>
      </div>
    </div>
  );

  const renderPersonal = () => (
    <div>
      <h2 className="text-2xl font-black text-[#0A0A0A] mb-2">Your details & delivery</h2>
      <p className="text-sm text-[#6B7280] mb-8">Our Sathi will contact you and come to this address.</p>
      <div className="space-y-5">
        <Field label="Full name" error={errors.name} required>
          <input className={inputClsNormal} placeholder="Rahul Sharma"
            value={personal.name} onChange={(e) => setPersonal((p) => ({ ...p, name: e.target.value }))} />
        </Field>
        <Field label="Mobile number" error={errors.phone} required>
          <input className={inputClsNormal} placeholder="9876543210" type="tel" maxLength={10}
            value={personal.phone} onChange={(e) => setPersonal((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} />
          <p className="text-[11px] text-[#9CA3AF] mt-1">Sathi will call you on this number to schedule visit</p>
        </Field>
        <Field label="Email (optional)" error={errors.email}>
          <input className={inputClsNormal} placeholder="rahul@email.com" type="email"
            value={personal.email} onChange={(e) => setPersonal((p) => ({ ...p, email: e.target.value }))} />
        </Field>
        <Field label="Delivery address" error={errors.address} required>
          <textarea className={inputClsNormal} placeholder="House / Flat no., Street, Landmark" rows={2}
            value={personal.address} onChange={(e) => setPersonal((p) => ({ ...p, address: e.target.value }))} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="City" error={errors.city} required>
            <input className={inputClsNormal} placeholder="Mumbai"
              value={personal.city} onChange={(e) => setPersonal((p) => ({ ...p, city: e.target.value }))} />
          </Field>
          <Field label="Pincode" error={errors.pincode} required>
            <input className={inputClsNormal} placeholder="400001" maxLength={6} type="tel"
              value={personal.pincode} onChange={(e) => setPersonal((p) => ({ ...p, pincode: e.target.value.replace(/\D/g, "") }))} />
          </Field>
        </div>
        <Field label="State" error={errors.state} required>
          <input className={inputClsNormal} placeholder="Maharashtra"
            value={personal.state} onChange={(e) => setPersonal((p) => ({ ...p, state: e.target.value }))} />
        </Field>
      </div>
    </div>
  );

  const renderReview = () => (
    <div>
      <h2 className="text-2xl font-black text-[#0A0A0A] mb-2">Review & Pay</h2>
      <p className="text-sm text-[#6B7280] mb-6">Check your order details before paying.</p>

      <div className="space-y-4 mb-8">
        {/* Bank */}
        <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E7EB]">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">FASTag</p>
          <div className="flex items-center gap-3">
            {bankMeta?.logo ? (
              <img src={bankMeta.logo} alt={bankMeta.name} className="h-8 w-12 object-contain" />
            ) : (
              <div className="w-10 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black"
                style={{ background: bankMeta?.color || "#6B7280" }}>
                {bankMeta?.shortName?.slice(0, 2)}
              </div>
            )}
            <div>
              <p className="font-black text-[#0A0A0A]">{bankMeta?.name || bankSlug}</p>
              <p className="text-xs text-[#6B7280]">{selectedPrice?.security_info}</p>
            </div>
            <p className="ml-auto font-black text-[#0A0A0A] text-xl">₹{selectedPrice?.price}</p>
          </div>
        </div>

        {/* Vehicle */}
        <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E7EB]">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Vehicle</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div><span className="text-[#6B7280]">Type</span><p className="font-semibold text-[#0A0A0A]">{vehicle.type}</p></div>
            <div><span className="text-[#6B7280]">RC Number</span><p className="font-semibold text-[#0A0A0A] font-mono">{vehicle.number}</p></div>
          </div>
        </div>

        {/* Delivery */}
        <div className="bg-[#F8F9FA] rounded-2xl p-5 border border-[#E5E7EB]">
          <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-3">Delivery</p>
          <div className="text-sm space-y-1">
            <p className="font-semibold text-[#0A0A0A]">{personal.name}</p>
            <p className="text-[#4B5563]">{personal.phone}</p>
            <p className="text-[#4B5563]">{personal.address}, {personal.city}, {personal.state} – {personal.pincode}</p>
          </div>
        </div>

        {/* What's included */}
        <div className="bg-[#FFF7F0] rounded-2xl p-5 border border-[#FF6B00]/30">
          <p className="text-xs font-bold text-[#FF6B00] uppercase tracking-wider mb-3">What's included</p>
          {["FASTag card (bank-issued)", "Sathi doorstep visit & activation", "RC linking + KYC completion", "Refund guarantee if activation fails"].map((i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-[#374151] mb-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#059669] flex-shrink-0" /> {i}
            </div>
          ))}
        </div>
      </div>

      {payError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {payError}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={paying}
        className="w-full bg-[#FF6B00] text-white font-black text-lg py-4 rounded-2xl hover:bg-[#E66000] disabled:opacity-60 transition-colors shadow-[0_6px_0_#0A0A0A] hover:-translate-y-0.5 hover:shadow-[0_8px_0_#0A0A0A] transition-all flex items-center justify-center gap-2"
      >
        {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
        {paying ? "Processing…" : `Pay ₹${selectedPrice?.price} Securely`}
      </button>
      <p className="text-center text-xs text-[#9CA3AF] mt-3">
        Secured by Cashfree · UPI, Card, NetBanking accepted
      </p>
    </div>
  );

  return (
    <>
      <SEO
        title="Buy FASTag — Order Form | ApnaFastag"
        description="Order a new FASTag online. Choose your bank, fill your vehicle details, and pay securely. A Sathi will deliver and activate it at your door."
        path="/buy-fastag/order"
      />

      <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-16">
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          {/* Back link */}
          <Link to="/buy-fastag" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#0A0A0A] mb-8 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Back to FASTag plans
          </Link>

          <StepIndicator current={step} />

          <div className="bg-white rounded-3xl border-2 border-[#E5E7EB] p-6 md:p-10 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {step === "bank"     && renderBank()}
                {step === "vehicle"  && renderVehicle()}
                {step === "personal" && renderPersonal()}
                {step === "review"   && renderReview()}
              </motion.div>
            </AnimatePresence>

            {/* Nav buttons */}
            {step !== "review" && (
              <div className="flex gap-3 mt-8">
                {step !== "bank" && (
                  <button onClick={goBack}
                    className="flex items-center gap-1.5 border-2 border-[#E5E7EB] text-[#374151] font-bold px-6 py-3 rounded-xl hover:border-[#0A0A0A] transition-colors">
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-[#0A0A0A] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#FF6B00] transition-colors">
                  Continue <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {step === "review" && step !== "bank" && (
              <button onClick={goBack}
                className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-[#6B7280] hover:text-[#0A0A0A] transition-colors">
                <ChevronLeft className="w-4 h-4" /> Edit details
              </button>
            )}
          </div>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-5 mt-8">
            {["Verified Sathis", "Instant Confirmation", "Full Refund Guarantee", "Cashfree Secured"].map((t) => (
              <div key={t} className="flex items-center gap-1.5 text-xs font-semibold text-[#6B7280]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" /> {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
