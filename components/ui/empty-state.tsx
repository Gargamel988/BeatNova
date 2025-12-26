import React from "react";
import { View } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";
import { Icon } from "./icon";
import { Music2, Search, Inbox, ListMusic } from "lucide-react-native";

type EmptyStateIcon = "music" | "search" | "inbox" | "playlist" | React.ComponentType<any>;

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: EmptyStateIcon;
  showIcon?: boolean;
  fullScreen?: boolean;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  music: Music2,
  search: Search,
  inbox: Inbox,
  playlist: ListMusic,
};

export function EmptyState({
  title = "Bulunamadı",
  message = "Henüz içerik eklenmemiş.",
  icon = "music",
  showIcon = true,
  fullScreen = false,
}: EmptyStateProps) {
  const { hp, wp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");

  const containerStyle = {
    flex: fullScreen ? 1 : undefined,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: fullScreen ? 0 : hp(4),
    paddingHorizontal: wp(10),
    gap: hp(2),
  };

  // Icon seçimi
  const IconComponent = typeof icon === "string" ? iconMap[icon] || Music2 : icon;

  return (
    <View style={containerStyle}>
      {showIcon && (
        <View
          style={{
            width: wp(24),
            height: wp(24),
            borderRadius: radius(24),
            backgroundColor: cardBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: hp(1),
          }}
        >
          <Icon name={IconComponent} size={wp(12)} color={textSecondary} />
        </View>
      )}
      
      <Text
        style={{
          color: textPrimary,
          fontSize: fontSize(18),
          fontWeight: "700",
          textAlign: "center",
          marginBottom: hp(0.5),
        }}
      >
        {title}
      </Text>
      
      {message && (
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(14),
            textAlign: "center",
            lineHeight: fontSize(20),
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

