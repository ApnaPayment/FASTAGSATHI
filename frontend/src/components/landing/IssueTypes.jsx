import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ShieldX, Zap, FileText, ReceiptText } from "lucide-react";

const ISSUES = [
  {
    icon: ShieldX,
    color: "#DC2626",
    accent: "#FEF2F2",
    tag: "Blacklist",
    h3: "FASTag blacklisted at toll?",
    body: "A blacklisted FASTag triggers double penalty at every plaza until cleared. A Sathi files the removal request with your bank and NHAI directly from the toll — average clearance in 48 hours, no branch visit.",
    cta: "Remove blacklist →",
    to: "/find",
    testId: "issue-blacklist",
  },
  {
    icon: Zap,
    color: "#F59E0B",
    accent: "#FFFBEB",
    tag: "Recharge Failure",
    h3: "Recharge failed or balance stuck?",
    body: "Low balance or a failed top-up causes manual lane queues and double deductions. Sathis verify the payment gateway, clear the NPCI hold, and force-sync your wallet — while you wait in the car.",
    cta: "Fix recharge issue →",
    to: "/find",
    testId: "issue-recharge",
  },
  {
    icon: FileText,
    color: "#059669",
    accent: "#F0FDF4",
    tag: "KYC & RC Mismatch",
    h3: "KYC incomplete or RC mismatch flagged?",
    body: "Banks reject FASTag transactions when Aadhaar, RC number, or vehicle class data is mismatched. Sathis carry Aadhaar-linked re-KYC kits and update your record on-site — no queue, no paperwork.",
    cta: "Update KYC →",
    to: "/find",
    testId: "issue-kyc",
  },
  {
    icon: ReceiptText,
    color: "#FF6B00",
    accent: "#FFF7ED",
    tag: "Dispute & Refund",
    h3: "Mischarge dispute or double deduction?",
    body: "NHAI's dispute window closes 30 days after the wrong deduction. A Sathi files your claim with receipt photo-evidence in minutes, then tracks the refund status until the money hits your bank.",
    cta: "Track my dispute →",
    to: "/tools/dispute-tracker",
    testId: "issue-dispute",
  },
];

export default function IssueTypes() {
  return (
    <section
      id="issues"
      data-testid="issues-section"
      className="py-24 md:py-32 bg-[#0A0A0A] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-10 lg:px-12">
        {/* Section heading — keyword-rich H2 */}
        <div className="max-w-3xl mb-14">
          <span className="inline-block bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] px-3 py-1 text-[11px] font-black uppercase tracking-widest rounded mb-5">
            Every FASTag crisis, covered
          </span>
          <h2 className="font-display font-black text-4xl md:text-6xl tracking-tight text-white leading-[0.95]">
            FASTag blacklisted,{" "}
            <span className="text-[#FFD60A]">recharge failed,</span>
            <br />
            KYC stuck, dispute pending?
          </h2>
          <p className="mt-5 text-lg text-white/60 max-w-2xl">
            These four problems strand thousands of Indian drivers at toll plazas every day.
            A verified Sathi resolves each one on the spot — usually under 8 minutes.
          </p>
        </div>

        {/* Issue cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {ISSUES.map((issue, i) => (
            <motion.div
              key={issue.tag}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              data-testid={issue.testId}
              className="group flex flex-col bg-white/5 border border-white/10 rounded-3xl p-6 hover:bg-white/10 hover:border-white/20 transition-all"
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 flex-shrink-0"
                style={{ backgroundColor: `${issue.color}20` }}
              >
                <issue.icon className="w-6 h-6" style={{ color: issue.color }} />
              </div>

              {/* Tag */}
              <span
                className="text-[10px] font-black uppercase tracking-widest mb-2"
                style={{ color: issue.color }}
              >
                {issue.tag}
              </span>

              {/* Keyword H3 */}
              <h3 className="font-display font-bold text-xl text-white leading-snug mb-3">
                {issue.h3}
              </h3>

              <p className="text-sm text-white/55 leading-relaxed flex-1">{issue.body}</p>

              <Link
                to={issue.to}
                className="mt-5 inline-flex items-center text-sm font-bold transition-colors"
                style={{ color: issue.color }}
              >
                {issue.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
