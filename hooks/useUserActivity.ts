import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseUserActivityReturn {
  isUserActive: boolean;
  lastActiveTime: Date | null;
  inactiveDuration: number; // saniye cinsinden
}

/**
 * Kullanıcı aktivitesini takip eden hook
 * Uygulama aktif olduğunda kullanıcıyı aktif kabul eder
 * @param inactiveThreshold Saniye cinsinden, bu süre geçerse kullanıcı pasif kabul edilir (varsayılan: 5 dakika)
 */
export function useUserActivity(
  inactiveThreshold: number = 5 * 60
): UseUserActivityReturn {
  const [isUserActive, setIsUserActive] = useState(true);
  const [lastActiveTime, setLastActiveTime] = useState<Date | null>(new Date());
  const [inactiveDuration, setInactiveDuration] = useState(0);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActiveRef = useRef<Date>(new Date());

  useEffect(() => {
    // AppState değişikliklerini dinle
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Uygulama aktif hale geldi
        const now = new Date();
        lastActiveRef.current = now;
        setLastActiveTime(now);
        setIsUserActive(true);
        setInactiveDuration(0);
      } else if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // Uygulama arka plana geçti
        setIsUserActive(false);
      }
      appState.current = nextAppState;
    });

    // Periyodik kontrol - her saniye kontrol et
    intervalRef.current = setInterval(() => {
      if (appState.current === "active") {
        const now = new Date();
        const diff = Math.floor(
          (now.getTime() - lastActiveRef.current.getTime()) / 1000
        );

        if (diff >= inactiveThreshold) {
          setIsUserActive(false);
          setInactiveDuration(diff);
        } else {
          setIsUserActive(true);
          setInactiveDuration(0);
        }
      } else {
        // Arka plandayken süreyi hesapla
        const now = new Date();
        const diff = Math.floor(
          (now.getTime() - lastActiveRef.current.getTime()) / 1000
        );
        setInactiveDuration(diff);
        setIsUserActive(false);
      }
    }, 1000);

    return () => {
      subscription.remove();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [inactiveThreshold]);

  return {
    isUserActive,
    lastActiveTime,
    inactiveDuration,
  };
}

