import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useModeToggle } from "@/hooks/useModeToggle";
import { Colors, ThemeMode } from "@/theme/colors";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { Icon } from "@/components/ui/icon";
import { ArrowLeft, Check } from "lucide-react-native";
import { router } from "expo-router";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

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
};

export default function ThemePlayground() {
  const { mode, setMode, availableModes } = useModeToggle();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const primary = useColor("primary");

  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInRight.duration(300).delay(100)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: hp(3),
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: wp(11),
                height: wp(11),
                borderRadius: radius(10),
                backgroundColor: cardBg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: wp(3),
                borderWidth: 1,
                borderColor,
              }}
              activeOpacity={0.7}
            >
              <Icon name={ArrowLeft} size={22} color={textPrimary} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(28),
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                Tema Seçimi
              </Text>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(13),
                  marginTop: 2,
                }}
              >
                Uygulamanızın görünümünü özelleştirin
              </Text>
            </View>
          </Animated.View>

          {/* Theme Cards */}
          <View style={{ gap: hp(2) }}>
            {availableModes.map((key, index) => {
              const { label, icon, description } = THEME_META[key];
              const themePalette = Colors[key];
              const active = mode === key;

              return (
                <Animated.View
                  key={key}
                  entering={FadeInDown.duration(400).delay(200 + index * 100)}
                >
                  <TouchableOpacity
                    onPress={() => setMode(key)}
                    activeOpacity={0.8}
                    style={{
                      borderRadius: radius(20),
                      overflow: "hidden",
                      borderWidth: active ? 3 : 1.5,
                      borderColor: active ? primary : borderColor,
                    }}
                  >
                    <LinearGradient
                      colors={themePalette.gradient.main as [string, string, string]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        padding: wp(5),
                        minHeight: hp(15),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              marginBottom: hp(1),
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize(32),
                                marginRight: wp(3),
                              }}
                            >
                              {icon}
                            </Text>
                            <Text
                              style={{
                                color: "#FFFFFF",
                                fontSize: fontSize(24),
                                fontWeight: "800",
                              }}
                            >
                              {label}
                            </Text>
                          </View>
                          <Text
                            style={{
                              color: "rgba(255, 255, 255, 0.85)",
                              fontSize: fontSize(14),
                              marginBottom: hp(1.5),
                            }}
                          >
                            {description}
                          </Text>
                          <View
                            style={{
                              flexDirection: "row",
                              flexWrap: "wrap",
                              gap: wp(2),
                              marginTop: hp(1),
                            }}
                          >
                            {themePalette.gradient.main.slice(0, 3).map((color, idx) => (
                              <View
                                key={idx}
                                style={{
                                  width: wp(8),
                                  height: wp(8),
                                  borderRadius: radius(8),
                                  backgroundColor: color,
                                  borderWidth: 1,
                                  borderColor: "rgba(255, 255, 255, 0.2)",
                                }}
                              />
                            ))}
                          </View>
                        </View>
                        {active && (
                          <Animated.View
                            entering={FadeInRight.duration(300)}
                            style={{
                              width: wp(12),
                              height: wp(12),
                              borderRadius: radius(12),
                              backgroundColor: "rgba(255, 255, 255, 0.25)",
                              alignItems: "center",
                              justifyContent: "center",
                              borderWidth: 2,
                              borderColor: "#FFFFFF",
                            }}
                          >
                            <Icon name={Check} size={24} color="#FFFFFF" />
                          </Animated.View>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Info Card */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(500)}
            style={{
              marginTop: hp(3),
              backgroundColor: cardBg,
              borderRadius: radius(16),
              padding: wp(4),
              borderWidth: 1,
              borderColor,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: hp(1),
              }}
            >
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: palette.purple + "30",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: wp(3),
                }}
              >
                <Text style={{ fontSize: fontSize(20) }}>💡</Text>
              </View>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(16),
                  fontWeight: "700",
                }}
              >
                İpucu
              </Text>
            </View>
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(14),
                lineHeight: fontSize(20),
              }}
            >
              Tema değişikliği anında uygulanır. Farklı temaları deneyerek
              en sevdiğinizi bulabilirsiniz.
            </Text>
            <View
              style={{
                marginTop: hp(1.5),
                paddingTop: hp(1.5),
                borderTopWidth: 1,
                borderTopColor: borderColor,
              }}
            >
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(12),
                }}
              >
                Aktif Tema:{" "}
                <Text
                  style={{
                    color: primary,
                    fontWeight: "700",
                  }}
                >
                  {THEME_META[mode as ThemeMode].label}
                </Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}