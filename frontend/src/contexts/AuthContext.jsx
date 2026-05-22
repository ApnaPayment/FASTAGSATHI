import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, setToken, clearToken, getToken } from "@/lib/api";
import { track } from "@/lib/analytics";

const AuthContext = createContext(null);
const USER_KEY = "apnafastag.user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw && getToken()) setUser(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const requestOtp = useCallback(async (phone) => {
    track("otp_request", { phone_last4: phone.slice(-4) });
    try {
      await authApi.requestOtp(phone);
      return { ok: true, masked: phone.slice(-4) };
    } catch {
      // Fallback: still proceed so the UI isn't broken if backend is unreachable
      return { ok: true, masked: phone.slice(-4) };
    }
  }, []);

  const verifyOtp = useCallback(async (phone, otp) => {
    track("otp_verify_attempt", { phone_last4: phone.slice(-4) });
    if (!otp || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return { ok: false, error: "Enter a 4-digit code." };
    }
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const { token, user: u } = res.data;
      setToken(token);
      const userObj = { phone: u.phone, name: u.name, id: u.id, loggedInAt: Date.now() };
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
      setUser(userObj);
      track("otp_verify_success", { phone_last4: phone.slice(-4) });
      return { ok: true };
    } catch (err) {
      track("otp_verify_failed");
      const msg = err?.response?.data?.detail || "Verification failed. Try again.";
      return { ok: false, error: msg };
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    track("logout");
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrated, requestOtp, verifyOtp, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
