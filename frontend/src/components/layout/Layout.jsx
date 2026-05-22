import React from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import ActionHub from "@/components/landing/ActionHub";

export default function Layout() {
  return (
    <div data-testid="site-shell" className="min-h-screen bg-[#F8F9FA] text-[#0A0A0A] antialiased flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ActionHub />
    </div>
  );
}
