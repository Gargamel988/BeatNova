import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useTranslation } from "react-i18next";

export function HomeHeaderComponent() {
  const { t } = useTranslation();
  const { hp, fontSize } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.goodMorning", "Günaydın");
    if (hour < 18) return t("home.goodAfternoon", "İyi günler");
    return t("home.goodEvening", "İyi akşamlar");
  };

  return (
    <View
      className="flex-row items-center justify-between "
      style={{
        paddingBottom: hp(2.5),
      }}
    >
      <View className="flex-1">
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(14),
            marginBottom: hp(0.5),
          }}
        >
          {getGreeting()}
        </Text>
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(32),
            fontWeight: "800",
          }}
        >
          {t("home.startMusic", "Müzik Keyfin Başlasın")}
        </Text>
      </View>

    </View>
  );
}

export default React.memo(HomeHeaderComponent);


