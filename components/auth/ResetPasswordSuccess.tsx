import React from "react";
import { View, Text } from "react-native";
import { CheckCircle } from "lucide-react-native";
import { router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type ResetPasswordSuccessProps = {
  onBackToLogin?: () => void;
};

export const ResetPasswordSuccess: React.FC<ResetPasswordSuccessProps> = ({
  onBackToLogin,
}) => {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const iconBackground = useColor("authIconBackground");
  const primaryText = useColor("authPrimaryText");
  const secondaryText = useColor("authSecondaryText");
  const buttonGradientStart = useColor("authButtonGradientStart");

  const handleBack = onBackToLogin ?? (() => router.back());

  return (
    <View style={{ alignItems: "center", gap: hp(2) }}>
      <View
        style={{
          width: wp(20),
          height: wp(20),
          borderRadius: radius(20),
          backgroundColor: iconBackground,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: hp(1),
        }}
      >
        <Icon name={CheckCircle} size={wp(10)} color={buttonGradientStart} />
      </View>

      <Text
        style={{
          fontSize: fontSize(24),
          fontWeight: "700",
          color: primaryText,
          textAlign: "center",
          marginBottom: hp(0.5),
        }}
      >
        {t("auth.forgotPasswordTitle", "E-posta Gönderildi")}
      </Text>

      <Text
        style={{
          fontSize: fontSize(14),
          color: secondaryText,
          textAlign: "center",
          lineHeight: fontSize(20),
          marginBottom: hp(3),
        }}
      >
        {t(
          "auth.forgotPasswordSubtitle",
          "Şifre sıfırlama bağlantısı e-posta adresinize gönderildi."
        )}
      </Text>

      <Button
        onPress={handleBack}
        variant="default"
        style={{ width: "100%", maxWidth: wp(80) }}
      >
        {t("auth.backToLogin", "Giriş Sayfasına Dön")}
      </Button>
    </View>
  );
};
