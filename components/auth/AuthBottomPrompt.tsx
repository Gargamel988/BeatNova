import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type AuthBottomPromptProps = {
  promptText: string;
  actionText: string;
  onActionPress: () => void;
};

export const AuthBottomPrompt: React.FC<AuthBottomPromptProps> = ({
  promptText,
  actionText,
  onActionPress,
}) => {
  const { wp, fontSize } = useResponsive();
  const secondaryText = useColor("authSecondaryText");
  const linkColor = useColor("authLink");

  return (
    <View style={{ alignItems: "center", marginTop: 8 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
        <Text
          style={{
            fontSize: fontSize(14),
            color: secondaryText,
          }}
        >
          {promptText}
        </Text>
        <TouchableOpacity onPress={onActionPress}>
          <Text
            style={{
              fontSize: fontSize(14),
              color: linkColor,
              fontWeight: "600",
              textDecorationLine: "underline",
            }}
          >
            {actionText}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
