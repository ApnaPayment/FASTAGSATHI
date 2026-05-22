import React from "react";
import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const ITEMS = [
  {
    name: "Suresh Kumar",
    role: "Truck Owner, NH-48",
    img: "https://images.unsplash.com/photo-1695395860103-38d172403a46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjB0cnVjayUyMGRyaXZlciUyMHNtaWxpbmd8ZW58MHx8fHwxNzc5MDM2NzA3fDA&ixlib=rb-4.1.0&q=85",
    quote: "मेरा ₹450 दो बार कट गया था। 4 मिनट में Sathi Ravi ने सब ठीक करा दिया। पैसा वापस।",
    quoteEn: "Charged twice — ₹450 stuck. Sathi Ravi got it reversed in 4 minutes.",
    accent: "#FF6B00",
  },
  {
    name: "Priya Nair",
    role: "Family driver, Mumbai-Pune",
    img: "https://images.unsplash.com/photo-1632999863880-034c5f73c779?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwzfHxpbmRpYW4lMjB0cnVjayUyMGRyaXZlciUyMHNtaWxpbmd8ZW58MHx8fHwxNzc5MDM2NzA3fDA&ixlib=rb-4.1.0&q=85",
    quote: "Late at night, FASTag stopped scanning at Khalapur. SOS button literally saved my trip.",
    quoteEn: null,
    accent: "#059669",
  },
  {
    name: "Anil Bhau",
    role: "Sathi · Lonavla Plaza",
    img: "https://images.unsplash.com/photo-1695395860103-38d172403a46?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMjh8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjB0cnVjayUyMGRyaXZlciUyMHNtaWxpbmd8ZW58MHx8fHwxNzc5MDM2NzA3fDA&ixlib=rb-4.1.0&q=85",
    quote: "टोल पर खड़े-खड़े ₹38,000 कमाए पिछले महीने। अपने hours, अपना काम।",
    quoteEn: "Earned ₹38k last month — at my own toll, on my own time.",
    accent: "#FFD60A",
  },
];

export default function Testimonials() {
  return (
    <section data-testid="testimonials-section" className="relative py-24 md:py-32 bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        <div className="max-w-2xl mb-14">
          <span className="inline-block bg-[#0A0A0A] text-[#FFD60A] px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5">
            ★ Voices from the road
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-[#0A0A0A] leading-[0.95]">
            <span className="font-hindi">सच्ची कहानियाँ</span>, <br />
            real receipts.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 md:gap-6">
          {ITEMS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              data-testid={`testimonial-${i}`}
              className="relative bg-white border-2 border-[#0A0A0A] rounded-3xl p-7 hover:-translate-y-1 transition-transform"
              style={{ boxShadow: `6px 6px 0 ${t.accent}` }}
            >
              <Quote className="w-8 h-8 text-[#FF6B00] mb-4" />
              <p className="font-hindi text-lg font-semibold text-[#0A0A0A] leading-snug">
                "{t.quote}"
              </p>
              {t.quoteEn && (
                <p className="text-sm text-[#4B5563] mt-3 italic">{t.quoteEn}</p>
              )}
              <div className="flex items-center gap-3 mt-6 pt-5 border-t border-[#E5E7EB]">
                <img
                  src={t.img}
                  alt={t.name}
                  loading="lazy"
                  className="w-12 h-12 rounded-full object-cover border-2 border-[#0A0A0A]"
                />
                <div>
                  <div className="font-display font-bold text-[#0A0A0A]">{t.name}</div>
                  <div className="text-xs text-[#4B5563]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
