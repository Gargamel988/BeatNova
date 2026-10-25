import React from "react";
import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import { Play, Music, MoreVertical } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";
import { formatLocalizedDuration } from "@/utils/format";
import * as Haptics from "expo-haptics";
import type { GalaxyStar } from "@/utils/buildGalaxy";
import { SafeAreaView } from "react-native-safe-area-context";

type GalaxyListViewProps = {
  stars: GalaxyStar[];
  activeSongId: string | null;
  onPlaySong: (star: GalaxyStar) => void;
  onOptionsPress?: (star: GalaxyStar) => void;
};

export const GalaxyListView: React.FC<GalaxyListViewProps> = ({
  stars,
  activeSongId,
  onPlaySong,
  onOptionsPress,
}) => {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const { t } = useTranslation();

  const renderItem = ({ item, index }: { item: GalaxyStar; index: number }) => {
    const isPlaying = activeSongId === item.id;
    const durationStr = item.played
      ? formatLocalizedDuration(item.total_secs, t)
      : t("galaxy.unplayed", { defaultValue: "Henüz dinlenmedi" });

    return (
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPlaySong(item);
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.artist}, ${durationStr}`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: hp(1.2),
          paddingHorizontal: wp(4),
          marginBottom: hp(0.8),
          backgroundColor: isPlaying ? colors.primary + "18" : "#10162480",
          borderRadius: radius(12),
          borderWidth: 1,
          borderColor: isPlaying ? colors.primary + "60" : "rgba(255,255,255,0.06)",
        }}
      >
        {/* Sıra & Yıldız Rengi */}
        <View style={{ width: wp(9), alignItems: "center", justifyContent: "center" }}>
          <Text
            style={{
              color: isPlaying ? colors.primary : "rgba(255,255,255,0.45)",
              fontSize: fontSize(12),
              fontWeight: "600",
            }}
          >
            {index + 1}
          </Text>
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: item.color,
              marginTop: 2,
            }}
          />
        </View>

        {/* Thumbnail */}
        <View
          style={{
            width: wp(11),
            height: wp(11),
            borderRadius: radius(8),
            backgroundColor: "#182030",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            marginEnd: wp(3),
          }}
        >
          {item.coverUri ? (
            <Image
              source={{ uri: item.coverUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Music size={wp(5)} color={item.color} />
          )}
        </View>

        {/* Başlık & Sanatçı */}
        <View style={{ flex: 1, paddingEnd: wp(2) }}>
          <Text
            numberOfLines={1}
            style={{
              color: isPlaying ? colors.primary : "#FFFFFF",
              fontSize: fontSize(14.5),
              fontWeight: "600",
            }}
          >
            {item.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: fontSize(12),
              marginTop: 1,
            }}
          >
            {item.artist}
          </Text>
        </View>

        {/* Dinleme Süresi / Durum */}
        <View style={{ alignItems: "flex-end", marginEnd: wp(2) }}>
          <Text
            style={{
              color: item.played ? item.color : "rgba(255,255,255,0.35)",
              fontSize: fontSize(12),
              fontWeight: "500",
            }}
          >
            {item.played ? formatLocalizedDuration(item.total_secs, t) : "-"}
          </Text>
          {item.play_count > 0 ? (
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: fontSize(10.5),
                marginTop: 1,
              }}
            >
              {t("galaxy.playsCount", {
                count: item.play_count,
                defaultValue: `${item.play_count} kez`,
              })}
            </Text>
          ) : null}
        </View>

        {/* Sağ Butonlar: 3 Nokta & Çal */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
          {onOptionsPress ? (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation?.();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOptionsPress(item);
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MoreVertical size={16} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          ) : null}

          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: isPlaying ? colors.primary : "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Play size={14} color="#FFFFFF" fill="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]}>
      <FlatList
        data={stars}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{
          paddingHorizontal: wp(4),
          paddingTop: hp(1.5),
          paddingBottom: hp(12),
        }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={20}
        maxToRenderPerBatch={25}
        windowSize={10}
      />
    </SafeAreaView>
  );
};
