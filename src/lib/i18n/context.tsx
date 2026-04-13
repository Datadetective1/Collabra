"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { languages, Language, TranslationKeys } from "./translations";

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: TranslationKeys;
  dir: "ltr" | "rtl";
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: languages.en.translations,
  dir: "ltr",
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("collabra-lang") as Language;
    if (saved && languages[saved]) {
      setLangState(saved);
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language.split("-")[0];
      if (browserLang in languages) {
        setLangState(browserLang as Language);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("collabra-lang", newLang);
  };

  const config = languages[lang];
  const dir = config.dir as "ltr" | "rtl";

  // Update document direction for RTL support
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t: config.translations, dir }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
