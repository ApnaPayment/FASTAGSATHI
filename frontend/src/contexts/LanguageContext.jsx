import React, { createContext, useContext, useState, useCallback } from "react";
import translations from "@/lib/translations";

const LANG_KEY = "apnafastag.lang";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(
    () => localStorage.getItem(LANG_KEY) || "en"
  );

  const setLang = useCallback((code) => {
    localStorage.setItem(LANG_KEY, code);
    setLangState(code);
  }, []);

  // t("key") — looks up in selected language, falls back to English
  const t = useCallback(
    (key) => {
      const dict = translations[lang] || translations.en;
      return dict[key] ?? translations.en[key] ?? key;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be inside LanguageProvider");
  return ctx;
}
