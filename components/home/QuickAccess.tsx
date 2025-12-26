import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Music2, ListMusic, BarChart3, Heart } from "lucide-react-native";
import { Href, router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type QuickAccessProps = {
  songsCount: number;
  playlistsCount: number;
  favoritesCount: number;
};

export default function QuickAccess({
  songsCount,
  playlistsCount,
  favoritesCount,
}: QuickAccessProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");

  const quickAccessItems = [
    {
      title: "Tüm Şarkılar",
      icon: Music2,
      href: "/(drawer)/(tabs)/songs" as Href,
      subtitle: `${songsCount} şarkı`,
    },
    {
      title: "Playlistler",
      icon: ListMusic,
      href: "/(drawer)/(tabs)/PlayList" as Href,
      subtitle: `${playlistsCount} liste`,
    },
    {
      title: "İstatistikler",
      icon: BarChart3,
      href: "/(drawer)/Statistic" as Href,
      subtitle: "Detayları gör",
    },
    {
      title: "Favoriler",
      icon: Heart,
      href: "/(drawer)/Favorite" as Href,
      subtitle: `${favoritesCount} favori`,
    },
  ];

  return (
    <View style={{ marginBottom: hp(3) }}>
      <Text
        style={{
          color: textPrimary,
          fontSize: fontSize(22),
          fontWeight: "800",
          marginBottom: hp(1.5),
        }}
      >
        Hızlı Erişim
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: wp(3),
        }}
      >
        {quickAccessItems.map((item) => (
          <TouchableOpacity
            key={item.title}
            activeOpacity={0.9}
            style={{
              width: wp(43),
              backgroundColor: cardBg,
              borderRadius: radius(16),
              padding: wp(4),
              borderWidth: 1,
              borderColor,
              gap: hp(1.5),
            }}
            onPress={() => router.push(item.href)}
          >
            <View
              style={{
                width: wp(12),
                height: wp(12),
                borderRadius: radius(12),
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={item.icon} size={24} color={accent} />
            </View>
            <View>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(16),
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(12),
                }}
              >
                {item.subtitle}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

