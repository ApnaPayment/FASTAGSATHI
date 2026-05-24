import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { Mail, Phone, MessageSquare, MapPin, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { track } from "@/lib/analytics";
import { useBranding } from "@/contexts/BrandingContext";

export default function ContactPage() {
  const [params] = useSearchParams();
  const topic = params.get("topic") || "general";
  const [submitted, setSubmitted] = useState(false);
  const [data, setData] = useState({ name: "", email: "", subject: "", message: "" });

  const {
    supportEmail, helpline, whatsapp,
    addressLine1, addressCity, addressState, addressPincode, addressCountry,
  } = useBranding();

  const addressFull = [addressLine1, addressCity, addressState, addressPincode, addressCountry]
    .filter(Boolean).join(", ");

  useEffect(() => { track("page_view", { page: "contact", topic }); }, [topic]);

  const submit = (e) => {
    e.preventDefault();
    track("contact_form_submit", { topic });
    setSubmitted(true);
  };

  const contactCards = [
    supportEmail && { Icon: Mail,          t: "Email",    v: supportEmail,                   href: `mailto:${supportEmail}` },
    helpline     && { Icon: Phone,         t: "Helpline", v: `${helpline} (24×7)`,            href: `tel:${helpline.replace(/\D/g,"")}` },
    whatsapp     && { Icon: MessageSquare, t: "WhatsApp", v: whatsapp,                        href: `https://wa.me/${whatsapp.replace(/\D/g,"")}` },
    addressFull  && { Icon: MapPin,        t: "HQ",       v: addressFull,                     href: null },
  ].filter(Boolean);

  return (
    <>
      <SEO
        title={`Contact ${""} — talk to a real human`}
        description={`Email ${supportEmail}${helpline ? `, helpline ${helpline} (24×7)` : ""}. Most messages get a reply in under 4 hours.`}
        path="/contact"
      />
      <PageHero
        eyebrow={topic === "fleet" ? "Talk to sales" : topic === "sathi" ? "Sathi recruiting" : "Get in touch"}
        title={<>Talk to a real <span className="text-[#FF6B00]">human.</span></>}
        sub="No bots, no ticket black holes. Most messages get a reply in under 4 hours during business hours."
        breadcrumb={[{ label: "Contact" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-12 grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            {submitted ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-10 text-center">
                <BadgeCheck className="w-14 h-14 text-[#059669] mx-auto" />
                <h3 className="font-display font-black text-2xl mt-4">Got it!</h3>
                <p className="text-[#4B5563] mt-2">We'll reply at <strong>{data.email}</strong> within 4 working hours.</p>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-3xl p-7 md:p-10 space-y-4 shadow-[6px_6px_0_#FF6B00]">
                <h2 className="font-display font-black text-2xl">Send us a message</h2>
                {[
                  { k: "name",    l: "Your name", t: "text" },
                  { k: "email",   l: "Email",     t: "email" },
                  { k: "subject", l: "Subject",   t: "text" },
                ].map((f) => (
                  <label key={f.k} className="block text-sm font-semibold text-[#0A0A0A]">
                    {f.l}
                    <input required type={f.t} value={data[f.k]}
                      onChange={(e) => setData({ ...data, [f.k]: e.target.value })}
                      data-testid={`contact-${f.k}`}
                      className="mt-1 w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors" />
                  </label>
                ))}
                <label className="block text-sm font-semibold">
                  Message
                  <textarea required rows={5} value={data.message}
                    onChange={(e) => setData({ ...data, message: e.target.value })}
                    data-testid="contact-message"
                    className="mt-1 w-full bg-white border-2 border-[#E5E7EB] focus:border-[#FF6B00] rounded-xl px-4 py-3 outline-none transition-colors" />
                </label>
                <button type="submit" data-testid="contact-submit"
                  className="bg-[#FF6B00] text-white font-bold px-7 py-3.5 rounded-full hover:bg-[#E66000] shadow-[0_4px_0_#0A0A0A]">
                  Send message
                </button>
              </form>
            )}
          </div>

          <div className="md:col-span-2 space-y-4">
            {contactCards.map((c) => (
              <div key={c.t} className="bg-white border-2 border-[#E5E7EB] rounded-2xl p-5">
                <c.Icon className="w-6 h-6 text-[#FF6B00] mb-2" />
                <div className="text-xs uppercase font-bold tracking-widest text-[#4B5563]">{c.t}</div>
                {c.href ? (
                  <a href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    onClick={() => track(c.t === "WhatsApp" ? "whatsapp_click" : c.t === "Helpline" ? "call_click" : "email_click", { src: "contact_page" })}
                    className="font-display font-bold text-lg hover:text-[#FF6B00] transition-colors break-all">
                    {c.v}
                  </a>
                ) : (
                  <div className="font-display font-bold text-lg">{c.v}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <PageCTA />
    </>
  );
}
