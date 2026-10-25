import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  Sparkles,
  Play,
  Flame,
  RotateCcw,
  Zap,
  Moon,
  Heart,
  Music2,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { SmartPlaylist, SmartPlaylistId } from "@/services/SmartPlaylistService";
import { useAudioPlayerContext } from "@/providers/player-context";

type SmartPlaylistSectionProps = {
  playlists: SmartPlaylist[];
  onOpenPlaylist?: (playlist: SmartPlaylist) => void;
  onSelectPlaylist?: (playlist: SmartPlaylist) => void;
};

const ICON_MAP: Record<SmartPlaylistId, any> = {
  heavy_rotation: Flame,
  time_capsule: RotateCcw,
  weekly_top: Zap,
  night_owl: Moon,
  never_skipped: Heart,
};

export default function SmartPlaylistSection({
  playlists,
  onOpenPlaylist,
  onSelectPlaylist,
}: SmartPlaylistSectionProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { play } = useAudioPlayerContext();
  const textPrimary = useColor("authPrimaryText");
  const primary = useColor("primary");

  const openAction = onOpenPlaylist || onSelectPlaylist;

  // Boş listeleri gizle
  const validPlaylists = (playlists || []).filter(
    (item) => item.songs && item.songs.length > 0
  );

  if (validPlaylists.length === 0) {
    return null;
  }

  const handlePlay = (playlist: SmartPlaylist) => {
    if (!playlist.songs?.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    play(playlist.songs[0], playlist.songs);
  };

  return (
    <View style={{ marginBottom: hp(2.5) }}>
      {/* Section Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: hp(1.2),
          paddingHorizontal: wp(1),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
          <View
            style={{
              width: wp(7.5),
              height: wp(7.5),
              borderRadius: radius(8),
              backgroundColor: primary + "25",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Sparkles} size={16} color={primary} />
          </View>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(17),
              fontWeight: "800",
            }}
          >
            {t("smartPlaylists.sectionTitle", "Akıllı Çalma Listeleri")}
          </Text>
        </View>
      </View>

      {/* Küçültülmüş Yatay Kartlar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: wp(3),
          paddingVertical: hp(0.5),
          paddingHorizontal: wp(1),
        }}
      >
        {validPlaylists.map((item) => {
          const IconComp = ICON_MAP[item.id] || Music2;
          const title = t(item.titleKey, item.defaultTitle);

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (openAction) {
                  openAction(item);
                } else {
                  handlePlay(item);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel={`${title}, ${item.songCount} şarkı`}
              style={{
                width: wp(38),
                height: hp(13),
                borderRadius: radius(16),
                overflow: "hidden",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.25,
                shadowRadius: 5,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  padding: wp(3),
                  justifyContent: "space-between",
                }}
              >
                {/* Üst Satır: İkon ve Şarkı Sayısı */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Icon name={IconComp} size={18} color="#fff" />
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: fontSize(10),
                      fontWeight: "700",
                    }}
                  >
                    {item.songCount}
                  </Text>
                </View>

                {/* Alt Satır: Başlık ve Küçük Oynat Butonu */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    justifyContent: "space-between",
                    gap: wp(1.5),
                  }}
                >
                  <Text
                    numberOfLines={2}
                    style={{
                      flex: 1,
                      color: "#fff",
                      fontSize: fontSize(13),
                      fontWeight: "800",
                      lineHeight: fontSize(17),
                    }}
                  >
                    {title}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handlePlay(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.75}
                    style={{
                      width: wp(8),
                      height: wp(8),
                      borderRadius: 99,
                      backgroundColor: "#fff",
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3,
                      elevation: 3,
                    }}
                  >
                    <Icon name={Play} size={14} color={item.badgeColor} fill={item.badgeColor} />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
