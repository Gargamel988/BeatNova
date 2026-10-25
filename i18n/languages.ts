export type LangCode =
  | "tr"
  | "en"
  | "de"
  | "ar"
  | "id"
  | "fr"
  | "ja"
  | "ko"
  | "pt-BR"
  | "ru"
  | "es";

export interface LanguageMeta {
  nativeName: string;
  name: string;
  flag: string;
  rtl: boolean;
}

export const LANGUAGES: Record<LangCode, LanguageMeta> = {
  tr: { nativeName: "Türkçe", name: "Turkish", flag: "🇹🇷", rtl: false },
  en: { nativeName: "English", name: "English", flag: "🇬🇧", rtl: false },
  de: { nativeName: "Deutsch", name: "German", flag: "🇩🇪", rtl: false },
  ar: { nativeName: "العربية", name: "Arabic", flag: "🇸🇦", rtl: true },
  id: { nativeName: "Bahasa Indonesia", name: "Indonesian", flag: "🇮🇩", rtl: false },
  fr: { nativeName: "Français", name: "French", flag: "🇫🇷", rtl: false },
  ja: { nativeName: "日本語", name: "Japanese", flag: "🇯🇵", rtl: false },
  ko: { nativeName: "한국어", name: "Korean", flag: "🇰🇷", rtl: false },
  "pt-BR": { nativeName: "Português (Brasil)", name: "Portuguese", flag: "🇧🇷", rtl: false },
  ru: { nativeName: "Русский", name: "Russian", flag: "🇷🇺", rtl: false },
  es: { nativeName: "Español", name: "Spanish", flag: "🇪🇸", rtl: false },
};

export const FALLBACK_LANG: LangCode = "en";
