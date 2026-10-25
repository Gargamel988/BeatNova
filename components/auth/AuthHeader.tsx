import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Music, ArrowLeft, type LucideIcon } from "lucide-react-native";
import { router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import { LanguageSelector } from "@/components/LanguageSelector";

type AuthHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  showBackButton?: boolean;
  onBackPress?: () => void;
  showLanguageSelector?: boolean;
};

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  title,
  subtitle,
  icon: IconComponent = Music,
  showBackButton = false,
  onBackPress,
  showLanguageSelector = true,
}) => {
  const { wp, hp, fontSize, radius } = useResponsive();
  const iconBackground = useColor("authIconBackground");
  const primaryText = useColor("authPrimaryText");
  const secondaryText = useColor("authSecondaryText");

  const handleBack = onBackPress ?? (() => router.back());

  return (
    <View style={{ marginBottom: hp(4) }}>
      {/* Üst Bar (Geri Butonu & Dil Seçici) */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: showBackButton ? "space-between" : "flex-end",
          alignItems: "center",
          marginBottom: hp(2),
        }}
      >
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              padding: wp(2),
              borderRadius: radius(99),
              backgroundColor: iconBackground,
            }}
          >
            <Icon name={ArrowLeft} size={wp(5)} color={primaryText} />
          </TouchableOpacity>
        ) : null}

        {showLanguageSelector ? <LanguageSelector compact={false} /> : null}
      </View>

      {/* Logo ve Başlık */}
      <View style={{ alignItems: "center" }}>
        <View
          style={{
            width: wp(20),
            height: wp(20),
            borderRadius: radius(16),
            backgroundColor: iconBackground,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: hp(2),
          }}
        >
          <Icon name={IconComponent} size={wp(10)} color={primaryText} />
        </View>

        <Text
          style={{
            fontSize: fontSize(24),
            color: primaryText,
            fontWeight: "bold",
            marginBottom: hp(0.8),
            textAlign: "center",
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              fontSize: fontSize(14),
              color: secondaryText,
              textAlign: "center",
              lineHeight: fontSize(20),
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
};
