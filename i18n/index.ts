import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { I18nManager } from "react-native";

// React Native'de Node.js 'events' modülü yok – minimal inline emitter
type Listener = (...args: unknown[]) => void;
const _listeners: Record<string, Listener[]> = {};
export const rtlEventEmitter = {
  on(event: string, fn: Listener) {
    (_listeners[event] ??= []).push(fn);
  },
  off(event: string, fn: Listener) {
    _listeners[event] = (_listeners[event] ?? []).filter((l) => l !== fn);
  },
  emit(event: string, ...args: unknown[]) {
    (_listeners[event] ?? []).forEach((l) => l(...args));
  },
};
export const RTL_CHANGE_EVENT = "rtl_direction_changed";

import tr from "./tr";
import en from "./en";
import ar from "./ar";
import de from "./de";
import fr from "./fr";
import es from "./es";
import pt from "./pt";
import ru from "./ru";
import ja from "./ja";
import ko from "./ko";
import id from "./id";

export const LANGUAGE_STORAGE_KEY = "@beatnova_language";

export type SupportedLanguage =
  | "tr"
  | "en"
  | "ar"
  | "de"
  | "fr"
  | "es"
  | "pt"
  | "ru"
  | "ja"
  | "ko"
  | "id";

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  isRTL?: boolean;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "tr", name: "Turkish", nativeName: "Türkçe", flag: "🇹🇷" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ar", name: "Arabic", nativeName: "العربية", flag: "🇸🇦", isRTL: true },
  { code: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪" },
  { code: "fr", name: "French", nativeName: "Français", flag: "🇫🇷" },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", nativeName: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "Korean", nativeName: "한국어", flag: "🇰🇷" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia", flag: "🇮🇩" },
];

import type { TranslationDictionary } from "@/type/i18n";

export const resources: Record<SupportedLanguage, { translation: TranslationDictionary }> = {
  tr: { translation: tr },
  en: { translation: en },
  ar: { translation: ar },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  ko: { translation: ko },
  id: { translation: id },
};

/**
 * Cihazın sistem dilini kontrol eder (asla konum/GPS kullanmaz).
 * Desteklenen 11 dilden biriyse onu döner, değilse 'tr' varsayılan döner.
 */
export function getDeviceSystemLanguage(): SupportedLanguage {
  try {
    const locales = Localization.getLocales();
    const systemCode = locales?.[0]?.languageCode?.toLowerCase() as SupportedLanguage | undefined;
    if (systemCode && SUPPORTED_LANGUAGES.some((lang) => lang.code === systemCode)) {
      return systemCode;
    }
  } catch {
    // Ignore error
  }
  return "tr";
}

/**
 * Uygulamanın dilini dinamik olarak değiştirir ve hafızaya kaydeder.
 * i18next sayesinde uygulama yeniden başlatılmadan arayüz anında güncellenir.
 */
export async function changeAppLanguage(lang: SupportedLanguage): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  await i18n.changeLanguage(lang);

  const isRtlLang = lang === "ar";
  if (I18nManager.isRTL !== isRtlLang) {
    I18nManager.allowRTL(isRtlLang);
    I18nManager.forceRTL(isRtlLang);
  }
}

// i18next başlatma (senkron varsayılan ile)
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    resources,
    lng: "tr",
    fallbackLng: "tr",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  // Kaydedilmiş dili arka planda yükle
  AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      i18n.changeLanguage(saved);
      const isRtl = saved === "ar";
      if (I18nManager.isRTL !== isRtl) {
        I18nManager.allowRTL(isRtl);
        I18nManager.forceRTL(isRtl);
      }
    } else {
      const systemLang = getDeviceSystemLanguage();
      i18n.changeLanguage(systemLang);
      const isRtl = systemLang === "ar";
      if (I18nManager.isRTL !== isRtl) {
        I18nManager.allowRTL(isRtl);
        I18nManager.forceRTL(isRtl);
      }
    }
  }).catch(() => {});
}

export default i18n;
