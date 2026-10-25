import React from "react";
import { Text, TouchableOpacity } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

type GoogleSignInProps = {
  text: string;
};

const GoogleSignIn: React.FC<GoogleSignInProps> = ({ text }) => {
  const { t } = useTranslation();
  const { radius, fontSize, hp } = useResponsive();
  const { palette } = useThemeModeContext();
  const { handleGoogleSignIn, loading } = useGoogleAuth();

  return (
    <TouchableOpacity
      style={{
        borderRadius: radius(12),
        paddingVertical: hp(1.5),
        backgroundColor: palette.purple,
        marginVertical: hp(1),
        marginBottom: hp(2),
      }}
      onPress={handleGoogleSignIn}
      disabled={loading}
      activeOpacity={0.8}
    >
      <Text
        style={{
          fontSize: fontSize(20),
          fontWeight: "bold",
          color: palette.primaryForeground,
          textAlign: "center",
        }}
      >
        {loading ? t("auth.googleLoading", "Google ile Oturum Açılıyor...") : text}
      </Text>
    </TouchableOpacity>
  );
};

export default GoogleSignIn;
