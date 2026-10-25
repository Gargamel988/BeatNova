import { useState, useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus, Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { supabase } from "@/lib/supabase";

const STORAGE_KEYS = {
  ACTIVE_SECONDS: "@beatnova_active_usage_seconds",
  COMPLETED: "@beatnova_rating_completed",
  DISMISS_COUNT: "@beatnova_rating_dismiss_count",
  DISMISSED_AT: "@beatnova_rating_dismissed_at",
} as const;

const TARGET_ACTIVE_SECONDS = 300; // 5 dakika aktif kullanım
const DISMISS_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000; // 3 gün
const MAX_DISMISS_COUNT = 3;
const PLAY_STORE_URL = "market://details?id=com.gargamel9288.beatnova";
const PLAY_STORE_WEB_URL =
  "https://play.google.com/store/apps/details?id=com.gargamel9288.beatnova";

export type RatingStep = "ask" | "feedback" | "thankYou";

export function useRatingPrompt(isSafeToPrompt: boolean = true) {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState<RatingStep>("ask");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeSecondsRef = useRef(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const isLoadedRef = useRef(false);
  const isCompletedRef = useRef(false);
  const dismissCountRef = useRef(0);
  const dismissedAtRef = useRef<number | null>(null);

  // 1. AsyncStorage'dan mevcut kullanım istatistiklerini yükle
  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [storedSecs, storedCompleted, storedCount, storedDismissedAt] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SECONDS),
            AsyncStorage.getItem(STORAGE_KEYS.COMPLETED),
            AsyncStorage.getItem(STORAGE_KEYS.DISMISS_COUNT),
            AsyncStorage.getItem(STORAGE_KEYS.DISMISSED_AT),
          ]);

        if (!isMounted) return;

        activeSecondsRef.current = storedSecs ? parseInt(storedSecs, 10) || 0 : 0;
        isCompletedRef.current = storedCompleted === "true";
        dismissCountRef.current = storedCount ? parseInt(storedCount, 10) || 0 : 0;
        dismissedAtRef.current = storedDismissedAt
          ? parseInt(storedDismissedAt, 10) || null
          : null;
        isLoadedRef.current = true;
      } catch {
        isLoadedRef.current = true;
      }
    }

    loadStats();

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Aktif kullanım süresini saniye bazlı say ve periyodik kaydet
  useEffect(() => {
    const timer = setInterval(() => {
      if (appStateRef.current === "active" && !isCompletedRef.current) {
        activeSecondsRef.current += 1;

        // Her 15 saniyede bir AsyncStorage'a senkronize et
        if (activeSecondsRef.current % 15 === 0) {
          AsyncStorage.setItem(
            STORAGE_KEYS.ACTIVE_SECONDS,
            String(activeSecondsRef.current)
          ).catch(() => {});
        }

        // Koşullar sağlandıysa ve modal henüz açık değilse tetikle
        if (
          !isVisible &&
          isSafeToPrompt &&
          isLoadedRef.current &&
          !isCompletedRef.current &&
          activeSecondsRef.current >= TARGET_ACTIVE_SECONDS
        ) {
          // 3 gün ve en fazla 3 kez kontrolü
          const now = Date.now();
          const isEligibleAfterDismiss =
            !dismissedAtRef.current ||
            now - dismissedAtRef.current >= DISMISS_COOLDOWN_MS;

          if (dismissCountRef.current < MAX_DISMISS_COUNT && isEligibleAfterDismiss) {
            setStep("ask");
            setIsVisible(true);
          }
        }
      }
    }, 1000);

    const subscription = AppState.addEventListener(
      "change",
      (nextState: AppStateStatus) => {
        if (
          appStateRef.current === "active" &&
          nextState.match(/inactive|background/)
        ) {
          // Arka plana geçerken son saniyeyi kaydet
          AsyncStorage.setItem(
            STORAGE_KEYS.ACTIVE_SECONDS,
            String(activeSecondsRef.current)
          ).catch(() => {});
        }
        appStateRef.current = nextState;
      }
    );

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [isVisible, isSafeToPrompt]);

  // "Evet" cevabı: Google Play Store Review penceresini aç
  const handleAnswerYes = useCallback(async () => {
    try {
      isCompletedRef.current = true;
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, "true");

      const hasAction = await StoreReview.hasAction();
      const isAvailable = await StoreReview.isAvailableAsync();

      if (hasAction && isAvailable) {
        await StoreReview.requestReview();
      } else {
        // In-app review desteklenmiyorsa mağaza sayfasına yönlendir
        const canOpen = await Linking.canOpenURL(PLAY_STORE_URL).catch(() => false);
        if (canOpen && Platform.OS === "android") {
          await Linking.openURL(PLAY_STORE_URL);
        } else {
          await Linking.openURL(PLAY_STORE_WEB_URL);
        }
      }
    } catch {
      // Fallback mağaza web url
      Linking.openURL(PLAY_STORE_WEB_URL).catch(() => {});
    } finally {
      setIsVisible(false);
    }
  }, []);

  // "Hayır" cevabı: Geri bildirim adımına geç (Play Store'a yönlendirmez)
  const handleAnswerNo = useCallback(() => {
    setStep("feedback");
  }, []);

  // "Daha sonra" / "Kapat": 3 gün sonra tekrar sor, en fazla 3 kez
  const handleDismissLater = useCallback(async () => {
    try {
      const newCount = dismissCountRef.current + 1;
      dismissCountRef.current = newCount;
      const now = Date.now();
      dismissedAtRef.current = now;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.DISMISS_COUNT, String(newCount)),
        AsyncStorage.setItem(STORAGE_KEYS.DISMISSED_AT, String(now)),
      ]);

      // 3 kez kapatıldıysa bir daha asla sorma
      if (newCount >= MAX_DISMISS_COUNT) {
        isCompletedRef.current = true;
        await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, "true");
      }
    } catch {
      // Ignore storage error
    } finally {
      setIsVisible(false);
    }
  }, []);

  // Geri bildirimi Supabase'e kaydet veya logla
  const handleSubmitFeedback = useCallback(async (feedbackText: string) => {
    const trimmed = feedbackText.trim();
    if (!trimmed) {
      setIsVisible(false);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Supabase feedback tablosuna eklemeyi dene
      try {
        const { data: userData } = await supabase.auth.getUser();
        await supabase.from("feedback").insert({
          user_id: userData?.user?.id ?? null,
          message: trimmed,
          platform: Platform.OS,
          created_at: new Date().toISOString(),
        });
      } catch {
        // Tablo henüz mevcut değilse veya ağ hatası varsa sessizce geç
      }

      // 2. Tamamlandı olarak işaretle (artık bir daha sorulmaz)
      isCompletedRef.current = true;
      await AsyncStorage.setItem(STORAGE_KEYS.COMPLETED, "true");

      setStep("thankYou");
      setTimeout(() => {
        setIsVisible(false);
      }, 2000);
    } catch {
      setIsVisible(false);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isVisible,
    step,
    isSubmitting,
    onAnswerYes: handleAnswerYes,
    onAnswerNo: handleAnswerNo,
    onDismissLater: handleDismissLater,
    onSubmitFeedback: handleSubmitFeedback,
    onClose: handleDismissLater,
  };
}
