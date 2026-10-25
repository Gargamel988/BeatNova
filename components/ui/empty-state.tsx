import React from "react";
import { View } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";
import { Music2, Search, Inbox, ListMusic } from "lucide-react-native";
import { useTranslation } from "react-i18next";

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
  title,
  message,
  icon = "music",
  showIcon = true,
  fullScreen = false,
}: EmptyStateProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("common.noData");
  const displayMessage = message ?? t("common.noDataDesc", { defaultValue: "Henüz içerik eklenmemiş." });
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
        {displayTitle}
      </Text>
      <Text
        style={{
          fontSize: fontSize(14),
          color: textSecondary,
          textAlign: "center",
          lineHeight: fontSize(20),
        }}
      >
        {displayMessage}
      </Text>
    </View>
  );
}
