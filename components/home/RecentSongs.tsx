import React from "react";
import { TouchableOpacity, View, Image } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Clock, Play, Music2 } from "lucide-react-native";
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

type RecentSongsProps = {
  songs: Song[];
  onPlaySong: (assetId: string) => void;
};

export default function RecentSongs({ songs, onPlaySong }: RecentSongsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");

  if (!songs || songs.length === 0) {
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
          <Icon name={Clock} size={24} color={textPrimary} />
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(22),
              fontWeight: "800",
            }}
          >
            Son Çalınanlar
          </Text>
        </View>
      </View>
      <View style={{ gap: hp(1.2) }}>
        {songs.map((song, index) => (
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
                  backgroundColor: accent,
                  borderRadius: radius(8),
                  width: 20,
                  height: 20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: accentForeground,
                    fontSize: fontSize(10),
                    fontWeight: "800",
                  }}
                >
                  {index + 1}
                </Text>
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

