import React, { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2, Clock, Truck, Zap, Phone, AlertCircle, Loader2,
  CreditCard, Search, ChevronRight, Package,
} from "lucide-react";
import SEO from "@/components/seo/SEO";
import { fastagOrderApi } from "@/lib/api";
import { BANKS as SEED_BANKS } from "@/data/seed";
import { track } from "@/lib/analytics";

const STATUS_TIMELINE = [
  { id: "pending_payment", label: "Order placed",      icon: CreditCard, color: "#9CA3AF" },
  { id: "paid",            label: "Payment received",  icon: CheckCircle2, color: "#059669" },
  { id: "confirmed",       label: "Order confirmed",   icon: Package,    color: "#059669" },
  { id: "sathi_assigned",  label: "Sathi assigned",    icon: Phone,      color: "#FF6B00" },
  { id: "out_for_delivery",label: "Out for delivery",  icon: Truck,      color: "#FF6B00" },
  { id: "delivered",       label: "FASTag delivered",  icon: Package,    color: "#2563EB" },
  { id: "activated",       label: "Activated & live!", icon: Zap,        color: "#7C3AED" },
];

const STATUS_MESSAGES = {
  pending_payment: "Waiting for payment confirmation…",
  paid:            "Payment received! We're confirming your order.",
  confirmed:       "Order confirmed! We're assigning a Sathi near you.",
  sathi_assigned:  "A Sathi has been assigned. They'll call you to schedule a visit.",
  out_for_delivery:"Your Sathi is on the way to your address!",
  delivered:       "FASTag delivered! Activation in progress.",
  activated:       "Your FASTag is live! Start using it at toll plazas.",
  cancelled:       "This order has been cancelled.",
};

function StatusTimeline({ currentStatus }) {
  const cancelledIdx = currentStatus === "cancelled" ? -1 : -2;
  const currentIdx = STATUS_TIMELINE.findIndex((s) => s.id === currentStatus);
  return (
    <div className="relative">
      {STATUS_TIMELINE.map((s, i) => {
        const done = i <= currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.id} className="flex items-start gap-4 mb-5 last:mb-0">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                done ? "bg-[#FF6B00] text-white" : "bg-[#F3F4F6] text-[#D1D5DB]"
              } ${active ? "ring-4 ring-[#FF6B00]/20" : ""}`}>
                <s.icon className="w-4 h-4" />
              </div>
              {i < STATUS_TIMELINE.length - 1 && (
                <div className={`w-0.5 h-6 mt-1 ${done && i < currentIdx ? "bg-[#FF6B00]" : "bg-[#E5E7EB]"}`} />
              )}
            </div>
            <div className="pt-1.5">
              <p className={`font-bold text-sm ${done ? "text-[#0A0A0A]" : "text-[#9CA3AF]"}`}>{s.label}</p>
              {active && (
                <p className="text-xs text-[#6B7280] mt-0.5">{STATUS_MESSAGES[currentStatus]}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function BuyFasTagTrackPage() {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("payment_id") || searchParams.get("order_id") || "");
  const [phone, setPhone] = useState(searchParams.get("phone") || "");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const initPaymentId = searchParams.get("payment_id");
  const initPhone = searchParams.get("phone");

  useEffect(() => {
    track("page_view", { page: "buy_fastag_track" });
    // Auto-track if redirected back from payment
    if (initPaymentId && initPhone) {
      fetchOrder(initPaymentId, initPhone);
    }
  }, [initPaymentId, initPhone]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchOrder = async (oid, ph) => {
    if (!oid || !ph) { setError("Please enter both order ID and phone number"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fastagOrderApi.track(oid.trim().toUpperCase(), ph.trim());
      setOrder(res.data);
      track("fastag_order_tracked", { status: res.data.status });
    } catch (e) {
      setError(e?.response?.data?.detail || "Order not found. Please check your order ID and phone number.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrder(orderId, phone);
  };

  const bankMeta = order ? SEED_BANKS.find((b) => b.slug === order.bank_slug) : null;
  const isCancelled = order?.status === "cancelled";
  const isActivated = order?.status === "activated";

  return (
    <>
      <SEO
        title="Track FASTag Order | ApnaFastag"
        description="Track your FASTag purchase order status. See delivery and activation updates in real time."
        path="/buy-fastag/track"
      />

      <div className="min-h-screen bg-[#F8F9FA] pt-24 pb-16">
        <div className="max-w-xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/10 flex items-center justify-center mx-auto mb-4">
              <Truck className="w-7 h-7 text-[#FF6B00]" />
            </div>
            <h1 className="text-3xl font-black text-[#0A0A0A]">Track your FASTag</h1>
            <p className="text-[#6B7280] mt-2">Enter your order ID and mobile number to see the latest status.</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl border-2 border-[#E5E7EB] p-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Order ID</label>
                <input
                  className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-sm font-mono uppercase focus:border-[#FF6B00] focus:outline-none"
                  placeholder="FTO-XXXXXXXXXX"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value.toUpperCase())}
                />
                <p className="text-[11px] text-[#9CA3AF] mt-1">Sent in your order confirmation</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#374151] mb-1.5">Mobile number</label>
                <input
                  className="w-full border-2 border-[#E5E7EB] rounded-xl px-4 py-3 text-sm focus:border-[#FF6B00] focus:outline-none"
                  placeholder="9876543210"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>
            {error && (
              <p className="flex items-center gap-1.5 text-sm text-red-600 mt-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="mt-5 w-full bg-[#0A0A0A] text-white font-bold py-3 rounded-xl hover:bg-[#FF6B00] transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {loading ? "Looking up…" : "Track Order"}
            </button>
          </form>

          {/* Order result */}
          {order && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              {/* Header card */}
              <div className={`rounded-2xl p-5 mb-4 border-2 ${
                isActivated ? "bg-[#F0FDF4] border-[#059669]/30" :
                isCancelled ? "bg-red-50 border-red-200" :
                "bg-[#FFF7F0] border-[#FF6B00]/30"
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Order</p>
                    <p className="font-mono font-black text-[#0A0A0A] text-lg">{order.order_id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider">Amount paid</p>
                    <p className="font-black text-[#0A0A0A] text-xl">₹{order.amount}</p>
                  </div>
                </div>
                {/* Bank */}
                <div className="flex items-center gap-3 pt-3 border-t border-current/10">
                  {bankMeta?.logo ? (
                    <img src={bankMeta.logo} alt={bankMeta.name} className="h-8 w-12 object-contain" />
                  ) : (
                    <div className="w-12 h-8 rounded-lg flex items-center justify-center text-white font-black text-xs"
                      style={{ background: bankMeta?.color || "#6B7280" }}>
                      {bankMeta?.shortName?.slice(0, 2) || "??"}
                    </div>
                  )}
                  <div>
                    <p className="font-black text-sm text-[#0A0A0A]">{bankMeta?.name || order.bank_slug}</p>
                    <p className="text-xs text-[#6B7280]">{order.vehicle_type} · {order.vehicle_number}</p>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] p-6 mb-4">
                <h3 className="font-black text-[#0A0A0A] mb-5">Order status</h3>
                {isCancelled ? (
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <AlertCircle className="w-5 h-5" /> This order has been cancelled.
                  </div>
                ) : (
                  <StatusTimeline currentStatus={order.status} />
                )}
                {order.tracking_notes && (
                  <div className="mt-5 pt-5 border-t border-[#F3F4F6]">
                    <p className="text-xs font-bold text-[#9CA3AF] uppercase tracking-wider mb-1">Note from Sathi</p>
                    <p className="text-sm text-[#374151]">{order.tracking_notes}</p>
                  </div>
                )}
              </div>

              {/* Delivery details */}
              <div className="bg-white rounded-2xl border-2 border-[#E5E7EB] p-6 mb-4">
                <h3 className="font-black text-[#0A0A0A] mb-3">Delivery details</h3>
                <div className="text-sm space-y-1 text-[#4B5563]">
                  <p className="font-semibold text-[#0A0A0A]">{order.customer_name}</p>
                  <p>{order.customer_phone}</p>
                  <p>{order.delivery_address}, {order.delivery_city}, {order.delivery_state} – {order.delivery_pincode}</p>
                </div>
                {order.sathi_name && (
                  <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#FF6B00]" />
                    <span className="text-sm font-semibold text-[#0A0A0A]">Sathi: {order.sathi_name}</span>
                  </div>
                )}
              </div>

              {isActivated && (
                <div className="bg-[#F0FDF4] border-2 border-[#059669]/30 rounded-2xl p-6 text-center">
                  <Zap className="w-8 h-8 text-[#059669] mx-auto mb-2" />
                  <h3 className="font-black text-[#059669] text-lg">FASTag is live!</h3>
                  <p className="text-sm text-[#4B5563] mt-1">Your FASTag is active and working at all toll plazas across India.</p>
                </div>
              )}

              {/* Need help */}
              <div className="mt-4 bg-white rounded-2xl border-2 border-[#E5E7EB] p-5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#0A0A0A] text-sm">Need help with this order?</p>
                  <p className="text-xs text-[#6B7280]">Find a Sathi near you for instant support</p>
                </div>
                <Link to="/find" className="inline-flex items-center gap-1 text-sm font-bold text-[#FF6B00] hover:underline">
                  Get Help <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          )}

          {/* CTA if no order yet */}
          {!order && !loading && (
            <div className="text-center mt-6">
              <p className="text-sm text-[#6B7280]">Don't have an order yet?</p>
              <Link to="/buy-fastag" className="inline-flex items-center gap-1.5 mt-2 font-bold text-[#FF6B00] hover:underline text-sm">
                Order your FASTag <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
