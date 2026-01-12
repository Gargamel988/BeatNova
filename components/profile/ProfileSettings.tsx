import React, { useState } from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { LinearGradient } from "expo-linear-gradient";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Settings, Shield, Radio, UserPlus } from "lucide-react-native";
import { useProfile } from "@/hooks/useProfil";

interface ProfileSettingsProps {
  isPrivate?: boolean;
  showCurrentSong?: boolean;
  allowFriendRequests?: boolean;
}

export function ProfileSettings({
  isPrivate,
  showCurrentSong,
  allowFriendRequests,
}: ProfileSettingsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const accent = useColor("accent");
  const primary = useColor("primary");
  const { mutateUpdateProfile } = useProfile();
  
  const [isUpdatingPrivate, setIsUpdatingPrivate] = useState(false);
  const [isUpdatingShowSong, setIsUpdatingShowSong] = useState(false);
  const [isUpdatingFriendRequests, setIsUpdatingFriendRequests] = useState(false);

  const handlePrivateToggle = async (value: boolean) => {
    setIsUpdatingPrivate(true);
    try {
      await mutateUpdateProfile.mutateAsync({
        is_private: value,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingPrivate(false);
    }
  };

  const handleShowSongToggle = async (value: boolean) => {
    setIsUpdatingShowSong(true);
    try {
      await mutateUpdateProfile.mutateAsync({
        show_current_song: value,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingShowSong(false);
    }
  };

  const handleFriendRequestsToggle = async (value: boolean) => {
    setIsUpdatingFriendRequests(true);
    try {
      await mutateUpdateProfile.mutateAsync({
        allow_friend_requests: value,
      });
    } catch (error) {
      console.log(error);
    } finally {
      setIsUpdatingFriendRequests(false);
    }
  };
  return (
    <Animated.View
      entering={FadeInUp.delay(400).springify()}
      style={{
        marginBottom: hp(2),
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
            <Icon name={Settings} size={20} color="#FFFFFF" />
          </LinearGradient>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(20),
              fontWeight: "800",
            }}
          >
            Profil Ayarları
          </Text>
        </View>

        <View style={{ gap: hp(2) }}>
          {/* Private Profile Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: hp(1.5),
              paddingHorizontal: wp(2),
              backgroundColor: `${primary}10`,
              borderRadius: radius(14),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: `${primary}25`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Shield} size={18} color={primary} />
              </View>
              <View>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(15),
                    fontWeight: "700",
                  }}
                >
                  Özel Profil
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    marginTop: 2,
                  }}
                >
                  Profilini gizle
                </Text>
              </View>
            </View>
            <View style={{ opacity: isUpdatingPrivate ? 0.5 : 1 }}>
              <Switch
                value={isPrivate || false}
                onValueChange={handlePrivateToggle}
                disabled={isUpdatingPrivate}
                trackColor={{ false: `${borderColor}80`, true: primary }}
                ios_backgroundColor={`${borderColor}80`}
              />
            </View>
          </View>

          {/* Show Current Song Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: hp(1.5),
              paddingHorizontal: wp(2),
              backgroundColor: `${accent}10`,
              borderRadius: radius(14),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: `${accent}25`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Radio} size={18} color={accent} />
              </View>
              <View>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(15),
                    fontWeight: "700",
                  }}
                >
                  Çalan Şarkıyı Göster
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    marginTop: 2,
                  }}
                >
                  Aktif şarkıyı paylaş
                </Text>
              </View>
            </View>
            <View style={{ opacity: isUpdatingShowSong ? 0.5 : 1 }}>
              <Switch
                value={showCurrentSong || false}
                onValueChange={handleShowSongToggle}
                disabled={isUpdatingShowSong}
                trackColor={{ false: `${borderColor}80`, true: accent }}
                ios_backgroundColor={`${borderColor}80`}
              />
            </View>
          </View>

          {/* Allow Friend Requests Toggle */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: hp(1.5),
              paddingHorizontal: wp(2),
              backgroundColor: `${primary}10`,
              borderRadius: radius(14),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: `${primary}25`,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={UserPlus} size={18} color={primary} />
              </View>
              <View>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(15),
                    fontWeight: "700",
                  }}
                >
                  Arkadaş İstekleri
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    marginTop: 2,
                  }}
                >
                  İstekleri kabul et
                </Text>
              </View>
            </View>
            <View style={{ opacity: isUpdatingFriendRequests ? 0.5 : 1 }}>
              <Switch
                value={allowFriendRequests || false}
                onValueChange={handleFriendRequestsToggle}
                disabled={isUpdatingFriendRequests}
                trackColor={{ false: `${borderColor}80`, true: primary }}
                ios_backgroundColor={`${borderColor}80`}
              />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

