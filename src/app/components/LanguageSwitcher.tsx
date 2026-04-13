"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n/context";
import { languages, Language } from "@/lib/i18n/translations";

const languageFlags: Record<Language, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  ar: "🇸🇦",
  de: "🇩🇪",
  es: "🇪🇸",
};

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
        title="Change language"
      >
        <span className="text-base">{languageFlags[lang]}</span>
        <span className="hidden sm:inline">{languages[lang].name}</span>
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {(Object.keys(languages) as Language[]).map((code) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                code === lang ? "bg-indigo-50 text-indigo-700 font-medium" : "text-gray-700"
              }`}
            >
              <span className="text-base">{languageFlags[code]}</span>
              <span>{languages[code].name}</span>
              {code === lang && (
                <svg className="w-4 h-4 ml-auto text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
