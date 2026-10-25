import React from "react";
import { View, Text, TouchableOpacity, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { ButtonSpinner } from "@/components/ui/spinner";

type AuthSubmitButtonProps = {
  title: string;
  loadingTitle?: string;
  isLoading?: boolean;
  disabled?: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const AuthSubmitButton: React.FC<AuthSubmitButtonProps> = ({
  title,
  loadingTitle,
  isLoading = false,
  disabled = false,
  onPress,
  style,
}) => {
  const { wp, hp, fontSize, radius } = useResponsive();
  const buttonGradientStart = useColor("authButtonGradientStart");
  const buttonGradientEnd = useColor("authButtonGradientEnd");
  const buttonTextColor = useColor("authButtonText");

  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={style}
    >
      <LinearGradient
        colors={[buttonGradientStart, buttonGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingVertical: hp(2),
          borderRadius: radius(12),
          alignItems: "center",
          justifyContent: "center",
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        {isLoading ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
            <ButtonSpinner size="sm" variant="circle" />
            <Text
              style={{
                fontSize: fontSize(16),
                color: buttonTextColor,
                fontWeight: "bold",
              }}
            >
              {loadingTitle ?? title}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontSize: fontSize(16),
              color: buttonTextColor,
              fontWeight: "bold",
            }}
          >
            {title}
          </Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};
