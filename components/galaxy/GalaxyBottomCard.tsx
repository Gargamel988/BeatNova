import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
  SharedValue,
} from "react-native-reanimated";
import { Play, Music, MoreVertical } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import type { GalaxyStar } from "@/utils/buildGalaxy";

type GalaxyBottomCardProps = {
  star: GalaxyStar | null;
  isVisible: boolean;
  onPlay: (star: GalaxyStar) => void;
  onOptionsPress?: (star: GalaxyStar) => void;
  onClose: () => void;
  translateYValue: SharedValue<number>;
};

export const GalaxyBottomCard: React.FC<GalaxyBottomCardProps> = ({
  star,
  onPlay,
  onOptionsPress,
  translateYValue,
}) => {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const { t } = useTranslation();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateYValue.value }],
      opacity: translateYValue.value > 150 ? 0 : 1 - translateYValue.value / 200,
    };
  });

  if (!star) return null;

  const handlePlayPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPlay(star);
  };

  const getSecondaryInfo = () => {
    if (!star.played) {
      return t("galaxy.unplayed", { defaultValue: "Henüz dinlenmedi" });
    }
    const plays = star.play_count || 1;
    const countStr = t("galaxy.playsCount", {
      count: plays,
      defaultValue: `${plays} kez dinlendi`,
    });

    if (star.last_played_at) {
      try {
        const d = new Date(star.last_played_at);
        const now = new Date();
        const diffHours = Math.round((now.getTime() - d.getTime()) / (1000 * 60 * 60));
        if (diffHours < 24) {
          const hoursAgoStr = t("galaxy.hoursAgo", {
            count: Math.max(1, diffHours),
            defaultValue: `${Math.max(1, diffHours)}s önce`,
          });
          return `${countStr} · ${hoursAgoStr}`;
        }
        const diffDays = Math.round(diffHours / 24);
        const daysAgoStr = t("galaxy.daysAgo", {
          count: Math.max(1, diffDays),
          defaultValue: `${Math.max(1, diffDays)}g önce`,
        });
        return `${countStr} · ${daysAgoStr}`;
      } catch {
        return countStr;
      }
    }
    return countStr;
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        {
          position: "absolute",
          bottom: hp(3.5),
          left: wp(4),
          right: wp(4),
          zIndex: 100,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          backgroundColor: "#0F1420EE",
          borderRadius: radius(16),
          borderWidth: 1,
          borderColor: colors.border + "40",
          paddingHorizontal: wp(4),
          paddingVertical: hp(1.4),
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.45,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        {/* Parlayan Gezegen Küresi / Album Cover */}
        <View
          style={{
            width: wp(13),
            height: wp(13),
            borderRadius: wp(6.5),
            backgroundColor: "#1B2234",
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            marginEnd: wp(3),
            borderWidth: 2,
            borderColor: star.color,
            shadowColor: star.color,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.85,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          {star.coverUri ? (
            <Image
              source={{ uri: star.coverUri }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="cover"
            />
          ) : (
            <Music size={wp(6)} color={star.color} />
          )}
        </View>

        {/* Title, Artist, Secondary Info */}
        <View style={{ flex: 1, paddingEnd: wp(3), justifyContent: "center" }}>
          <Text
            numberOfLines={1}
            style={{
              color: "#FFFFFF",
              fontSize: fontSize(15),
              fontWeight: "600",
              letterSpacing: -0.2,
            }}
          >
            {star.title}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: fontSize(12.5),
              fontWeight: "400",
              marginTop: 1,
            }}
          >
            {star.artist}
          </Text>
          <Text
            numberOfLines={1}
            style={{
              color: star.played ? star.color : "rgba(255,255,255,0.45)",
              fontSize: fontSize(11),
              fontWeight: "400",
              marginTop: 2,
            }}
          >
            {getSecondaryInfo()}
          </Text>
        </View>

        {/* Actions: 3 Nokta & Çal */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
          {onOptionsPress ? (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOptionsPress(star);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Daha fazla seçenek"
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: "rgba(255, 255, 255, 0.08)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.12)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MoreVertical size={18} color="#FFFFFF" />
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            onPress={handlePlayPress}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t("galaxy.play", { defaultValue: "Çal" })}
            style={{
              backgroundColor: colors.primary,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: wp(4),
              paddingVertical: hp(1.1),
              borderRadius: radius(20),
              minHeight: 42,
              gap: wp(1.5),
            }}
          >
            <Play size={16} color="#FFFFFF" fill="#FFFFFF" />
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: fontSize(13.5),
                fontWeight: "600",
              }}
            >
              {t("galaxy.play", { defaultValue: "Çal" })}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};
