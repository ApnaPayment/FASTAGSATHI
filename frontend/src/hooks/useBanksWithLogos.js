import { useState, useEffect } from "react";
import { BANKS as SEED_BANKS } from "@/data/seed";
import { banksApi } from "@/lib/api";

/**
 * Returns bank list merged from seed data + DB uploaded logos.
 * Falls back silently to seed data if the API call fails.
 * Safe to use on public pages — no admin auth required.
 */
export function useBanksWithLogos() {
  const [banks, setBanks] = useState(SEED_BANKS);

  useEffect(() => {
    let cancelled = false;
    banksApi.list()
      .then((res) => {
        if (cancelled) return;
        const dbBanks = res.data?.banks || [];
        if (!dbBanks.length) return;
        const dbMap = Object.fromEntries(dbBanks.map((b) => [b.slug, b]));
        // Seed order preserved; DB fields (especially `logo`) override seed
        setBanks(SEED_BANKS.map((s) => ({ ...s, ...(dbMap[s.slug] || {}) })));
      })
      .catch(() => { /* silently use seed fallback */ });
    return () => { cancelled = true; };
  }, []);

  return banks;
}
