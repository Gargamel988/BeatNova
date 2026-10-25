import type tr from "@/i18n/tr";

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

/**
 * Ana referans çeviri şeması (tr.ts kaynaklı anahtar ağacı)
 */
export type TranslationSchema = typeof tr;

/**
 * Çeviri anahtarlarını birebir korurken metin değerlerinin farklı dillerde
 * string olmasına olanak tanıyan genel tip haritası.
 */
export type StringMap<T> = {
  [K in keyof T]?: T[K] extends object ? StringMap<T[K]> : string;
};

/**
 * Desteklenen tüm dil dosyalarının (en, ar, de vs.) TR anahtar yapısına
 * uymasını zorunlu kılan güvenli çeviri sözlüğü tipi.
 */
export type TranslationDictionary = StringMap<TranslationSchema>;

/**
 * Nokta notasyonuyla çeviri anahtarları üretimi (örn: "auth.login", "playlist.create")
 */
type Leaves<T, D extends number = 5> = [D] extends [never]
  ? never
  : T extends object
  ? { [K in keyof T]-?: Join<K, Leaves<T[K], Prev[D]>> }[keyof T]
  : "";

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${"" extends P ? "" : "."}${P}`
    : never
  : never;

type Prev = [never, 0, 1, 2, 3, 4, 5];

export type TranslationKey = Leaves<TranslationSchema>;
