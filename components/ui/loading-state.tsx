import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";
import { useTranslation } from "react-i18next";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "large";
  showIcon?: boolean;
  fullScreen?: boolean;
}

export function LoadingState({
  message,
  size = "large",
  showIcon = true,
  fullScreen = false,
}: LoadingStateProps) {
  const { t } = useTranslation();
  const displayMessage = message ?? t("common.loading");
  const { hp, wp, fontSize } = useResponsive();
  const accent = useColor("accent");
  const textSecondary = useColor("authSecondaryText");

  const containerStyle = {
    flex: fullScreen ? 1 : undefined,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: fullScreen ? 0 : hp(4),
    paddingHorizontal: wp(5),
    gap: hp(1.5),
  };

  return (
    <View style={containerStyle}>
      {showIcon && (
        <ActivityIndicator size={size} color={accent} />
      )}
      {displayMessage && (
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(14),
            textAlign: "center",
          }}
        >
          {displayMessage}
        </Text>
      )}
    </View>
  );
}

