import { Tabs } from "expo-router";
import { Ionicons , MaterialIcons} from "@expo/vector-icons";
import { useColor } from "@/hooks/useColor";
import React from "react";
import { useResponsive } from "@/hooks/useResponsive";

export default function TabLayout() {
  const tabIconDefault = useColor("tabIconDefault");
  const tabIconSelected = useColor("tabIconSelected");
  const background = useColor("background");
  const { hp, wp } = useResponsive();
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
          tabBarInactiveTintColor: tabIconDefault,
          tabBarActiveTintColor: tabIconSelected,
          tabBarStyle: {
            backgroundColor: background,
            paddingHorizontal: wp(2),
            paddingVertical: hp(1),
          },
          animation: 'shift',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="songs"
        options={{
          title: "Şarkılar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="musical-notes" color={color} size={size} />
          ),
        }}
      />
	
      <Tabs.Screen
        name="MusicAssistant"
        options={{
          title: "Müzik Asistanı",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="auto-awesome" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="PlayList"
        options={{
          title: "Oynatma Listesi",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ayarlar",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings" color={color} size={size} />
          ),
          }}
        />
      </Tabs>
  );
}
