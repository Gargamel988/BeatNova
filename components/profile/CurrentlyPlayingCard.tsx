import React from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Music2 } from "lucide-react-native";

interface CurrentlyPlayingCardProps {
  currentSongId?: string | null;
}

export function CurrentlyPlayingCard({ currentSongId }: CurrentlyPlayingCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const primary = useColor("primary");
  const accent = useColor("accent");

  if (!currentSongId) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(300).springify()}
      style={{
        marginBottom: hp(3),
      }}
    >
      <LinearGradient
        colors={[`${primary}30`, `${accent}20`]}
        style={{
          borderRadius: radius(20),
          padding: wp(4.5),
          borderWidth: 1,
          borderColor: `${primary}50`,
          flexDirection: "row",
          alignItems: "center",
          gap: wp(3),
        }}
      >
        <LinearGradient
          colors={[primary, accent]}
          style={{
            width: wp(16),
            height: wp(16),
            borderRadius: radius(14),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name={Music2} size={24} color="#FFFFFF" />
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
              marginBottom: 4,
              fontWeight: "500",
            }}
          >
            Şu anda çalıyor
          </Text>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(17),
              fontWeight: "700",
            }}
            numberOfLines={1}
          >
            {currentSongId}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

