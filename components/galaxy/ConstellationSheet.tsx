import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import {
  Play,
  BookmarkPlus,
  Trash2,
  Wand2,
  X,
  Music,
  Clock,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { GalaxyStar } from "@/utils/buildGalaxy";

type ConstellationSheetProps = {
  stars: GalaxyStar[];
  onPlay: () => void;
  onOpenSaveModal: () => void;
  onClear: () => void;
  onExitDrawMode: () => void;
  onApplyPreset: (type: "center-out" | "outer-in" | "cycle-24h") => void;
};

export const ConstellationSheet: React.FC<ConstellationSheetProps> = ({
  stars,
  onPlay,
  onOpenSaveModal,
  onClear,
  onExitDrawMode,
  onApplyPreset,
}) => {
  const { t } = useTranslation();
  const [showPresets, setShowPresets] = useState(false);

  const totalSecs = stars.reduce((sum, s) => sum + (s.duration || 0), 0);
  const minutes = Math.floor(totalSecs / 60);
  const seconds = Math.floor(totalSecs % 60);
  const formattedDuration = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

  return (
    <View
      style={{
        position: "absolute",
        bottom: 24,
        left: 16,
        right: 16,
        backgroundColor: "rgba(13, 17, 26, 0.94)",
        borderColor: "rgba(56, 189, 248, 0.35)",
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        shadowColor: "#38BDF8",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      {/* Üst Bar: Başlık, sayaç ve kapat butonu */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: stars.length > 0 ? 12 : 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: "#38BDF8",
            }}
          />
          <Text
            style={{
              color: "#F8FAFC",
              fontSize: 15,
              fontWeight: "700",
              letterSpacing: 0.3,
            }}
          >
            {t("galaxy.constellationTitle", { defaultValue: "Çizilen Şarkılar" })}
          </Text>

          {stars.length > 0 ? (
            <View
              style={{
                backgroundColor: "rgba(56,189,248,0.18)",
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 10,
              }}
            >
              <Text
                style={{
                  color: "#38BDF8",
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {stars.length}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {stars.length > 0 ? (
            <Text
              style={{
                color: "#64748B",
                fontSize: 12,
                fontWeight: "500",
              }}
            >
              {formattedDuration}
            </Text>
          ) : null}

          <TouchableOpacity
            onPress={onExitDrawMode}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t("galaxy.drawExit", { defaultValue: "Çizimden Çık" })}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Eğer henüz yıldız yakalanmadıysa: İpucu ve Şablonlar */}
      {stars.length === 0 ? (
        <View style={{ paddingVertical: 6 }}>
          <Text
            style={{
              color: "#94A3B8",
              fontSize: 13,
              marginBottom: 12,
              lineHeight: 18,
            }}
          >
            {t("galaxy.drawHint", {
              defaultValue:
                "Parmağınla yıldızlar arasında bir yol çiz ya da hazır bir şablon seç:",
            })}
          </Text>

          {/* Hızlı şablon butonları */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onApplyPreset("cycle-24h");
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: "rgba(56,189,248,0.1)",
                borderWidth: 1,
                borderColor: "rgba(56,189,248,0.25)",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#38BDF8",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("galaxy.presetCycle24h", { defaultValue: "Günün Döngüsü" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onApplyPreset("center-out");
              }}
              style={{
                flex: 1,
                paddingVertical: 9,
                paddingHorizontal: 10,
                borderRadius: 12,
                backgroundColor: "rgba(129,140,248,0.1)",
                borderWidth: 1,
                borderColor: "rgba(129,140,248,0.25)",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: "#818CF8",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {t("galaxy.presetCenterOut", { defaultValue: "Merkezden Dışa" })}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* Yakalanan yıldızların yatay chip listesi */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            style={{ marginBottom: 14 }}
          >
            {stars.map((s, idx) => (
              <View
                key={`chip-${s.id}-${idx}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                  borderRadius: 12,
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  maxWidth: 160,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    backgroundColor: "#161D2B",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {s.coverUri ? (
                    <Image
                      source={{ uri: s.coverUri }}
                      style={{ width: "100%", height: "100%" }}
                    />
                  ) : (
                    <Text
                      style={{
                        color: "#38BDF8",
                        fontSize: 10,
                        fontWeight: "700",
                      }}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#F8FAFC",
                      fontSize: 12,
                      fontWeight: "600",
                    }}
                  >
                    {s.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: "#94A3B8",
                      fontSize: 10,
                    }}
                  >
                    {s.artist}
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Şablonlar açılır menüsü (isteğe bağlı) */}
          {showPresets ? (
            <View
              style={{
                backgroundColor: "rgba(22, 29, 43, 0.95)",
                borderRadius: 14,
                padding: 8,
                marginBottom: 12,
                gap: 6,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  onApplyPreset("cycle-24h");
                  setShowPresets(false);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                <Text style={{ color: "#38BDF8", fontSize: 13, fontWeight: "600" }}>
                  ⏰ {t("galaxy.presetCycle24h", { defaultValue: "Günün Döngüsü" })}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 11 }}>
                  {t("galaxy.presetCycle24hDesc", {
                    defaultValue: "24 saatlik dairesel zaman akışı",
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onApplyPreset("center-out");
                  setShowPresets(false);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                <Text style={{ color: "#818CF8", fontSize: 13, fontWeight: "600" }}>
                  🌀 {t("galaxy.presetCenterOut", { defaultValue: "Merkezden Dışa" })}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 11 }}>
                  {t("galaxy.presetCenterOutDesc", {
                    defaultValue: "En çok dinlenenlerden keşiflere",
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  onApplyPreset("outer-in");
                  setShowPresets(false);
                }}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: "rgba(255,255,255,0.04)",
                }}
              >
                <Text style={{ color: "#34D399", fontSize: 13, fontWeight: "600" }}>
                  🎯 {t("galaxy.presetOuterIn", { defaultValue: "Dıştan Merkeze" })}
                </Text>
                <Text style={{ color: "#64748B", fontSize: 11 }}>
                  {t("galaxy.presetOuterInDesc", {
                    defaultValue: "Sönüklerden favorilere doğru",
                  })}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Aksiyon Butonları: Çal, Kaydet, Şablonlar, Temizle */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onPlay();
              }}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.play", { defaultValue: "Çal" })}
              style={{
                flex: 1.5,
                backgroundColor: "#38BDF8",
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Play size={17} color="#07090E" fill="#07090E" />
              <Text
                style={{
                  color: "#07090E",
                  fontSize: 14,
                  fontWeight: "700",
                }}
              >
                {t("galaxy.play", { defaultValue: "Çal" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenSaveModal();
              }}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.save", { defaultValue: "Kaydet" })}
              style={{
                flex: 1.3,
                backgroundColor: "rgba(56,189,248,0.15)",
                borderColor: "rgba(56,189,248,0.3)",
                borderWidth: 1,
                paddingVertical: 12,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <BookmarkPlus size={16} color="#38BDF8" />
              <Text
                style={{
                  color: "#38BDF8",
                  fontSize: 13,
                  fontWeight: "600",
                }}
              >
                {t("galaxy.save", { defaultValue: "Kaydet" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowPresets(!showPresets);
              }}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.presets", { defaultValue: "Şablonlar" })}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: showPresets
                  ? "rgba(129,140,248,0.25)"
                  : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: showPresets
                  ? "rgba(129,140,248,0.5)"
                  : "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wand2 size={18} color={showPresets ? "#818CF8" : "#94A3B8"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClear();
              }}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.clear", { defaultValue: "Temizle" })}
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trash2 size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};
