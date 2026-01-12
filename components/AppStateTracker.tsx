import { useCallback, useEffect } from "react";
import { useProfile } from "@/hooks/useProfil";
import { useAppStateActive, useAppStateBackground } from "@/hooks/useAppState";
import { useUserActivity } from "@/hooks/useUserActivity";


export function AppStateTracker() {
  const { mutateUpdateActiveStatus } = useProfile();
  const { isUserActive } = useUserActivity();
  const handleActive = useCallback(() => {
    if (isUserActive && mutateUpdateActiveStatus) {
      mutateUpdateActiveStatus.mutate(true);
    }
  }, [isUserActive, mutateUpdateActiveStatus]);

  const handleBackground = useCallback(() => {
    if (isUserActive && mutateUpdateActiveStatus) {
      mutateUpdateActiveStatus.mutate(false);
    }
  }, [isUserActive, mutateUpdateActiveStatus]);

  useAppStateActive(handleActive);
  useAppStateBackground(handleBackground);

  // İlk mount'ta veya authentication durumu değiştiğinde aktif olarak işaretle
  useEffect(() => {
    if (isUserActive && mutateUpdateActiveStatus) {
      mutateUpdateActiveStatus.mutate(true);
    }
  }, [isUserActive, mutateUpdateActiveStatus]);

  // Bu component sadece side effect'ler için kullanılıyor, render etmiyor
  return null;
}

