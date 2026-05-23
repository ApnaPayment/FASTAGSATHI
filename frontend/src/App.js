import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import Layout from "@/components/layout/Layout";
import ScrollToTop from "@/components/layout/ScrollToTop";
import RedirectTo from "@/components/layout/RedirectTo";

import LandingPage from "@/components/landing/LandingPage";
import BuyFasTagPage from "@/pages/BuyFasTagPage";
import BuyFasTagOrderPage from "@/pages/BuyFasTagOrderPage";
import BuyFasTagTrackPage from "@/pages/BuyFasTagTrackPage";
import HowItWorksPage from "@/pages/HowItWorksPage";
import FeaturesPage from "@/pages/FeaturesPage";
import PricingPage from "@/pages/PricingPage";
import BecomeSathiPage from "@/pages/BecomeSathiPage";
import CoveragePage from "@/pages/CoveragePage";
import PlazaPage from "@/pages/PlazaPage";
import StatePage from "@/pages/StatePage";
import BankPage from "@/pages/BankPage";
import HighwayPage from "@/pages/HighwayPage";
import CityPage from "@/pages/CityPage";
import AboutPage from "@/pages/AboutPage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import HelpCenterPage from "@/pages/HelpCenterPage";
import HelpDirectoryPage from "@/pages/HelpDirectoryPage";
import HelpArticlePage from "@/pages/HelpArticlePage";
import ContactPage from "@/pages/ContactPage";
import CareersPage from "@/pages/CareersPage";
import PressPage from "@/pages/PressPage";
import LegalPage from "@/pages/LegalPage";
import BalanceCheckPage from "@/pages/tools/BalanceCheckPage";
import TollCalculatorPage from "@/pages/tools/TollCalculatorPage";
import DisputeTrackerPage from "@/pages/tools/DisputeTrackerPage";
import FasTagStatusPage from "@/pages/tools/FasTagStatusPage";
import FindSathiPage from "@/pages/FindSathiPage";
import LoginPage from "@/pages/LoginPage";
import SathiProfilePage from "@/pages/SathiProfilePage";
import MyJobsPage from "@/pages/MyJobsPage";
import SathiDashboardPage from "@/pages/SathiDashboardPage";
import AdminPage from "@/pages/AdminPage";
import NotFoundPage from "@/pages/NotFoundPage";

function App() {
  // Remove SSG pre-render immediately on mount so users never see unstyled flash
  React.useEffect(() => {
    const root = document.getElementById("root");
    if (root) root.removeAttribute("data-ssg");
    document.getElementById("ssg-hide")?.remove();
  }, []);

  return (
    <BrandingProvider>
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LandingPage />} />
            {/* Buy FASTag */}
            <Route path="buy-fastag" element={<BuyFasTagPage />} />
            <Route path="buy-fastag/order" element={<BuyFasTagOrderPage />} />
            <Route path="buy-fastag/track" element={<BuyFasTagTrackPage />} />
            <Route path="how-it-works" element={<HowItWorksPage />} />
            <Route path="features" element={<FeaturesPage />} />
            <Route path="pricing" element={<PricingPage />} />
            <Route path="become-a-sathi" element={<BecomeSathiPage />} />

            {/* Find a Sathi flow */}
            <Route path="find" element={<FindSathiPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="sathi/:slug" element={<SathiProfilePage />} />
            <Route path="my-jobs" element={<MyJobsPage />} />
            <Route path="dashboard" element={<SathiDashboardPage />} />

            {/* Coverage + programmatic SEO */}
            <Route path="coverage" element={<CoveragePage />} />
            <Route path="toll/:plazaSlug" element={<PlazaPage />} />
            <Route path="state/:stateSlug" element={<StatePage />} />
            <Route path="bank/:bankSlug" element={<BankPage />} />
            <Route path="highway/:highwaySlug" element={<HighwayPage />} />
            <Route path="city/:citySlug" element={<CityPage />} />

            {/* Content */}
            <Route path="about" element={<AboutPage />} />
            <Route path="blog" element={<BlogPage />} />
            <Route path="blog/:slug" element={<BlogPostPage />} />
            <Route path="help" element={<HelpDirectoryPage />} />
            <Route path="help/:slug" element={<HelpArticlePage />} />
            <Route path="contact" element={<ContactPage />} />
            <Route path="careers" element={<CareersPage />} />
            <Route path="press" element={<PressPage />} />

            {/* Tools */}
            <Route path="tools/fastag-balance-check" element={<BalanceCheckPage />} />
            <Route path="tools/fastag-status" element={<FasTagStatusPage />} />
            <Route path="tools/toll-calculator" element={<TollCalculatorPage />} />
            <Route path="tools/dispute-tracker" element={<DisputeTrackerPage />} />

            {/* Legal */}
            <Route path="privacy" element={<LegalPage kind="privacy" />} />
            <Route path="terms" element={<LegalPage kind="terms" />} />
            <Route path="refund-policy" element={<LegalPage kind="refund" />} />

            {/* Friendly redirects */}
            <Route path="home" element={<RedirectTo to="/" />} />
            <Route path="sathi" element={<RedirectTo to="/become-a-sathi" />} />
            <Route path="partner" element={<RedirectTo to="/become-a-sathi" />} />
            <Route path="signup" element={<RedirectTo to="/login" />} />
            <Route path="find-sathi-near-me" element={<RedirectTo to="/find" />} />
            <Route path="find-a-sathi" element={<RedirectTo to="/find" />} />
            <Route path="toll-rates" element={<RedirectTo to="/tools/toll-calculator" />} />
            <Route path="fastag-balance" element={<RedirectTo to="/tools/fastag-balance-check" />} />
            <Route path="dispute" element={<RedirectTo to="/tools/dispute-tracker" />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>

          {/* Standalone — no site header/footer */}
          <Route path="admin" element={<AdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </BrandingProvider>
  );
}

export default App;
