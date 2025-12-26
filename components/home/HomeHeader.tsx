import React from "react";
import { TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Menu } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useNavigation } from "expo-router";

export default function HomeHeader() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const navigation = useNavigation();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi günler";
    return "İyi akşamlar";
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
            Müzik Keyfin Başlasın
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => {
            // @ts-ignore
            navigation.openDrawer?.();
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
        >
          <Icon name={Menu} size={24} color={textPrimary} />
        </TouchableOpacity>
      </View>
  );
}

