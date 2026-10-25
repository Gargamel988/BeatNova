import { Tabs } from "expo-router";
import React from "react";
import FloatingTabBar from "@/components/FloatingTabBar";
import { useTranslation } from "react-i18next";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        animation: "shift",
      }}
    >
      <Tabs.Screen name="index" options={{ title: t("tabs.home", "Ana Sayfa") }} />
      <Tabs.Screen name="songs" options={{ title: t("tabs.songs", "Şarkılar") }} />
      <Tabs.Screen name="music-assistant" options={{ title: t("tabs.assistant", "Asistan") }} />
      <Tabs.Screen name="playlist" options={{ title: t("tabs.playlists", "Listeler") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings", "Ayarlar") }} />
    </Tabs>
  );
}