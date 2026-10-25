import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LangCode,
  LANGUAGES,
  FALLBACK_LANG,
} from "./languages";
import { rtlEventEmitter, RTL_CHANGE_EVENT, LANGUAGE_STORAGE_KEY } from "./index";

export function useLanguage() {
  const { i18n, t } = useTranslation();

  const currentLanguage = (i18n.language in LANGUAGES
    ? (i18n.language as LangCode)
    : FALLBACK_LANG);

  const isRTL = LANGUAGES[currentLanguage]?.rtl ?? false;

  const changeLanguage = useCallback(
    async (code: LangCode) => {
      try {
        const targetMeta = LANGUAGES[code];
        if (!targetMeta) return;

        await i18n.changeLanguage(code);
        await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);

        const shouldBeRTL = targetMeta.rtl;
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
          rtlEventEmitter.emit(RTL_CHANGE_EVENT, shouldBeRTL);
        }
      } catch (err: unknown) {
        console.error("[useLanguage] Dil değiştirilirken hata oluştu:", err);
      }
    },
    [i18n]
  );

  return {
    currentLanguage,
    isRTL,
    languages: LANGUAGES,
    changeLanguage,
    t,
  };
}
