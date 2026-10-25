import React from "react";
import { TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { BarChart3 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";

export function HomeHeaderComponent() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");

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
      <TouchableOpacity
        onPress={() => {
          router.push("/statistic" as any);
        }}
        className="items-center justify-center"
        style={{
          width: wp(12),
          height: wp(12),
          borderRadius: radius(12),
          backgroundColor: cardBg,
          borderWidth: 1,
          borderColor,
        }}
        activeOpacity={0.7}
        accessibilityLabel={t("stats.title", "İstatistikler")}
      >
        <Icon name={BarChart3} size={22} color={textPrimary} />
      </TouchableOpacity>
    </View>
  );
}

export default React.memo(HomeHeaderComponent);


