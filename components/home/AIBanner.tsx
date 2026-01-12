import React from "react";
import { TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Sparkles, ArrowRight } from "lucide-react-native";
import { router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

export default function AIBanner() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const handlePress = () => {
    router.push("/(drawer)/(tabs)/MusicAssistant");
  };

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={handlePress}
      style={{
        marginBottom: hp(3),
      }}
    >
      <LinearGradient
        colors={colors.gradient.purplePink as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: radius(20),
          padding: wp(5),
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Arka plan dekoratif elementler */}
        <View
          style={{
            position: "absolute",
            top: -wp(10),
            right: -wp(10),
            width: wp(40),
            height: wp(40),
            borderRadius: wp(20),
            backgroundColor: colors.overlay.white08,
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -wp(8),
            left: -wp(8),
            width: wp(30),
            height: wp(30),
            borderRadius: wp(15),
            backgroundColor: colors.overlay.white08,
          }}
        />

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: hp(1),
                gap: wp(2),
              }}
            >
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: colors.overlay.white20,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Sparkles} size={24} color={colors.text} />
              </View>
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(14),
                  fontWeight: "600",
                  opacity: 0.9,
                }}
              >
                YAPAY ZEKA
              </Text>
            </View>
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(24),
                fontWeight: "800",
                marginBottom: hp(0.5),
              }}
            >
              Müzik Asistanı
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(14),
                opacity: 0.9,
                lineHeight: fontSize(20),
              }}
            >
              AI ile sana özel şarkı önerileri al
            </Text>
          </View>

          <View
            style={{
              width: wp(14),
              height: wp(14),
              borderRadius: radius(14),
              backgroundColor: colors.overlay.white20,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: wp(3),
            }}
          >
            <Icon name={ArrowRight} size={28} color={colors.text} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

