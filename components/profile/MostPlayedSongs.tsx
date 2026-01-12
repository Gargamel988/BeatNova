import React from "react";
import { Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Music2 } from "lucide-react-native";

interface Song {
  id: string | number;
  title: string;
  artist: string;
  plays: number;
  cover: string | null;
}

interface MostPlayedSongsProps {
  songs: Song[];
}

export function MostPlayedSongs({ songs }: MostPlayedSongsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const accent = useColor("accent");
  const primary = useColor("primary");

  if (songs.length === 0) return null;

  return (
    <Animated.View
      entering={FadeInUp.delay(600).springify()}
      style={{
        marginBottom: hp(3),
      }}
    >
      <LinearGradient
        colors={[cardBg, `${cardBg}CC`]}
        style={{
          borderRadius: radius(20),
          padding: wp(5),
          borderWidth: 1,
          borderColor,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2.5),
            marginBottom: hp(2.5),
          }}
        >
          <LinearGradient
            colors={[primary, accent]}
            style={{
              width: wp(10),
              height: wp(10),
              borderRadius: radius(12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Music2} size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(20),
              fontWeight: "800",
            }}
          >
            En Çok Dinlenen Şarkılar
          </Text>
        </View>

        <View style={{ gap: hp(1.5) }}>
          {songs.map((song, index) => (
            <View
              key={song.id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: wp(3),
                paddingVertical: hp(1.5),
                paddingHorizontal: wp(2),
                backgroundColor: `${primary}10`,
                borderRadius: radius(14),
              }}
            >
              <View
                style={{
                  width: wp(12),
                  height: wp(12),
                  borderRadius: radius(10),
                  backgroundColor: `${primary}25`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: primary,
                    fontSize: fontSize(18),
                    fontWeight: "800",
                  }}
                >
                  {index + 1}
                </Text>
              </View>
              {song.cover && (
                <Image
                  source={{ uri: song.cover }}
                  style={{
                    width: wp(12),
                    height: wp(12),
                    borderRadius: radius(10),
                  }}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(15),
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {song.title}
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(13),
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {song.artist}
                </Text>
              </View>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(12),
                  fontWeight: "600",
                }}
              >
                {song.plays}x
              </Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

