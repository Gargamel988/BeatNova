import React from "react";
import { View, Text, TouchableOpacity, I18nManager } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";

export const GalaxyPromoCard: React.FC = () => {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/galaxy" as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`${t("galaxy.promoTitle", { defaultValue: "Galaksin & Playlist Çiz" })}. ${t("galaxy.promoDesc", { defaultValue: "Şarkılarını kozmik uzayda keşfet ve yıldızları birleştirerek playlist oluştur." })}`}
      onPress={handlePress}
      style={{
        marginBottom: hp(2.5),
        borderRadius: radius(20),
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(56, 189, 248, 0.28)",
        shadowColor: "#38BDF8",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 14,
        elevation: 6,
      }}
    >
      <LinearGradient
        colors={["#0B0F19", "#111827", "#1E1B4B"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: wp(4.5),
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Dekoratif kozmik parıltı çemberleri */}
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: -wp(12),
            end: -wp(12),
            width: wp(36),
            height: wp(36),
            borderRadius: wp(18),
            backgroundColor: "rgba(56, 189, 248, 0.12)",
          }}
        />
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: -wp(10),
            start: -wp(10),
            width: wp(28),
            height: wp(28),
            borderRadius: wp(14),
            backgroundColor: "rgba(168, 85, 247, 0.1)",
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Sol: İkon & Metin Bölümü */}
          <View style={{ flex: 1, marginEnd: wp(3) }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: wp(2),
                marginBottom: hp(0.6),
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(56, 189, 248, 0.18)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(56, 189, 248, 0.35)",
                }}
              >
                <Sparkles size={16} color="#38BDF8" />
              </View>
              <Text
                numberOfLines={1}
                style={{
                  color: "#F8FAFC",
                  fontSize: fontSize(15),
                  fontWeight: "700",
                  letterSpacing: -0.2,
                }}
              >
                {t("galaxy.promoTitle", { defaultValue: "Galaksin & Playlist Çiz" })}
              </Text>
            </View>

            <Text
              numberOfLines={2}
              style={{
                color: "#94A3B8",
                fontSize: fontSize(12),
                lineHeight: fontSize(17),
                fontWeight: "400",
              }}
            >
              {t("galaxy.promoDesc", {
                defaultValue:
                  "Şarkılarını kozmik uzayda keşfet ve yıldızları birleştirerek playlist oluştur.",
              })}
            </Text>
          </View>

          {/* Sağ: Şık Keşfet Butonu (En az 44x44 dokunma hedefi) */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(56, 189, 248, 0.16)",
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "rgba(56, 189, 248, 0.45)",
              minHeight: 44,
            }}
          >
            <Text
              style={{
                color: "#38BDF8",
                fontSize: fontSize(13),
                fontWeight: "700",
              }}
            >
              {t("galaxy.explore", { defaultValue: "Keşfet" })}
            </Text>
            <ArrowRight
              size={15}
              color="#38BDF8"
              style={{
                transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
              }}
            />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};
