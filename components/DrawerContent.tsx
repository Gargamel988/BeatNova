import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { ThemeModeContext } from "@/providers/theme-provider";
import { Colors } from "@/theme/colors";
import { Icon } from "@/components/ui/icon";
import { useProfile } from "@/hooks/useProfil";
import { useAuth } from "@/hooks/useAuth";
import { router, usePathname } from "expo-router";
import {
  User,
  BarChart3,
  Heart,
  LogOut,
  X,
  Home,
  Palette,
} from "lucide-react-native";
import Animated, { FadeInDown, FadeInRight } from "react-native-reanimated";

interface DrawerItem {
  title: string;
  icon: any;
  route: string;
  onPress?: () => void;
}

interface DrawerContentProps {
  onClose?: () => void;
  [key: string]: any; // Expo Router Drawer props
}

export default function DrawerContent(props: DrawerContentProps) {
  const { onClose } = props;
  const { wp, hp, fontSize, radius } = useResponsive();

  // ThemeProvider context'ini güvenli bir şekilde kullan
  const themeContext = React.useContext(ThemeModeContext);
  const palette = themeContext?.palette || Colors.system;
  const { profile } = useProfile();
  const { logout } = useAuth();
  const pathname = usePathname();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const primary = useColor("primary");

  const drawerItems: DrawerItem[] = [
    {
      title: "Ana Sayfa",
      icon: Home,
      route: "/(drawer)/(tabs)",
    },
    {
      title: "Profil",
      icon: User,
      route: "/(drawer)/Profile",
    },
    {
      title: "İstatistikler",
      icon: BarChart3,
      route: "/(drawer)/Statistic",
    },

    {
      title: "Favoriler",
      icon: Heart,
      route: "/(drawer)/Favorite",
    },
    {
      title: "Tema Önizleme",
      icon: Palette,
      route: "/(drawer)/Theme",
    },
  ];

  const isActive = (route: string) => {
    if (route === "/(drawer)/(tabs)") {
      return (
        pathname === "/(drawer)/(tabs)" || pathname === "/(drawer)/(tabs)/"
      );
    }
    return pathname?.includes(route);
  };

  const handleNavigation = (route: string) => {
    router.push(route as any);
    onClose?.();
  };

  const handleLogout = async () => {
    await logout();
    onClose?.();
  };

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            entering={FadeInRight.duration(300).delay(100)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: hp(3),
            }}
          >
            <View>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(28),
                  fontWeight: "900",
                  letterSpacing: -0.5,
                }}
              >
                BeatNova
              </Text>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(12),
                  marginTop: 2,
                }}
              >
                Müzik Deneyimin
              </Text>
            </View>
            {onClose && (
              <TouchableOpacity
                onPress={onClose}
                style={{
                  width: wp(11),
                  height: wp(11),
                  borderRadius: radius(10),
                  backgroundColor: cardBg,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor,
                }}
                activeOpacity={0.7}
              >
                <Icon name={X} size={20} color={textPrimary} />
              </TouchableOpacity>
            )}
          </Animated.View>

          {/* User Profile Section */}
          <Animated.View
            entering={FadeInDown.duration(400).delay(150)}
            style={{
              marginBottom: hp(3),
            }}
          >
            <LinearGradient
              colors={[backgroundMid, backgroundEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: radius(20),
                padding: wp(5),
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: wp(4),
                }}
              >
                <LinearGradient
                  colors={[backgroundStart, backgroundEnd]}
                  style={{
                    width: wp(18),
                    height: wp(18),
                    borderRadius: radius(16),
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 2,
                    borderColor: "rgba(255, 255, 255, 0.3)",
                  }}
                >
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(22),
                      fontWeight: "800",
                    }}
                  >
                    {getUserInitials(profile?.data?.display_name)}
                  </Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(20),
                      fontWeight: "800",
                      marginBottom: 4,
                    }}
                  >
                    {profile?.data?.display_name || "Kullanıcı"}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.85)",
                      fontSize: fontSize(13),
                    }}
                    numberOfLines={1}
                  >
                    {profile?.data?.bio || "Müzik tutkunu"}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Drawer Items */}
          <View style={{ gap: hp(1.2) }}>
            {drawerItems.map((item, index) => {
              const active = isActive(item.route);
              return (
                <Animated.View
                  key={item.title}
                  entering={FadeInDown.duration(300).delay(200 + index * 50)}
                >
                  <TouchableOpacity
                    onPress={() => handleNavigation(item.route)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: wp(4.5),
                      backgroundColor: active
                        ? "rgba(147, 51, 234, 0.2)"
                        : cardBg,
                      borderRadius: radius(14),
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? primary : borderColor,
                      gap: wp(3.5),
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        width: wp(10),
                        height: wp(10),
                        borderRadius: radius(10),
                        backgroundColor: active
                          ? primary
                          : "rgba(147, 51, 234, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon
                        name={item.icon}
                        size={20}
                        color={active ? "#FFFFFF" : palette.purple}
                      />
                    </View>
                    <Text
                      style={{
                        color: active ? primary : textPrimary,
                        fontSize: fontSize(16),
                        fontWeight: active ? "700" : "600",
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </Text>
                    {active && (
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: primary,
                        }}
                      />
                    )}
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>

          {/* Logout Button */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(600)}
            style={{ marginTop: hp(2) }}
          >
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: wp(4.5),
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                borderRadius: radius(14),
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.4)",
                gap: wp(3.5),
              }}
              activeOpacity={0.7}
            >
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={LogOut} size={20} color="#EF4444" />
              </View>
              <Text
                style={{
                  color: "#EF4444",
                  fontSize: fontSize(16),
                  fontWeight: "700",
                  flex: 1,
                }}
              >
                Çıkış Yap
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
