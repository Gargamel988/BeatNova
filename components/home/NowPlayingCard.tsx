import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Play, Music2 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Song } from "@/components/songs/songsService";

type NowPlayingCardProps = {
  activeSong: Song | null;
};

export default function NowPlayingCard({ activeSong }: NowPlayingCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");

  if (!activeSong) {
    return null;
  }

  return (
    <View
      className="flex-row items-center gap-3"
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(20),
        padding: wp(4),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor,
        gap: wp(3),
      }}
    >
      <View
      className="items-center justify-center"
        style={{
          width: wp(16),
          height: wp(16),
          borderRadius: radius(12),
          backgroundColor: accent,
        }}
      >
        <Icon name={Music2} size={24} color={accentForeground} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(12),
            marginBottom: 2,
          }}
        >
          Şu an çalıyor
        </Text>
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(16),
            fontWeight: "700",
          }}
          numberOfLines={1}
        >
          {activeSong.metadata?.title || "Bilinmeyen Şarkı"}
        </Text>
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(13),
          }}
          numberOfLines={1}
        >
          {activeSong.metadata?.artist || "Bilinmeyen Sanatçı"}
        </Text>
      </View>
      <View
        className="items-center justify-center"
        style={{
          width: wp(12),
          height: wp(12),
          borderRadius: radius(10),
          backgroundColor: accent,
        }}
      >
        <Icon name={Play} size={20} color={accentForeground} />
      </View>
    </View>
  );
}

