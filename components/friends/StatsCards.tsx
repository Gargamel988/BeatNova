import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Users, Music2, UserPlus } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";

interface StatsCardsProps {
  totalFriends: number;
  activeFriends: number;
  pendingRequests: number;
}

export function StatsCards({
  totalFriends,
  activeFriends,
  pendingRequests,
}: StatsCardsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");

  return (
    <View
      style={{
        flexDirection: "row",
        gap: wp(3),
        marginBottom: hp(2),
      }}
    >
      <View
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
        <Icon name={Users} size={22} color={accent} />
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(20),
            fontWeight: "800",
          }}
        >
          {totalFriends}
        </Text>
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(12),
          }}
        >
          Toplam
        </Text>
      </View>

      <View
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
        <Icon name={Music2} size={22} color={accent} />
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(20),
            fontWeight: "800",
          }}
        >
          {activeFriends}
        </Text>
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(12),
          }}
        >
          Aktif
        </Text>
      </View>

      <View
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
        <Icon name={UserPlus} size={22} color={accent} />
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(20),
            fontWeight: "800",
          }}
        >
          {pendingRequests}
        </Text>
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(12),
          }}
        >
          İstek
        </Text>
      </View>
    </View>
  );
}

