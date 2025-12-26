import React, { useMemo } from "react";
import { TouchableOpacity, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useProfile } from "@/hooks/useProfil";
import { useQueries } from "@tanstack/react-query";
import { getlisteninghistory } from "@/services/StatisticServices";
import { getFavorites } from "@/services/PlaylistServices";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { formathour } from "@/utils/format";
import { ScrollView } from "@/components/ui/scroll-view";
import {
  Music2,
  Clock,
  Heart,
  Settings,
  Lock,
  Eye,
  UserPlus,
  Headphones,
  Edit3,
  ArrowLeft,
} from "lucide-react-native";
import { router } from "expo-router";

export default function Profile() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { profile } = useProfile();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  const [listeningHistory, favorites, songs] = useQueries({
    queries: [
      {
        queryKey: ["listeninghistory"],
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: ["favorites"],
        queryFn: () => getFavorites(),
      },
      {
        queryKey: ["songs"],
        queryFn: () => getAllSongsWithDetails(),
      },
    ],
  });

  const totalListeningTime = useMemo(
    () =>
      listeningHistory?.data?.reduce(
        (acc, item) => acc + (item.total_seconds || 0),
        0
      ) || 0,
    [listeningHistory?.data]
  );

  const totalSongs = songs?.data?.length || 0;
  const totalFavorites = favorites?.data?.length || 0;
  const totalPlays =
    listeningHistory?.data?.reduce(
      (acc, item) => acc + (item.play_count || 0),
      0
    ) || 0;

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const stats = [
    {
      label: "Toplam Dinleme",
      value: formathour(totalListeningTime),
      icon: Clock,
      color: "#667eea",
    },
    {
      label: "Şarkı Sayısı",
      value: totalSongs.toString(),
      icon: Music2,
      color: "#764ba2",
    },
    {
      label: "Favoriler",
      value: totalFavorites.toString(),
      icon: Heart,
      color: "#f093fb",
    },
    {
      label: "Toplam Çalma",
      value: totalPlays.toString(),
      icon: Headphones,
      color: "#4facfe",
    },
  ];

  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
            paddingBottom: hp(12),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: hp(2),
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: wp(11),
                height: wp(11),
                borderRadius: radius(10),
                backgroundColor: cardBg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: wp(3),
                borderWidth: 1,
                borderColor,
              }}
              activeOpacity={0.7}
            >
              <Icon name={ArrowLeft} size={22} color={textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(28),
                fontWeight: "900",
                letterSpacing: -0.5,
                flex: 1,
              }}
            >
              Profil
            </Text>
          </View>
          {/* Profile Header */}
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: radius(20),
              padding: wp(5),
              marginBottom: hp(3),
              borderWidth: 1,
              borderColor,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: wp(24),
                height: wp(24),
                borderRadius: radius(16),
                backgroundColor: palette.purple,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: hp(2),
              }}
            >
              {profile?.data?.avatar_url ? (
                <Image
                  source={{ uri: profile.data.avatar_url }}
                  style={{
                    width: wp(24),
                    height: wp(24),
                    borderRadius: radius(16),
                  }}
                />
              ) : (
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: fontSize(32),
                    fontWeight: "800",
                  }}
                >
                  {getUserInitials(profile?.data?.display_name)}
                </Text>
              )}
            </View>

            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(24),
                fontWeight: "800",
                marginBottom: hp(0.5),
              }}
            >
              {profile?.data?.display_name || "Kullanıcı"}
            </Text>

            {profile?.data?.bio && (
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(14),
                  textAlign: "center",
                  marginBottom: hp(2),
                }}
              >
                {profile.data.bio}
              </Text>
            )}

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: wp(2),
                backgroundColor: accent,
                paddingHorizontal: wp(4),
                paddingVertical: hp(1),
                borderRadius: radius(12),
              }}
            >
              <Icon name={Edit3} size={16} color={useColor("accentForeground")} />
              <Text
                style={{
                  color: useColor("accentForeground"),
                  fontSize: fontSize(14),
                  fontWeight: "600",
                }}
              >
                Profili Düzenle
              </Text>
            </TouchableOpacity>
          </View>

          {/* Stats Grid */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: wp(3),
              marginBottom: hp(3),
            }}
          >
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={{
                  width: wp(43),
                  backgroundColor: cardBg,
                  borderRadius: radius(16),
                  padding: wp(4),
                  borderWidth: 1,
                  borderColor,
                  gap: hp(1),
                }}
              >
                <View
                  style={{
                    width: wp(12),
                    height: wp(12),
                    borderRadius: radius(12),
                    backgroundColor: `${stat.color}20`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: hp(0.5),
                  }}
                >
                  <Icon name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(20),
                    fontWeight: "800",
                  }}
                >
                  {stat.value}
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                  }}
                >
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>

          {/* Currently Playing */}
          {profile?.data?.current_song_id && (
            <View
              style={{
                backgroundColor: cardBg,
                borderRadius: radius(16),
                padding: wp(4),
                marginBottom: hp(3),
                borderWidth: 1,
                borderColor,
                flexDirection: "row",
                alignItems: "center",
                gap: wp(3),
              }}
            >
              <View
                style={{
                  width: wp(16),
                  height: wp(16),
                  borderRadius: radius(12),
                  backgroundColor: accent,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Headphones} size={24} color={accentForeground} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    marginBottom: 2,
                  }}
                >
                  Şu anda çalıyor
                </Text>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(16),
                    fontWeight: "700",
                  }}
                  numberOfLines={1}
                >
                  {profile.data.current_song_id}
                </Text>
              </View>
            </View>
          )}

          {/* Profile Settings */}
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: radius(16),
              padding: wp(4),
              borderWidth: 1,
              borderColor,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: wp(2),
                marginBottom: hp(2),
              }}
            >
              <Icon name={Settings} size={20} color={accent} />
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(18),
                  fontWeight: "700",
                }}
              >
                Profil Ayarları
              </Text>
            </View>

            <View style={{ gap: hp(1.5) }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: hp(1),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                  <Icon name={Lock} size={18} color={textSecondary} />
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(14),
                      fontWeight: "600",
                    }}
                  >
                    Özel Profil
                  </Text>
                </View>
                <View
                  style={{
                    width: wp(12),
                    height: wp(6),
                    borderRadius: radius(12),
                    backgroundColor: profile?.data?.is_private
                      ? accent
                      : borderColor,
                    alignItems: profile?.data?.is_private ? "flex-end" : "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: wp(1),
                  }}
                >
                  <View
                    style={{
                      width: wp(5),
                      height: wp(5),
                      borderRadius: radius(10),
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: hp(1),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                  <Icon name={Eye} size={18} color={textSecondary} />
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(14),
                      fontWeight: "600",
                    }}
                  >
                    Çalan Şarkıyı Göster
                  </Text>
                </View>
                <View
                  style={{
                    width: wp(12),
                    height: wp(6),
                    borderRadius: radius(12),
                    backgroundColor: profile?.data?.show_current_song
                      ? accent
                      : borderColor,
                    alignItems: profile?.data?.show_current_song
                      ? "flex-end"
                      : "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: wp(1),
                  }}
                >
                  <View
                    style={{
                      width: wp(5),
                      height: wp(5),
                      borderRadius: radius(10),
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </View>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: hp(1),
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                  <Icon name={UserPlus} size={18} color={textSecondary} />
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(14),
                      fontWeight: "600",
                    }}
                  >
                    Arkadaş İsteklerini Kabul Et
                  </Text>
                </View>
                <View
                  style={{
                    width: wp(12),
                    height: wp(6),
                    borderRadius: radius(12),
                    backgroundColor: profile?.data?.allow_friend_requests
                      ? accent
                      : borderColor,
                    alignItems: profile?.data?.allow_friend_requests
                      ? "flex-end"
                      : "flex-start",
                    justifyContent: "center",
                    paddingHorizontal: wp(1),
                  }}
                >
                  <View
                    style={{
                      width: wp(5),
                      height: wp(5),
                      borderRadius: radius(10),
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
