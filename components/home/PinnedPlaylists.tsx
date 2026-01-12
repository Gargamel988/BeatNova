import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { ScrollView } from "@/components/ui/scroll-view";
import { Icon } from "@/components/ui/icon";
import { ListMusic, Music2 } from "lucide-react-native";
import { Href, router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { formatTime } from "@/utils/format";

type Playlist = {
  id: string;
  name: string;
  song_count?: number;
  duration?: number;
  song_cover_urls?: string[];
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
        contentContainerStyle={{ gap: wp(3), paddingRight: wp(2) }}
      >
        {playlists.map((playlist) => {
          const hasCovers = playlist.song_cover_urls && playlist.song_cover_urls.length > 0;
          
          return (
            <TouchableOpacity
              key={playlist.id}
              activeOpacity={0.8}
              style={{
                width: wp(42),
                backgroundColor: cardBg,
                borderRadius: radius(18),
                padding: wp(3.5),
                borderWidth: 1,
                borderColor,
                gap: hp(1.2),
              }}
              onPress={() => onPlayPlaylist(playlist)}
            >
              {/* Cover Image Grid */}
              <View
                style={{
                  width: "100%",
                  aspectRatio: 1,
                  borderRadius: radius(14),
                  overflow: "hidden",
                  backgroundColor: cardBg,
                  flexDirection: "row",
                  flexWrap: "wrap",
                }}
              >
                {hasCovers ? (
                  [0, 1, 2, 3].map((index) => {
                    const coverUrl = playlist.song_cover_urls?.[index];
                    const hasCover = coverUrl && coverUrl.trim() !== "";
                    return (
                      <View
                        key={index}
                        style={{
                          width: "50%",
                          height: "50%",
                          borderWidth: 0.5,
                          borderColor: borderColor,
                        }}
                      >
                        {hasCover ? (
                          <Image
                            source={{ uri: coverUrl }}
                            style={{ width: "100%", height: "100%" }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: cardBg,
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Icon name={Music2} size={wp(6)} color={textSecondary} />
                          </View>
                        )}
                      </View>
                    );
                  })
                ) : (
                  <View
                    style={{
                      width: "100%",
                      height: "100%",
                      backgroundColor: cardBg,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={Music2} size={wp(12)} color={textSecondary} />
                  </View>
                )}
              </View>

              {/* Playlist Info */}
              <View style={{ gap: hp(0.3) }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(16),
                    fontWeight: "700",
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
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

