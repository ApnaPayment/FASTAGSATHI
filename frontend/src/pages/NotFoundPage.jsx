import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import SEO from "@/components/seo/SEO";
import { track } from "@/lib/analytics";

export default function NotFoundPage() {
  useEffect(() => { track("page_view", { page: "404", path: window.location.pathname }); }, []);
  return (
    <section className="min-h-screen pt-32 pb-20 px-6 flex items-center justify-center bg-[#F8F9FA]">
      <SEO title="404 — Page not found · ApnaFastag" description="Page not found." path="/404" noindex />
      <div className="text-center max-w-xl">
        <div className="font-display font-black text-9xl text-[#FF6B00] leading-none">404</div>
        <div className="road-divider opacity-40 my-6 max-w-xs mx-auto" />
        <h1 className="font-display font-black text-3xl md:text-4xl mt-4">Wrong lane.</h1>
        <p className="font-hindi text-lg text-[#4B5563] mt-2">यह route खाली है।</p>
        <p className="text-[#4B5563] mt-2">The page you're looking for has either moved, was never built, or you mistyped the URL.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="bg-[#FF6B00] text-white font-bold px-7 py-3.5 rounded-full shadow-[0_4px_0_#0A0A0A]">Back to home</Link>
          <Link to="/coverage" className="border-2 border-[#0A0A0A] font-bold px-7 py-3.5 rounded-full">Find your toll plaza</Link>
        </div>
      </div>
    </section>
  );
}
