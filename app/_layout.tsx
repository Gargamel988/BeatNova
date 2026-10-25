import "@/i18n";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemeProvider } from "@/providers/theme-provider";
import * as NavigationBar from "expo-navigation-bar";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect, useMemo, useState } from "react";
import { Platform, View, Text, TouchableOpacity, Linking, Alert, BackHandler } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../global.css";
import { LinearGradient } from "expo-linear-gradient";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AudioPlayerProvider } from "@/providers/player-context";
import { PlaylistProvider } from "@/providers/playlist-context";
import GlobalMiniPlayer from "@/components/GlobalMiniPlayer";
import { supabase } from "@/lib/supabase";
import { ToastProvider } from "@/components/ui/toast";
import { ConfirmDialogProvider } from "@/components/ui/confirm-modal";
import { useColor } from "@/hooks/useColor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useResponsive } from "@/hooks/useResponsive";
import { AnimatedLogoSplash } from "@/components/AnimatedLogoSplash";
import { useRatingPrompt } from "@/hooks/useRatingPrompt";
import { RatingModal } from "@/components/feedback/RatingModal";
import { AdsProvider } from "@/providers/AdsProvider";
import * as MediaLibrary from "expo-media-library";
import { ShieldAlert } from "lucide-react-native";
import { useTranslation, I18nextProvider } from "react-i18next";
import i18n from "@/i18n";
import TrackPlayer from "@rntp/player";
import { PlaybackService } from "@/services/playbackService";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Arka plan müzik servisi (İstatistik ve background event'ler için)
// Fast Refresh sırasında tekrar tekrar çağrılmasını engelle
// @ts-ignore
if (!global.__TRACK_PLAYER_BG_REGISTERED__) {
  // @ts-ignore
  global.__TRACK_PLAYER_BG_REGISTERED__ = true;
  try {
    TrackPlayer.registerBackgroundEventHandler(() => PlaybackService);
  } catch (e) {
    console.warn("TrackPlayer background handler skipped (Expo Go):", e);
  }
}

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 dakika
      gcTime: 1000 * 60 * 30, // 30 dakika
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme() || "system";

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <ConfirmDialogProvider>
              <RootContent colorScheme={colorScheme} />
            </ConfirmDialogProvider>
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

type RootContentProps = {
  colorScheme: string;
};



function RootContent({ colorScheme }: RootContentProps) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const segments = useSegments();
  const { hp, wp, fontSize, radius } = useResponsive();
  const insets = useSafeAreaInsets();

  const requestMediaPermission = async () => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status === "granted") {
        setHasMediaPermission(true);
      } else {
        const res = await MediaLibrary.requestPermissionsAsync();
        setHasMediaPermission(res.status === "granted");
      }
    } catch (error) {
      console.error("Media permission check error:", error);
      setHasMediaPermission(false);
    }
  };


  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (isMounted) {
          setIsAuthenticated(!!session);
        }
      } catch (error) {
        console.error("Session check error:", error);
        if (isMounted) {
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      // Sadece oturum açma/kapama event'lerinde state güncelle.
      // TOKEN_REFRESHED, USER_UPDATED gibi event'ler gereksiz
      // yönlendirmeye neden olmaması için filtrelenir.
      if (
        event === 'SIGNED_IN' ||
        event === 'SIGNED_OUT' ||
        event === 'INITIAL_SESSION'
      ) {
        setIsAuthenticated(!!session);
        if (event !== 'INITIAL_SESSION') {
          // Yükleme bittikten sonra bu event'ler gelirse de loading'i kapat
          setIsLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Giriş yapılmamış ve drawer'dayız → login'e gönder
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Giriş yapılmış ve auth ekranındayız → ana sayfaya gönder
      router.replace("/");
    }
    // Diğer durumlar (isAuthenticated=true, inAuthGroup=false veya
    // isAuthenticated=false, inAuthGroup=true) → hiçbir şey yapma,
    // mevcut konumda kal.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isLoading]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync("light").catch(() => {});
      setBackgroundColorAsync("#000000").catch(() => {});
    }
  }, [colorScheme]);

  const start = useColor("authBackgroundGradientStart");
  const mid = useColor("authBackgroundGradientMid");
  const end = useColor("authBackgroundGradientEnd");
  const primaryColor = useColor("primary");

  const isTabsPage = segments[0] === "(tabs)";
  const isGalaxyPage = segments[0] === "galaxy";
  const isAuthPage = segments[0] === "(auth)";

  // Google Play Değerlendirme Akışı (5 dk aktif kullanım sonrası güvenli ekranda)
  const isSafeToPrompt = isAuthenticated && !isGalaxyPage && !isAuthPage && !isLoading;
  const ratingPrompt = useRatingPrompt(isSafeToPrompt);

  if (isLoading) {
    return (
      <AnimatedLogoSplash
        message={t("splash.preparing", {
          defaultValue: "BeatNova Hazırlanıyor...",
        })}
      />
    );
  }

  // Kullanıcı giriş yapmış ama müzik/medya izni verilmemişse izin isteme ekranı göster
  if (isAuthenticated && hasMediaPermission === false) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LinearGradient
          colors={[start, mid, end] as [string, string, string]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: wp(6),
          }}
        >
          <StatusBar style={colorScheme === "dark" ? "light" : "dark"} animated />
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              borderRadius: radius(16),
              padding: wp(6),
              alignItems: "center",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.15)",
              width: "100%",
              maxWidth: 400,
            }}
          >
            <View
              style={{
                width: wp(18),
                height: wp(18),
                borderRadius: wp(9),
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                justifyContent: "center",
                alignItems: "center",
                marginBottom: hp(2),
              }}
            >
              <ShieldAlert size={wp(9)} color="#ef4444" />
            </View>

            <Text
              style={{
                fontSize: fontSize(20),
                fontWeight: "bold",
                color: "#FFFFFF",
                textAlign: "center",
                marginBottom: hp(1),
              }}
            >
              {t("permission.title", "Müzik Erişimi İzni Gerekli")}
            </Text>

            <Text
              style={{
                fontSize: fontSize(14),
                color: "rgba(255, 255, 255, 0.7)",
                textAlign: "center",
                marginBottom: hp(3),
                lineHeight: fontSize(14) * 1.4,
              }}
            >
              {t(
                "permission.desc",
                "Cihazınızdaki şarkıları tarayabilmek ve oynatabilmek için medya / müzik kütüphanesine erişim izni vermeniz gerekmektedir."
              )}
            </Text>

            <TouchableOpacity
              onPress={requestMediaPermission}
              activeOpacity={0.8}
              style={{
                backgroundColor: primaryColor || "#3b82f6",
                paddingVertical: hp(1.5),
                paddingHorizontal: wp(6),
                borderRadius: radius(8),
                width: "100%",
                alignItems: "center",
                marginBottom: hp(1.5),
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: fontSize(15),
                  fontWeight: "600",
                }}
              >
                {t("permission.grantBtn", "İzin Ver")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openSettings()}
              activeOpacity={0.7}
              style={{
                paddingVertical: hp(1),
              }}
            >
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: fontSize(13),
                  textDecorationLine: "underline",
                }}
              >
                {t("permission.openSettings", "Cihaz Ayarlarını Aç")}
              </Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </GestureHandlerRootView>
    );
  }

  return (
    <ErrorBoundary>
      <AdsProvider>
        <AudioPlayerProvider>
          <PlaylistProvider>
            <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
              <LinearGradient
                colors={[start, mid, end] as [string, string, string]}
                start={{ x: 0, y: 1 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              >
                <StatusBar
                  style={colorScheme === "dark" ? "light" : "dark"}
                  animated
                />
                <Stack
                  screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: "transparent" },
                    animation: "fade",
                  }}
                >
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="favorite" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="statistic" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="theme" options={{ animation: "slide_from_right" }} />
                  <Stack.Screen name="galaxy" options={{ animation: "slide_from_bottom" }} />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                {isAuthenticated && !isGalaxyPage && (
                  <>
                    <GlobalMiniPlayer hasTabBar={isTabsPage} />
                  </>
                )}

                <RatingModal
                  visible={ratingPrompt.isVisible}
                  step={ratingPrompt.step}
                  isSubmitting={ratingPrompt.isSubmitting}
                  onAnswerYes={ratingPrompt.onAnswerYes}
                  onAnswerNo={ratingPrompt.onAnswerNo}
                  onDismissLater={ratingPrompt.onDismissLater}
                  onSubmitFeedback={ratingPrompt.onSubmitFeedback}
                  onClose={ratingPrompt.onClose}
                />
              </LinearGradient>
            </GestureHandlerRootView>
          </PlaylistProvider>
        </AudioPlayerProvider>
      </AdsProvider>
    </ErrorBoundary>
  );
}

