import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemeProvider } from "@/providers/theme-provider";
import * as NavigationBar from "expo-navigation-bar";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect, useMemo, useState } from "react";
import { Platform } from "react-native";
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
import { LoadingState } from "@/components/ui/loading-state";


SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme() || "system";
  const queryClient = useMemo(() => new QueryClient(), []);
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

  const segments = useSegments();
  const { hp } = useResponsive();


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
  }, [isAuthenticated, segments, isLoading]);

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

  const isDrawerPage = segments[0] === "(drawer)" && segments[1] === "(tabs)";
  const bottomOffset = isDrawerPage ? hp(12.5) : 0;

  if (isLoading) {
    return (
      <LoadingState
        size="large"
        message="Giriş yapılıyor..."
        fullScreen={true}
      />
    );
  }

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
