import { translations as en } from "./en";
import { translations as fr } from "./fr";
import { translations as ar } from "./ar";
import { translations as de } from "./de";
import { translations as es } from "./es";

export const languages = {
  en: { name: "English", dir: "ltr", translations: en },
  fr: { name: "Français", dir: "ltr", translations: fr },
  ar: { name: "العربية", dir: "rtl", translations: ar },
  de: { name: "Deutsch", dir: "ltr", translations: de },
  es: { name: "Español", dir: "ltr", translations: es },
} as const;

export type Language = keyof typeof languages;
export type TranslationKeys = typeof en;
