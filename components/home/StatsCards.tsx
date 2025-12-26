import React from "react";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Music2, ListMusic, Heart } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type StatsCardsProps = {
  totalSongs: number;
  totalPlaylists: number;
  totalFavorites: number;
};

export default function StatsCards({
  totalSongs,
  totalPlaylists,
  totalFavorites,
}: StatsCardsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");

  const stats = [
    {
      label: "Şarkı",
      value: totalSongs.toString(),
      icon: Music2,
      color: accent,
    },
    {
      label: "Playlist",
      value: totalPlaylists.toString(),
      icon: ListMusic,
      color: "#8B5CF6",
    },
    {
      label: "Favori",
      value: totalFavorites.toString(),
      icon: Heart,
      color: "#EF4444",
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        gap: wp(3),
        marginBottom: hp(3),
      }}
    >
      {stats.map((stat) => (
        <View
          key={stat.label}
          style={{
            flex: 1,
            backgroundColor: cardBg,
            borderRadius: radius(16),
            padding: wp(4),
            borderWidth: 1,
            borderColor,
            gap: hp(1),
          }}
        >
          <Icon name={stat.icon} size={22} color={stat.color} />
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(20),
              fontWeight: "800",
            }}
          >
            {stat.value}
          </Text>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
            }}
          >
            {stat.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

