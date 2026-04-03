import React, { useState } from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";
import { LinearGradient } from "expo-linear-gradient";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Settings, Shield, Radio, UserPlus, Music, Image as ImageIcon, ExternalLink } from "lucide-react-native";
import { useProfile } from "@/hooks/useProfil";
import * as MediaLibrary from "expo-media-library";
import { Linking, TouchableOpacity } from "react-native";
import { useEffect } from "react";

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
  const [musicStatus, setMusicStatus] = useState<string>("undetermined");
  const [photoStatus, setPhotoStatus] = useState<string>("undetermined");

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const music = await MediaLibrary.getPermissionsAsync();
    setMusicStatus(music.status);
    
    // Photo varken Android 13+ da READ_MEDIA_IMAGES gerekir ama MediaLibrary genel bakar
    setPhotoStatus(music.status);
  };

  const handleOpenSettings = async () => {
    await Linking.openSettings();
  };

  const handlePrivateToggle = async (value: boolean) => {
    setIsUpdatingPrivate(true);
    try {
      await mutateUpdateProfile.mutateAsync({
        is_private: value,
      });
    } catch (error) {
      // Error handling
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
      // Error handling
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
      // Error handling
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
            </View>
          </View>

          {/* Permission Management */}
          <View style={{ marginTop: hp(1), paddingTop: hp(2), borderTopWidth: 1, borderColor: `${borderColor}40` }}>
            <Text style={{ color: textPrimary, fontSize: fontSize(16), fontWeight: "800", marginBottom: hp(2) }}>
              İzin Yönetimi
            </Text>

            {/* Music Permission */}
            <TouchableOpacity 
              onPress={handleOpenSettings}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: hp(1.5),
                paddingHorizontal: wp(2),
                backgroundColor: `${primary}08`,
                borderRadius: radius(14),
                marginBottom: hp(1.5)
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
                <View style={{ width: wp(10), height: wp(10), borderRadius: radius(10), backgroundColor: `${primary}20`, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={Music} size={18} color={primary} />
                </View>
                <View>
                  <Text style={{ color: textPrimary, fontSize: fontSize(15), fontWeight: "700" }}>Müzik Kitaplığı</Text>
                  <Text style={{ color: musicStatus === 'granted' ? '#22c55e' : '#ef4444', fontSize: fontSize(12), fontWeight: "600" }}>
                    {musicStatus === 'granted' ? "Erişim Verildi" : "Erişim Yok (Ayarlara Git)"}
                  </Text>
                </View>
              </View>
              <Icon name={ExternalLink} size={16} color={textSecondary} />
            </TouchableOpacity>

            {/* Photo Permission */}
            <TouchableOpacity 
              onPress={handleOpenSettings}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingVertical: hp(1.5),
                paddingHorizontal: wp(2),
                backgroundColor: `${accent}08`,
                borderRadius: radius(14),
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
                <View style={{ width: wp(10), height: wp(10), borderRadius: radius(10), backgroundColor: `${accent}20`, alignItems: "center", justifyContent: "center" }}>
                  <Icon name={ImageIcon} size={18} color={accent} />
                </View>
                <View>
                  <Text style={{ color: textPrimary, fontSize: fontSize(15), fontWeight: "700" }}>Fotoğraf Kitaplığı</Text>
                  <Text style={{ color: photoStatus === 'granted' ? '#22c55e' : '#ef4444', fontSize: fontSize(12), fontWeight: "600" }}>
                    {photoStatus === 'granted' ? "Erişim Verildi" : "Erişim Yok (Ayarlara Git)"}
                  </Text>
                </View>
              </View>
              <Icon name={ExternalLink} size={16} color={textSecondary} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

