import { Tabs } from "expo-router";
import React from "react";
import FloatingTabBar from "@/components/FloatingTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: "transparent" },
        animation: "shift",
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Ana Sayfa" }} />
      <Tabs.Screen name="songs" options={{ title: "Şarkılar" }} />
      <Tabs.Screen name="MusicAssistant" options={{ title: "Asistan" }} />
      <Tabs.Screen name="PlayList" options={{ title: "Listeler" }} />
      <Tabs.Screen name="settings" options={{ title: "Ayarlar" }} />
    </Tabs>
  );
}