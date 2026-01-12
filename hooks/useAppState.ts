import { useEffect, useState, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";

interface UseAppStateReturn {
  appState: AppStateStatus;
  isActive: boolean;
  isBackground: boolean;
  isInactive: boolean;
}

/**
 * Uygulama durumunu (foreground/background/inactive) takip eden hook
 * @returns {UseAppStateReturn} Uygulama durumu bilgileri
 */
export function useAppState(): UseAppStateReturn {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      appStateRef.current = nextAppState;
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return {
    appState,
    isActive: appState === "active",
    isBackground: appState === "background",
    isInactive: appState === "inactive",
  };
}

/**
 * Uygulama aktif olduğunda callback çalıştıran hook
 * @param callback Uygulama aktif olduğunda çalışacak fonksiyon
 */
export function useAppStateActive(callback: () => void) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        // Uygulama arka plandan aktif hale geldi
        callback();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
}

/**
 * Uygulama arka plana geçtiğinde callback çalıştıran hook
 * @param callback Uygulama arka plana geçtiğinde çalışacak fonksiyon
 */
export function useAppStateBackground(callback: () => void) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        // Uygulama arka plana geçti
		console.log("Uygulama arka plana geçti");
        callback();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [callback]);
}

