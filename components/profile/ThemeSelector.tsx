import React from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { Colors, ThemeMode } from "@/theme/colors";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Palette, Check } from "lucide-react-native";

const THEME_META: Record<ThemeMode, { label: string; icon: string; description: string }> = {
  system: { 
    label: "BeatNova", 
    icon: "🎛️",
    description: "Klasik mor ve pembe tema"
  },
  aurora: { 
    label: "Aurora", 
    icon: "🌌",
    description: "Mavi ve cyan tonları"
  },
  sunset: { 
    label: "Sunset", 
    icon: "🌅",
    description: "Turuncu ve kırmızı tonları"
  },
  ocean: { 
    label: "Ocean", 
    icon: "🌊",
    description: "Okyanus mavisi ve turkuaz tonları"
  },
  forest: { 
    label: "Forest", 
    icon: "🌲",
    description: "Yeşil ve doğa tonları"
  },
  midnight: { 
    label: "Midnight", 
    icon: "🌙",
    description: "Koyu mavi gece teması"
  },
  rose: { 
    label: "Rose", 
    icon: "🌹",
    description: "Pembe ve gül tonları"
  },
  amber: { 
    label: "Amber", 
    icon: "✨",
    description: "Altın ve sarı tonları"
  },
  lavender: { 
    label: "Lavender", 
    icon: "💜",
    description: "Lavanta mor tonları"
  },
};

interface ThemeSelectorProps {
  currentMode: ThemeMode;
  availableModes: readonly ThemeMode[];
  onThemeChange: (theme: ThemeMode) => void;
}

export function ThemeSelector({
  currentMode,
  availableModes,
  onThemeChange,
}: ThemeSelectorProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const accent = useColor("accent");
  const primary = useColor("primary");

  return (
    <Animated.View
      entering={FadeInUp.delay(500).springify()}
      style={{
        marginBottom: hp(3),
      }}
    >
      <LinearGradient
        colors={[cardBg, `${cardBg}CC`]}
        style={{
          borderRadius: radius(20),
          padding: wp(5),
          borderWidth: 1,
          borderColor,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2.5),
            marginBottom: hp(2.5),
          }}
        >
          <LinearGradient
            colors={[primary, accent]}
            style={{
              width: wp(10),
              height: wp(10),
              borderRadius: radius(12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Palette} size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(20),
              fontWeight: "800",
            }}
          >
            Tema
          </Text>
        </View>

        <View style={{ gap: hp(1.5) }}>
          {availableModes.map((themeMode) => {
            const { label, icon, description } = THEME_META[themeMode];
            const themePalette = Colors[themeMode];
            const active = currentMode === themeMode;

            return (
              <TouchableOpacity
                key={themeMode}
                onPress={() => onThemeChange(themeMode)}
                activeOpacity={0.8}
                style={{
                  borderRadius: radius(16),
                  overflow: "hidden",
                  borderWidth: active ? 2 : 1,
                  borderColor: active ? primary : borderColor,
                }}
              >
                <LinearGradient
                  colors={themePalette.gradient.main as [string, string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    padding: wp(4),
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3), flex: 1 }}>
                    <Text style={{ fontSize: fontSize(24) }}>{icon}</Text>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: "#FFFFFF",
                          fontSize: fontSize(16),
                          fontWeight: "700",
                        }}
                      >
                        {label}
                      </Text>
                      <Text
                        style={{
                          color: "rgba(255, 255, 255, 0.8)",
                          fontSize: fontSize(12),
                          marginTop: 2,
                        }}
                      >
                        {description}
                      </Text>
                    </View>
                  </View>
                  {active && (
                    <View
                      style={{
                        width: wp(8),
                        height: wp(8),
                        borderRadius: radius(10),
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 2,
                        borderColor: "#FFFFFF",
                      }}
                    >
                      <Icon name={Check} size={18} color="#FFFFFF" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

