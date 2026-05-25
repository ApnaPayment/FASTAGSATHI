import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, setToken, clearToken, getToken } from "@/lib/api";
import { track } from "@/lib/analytics";

const AuthContext = createContext(null);
const USER_KEY = "apnafastag.user";

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      if (raw && getToken()) setUser(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  const _saveUser = useCallback((u, token) => {
    if (token) setToken(token);
    const obj = { phone: u.phone, name: u.name, email: u.email, id: u.id, loggedInAt: Date.now() };
    localStorage.setItem(USER_KEY, JSON.stringify(obj));
    setUser(obj);
  }, []);

  const requestOtp = useCallback(async (phone) => {
    track("otp_request", { phone_last4: phone.slice(-4) });
    try {
      await authApi.requestOtp(phone);
      return { ok: true };
    } catch {
      return { ok: true }; // proceed even if backend unreachable
    }
  }, []);

  const verifyOtp = useCallback(async (phone, otp) => {
    track("otp_verify_attempt", { phone_last4: phone.slice(-4) });
    if (!otp || otp.length !== 4 || !/^\d{4}$/.test(otp)) {
      return { ok: false, error: "Enter a 4-digit code." };
    }
    try {
      const res = await authApi.verifyOtp(phone, otp);
      const { token, user: u, is_new_user } = res.data;
      _saveUser(u, token);
      track("otp_verify_success", { phone_last4: phone.slice(-4) });
      return { ok: true, is_new_user: !!is_new_user };
    } catch (err) {
      track("otp_verify_failed");
      const msg = err?.response?.data?.detail || "Verification failed. Try again.";
      return { ok: false, error: msg };
    }
  }, [_saveUser]);

  const googleLogin = useCallback(async (credential) => {
    track("google_login_attempt");
    try {
      const res = await authApi.googleAuth(credential);
      const { token, user: u, is_new_user } = res.data;
      _saveUser(u, token);
      track("google_login_success");
      return { ok: true, is_new_user: !!is_new_user };
    } catch (err) {
      const msg = err?.response?.data?.detail || "Google login failed. Try again.";
      return { ok: false, error: msg };
    }
  }, [_saveUser]);

  const verifyPhone = useCallback(async (phone) => {
    try {
      await authApi.verifyPhone(phone);
      return { ok: true };
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not send OTP. Try again.";
      return { ok: false, error: msg };
    }
  }, []);

  const confirmPhone = useCallback(async (phone, otp) => {
    try {
      const res = await authApi.confirmPhone(phone, otp);
      const u = res.data;
      // Update stored user with confirmed phone
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || "{}");
      const updated = { ...stored, phone: u.phone };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
      return { ok: true };
    } catch (err) {
      const msg = err?.response?.data?.detail || "Verification failed. Try again.";
      return { ok: false, error: msg };
    }
  }, []);

  const updateProfile = useCallback(async ({ name, email }) => {
    try {
      const res = await authApi.updateMe({ name, email });
      const u = res.data;
      const updated = { ...JSON.parse(localStorage.getItem(USER_KEY) || "{}"), name: u.name, email: u.email };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      setUser(updated);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err?.response?.data?.detail || "Update failed." };
    }
  }, []);

  const logout = useCallback(() => {
    clearToken();
    localStorage.removeItem(USER_KEY);
    setUser(null);
    track("logout");
  }, []);

  return (
    <AuthContext.Provider value={{ user, hydrated, requestOtp, verifyOtp, googleLogin, verifyPhone, confirmPhone, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
