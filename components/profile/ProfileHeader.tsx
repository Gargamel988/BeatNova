import React from "react";
import { TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Edit3 } from "lucide-react-native";

interface ProfileHeaderProps {
  displayName?: string;
  bio?: string;
  avatarUrl?: string;
  onEditPress: () => void;
}

export function ProfileHeader({
  displayName,
  bio,
  avatarUrl,
  onEditPress,
}: ProfileHeaderProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const accent = useColor("accent");
  const primary = useColor("primary");

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(200).springify()}
      style={{
        marginBottom: hp(4),
      }}
    >
      <LinearGradient
        colors={[cardBg, `${cardBg}CC`]}
        style={{
          borderRadius: radius(24),
          padding: wp(6),
          borderWidth: 1,
          borderColor,
          alignItems: "center",
        }}
      >
        {/* Avatar with gradient border */}
        <View
          style={{
            width: wp(32),
            height: wp(32),
            borderRadius: radius(20),
            marginBottom: hp(2.5),
            padding: wp(0.5),
            backgroundColor: "transparent",
          }}
        >
          <LinearGradient
            colors={[primary, accent]}
            style={{
              width: "100%",
              height: "100%",
              borderRadius: radius(20),
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: radius(20),
                }}
              />
            ) : (
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: fontSize(40),
                  fontWeight: "800",
                }}
              >
                {getUserInitials(displayName)}
              </Text>
            )}
          </LinearGradient>
        </View>

        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(28),
            fontWeight: "800",
            marginBottom: hp(0.5),
            textAlign: "center",
          }}
        >
          {displayName || "Kullanıcı"}
        </Text>

        {bio ? (
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(15),
              textAlign: "center",
              marginBottom: hp(3),
              lineHeight: fontSize(22),
              paddingHorizontal: wp(2),
            }}
          >
            {bio}
          </Text>
        ) : (
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(14),
              textAlign: "center",
              marginBottom: hp(3),
              fontStyle: "italic",
              opacity: 0.6,
            }}
          >
            Bio eklenmemiş
          </Text>
        )}

        <TouchableOpacity
          onPress={onEditPress}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2),
            paddingHorizontal: wp(6),
            paddingVertical: hp(1.5),
            borderRadius: radius(16),
            overflow: "hidden",
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[primary, accent]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
            }}
          />
          <Icon name={Edit3} size={18} color="#FFFFFF" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: fontSize(15),
              fontWeight: "700",
            }}
          >
            Profili Düzenle
          </Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

