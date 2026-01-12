import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import {
  Bell,
  Volume2,
  ChevronRight,
  BarChart3,
  Palette,
  Repeat,
  Shuffle,
  LogOut,
  PlayCircle,
  Info,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayerContext } from "@/providers/player-context";

export default function Settings() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const cardBg = useColor("card");

  // Audio hook'tan shuffle ve loopMode al
  const {
    shuffle: audioShuffle,
    loopMode: audioLoopMode,
    loop: updateLoopMode,
    isShuffled,
  } = useAudioPlayerContext();

  const [notifications, setNotifications] = useState(true);
  const [soundNormalization, setSoundNormalization] = useState(true);
  const [offlineMode, setOfflineMode] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const { logout } = useAuth();

  // Settings'i localStorage'dan bir kez yükle
  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem("appSettings");
        if (isMounted && saved) {
          const settings = JSON.parse(saved);
          setNotifications(settings.notifications ?? true);
          setSoundNormalization(settings.soundNormalization ?? true);
          setOfflineMode(settings.offlineMode ?? true);
          setAutoPlay(settings.autoPlay ?? false);
        }
        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (error) {
        console.error("Settings yüklenelemedi:", error);
        if (isMounted) {
          setIsLoaded(true);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  // Settings'i localStorage'a kaydet (sadece isLoaded true olunca)
  useEffect(() => {
    if (!isLoaded) return;

    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem(
          "appSettings",
          JSON.stringify({
            notifications,
            soundNormalization,
            offlineMode,
            autoPlay,
          })
        );
      } catch (error) {
        console.error("Settings kaydedilemedi:", error);
      }
    };

    saveSettings();
  }, [isLoaded, notifications, soundNormalization, offlineMode, autoPlay]);

  const handleLogout = useCallback(() => {
    Alert.alert(
      "Çıkış Yap",
      "Uygulamadan çıkış yapmak istediğinize emin misiniz?",
      [
        {
          text: "İptal",
          onPress: () => { },
          style: "cancel",
        },
        {
          text: "Çıkış Yap",
          onPress: async () => {
            if (isLoggingOut) return;

            setIsLoggingOut(true);
            try {
              await logout();
              router.replace("/(auth)/login");
            } catch (error: any) {
              Alert.alert(
                "Hata",
                error?.message || "Çıkış yapılırken bir hata oluştu"
              );
              setIsLoggingOut(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  }, [isLoggingOut, logout]);

  const handleLoopModeChange = useCallback(() => {
    const modes: ("all" | "one" | "none")[] = ["all", "one", "none"];
    const currentIndex = modes.indexOf(audioLoopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const nextMode = modes[nextIndex];

    updateLoopMode(nextMode);
  }, [audioLoopMode, updateLoopMode]);

  const handleShuffleChange = useCallback(
    (value: boolean) => {
      audioShuffle(value);
    },
    [audioShuffle]
  );

  const SettingItem = ({
    icon: Icon,
    title,
    subtitle,
    onPress,
    showToggle = false,
    toggleValue = false,
    onToggleChange,
    isDangerous = false,
  }: {
    icon: any;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showToggle?: boolean;
    toggleValue?: boolean;
    onToggleChange?: (value: boolean) => void;
    isDangerous?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      disabled={showToggle || isLoggingOut}
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(16),
        padding: wp(4),
        marginBottom: hp(1.5),
        flexDirection: "row",
        alignItems: "center",
        opacity: isLoggingOut ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: wp(12),
          height: wp(12),
          borderRadius: radius(12),
          backgroundColor: isDangerous
            ? palette.red + "20"
            : palette.primary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: wp(3),
        }}
      >
        <Icon
          size={wp(6)}
          color={isDangerous ? palette.red : palette.primary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: fontSize(15),
            fontWeight: "600",
            color: isDangerous ? palette.red : textPrimary,
            marginBottom: hp(0.3),
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: fontSize(13),
              color: textSecondary,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>
      {showToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggleChange}
          disabled={isLoggingOut}
          trackColor={{ false: "#767577", true: palette.primary }}
          thumbColor={toggleValue ? "#FFFFFF" : "#f4f3f4"}
        />
      ) : (
        <ChevronRight
          size={wp(5)}
          color={isDangerous ? palette.red : textSecondary}
        />
      )}
    </TouchableOpacity>
  );

  if (!isLoaded) {
    return (
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="flex-1 items-center justify-center">
          <Text style={{ color: textPrimary }}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: wp(4),
          paddingTop: hp(2.5),
          paddingBottom: hp(3),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View className="mb-6">
          <Text
            style={{
              fontSize: fontSize(28),
              fontWeight: "700",
              color: textPrimary,
              marginBottom: hp(0.5),
            }}
          >
            Ayarlar
          </Text>
          <Text
            style={{
              fontSize: fontSize(14),
              color: textSecondary,
            }}
          >
            Uygulamayı kişiselleştir
          </Text>
        </View>

        {/* Genel Section */}
        <Text
          style={{
            fontSize: fontSize(16),
            fontWeight: "600",
            color: textPrimary,
            marginBottom: hp(1.5),
            marginTop: hp(1),
          }}
        >
          Genel
        </Text>

        <SettingItem
          icon={Bell}
          title="Bildirimler"
          subtitle={notifications ? "Açık" : "Kapalı"}
          showToggle
          toggleValue={notifications}
          onToggleChange={setNotifications}
        />

        <SettingItem
          icon={Palette}
          title="Tema"
          subtitle="Görünümü değiştir"
          onPress={() => {
            router.push("/(drawer)/Theme");
          }}
        />

        <SettingItem
          icon={BarChart3}
          title="İstatistikler"
          subtitle="Dinleme istatistikleriniz"
          onPress={() => {
            router.push("/(drawer)/Statistic");
          }}
        />

        {/* Oynatma Section */}
        <Text
          style={{
            fontSize: fontSize(16),
            fontWeight: "600",
            color: textPrimary,
            marginBottom: hp(1.5),
            marginTop: hp(2),
          }}
        >
          Oynatma
        </Text>

        <SettingItem
          icon={Volume2}
          title="Ses Normalleştirme"
          subtitle="Tüm şarkıları aynı ses seviyesinde çal"
          showToggle
          toggleValue={soundNormalization}
          onToggleChange={setSoundNormalization}
        />

        <SettingItem
          icon={PlayCircle}
          title="Otomatik Oynatma"
          subtitle="Şarkı seçildiğinde otomatik başlat"
          showToggle
          toggleValue={autoPlay}
          onToggleChange={setAutoPlay}
        />

        <SettingItem
          icon={Repeat}
          title="Tekrar Modu"
          subtitle={
            audioLoopMode === "all"
              ? "Tüm liste"
              : audioLoopMode === "one"
                ? "Tek şarkı"
                : "Kapalı"
          }
          onPress={handleLoopModeChange}
        />

        <SettingItem
          icon={Shuffle}
          title="Karıştır"
          subtitle={isShuffled ? "Açık" : "Kapalı"}
          showToggle
          toggleValue={isShuffled}
          onToggleChange={handleShuffleChange}
        />

        {/* Diğer Section */}
        <Text
          style={{
            fontSize: fontSize(16),
            fontWeight: "600",
            color: textPrimary,
            marginBottom: hp(1.5),
            marginTop: hp(2),
          }}
        >
          Diğer
        </Text>

        <SettingItem
          icon={Info}
          title="Hakkında"
          subtitle="BeatNova v1.0.0"
          onPress={() => {
            Alert.alert(
              "BeatNova Hakkında",
              "BeatNova v1.0.0\n\nYapay zeka destekli müzik asistanı ile müzik keşfetmeyin. Türkçe şarkılardan uluslararası hitlere kadar geniş bir seçim.\n\n© 2024 BeatNova"
            );
          }}
        />

        <SettingItem
          icon={LogOut}
          title="Çıkış Yap"
          isDangerous
          onPress={handleLogout}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
