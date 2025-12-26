import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/icon";
import { Song } from "@/components/songs/songsService";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useAudioPlayerContext } from "@/providers/player-context";
import { formatTime } from "@/utils/format";
import { Music2, Heart, Clock, Waves } from "lucide-react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { removeSongFromFavorites } from "@/services/PlaylistServices";

interface FavoriteSongItemProps {
  item: Song;
  playlist: Song[];
}

export default function FavoriteSongItem({
  item,
  playlist,
}: FavoriteSongItemProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const accent = useColor("accent");
  const { play } = useAudioPlayerContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const hasCover = item.metadata?.coverUri && item.metadata.coverUri.trim() !== "";

  const { mutate: removeFromFavorites } = useMutation({
    mutationFn: async (songId: string) => {
      return removeSongFromFavorites(songId);
    },
    onSuccess: () => {
      toast({
        title: "Favorilerden kaldırıldı",
        description: "Şarkı favorilerden kaldırıldı",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Bir hata oluştu",
        variant: "error",
      });
    },
  });

  const handlePlay = () => {
    play(item, playlist);
  };

  const handleRemoveFromFavorites = () => {
    removeFromFavorites(item.id);
  };

  // Mock play count (would come from actual data)
  const playCount = Math.floor(Math.random() * 100) + 20;

  return (
    <TouchableOpacity
      onPress={handlePlay}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.overlay.white12,
        borderRadius: radius(14),
        padding: wp(3),
        marginBottom: hp(1.2),
        borderWidth: 1,
        borderColor: colors.overlay.white15,
      }}
    >
      {/* Cover Image */}
      <View style={{ marginRight: wp(3) }}>
        {hasCover ? (
          <Image
            source={{ uri: item.metadata.coverUri }}
            style={{
              width: wp(14),
              height: wp(14),
              borderRadius: radius(10),
            }}
            resizeMode="cover"
          />
        ) : (
          <LinearGradient
            colors={
              (colors.gradient?.coverArt as [string, string]) || [
                "#a855f7",
                "#ec4899",
              ]
            }
            style={{
              width: wp(14),
              height: wp(14),
              borderRadius: radius(10),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Music2} size={wp(7)} color="#FFFFFF" />
          </LinearGradient>
        )}
      </View>

      {/* Song Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize(15),
            fontWeight: "700",
            marginBottom: hp(0.2),
          }}
          numberOfLines={1}
        >
          {item.metadata?.title || "Bilinmeyen Şarkı"}
        </Text>
        <Text
          style={{
            color: colors.textSecondary,
            fontSize: fontSize(12),
            marginBottom: hp(0.2),
          }}
          numberOfLines={1}
        >
          {item.metadata?.artist || "Bilinmeyen Sanatçı"}
          {item.metadata?.album ? ` • ${item.metadata.album}` : ""}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: wp(1) }}>
            <Icon name={Clock} size={fontSize(11)} color={colors.textSecondary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(11),
              }}
            >
              {formatTime(item.metadata?.duration || 0)}
            </Text>
          </View>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize(11),
            }}
          >
            •
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: wp(1) }}>
            <Icon name={Waves} size={fontSize(11)} color={colors.textSecondary} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(11),
              }}
            >
              {playCount} çalma
            </Text>
          </View>
        </View>
      </View>

      {/* Heart Icon */}
      <TouchableOpacity
        onPress={handleRemoveFromFavorites}
        activeOpacity={0.7}
        style={{
          padding: wp(1.5),
        }}
      >
        <Icon name={Heart} size={wp(5.5)} color={accent} fill={accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

