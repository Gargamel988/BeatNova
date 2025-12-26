import React from "react";
import { TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Icon } from "@/components/ui/icon";
import { ListMusic } from "lucide-react-native";
import { Href, router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { formatTime } from "@/utils/format";

type Playlist = {
  id: string;
  name: string;
  song_count?: number;
  duration?: number;
};

type PinnedPlaylistsProps = {
  playlists: Playlist[];
  onPlayPlaylist: (playlist: Playlist) => void;
};

export default function PinnedPlaylists({ playlists, onPlayPlaylist }: PinnedPlaylistsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  if (playlists.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: hp(3) }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: hp(1.5),
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
          <Icon name={ListMusic} size={24} color={textPrimary} />
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(22),
              fontWeight: "800",
            }}
          >
            Öne Çıkanlar
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(drawer)/(tabs)/PlayList" as Href)}
        >
          <Text
            style={{
              color: accent,
              fontSize: fontSize(13),
              fontWeight: "600",
            }}
          >
            Tümünü Gör
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: wp(3) }}
      >
        {playlists.map((playlist) => (
          <TouchableOpacity
            key={playlist.id}
            activeOpacity={0.9}
            style={{
              width: wp(60),
              backgroundColor: cardBg,
              borderRadius: radius(16),
              padding: wp(4),
              borderWidth: 1,
              borderColor,
            }}
            onPress={() =>
              onPlayPlaylist(playlist)
            }
          >
            <View
              style={{
                width: "100%",
                height: wp(35),
                borderRadius: radius(12),
                backgroundColor: accent,
                marginBottom: hp(1.5),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={ListMusic} size={40} color={accentForeground} />
            </View>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(16),
                fontWeight: "700",
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {playlist.name}
            </Text>
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(12),
              }}
            >
              {playlist.song_count || 0} şarkı • {formatTime(playlist.duration || 0)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

