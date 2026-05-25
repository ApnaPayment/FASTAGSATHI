import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Twitter, Youtube, Mail, Facebook, Linkedin } from "lucide-react";
import { useBranding } from "@/contexts/BrandingContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { LANGUAGES } from "@/lib/translations";

export default function Footer() {
  const {
    siteName, description, tagline, footerTagline, legalName, foundedYear,
    supportEmail, helpline,
    socialInstagram, socialTwitter, socialYoutube, socialFacebook, socialLinkedin,
  } = useBranding();
  const { lang, setLang, t } = useLanguage();

  const socials = [
    { Ic: Instagram, label: "Instagram", url: socialInstagram },
    { Ic: Twitter,   label: "Twitter / X", url: socialTwitter },
    { Ic: Youtube,   label: "YouTube",   url: socialYoutube },
    { Ic: Facebook,  label: "Facebook",  url: socialFacebook },
    { Ic: Linkedin,  label: "LinkedIn",  url: socialLinkedin },
    { Ic: Mail,      label: "Email us",  url: supportEmail ? `mailto:${supportEmail}` : null },
  ].filter((s) => s.url);

  const year = new Date().getFullYear();

  return (
    <footer data-testid="site-footer" className="relative bg-[#0A0A0A] text-white pt-20 pb-10 overflow-hidden">
      <div className="absolute inset-0 dot-grid-dark opacity-30" />
      <div className="absolute top-0 left-0 right-0 road-divider opacity-40"
           style={{ backgroundImage: "repeating-linear-gradient(90deg,#FFD60A 0,#FFD60A 24px,transparent 24px,transparent 44px)" }} />

      <div className="relative max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        {/* Mega heading */}
        <h3 className="font-display font-black text-6xl md:text-8xl tracking-tighter leading-[0.85] text-white mb-10">
          {siteName}
        </h3>

        <div className="grid md:grid-cols-12 gap-8 mb-14">
          <div className="md:col-span-5">
            <p className="text-white/70 text-base max-w-md">
              {description}
              {tagline && <span className="font-hindi block mt-2 text-white/60">{tagline}</span>}
            </p>
            {socials.length > 0 && (
              <div className="flex gap-3 mt-6">
                {socials.map(({ Ic, label, url }) => (
                  <a
                    key={label}
                    href={url}
                    target={url?.startsWith("http") ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-[#FF6B00] hover:border-[#FF6B00] transition-colors"
                  >
                    <Ic className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-4">Product</div>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link to="/buy-fastag" className="hover:text-white">Buy FASTag</Link></li>
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
            <div className="text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-4">{t("footer.lang")}</div>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  data-testid={`footer-lang-${l.label}`}
                  onClick={() => setLang(l.code)}
                  className={`px-3 py-1.5 border rounded-full text-xs font-semibold transition-all font-hindi ${
                    lang === l.code
                      ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                      : "border-white/20 text-white/70 hover:bg-white hover:text-[#0A0A0A] hover:border-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            <div className="mt-6 text-xs uppercase tracking-widest text-[#FF6B00] font-bold mb-3">
              Support
            </div>
            {supportEmail && <p className="text-sm text-white/70">{supportEmail}</p>}
            {helpline && <p className="text-sm text-white/70">{helpline} (24×7)</p>}
          </div>
        </div>

        {/* Legal / trust block — CIN, GST, RoC for Indian compliance */}
        <div className="mb-8 bg-white/[0.04] border border-white/10 rounded-2xl px-6 py-5 flex flex-wrap gap-x-10 gap-y-3 items-center text-xs text-white/55">
          <a href="https://apnapayment.com" target="_blank" rel="noopener noreferrer"
            className="font-semibold text-white/80 hover:text-[#FF6B00] transition-colors">
            apnapayment.com
          </a>
          <span>Apna Payment Services Pvt. Ltd.</span>
          <span>CIN: <span className="font-mono text-white/75">U67100RJ2021PTC074460</span></span>
          <span>GSTIN: <span className="font-mono text-white/75">08AAVCA0650L1ZA</span></span>
          <span>Plot 796, Gokul Nagar, Jhotwara, Jaipur — 302012, Rajasthan</span>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row md:justify-between gap-4 text-xs text-white/50">
          <span>© {year} {legalName}. {footerTagline}</span>
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
