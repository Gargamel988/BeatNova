import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Sparkles,
  List,
  Compass,
  PenTool,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";

type GalaxyHeaderProps = {
  viewMode: "map" | "list";
  isDrawingMode: boolean;
  starCount: number;
  onBackPress: () => void;
  onToggleDrawMode: () => void;
  onDiscoverFromDarkness: () => void;
  onToggleViewMode: () => void;
};

export const GalaxyHeader: React.FC<GalaxyHeaderProps> = ({
  viewMode,
  isDrawingMode,
  starCount,
  onBackPress,
  onToggleDrawMode,
  onDiscoverFromDarkness,
  onToggleViewMode,
}) => {
  const { t } = useTranslation();
  const { wp, hp, fontSize } = useResponsive();

  const handleToggleDraw = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onToggleDrawMode();
  };

  const handleDiscover = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDiscoverFromDarkness();
  };

  const handleViewToggle = () => {
    Haptics.selectionAsync();
    onToggleViewMode();
  };

  return (
    <SafeAreaView
      edges={["top"]}
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: wp(4),
        paddingTop: hp(1.5),
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 50,
      }}
    >
      {/* Sol: Dairesel Cam Geri Butonu (RTL Aynalamalı) */}
      <TouchableOpacity
        onPress={onBackPress}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityRole="button"
        accessibilityLabel={t("common.back", { defaultValue: "Geri" })}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "rgba(13, 17, 26, 0.85)",
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.12)",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <ArrowLeft
          size={19}
          color="#F8FAFC"
          style={{
            transform: [{ scaleX: I18nManager.isRTL ? -1 : 1 }],
          }}
        />
      </TouchableOpacity>

      {/* Orta: Yüzen Kozmik Kapsül */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingHorizontal: 14,
          paddingVertical: 9,
          borderRadius: 22,
          backgroundColor: isDrawingMode
            ? "rgba(56, 189, 248, 0.15)"
            : "rgba(13, 17, 26, 0.85)",
          borderWidth: 1,
          borderColor: isDrawingMode
            ? "rgba(56, 189, 248, 0.45)"
            : "rgba(255, 255, 255, 0.12)",
          shadowColor: isDrawingMode ? "#38BDF8" : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDrawingMode ? 0.3 : 0.25,
          shadowRadius: 10,
          elevation: 6,
        }}
      >
        {isDrawingMode ? (
          <>
            <PenTool size={14} color="#38BDF8" />
            <Text
              style={{
                color: "#38BDF8",
                fontSize: fontSize(13),
                fontWeight: "700",
                letterSpacing: 0.2,
              }}
            >
              {t("galaxy.drawMode", { defaultValue: "Playlist Çiz" })}
            </Text>
          </>
        ) : (
          <>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: "#38BDF8",
              }}
            />
            <Text
              style={{
                color: "#F8FAFC",
                fontSize: fontSize(14),
                fontWeight: "700",
                letterSpacing: -0.2,
              }}
            >
              {viewMode === "list"
                ? t("galaxy.listView", { defaultValue: "Liste" })
                : t("galaxy.title", { defaultValue: "Galaksin" })}
            </Text>
            {starCount > 0 ? (
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginStart: 2,
                }}
              >
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.65)",
                    fontSize: fontSize(11),
                    fontWeight: "600",
                  }}
                >
                  {starCount}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </View>

      {/* Sağ Aksiyon Butonları */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {viewMode === "map" ? (
          <>
            {/* Playlist Çiz Butonu */}
            <TouchableOpacity
              onPress={handleToggleDraw}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.drawMode", { defaultValue: "Playlist Çiz" })}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: isDrawingMode
                  ? "rgba(56, 189, 248, 0.25)"
                  : "rgba(13, 17, 26, 0.85)",
                borderWidth: 1,
                borderColor: isDrawingMode ? "#38BDF8" : "rgba(255, 255, 255, 0.12)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: isDrawingMode ? "#38BDF8" : "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDrawingMode ? 0.35 : 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <PenTool
                size={18}
                color={isDrawingMode ? "#38BDF8" : "#CBD5E1"}
              />
            </TouchableOpacity>

            {/* Karanlıktan Keşfet Butonu */}
            {!isDrawingMode ? (
              <TouchableOpacity
                onPress={handleDiscover}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("galaxy.discoverDarkness", {
                  defaultValue: "Karanlıktan keşfet",
                })}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "rgba(244, 162, 97, 0.16)",
                  borderWidth: 1,
                  borderColor: "rgba(244, 162, 97, 0.4)",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#F4A261",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <Sparkles size={18} color="#F4A261" />
              </TouchableOpacity>
            ) : null}
          </>
        ) : null}

        {/* Harita / Liste Toggle */}
        {!isDrawingMode ? (
          <>
            <TouchableOpacity
              onPress={handleViewToggle}
              accessibilityRole="button"
              accessibilityLabel={
                viewMode === "map"
                  ? t("galaxy.listView", { defaultValue: "Liste" })
                  : t("galaxy.mapView", { defaultValue: "Harita" })
              }
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(13, 17, 26, 0.85)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {viewMode === "map" ? (
                <List size={18} color="#CBD5E1" />
              ) : (
                <Compass size={18} color="#38BDF8" />
              )}
            </TouchableOpacity>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
};
