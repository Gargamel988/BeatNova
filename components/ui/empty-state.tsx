import React from "react";
import { View } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";
import { Music2, Search, Inbox, ListMusic } from "lucide-react-native";

type EmptyStateIcon =
  | "music"
  | "search"
  | "inbox"
  | "playlist"
  | React.ComponentType<any>;

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
  const borderColor = useColor("border");

  // Icon seçimi
  const IconComponent =
    typeof icon === "string" ? iconMap[icon] || Music2 : icon;

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(16),
        borderWidth: 1,
        borderColor: borderColor,
        padding: wp(6),
        alignItems: "center",
        marginTop: hp(4),
      }}
    >
      <IconComponent size={wp(10)} color={textSecondary} />
      <Text
        style={{
          fontSize: fontSize(18),
          color: textPrimary,
          marginTop: hp(2),
          marginBottom: hp(1),
        }}
        className="font-bold text-center"
      >
        {title}
      </Text>
      <Text
        style={{
          fontSize: fontSize(14),
          color: textSecondary,
          textAlign: "center",
          lineHeight: fontSize(20),
        }}
      >
        {message}
      </Text>
    </View>
  );
}
