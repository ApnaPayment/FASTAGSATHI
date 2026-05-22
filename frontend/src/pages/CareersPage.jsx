import React, { useEffect } from "react";
import PageHero from "@/components/layout/PageHero";
import PageCTA from "@/components/layout/PageCTA";
import SEO from "@/components/seo/SEO";
import { MapPin, ArrowRight, IndianRupee } from "lucide-react";
import { track } from "@/lib/analytics";

const JOBS = [
  { title: "Senior Backend Engineer (Firestore, Node)", loc: "Pune / Remote", type: "Full-time", salary: "₹25-45L" },
  { title: "iOS Engineer (Swift)", loc: "Pune / Remote", type: "Full-time", salary: "₹20-38L" },
  { title: "Sathi Network Lead — Maharashtra", loc: "Pune (on-ground)", type: "Full-time", salary: "₹12-18L" },
  { title: "Growth Marketer — SEO & Programmatic", loc: "Remote (IN)", type: "Full-time", salary: "₹18-28L" },
  { title: "Customer Success — Tamil", loc: "Chennai / Remote", type: "Full-time", salary: "₹8-14L" },
  { title: "Design Intern (Web + Mobile)", loc: "Pune", type: "6-month internship", salary: "₹60k/mo stipend" },
];

export default function CareersPage() {
  useEffect(() => { track("page_view", { page: "careers" }); }, []);
  return (
    <>
      <SEO
        title="Careers — build the rescue layer for India's roads"
        description="6 open roles: backend, iOS, growth, Sathi network lead, customer success, design intern. Hybrid + remote welcome. Pune-based."
        path="/careers"
        keywords="apnafastag careers, fastag startup jobs, pune startup jobs, growth marketer india"
      />
      <PageHero
        eyebrow="Careers"
        title={<>Build the rescue layer for <span className="text-[#FF6B00]">India's roads.</span></>}
        sub="Small team, big mission. We hire for ownership over pedigree. Hybrid + remote welcome."
        breadcrumb={[{ label: "Careers" }]}
      />

      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-12 space-y-4">
          {JOBS.map((j) => (
            <a key={j.title} href={`mailto:hiring@apnafastag.in?subject=Applying — ${encodeURIComponent(j.title)}`} className="group flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#F8F9FA] border-2 border-[#0A0A0A] rounded-2xl p-6 hover:bg-[#0A0A0A] hover:text-white transition-colors">
              <div>
                <h3 className="font-display font-bold text-xl">{j.title}</h3>
                <div className="flex flex-wrap gap-4 text-sm text-[#4B5563] group-hover:text-white/60 mt-2">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.loc}</span>
                  <span>{j.type}</span>
                  <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{j.salary}</span>
                </div>
              </div>
              <span className="flex items-center gap-2 font-bold text-[#FF6B00]">Apply <ArrowRight className="w-4 h-4" /></span>
            </a>
          ))}
        </div>
      </section>

      <PageCTA primary="See all roles" secondary="Refer a friend" primaryTo="/careers" secondaryTo="/contact?topic=referral" />
    </>
  );
}
