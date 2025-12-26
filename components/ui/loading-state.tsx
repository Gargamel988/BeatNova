import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";

interface LoadingStateProps {
  message?: string;
  size?: "small" | "large";
  showIcon?: boolean;
  fullScreen?: boolean;
}

export function LoadingState({
  message = "Yükleniyor...",
  size = "large",
  showIcon = true,
  fullScreen = false,
}: LoadingStateProps) {
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
      {message && (
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(14),
            textAlign: "center",
          }}
        >
          {message}
        </Text>
      )}
    </View>
  );
}

