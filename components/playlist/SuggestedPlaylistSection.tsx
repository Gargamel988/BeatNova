import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import {
  Sparkles,
  Play,
  BookmarkPlus,
  Check,
  Music2,
  Clock,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useAudioPlayerContext } from "@/providers/player-context";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import {
  SuggestedPlaylist,
  saveSuggestedPlaylist,
} from "@/services/RecommendationService";

type SuggestedPlaylistSectionProps = {
  playlists: SuggestedPlaylist[];
  onOpenPlaylist?: (playlist: SuggestedPlaylist) => void;
};

export default function SuggestedPlaylistSection({
  playlists,
  onOpenPlaylist,
}: SuggestedPlaylistSectionProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { play } = useAudioPlayerContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const primary = useColor("primary");

  const [savingKind, setSavingKind] = useState<string | null>(null);
  const [savedKinds, setSavedKinds] = useState<Set<string>>(new Set());

  const validPlaylists = (playlists || []).filter(
    (p) => p.songs && p.songs.length > 0
  );

  if (validPlaylists.length === 0) {
    return null;
  }

  const handlePlay = (playlist: SuggestedPlaylist) => {
    if (!playlist.songs?.length) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const first = playlist.songs[0];
    if (first) {
      play(first, playlist.songs);
    }
  };

  const handleSave = async (playlist: SuggestedPlaylist) => {
    if (savingKind) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSavingKind(playlist.kind);

    try {
      const success = await saveSuggestedPlaylist(playlist);
      if (success) {
        setSavedKinds((prev) => new Set([...prev, playlist.kind]));
        await queryClient.invalidateQueries({
          queryKey: queryKeys.playlists.all(),
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast({
          title: t("suggestions.savedSuccess", "Çalma listesi oluşturuldu!"),
          description: t(
            "suggestions.savedSuccessDesc",
            "\"{{name}}\" çalma listelerine eklendi.",
            { name: t(playlist.titleKey, playlist.defaultTitle) }
          ),
          variant: "success",
        });
      } else {
        throw new Error("Failed to save");
      }
    } catch {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast({
        title: t("suggestions.saveError", "Liste kaydedilemedi"),
        variant: "error",
      });
    } finally {
      setSavingKind(null);
    }
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
        <View style={{ gap: hp(0.3) }}>
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
              {t("suggestions.sectionTitle", "Senin İçin Öneriler")}
            </Text>
          </View>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
              marginStart: wp(9.5),
            }}
          >
            {t(
              "suggestions.sectionSubtitle",
              "Dinleme alışkanlıklarına ve günün saatine göre hazırlandı"
            )}
          </Text>
        </View>
      </View>

      {/* Horizontal Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: wp(1),
          gap: wp(3.5),
          paddingVertical: hp(0.5),
        }}
      >
        {validPlaylists.map((item) => {
          const isSaved = savedKinds.has(item.kind);
          const isSaving = savingKind === item.kind;
          const covers = item.songs.slice(0, 4);

          return (
            <TouchableOpacity
              key={item.kind}
              onPress={() => onOpenPlaylist?.(item) ?? handlePlay(item)}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`${t(item.titleKey, item.defaultTitle)}, ${t(item.reasonKey, item.defaultReason)}`}
              style={{
                width: wp(68),
                backgroundColor: cardBg,
                borderRadius: radius(18),
                padding: wp(3.5),
                borderWidth: 1,
                borderColor,
                gap: hp(1.2),
              }}
            >
              {/* 2x2 Collage Cover */}
              <View
                style={{
                  width: "100%",
                  height: wp(36),
                  borderRadius: radius(12),
                  overflow: "hidden",
                  flexDirection: "row",
                  flexWrap: "wrap",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
              >
                {covers.length > 0 ? (
                  [0, 1, 2, 3].map((idx) => {
                    const song = covers[idx];
                    const uri = song?.metadata?.coverUri;
                    return (
                      <View
                        key={idx}
                        style={{
                          width: "50%",
                          height: "50%",
                          overflow: "hidden",
                        }}
                      >
                        {uri ? (
                          <Image
                            source={{ uri }}
                            style={{ width: "100%", height: "100%" }}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <LinearGradient
                            colors={item.gradient}
                            style={{
                              width: "100%",
                              height: "100%",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon name={Music2} size={16} color="rgba(255,255,255,0.7)" />
                          </LinearGradient>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <LinearGradient
                    colors={item.gradient}
                    style={{
                      width: "100%",
                      height: "100%",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={Music2} size={32} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              {/* Title & Song Count */}
              <View style={{ gap: hp(0.3) }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(15),
                      fontWeight: "800",
                      flex: 1,
                    }}
                  >
                    {t(item.titleKey, item.defaultTitle)}
                  </Text>
                  <View
                    style={{
                      backgroundColor: item.badgeColor + "20",
                      paddingHorizontal: wp(2),
                      paddingVertical: hp(0.3),
                      borderRadius: radius(6),
                      marginStart: wp(2),
                    }}
                  >
                    <Text
                      style={{
                        color: item.badgeColor,
                        fontSize: fontSize(10),
                        fontWeight: "800",
                      }}
                    >
                      {t("suggestions.songsCount", "{{count}} Şarkı", {
                        count: item.songCount,
                      })}
                    </Text>
                  </View>
                </View>

                {/* Reason ("Neden bu liste") */}
                <Text
                  numberOfLines={2}
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    lineHeight: fontSize(16),
                  }}
                >
                  {t(item.reasonKey, item.defaultReason)}
                </Text>
              </View>

              {/* Buttons: Çal & Kaydet */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: wp(2),
                  paddingTop: hp(0.5),
                  borderTopWidth: 1,
                  borderTopColor: borderColor,
                }}
              >
                {/* Play Button */}
                <TouchableOpacity
                  onPress={() => handlePlay(item)}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t("suggestions.playAll", "Tümünü Çal")}
                  style={{
                    flex: 1,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: primary,
                    paddingVertical: hp(0.9),
                    borderRadius: radius(10),
                    gap: wp(1.5),
                  }}
                >
                  <Icon name={Play} size={14} color="#FFFFFF" />
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: fontSize(12),
                      fontWeight: "800",
                    }}
                  >
                    {t("suggestions.playAll", "Tümünü Çal")}
                  </Text>
                </TouchableOpacity>

                {/* Save as Playlist Button */}
                <TouchableOpacity
                  onPress={() => handleSave(item)}
                  disabled={isSaved || isSaving}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={t("suggestions.savePlaylist", "Listeyi Kaydet")}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: isSaved
                      ? "#10B981"
                      : "rgba(255,255,255,0.08)",
                    paddingHorizontal: wp(3),
                    paddingVertical: hp(0.9),
                    borderRadius: radius(10),
                    gap: wp(1),
                    borderWidth: isSaved ? 0 : 1,
                    borderColor,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : isSaved ? (
                    <Icon name={Check} size={14} color="#FFFFFF" />
                  ) : (
                    <Icon name={BookmarkPlus} size={14} color={textPrimary} />
                  )}
                  <Text
                    style={{
                      color: isSaved ? "#FFFFFF" : textPrimary,
                      fontSize: fontSize(12),
                      fontWeight: "700",
                    }}
                  >
                    {isSaved
                      ? t("common.saved", "Kaydedildi")
                      : t("suggestions.savePlaylist", "Kaydet")}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}
