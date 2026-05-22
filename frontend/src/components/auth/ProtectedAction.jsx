import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Lock, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

/**
 * Wraps content that should only be visible/clickable after the user logs in
 * via OTP. If logged out, the children are blurred and a locked-state CTA
 * appears that redirects to /login?returnTo=<current path>.
 */
export default function ProtectedAction({ children, label = "contact this Sathi", noun = "details", className = "" }) {
  const { user, hydrated } = useAuth();
  const { pathname, search } = useLocation();
  const returnTo = encodeURIComponent(pathname + search);

  // Avoid hydration flash on first render
  if (!hydrated) return <div className={className}>{children}</div>;

  if (user) return <div className={className}>{children}</div>;

  return (
    <div data-testid="protected-action" className={`relative ${className}`}>
      <div className="filter blur-sm select-none pointer-events-none" aria-hidden>{children}</div>
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl"
      >
        <div className="bg-white border-2 border-[#0A0A0A] rounded-2xl p-5 max-w-sm text-center shadow-[5px_5px_0_#FF6B00] mx-4">
          <div className="w-11 h-11 rounded-full bg-[#FF6B00]/15 flex items-center justify-center mx-auto mb-2">
            <Lock className="w-5 h-5 text-[#FF6B00]" />
          </div>
          <h3 className="font-display font-bold text-lg">Login to {label}</h3>
          <p className="text-xs text-[#4B5563] mt-1">Quick mobile OTP. We hide Sathi {noun} from bots and spam.</p>
          <Link
            to={`/login?returnTo=${returnTo}`}
            data-testid="protected-login-cta"
            className="mt-4 inline-flex items-center justify-center gap-2 bg-[#FF6B00] text-white font-bold px-5 py-2.5 rounded-full shadow-[0_4px_0_#0A0A0A]"
          >
            <Phone className="w-4 h-4" /> Verify mobile to unlock
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
