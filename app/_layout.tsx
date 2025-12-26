import { useColorScheme } from "@/hooks/useColorScheme";
import { ThemeProvider } from "@/providers/theme-provider";
import * as NavigationBar from "expo-navigation-bar";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { setBackgroundColorAsync } from "expo-system-ui";
import React, { useEffect, useMemo } from "react";
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
import { insertProfile} from "@/services/ProfilServices";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useResponsive } from "@/hooks/useResponsive";

SplashScreen.setOptions({
  duration: 200,
  fade: true,
});

export default function RootLayout() {
  const colorScheme = useColorScheme() || "system";
  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <ThemeProvider>
      <RootContent colorScheme={colorScheme} queryClient={queryClient} />
    </ThemeProvider>
  );
}

type RootContentProps = {
  colorScheme: string;
  queryClient: QueryClient;
};

function RootContent({ colorScheme, queryClient }: RootContentProps) {
  const segments = useSegments();
  const { hp } = useResponsive();
  const isDrawerPage = segments[0] === "(drawer)" && segments[1] === "(tabs)";  
  const bottomOffset = isDrawerPage ? hp(12.5) : 0;

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync(
        colorScheme === "light" ? "dark" : "light"
      );
    }
  }, [colorScheme]);

  useEffect(() => {
    setBackgroundColorAsync("#000000");
  }, []);


  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        // Profil kontrolü ve oluşturma
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          // Profil yoksa oluştur
          if (!profile && !profileError) {
            await insertProfile(session.user);
          }
        } catch (error) {
          console.error("Profil oluşturma hatası:", error);
          // Hata olsa bile devam et
        }

        router.replace("/(drawer)/(tabs)");
      } else if (event === "SIGNED_OUT" || !session) {
        router.replace("/(auth)/login");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        // Profil kontrolü ve oluşturma
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          // Profil yoksa oluştur
          if (!profile && !profileError) {
            await insertProfile(session.user);
          }
        } catch (error) {
          console.error("Profil oluşturma hatası:", error);
          // Hata olsa bile devam et
        }

        router.replace("/(drawer)/(tabs)");
      } else {
        router.replace("/(auth)/login");
      }
    };
    fetchSession();
  }, []);


  const start = useColor("authBackgroundGradientStart");
  const mid = useColor("authBackgroundGradientMid");
  const end = useColor("authBackgroundGradientEnd");

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
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
                    <GlobalMiniPlayer bottomOffset={bottomOffset} />
              </LinearGradient>
            </GestureHandlerRootView>
            </PlaylistProvider>
          </AudioPlayerProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
