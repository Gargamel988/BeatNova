import React from "react";
import { View, TouchableOpacity } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Text } from "./text";
import { Icon } from "./icon";
import { AlertCircle, RefreshCw } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  showIcon?: boolean;
  fullScreen?: boolean;
}

export function ErrorState({
  title,
  message,
  onRetry,
  retryLabel,
  showIcon = true,
  fullScreen = false,
}: ErrorStateProps) {
  const { t } = useTranslation();
  const displayTitle = title ?? t("common.error");
  const displayMessage = message ?? t("assistant.errorMessage");
  const displayRetryLabel = retryLabel ?? t("common.retry");
  const { hp, wp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");
  const borderColor = useColor("border");

  const containerStyle = {
    flex: fullScreen ? 1 : undefined,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: fullScreen ? 0 : hp(4),
    paddingHorizontal: wp(10),
    gap: hp(2),
  };

  return (
    <View style={containerStyle}>
      {showIcon && (
        <View
          style={{
            width: wp(20),
            height: wp(20),
            borderRadius: radius(20),
            backgroundColor: cardBg,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: hp(1),
          }}
        >
          <Icon name={AlertCircle} size={wp(10)} color={textSecondary} />
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
        {displayTitle}
      </Text>
      
      {displayMessage && (
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(14),
            textAlign: "center",
            lineHeight: fontSize(20),
          }}
        >
          {displayMessage}
        </Text>
      )}

      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={displayRetryLabel}
          style={{
            marginTop: hp(1),
            backgroundColor: accent,
            paddingHorizontal: wp(6),
            paddingVertical: hp(1.5),
            minHeight: 48,
            borderRadius: radius(12),
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: wp(2),
          }}
        >
          <Icon name={RefreshCw} size={wp(5)} color="white" />
          <Text
            style={{
              color: "white",
              fontSize: fontSize(14),
              fontWeight: "600",
            }}
          >
            {displayRetryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

