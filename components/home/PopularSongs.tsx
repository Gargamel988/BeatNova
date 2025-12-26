import React from "react";
import { TouchableOpacity, Image } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { TrendingUp, Play, Music2 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type Song = {
  id: string;
  assetId: string;
  title: string;
  artist: string;
  cover?: string;
  duration?: number;
};

type PopularSongsProps = {
  songs: Song[];
  onPlaySong: (assetId: string) => void;
};

export default function PopularSongs({ songs, onPlaySong }: PopularSongsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");

  if (songs.length === 0) {
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
          <Icon name={TrendingUp} size={24} color={textPrimary} />
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(22),
              fontWeight: "800",
            }}
          >
            En Çok Dinlenenler
          </Text>
        </View>
      </View>
      <View style={{ gap: hp(1.2) }}>
        {songs.map((song) => (
          <TouchableOpacity
            key={song.id}
            activeOpacity={0.9}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: cardBg,
              borderRadius: radius(16),
              padding: wp(3),
              borderWidth: 1,
              borderColor,
              gap: wp(3),
            }}
            onPress={() => onPlaySong(song.assetId)}
          >
            <View style={{ position: "relative" }}>
              {song.cover ? (
                <Image
                  source={{ uri: song.cover }}
                  style={{
                    width: wp(16),
                    height: wp(16),
                    borderRadius: radius(12),
                  }}
                />
              ) : (
                <View
                  style={{
                    width: wp(16),
                    height: wp(16),
                    borderRadius: radius(12),
                    backgroundColor: accent,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={Music2} size={20} color={accentForeground} />
                </View>
              )}
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  left: -4,
                  backgroundColor: "#FF9F0A",
                  borderRadius: radius(8),
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={TrendingUp} size={12} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(15),
                  fontWeight: "700",
                  marginBottom: 2,
                }}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(13),
                }}
                numberOfLines={1}
              >
                {song.artist}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                backgroundColor: accent,
                borderRadius: radius(10),
                padding: wp(2),
              }}
              onPress={() => onPlaySong(song.assetId)}
            >
              <Icon name={Play} size={18} color={accentForeground} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

