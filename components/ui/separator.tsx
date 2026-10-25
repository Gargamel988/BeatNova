import React from "react";
import { ViewStyle, TextStyle } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";

interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  style?: ViewStyle;
  text?: string;
  showText?: boolean;
  textStyle?: TextStyle;
}

export function Separator({
  orientation = "horizontal",
  style,
  text,
  showText = true,
  textStyle,
}: SeparatorProps) {
  const { t } = useTranslation();
  const borderColor = useColor("border");
  const secondaryText = useColor("authSecondaryText");
  const { wp, hp, fontSize } = useResponsive();

  const label = text ?? t("common.or", "veya");

  if (!showText || orientation === "vertical") {
    return (
      <View
        style={[
          {
            backgroundColor: borderColor,
            ...(orientation === "horizontal"
              ? { height: 1, width: "100%" }
              : { width: 1, height: hp(100) }),
          },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        },
        style,
      ]}
    >
      <View
        style={{
          backgroundColor: borderColor,
          height: 1,
          flex: 1,
        }}
      />
      <Text
        style={[
          {
            color: secondaryText,
            marginHorizontal: wp(3),
            fontSize: fontSize(13),
            fontWeight: "500",
            textTransform: "lowercase",
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
      <View
        style={{
          backgroundColor: borderColor,
          height: 1,
          flex: 1,
        }}
      />
    </View>
  );
}

export default Separator;
