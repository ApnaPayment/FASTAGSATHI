import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative bg-[#0A0A0A] text-white pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 dot-grid-dark opacity-30" />
      <div className="absolute top-0 left-0 right-0 road-divider opacity-40"
           style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFD60A 0,#FFD60A 24px,transparent 24px,transparent 44px)" }} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        {/* Mega heading */}
        <h3 className="font-display font-black text-6xl md:text-8xl tracking-tighter leading-[0.85] text-white mb-10">
          ApnaFastag.<span className="text-[#FF6B00]">in</span>
        </h3>

        <div className="grid md:grid-cols-12 gap-8 mb-14">
          <div className="md:col-span-5">
            <p className="text-white/70 text-base max-w-md">
              India's first real-time, peer-to-peer rescue network for FASTag chaos.
              <span className="font-hindi block mt-2 text-white/60">हर टोल पर एक साथी।</span>
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { Ic: Instagram, label: "Instagram" },
                { Ic: Twitter,   label: "Twitter / X" },
                { Ic: Youtube,   label: "YouTube" },
                { Ic: Mail,      label: "Email us" },
              ].map(({ Ic, label }, i) => (
                <a
                  key={i}
                  href="#"
                  aria-label={label}
                  data-testid={`social-${i}`}
                  className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-colors"
                >
                  <Ic className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-4">Product</div>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/features" className="hover:text-white">Features</Link></li>
              <li><Link to="/how-it-works" className="hover:text-white">How it works</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/coverage" className="hover:text-white">Coverage</Link></li>
              <li><Link to="/become-a-sathi" className="hover:text-white">Become a Sathi</Link></li>
              <li><Link to="/help" className="hover:text-white">Help Center</Link></li>
            </ul>
          </div>

          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-4">Company</div>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/careers" className="hover:text-white">Careers</Link></li>
              <li><Link to="/press" className="hover:text-white">Press</Link></li>
              <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-4">Languages</div>
            <div className="flex flex-wrap gap-2">
              {["English", "हिन्दी", "मराठी", "தமிழ்"].map((l) => (
                <button
                  key={l}
                  data-testid={`footer-lang-${l}`}
                  className="px-3 py-1.5 border border-white/20 rounded-full text-xs font-semibold hover:bg-white hover:text-[#0A0A0A] transition-colors font-hindi"
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="mt-6 text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-3">
              Support
            </div>
            <p className="text-sm text-white/70">help@apnafastag.in</p>
            <p className="text-sm text-white/70">1800-XXX-XXXX (24×7)</p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row md:justify-between gap-4 text-xs text-white/50">
          <span>© 2026 ApnaFastag Technologies Pvt. Ltd. Made with chai on NH-48.</span>
          <div className="flex gap-5">
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/refund-policy" className="hover:text-white">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
