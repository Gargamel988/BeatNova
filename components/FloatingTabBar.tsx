import React, { useEffect, useState } from "react";
import { View, Text, Pressable, Keyboard, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useColor } from "@/hooks/useColor";
import { useTabBarLayout } from "@/hooks/useTabBarLayout";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const ICONS: Record<string, { off: IconName; on: IconName; label: string }> = {
  index: { off: "home-outline", on: "home", label: "Ana Sayfa" },
  songs: { off: "musical-notes-outline", on: "musical-notes", label: "Şarkılar" },
  MusicAssistant: { off: "sparkles-outline", on: "sparkles", label: "Asistan" },
  PlayList: { off: "albums-outline", on: "albums", label: "Listeler" },
  settings: { off: "settings-outline", on: "settings", label: "Ayarlar" },
};

export default function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const accent = useColor("accent");
  const inactive = useColor("tabIconDefault");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const { scale, barHeight, barWidth, bottom } = useTabBarLayout();
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardOpen(true)
    );
    const hide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOpen(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  if (keyboardOpen) return null;

  const iconSize = Math.round(22 * scale);
  const pillW = Math.round(52 * scale);
  const pillH = Math.round(30 * scale);

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom }]}>
      <View
        style={[
          styles.bar,
          {
            width: barWidth,
            height: barHeight,
            borderRadius: Math.round(barHeight * 0.38),
            backgroundColor: cardBg,
            borderColor,
          },
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const cfg = ICONS[route.name];
          if (!cfg) return null;
          const color = focused ? accent : inactive;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name as never);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: "tabLongPress", target: route.key })}
              accessibilityRole="tab"
              accessibilityLabel={cfg.label}
              accessibilityState={{ selected: focused }}
              android_ripple={{ color: accent + "22", borderless: true, radius: 36 }}
              style={styles.item}
            >
              <View style={[styles.pill, { width: pillW, height: pillH, borderRadius: pillH / 2 }]}>
                {focused && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      { backgroundColor: accent, opacity: 0.18, borderRadius: pillH / 2 },
                    ]}
                  />
                )}
                <Ionicons name={focused ? cfg.on : cfg.off} size={iconSize} color={color} />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color,
                  fontSize: Math.round(11 * scale),
                  fontWeight: focused ? "700" : "500",
                  marginTop: 3,
                }}
              >
                {cfg.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 4,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  item: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    alignItems: "center",
    justifyContent: "center",
  },
});
