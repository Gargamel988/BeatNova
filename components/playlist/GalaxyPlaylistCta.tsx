import React from "react";
import { View, Text, TouchableOpacity, I18nManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PenTool, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";

export const GalaxyPlaylistCta: React.FC = () => {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/galaxy" as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`${t("galaxy.ctaTitle", { defaultValue: "Yıldızlardan Playlist Çiz" })}. ${t("galaxy.ctaDesc", { defaultValue: "Galaksinde şarkılar arasında çizim yaparak anında özel bir playlist oluştur." })}`}
      onPress={handlePress}
      style={{
        marginTop: hp(2),
        marginBottom: hp(1.5),
        borderRadius: radius(16),
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(56, 189, 248, 0.22)",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
      }}
    >
      <LinearGradient
        colors={["rgba(15, 23, 42, 0.95)", "rgba(30, 27, 75, 0.65)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingHorizontal: wp(4),
          paddingVertical: hp(1.6),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", flex: 1, marginEnd: wp(3) }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(56, 189, 248, 0.15)",
              borderWidth: 1,
              borderColor: "rgba(56, 189, 248, 0.3)",
              alignItems: "center",
              justifyContent: "center",
              marginEnd: wp(3),
            }}
          >
            <PenTool size={16} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                color: "#F8FAFC",
                fontSize: fontSize(14),
                fontWeight: "700",
                letterSpacing: -0.2,
                marginBottom: 2,
              }}
            >
              {t("galaxy.ctaTitle", { defaultValue: "Yıldızlardan Playlist Çiz" })}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                color: "#94A3B8",
                fontSize: fontSize(11),
                fontWeight: "400",
              }}
            >
              {t("galaxy.ctaDesc", {
                defaultValue:
                  "Galaksinde şarkılar arasında çizim yaparak anında özel bir playlist oluştur.",
              })}
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            backgroundColor: "rgba(56, 189, 248, 0.14)",
            paddingHorizontal: 10,
            paddingVertical: 7,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(56, 189, 248, 0.35)",
            minHeight: 36,
          }}
        >
          <Text
            style={{
              color: "#38BDF8",
              fontSize: fontSize(12),
              fontWeight: "700",
            }}
          >
            {t("galaxy.explore", { defaultValue: "Keşfet" })}
          </Text>
          <ArrowRight
            size={13}
            color="#38BDF8"
            style={{
              transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
            }}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
