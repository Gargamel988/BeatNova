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
import { useColor } from "@/hooks/useColor";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useResponsive } from "@/hooks/useResponsive";
import { AnimatedLogoSplash } from "@/components/AnimatedLogoSplash";
import { AdsProvider } from "@/providers/AdsProvider";
import * as MediaLibrary from "expo-media-library";
import { ShieldAlert } from "lucide-react-native";
import TrackPlayer from "@rntp/player";
import { PlaybackService } from "@/services/playbackService";

// Arka plan müzik servisi (İstatistik ve background event'ler için)
TrackPlayer.registerBackgroundEventHandler(() => PlaybackService);

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme() || "system";
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <RootContent colorScheme={colorScheme} />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

type RootContentProps = {
  colorScheme: string;
};



function RootContent({ colorScheme }: RootContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasMediaPermission, setHasMediaPermission] = useState<boolean | null>(null);

  const segments = useSegments();
  const { hp, wp, fontSize, radius } = useResponsive();

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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (isMounted) {
        setIsAuthenticated(!!session);
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
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(drawer)/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        colorScheme === "light" ? "dark" : "light"
      );
      setBackgroundColorAsync("#000000");
    }
  }, [colorScheme]);

  const start = useColor("authBackgroundGradientStart");
  const mid = useColor("authBackgroundGradientMid");
  const end = useColor("authBackgroundGradientEnd");
  const primaryColor = useColor("primary");

  const isDrawerPage = segments[0] === "(drawer)" && segments[1] === "(tabs)";
  const bottomOffset = isDrawerPage ? hp(12.5) : 0;

  if (isLoading) {
    return <AnimatedLogoSplash message="MüzikBox Hazırlanıyor..." />;
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
              Müzik Erişimi İzni Gerekli
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
              Cihazınızdaki şarkıları tarayabilmek ve oynatabilmek için medya / müzik kütüphanesine erişim izni vermeniz gerekmektedir.
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
                İzin Ver
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
                Cihaz Ayarlarını Aç
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
            <GestureHandlerRootView style={{ flex: 1 }}>
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
                  <Stack.Screen name="(drawer)" />
                  <Stack.Screen name="(auth)" />
                  <Stack.Screen name="+not-found" />
                </Stack>
                {isAuthenticated && (
                  <>
                    <GlobalMiniPlayer bottomOffset={bottomOffset} />
                  </>
                )}
              </LinearGradient>
            </GestureHandlerRootView>
          </PlaylistProvider>
        </AudioPlayerProvider>
      </AdsProvider>
    </ErrorBoundary>
  );
}

