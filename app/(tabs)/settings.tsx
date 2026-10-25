import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ScrollView,
  Linking,
  AppState,
} from "react-native";
import { useConfirmDialog } from "@/components/ui/confirm-modal";
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
  PlayCircle,
  Info,
  Clock,
  Music,
  ImageIcon,
  Flag,
  LogOut,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAudioPlayerContext } from "@/providers/player-context";
import * as MediaLibrary from "expo-media-library";
import { LanguageSelector } from "@/components/LanguageSelector";
import { SleepTimerModal } from "@/components/settings/SleepTimerModal";
import EqualizerModal from "@/components/settings/EqualizerModal";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

const SETTINGS_KEY = "appSettings";
const LOOP_MODES = ["all", "one", "none"] as const;
const LOOP_LABEL_KEYS = {
  all: "settings.repeatAll",
  one: "settings.repeatOne",
  none: "settings.repeatOff",
} as const;

type AppSettings = {
  notifications: boolean;
  soundNormalization: boolean;
  autoPlay: boolean;
};

const DEFAULT_SETTINGS: AppSettings = {
  notifications: true,
  soundNormalization: true,
  autoPlay: false,
};

type SettingItemProps = {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showToggle?: boolean;
  toggleValue?: boolean;
  onToggleChange?: (value: boolean) => void;
  isDangerous?: boolean;
  disabled?: boolean;
};

function SettingItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  showToggle = false,
  toggleValue = false,
  onToggleChange,
  isDangerous = false,
  disabled = false,
}: SettingItemProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");

  const accent = isDangerous ? palette.red : palette.primary;

  return (
    <TouchableOpacity
      onPress={showToggle ? () => onToggleChange?.(!toggleValue) : onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessibilityRole={showToggle ? "switch" : "button"}
      accessibilityState={{
        disabled,
        checked: showToggle ? toggleValue : undefined,
      }}
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ""}`}
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(16),
        paddingHorizontal: wp(3.5),
        paddingVertical: hp(1.4),
        marginBottom: hp(1.2),
        minHeight: Math.max(62, hp(7.5)),
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: borderColor + "25",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <View
        style={{
          width: wp(11),
          height: wp(11),
          borderRadius: radius(12),
          backgroundColor: accent + "18",
          alignItems: "center",
          justifyContent: "center",
          marginEnd: wp(3.5),
        }}
      >
        <Icon size={wp(5.5)} color={accent} />
      </View>
      <View style={{ flex: 1, paddingEnd: wp(2), justifyContent: "center" }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize: fontSize(15),
            fontWeight: "600",
            color: isDangerous ? palette.red : textPrimary,
            marginBottom: subtitle ? hp(0.2) : 0,
            textAlign: "left",
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={{
              fontSize: fontSize(12.5),
              color: textSecondary,
              textAlign: "left",
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View
        style={{
          minWidth: 46,
          alignItems: "flex-end",
          justifyContent: "center",
        }}
      >
        {showToggle ? (
          <Switch
            value={toggleValue}
            onValueChange={onToggleChange}
            disabled={disabled}
            trackColor={{ false: "#767577", true: palette.primary }}
            thumbColor={toggleValue ? "#FFFFFF" : "#f4f3f4"}
          />
        ) : (
          <ChevronRight size={wp(5)} color={isDangerous ? palette.red : textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );
}

function SectionTitle({ title, first = false }: { title: string; first?: boolean }) {
  const { hp, fontSize, wp } = useResponsive();
  const textSecondary = useColor("authSecondaryText");

  return (
    <Text
      style={{
        fontSize: fontSize(12),
        fontWeight: "700",
        color: textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.8,
        marginBottom: hp(1),
        marginTop: first ? hp(0.5) : hp(2.2),
        paddingHorizontal: wp(1),
      }}
    >
      {title}
    </Text>
  );
}

export default function Settings() {
  const { t } = useTranslation();
  const { wp, hp, fontSize } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const { logout } = useAuth();

  const {
    shuffle: audioShuffle,
    loopMode: audioLoopMode,
    loop: updateLoopMode,
    isShuffled,
    sleepTimerRemaining,
    isPlaying,
  } = useAudioPlayerContext();

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSleepTimerModalVisible, setIsSleepTimerModalVisible] = useState(false);
  const [isEqualizerModalVisible, setIsEqualizerModalVisible] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mediaStatus, setMediaStatus] = useState<string>("undetermined");
  const { confirm, alert } = useConfirmDialog();

  const updateSetting = useCallback(
    <K extends keyof AppSettings>(key: K, value: AppSettings[K]) =>
      setSettings((prev) => ({ ...prev, [key]: value })),
    []
  );

  // Oturum durumu
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // İzin durumu: kullanıcı sistem ayarlarından dönünce tekrar kontrol et
  useEffect(() => {
    const checkPermissions = async () => {
      const { status } = await MediaLibrary.getPermissionsAsync();
      setMediaStatus(status);
    };
    checkPermissions();

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermissions();
    });
    return () => sub.remove();
  }, []);

  // Ayarları arka planda yükle
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const saved = await AsyncStorage.getItem(SETTINGS_KEY);
        if (isMounted && saved) {
          const parsed = JSON.parse(saved);
          setSettings({
            notifications: parsed.notifications ?? DEFAULT_SETTINGS.notifications,
            soundNormalization: parsed.soundNormalization ?? DEFAULT_SETTINGS.soundNormalization,
            autoPlay: parsed.autoPlay ?? DEFAULT_SETTINGS.autoPlay,
          });
        }
      } catch (error) {
        console.error("Ayarlar yüklenemedi:", error);
      }
    };
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  // Ayarları kaydet
  useEffect(() => {
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)).catch((error) =>
      console.error("Ayarlar kaydedilemedi:", error)
    );
  }, [settings]);

  const formatTimer = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return t("common.off");
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return t("settings.timerRemaining", { time: `${mins}:${secs < 10 ? "0" : ""}${secs}` });
  };

  const handleLogout = () => {
    confirm({
      title: t("settings.logout"),
      message: t("settings.logoutConfirm"),
      variant: "destructive",
      confirmText: t("settings.logout"),
      cancelText: t("common.cancel"),
      onConfirm: async () => {
        if (isLoggingOut) return;
        setIsLoggingOut(true);
        try {
          await logout();
          router.replace("/(auth)/login");
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String((error as { message: unknown }).message) : String(error);
          alert({
            title: t("common.error"),
            message: errorMsg || t("settings.logoutError"),
            variant: "destructive",
          });
          setIsLoggingOut(false);
        }
      },
    });
  };

  const handleLoopModeChange = () => {
    const nextIndex = (LOOP_MODES.indexOf(audioLoopMode) + 1) % LOOP_MODES.length;
    updateLoopMode(LOOP_MODES[nextIndex]);
  };

  const permissionSubtitle =
    mediaStatus === "granted" ? t("settings.accessGranted") : t("settings.accessDenied");

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: wp(4),
          paddingTop: hp(2),
          paddingBottom: isPlaying ? hp(24) : hp(14),
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ marginBottom: hp(2.5), paddingHorizontal: wp(1) }}>
          <Text
            style={{
              fontSize: fontSize(28),
              fontWeight: "700",
              color: textPrimary,
              marginBottom: hp(0.5),
            }}
          >
            {t("settings.title")}
          </Text>
          <Text style={{ fontSize: fontSize(14), color: textSecondary }}>
            {t("settings.subtitle")}
          </Text>
        </View>

        <SectionTitle first title={t("settings.general")} />
        <SettingItem
          icon={Bell}
          title={t("settings.notifications")}
          subtitle={settings.notifications ? t("settings.on") : t("settings.off")}
          showToggle
          toggleValue={settings.notifications}
          onToggleChange={(v) => updateSetting("notifications", v)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Palette}
          title={t("settings.theme")}
          subtitle={t("settings.themeSubtitle")}
          onPress={() => router.push("/theme" as any)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={BarChart3}
          title={t("settings.statistics")}
          subtitle={t("settings.statisticsSubtitle")}
          onPress={() => router.push("/statistic" as any)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Sparkles}
          title={t("galaxy.title", { defaultValue: "Galaksin" })}
          subtitle={t("galaxy.promoTitle", { defaultValue: "Galaksin & Playlist Çiz" })}
          onPress={() => router.push("/galaxy" as any)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Flag}
          title={t("settings.language")}
          subtitle={t("settings.languageSubtitle")}
          onPress={() => setShowLanguageModal(true)}
          disabled={isLoggingOut}
        />

        <SectionTitle title={t("settings.playback")} />
        <SettingItem
          icon={SlidersHorizontal}
          title={t("equalizer.title", "Ekolayzır")}
          subtitle={t("equalizer.subtitle", "Ses frekansları ve bas güçlendirme")}
          onPress={() => setIsEqualizerModalVisible(true)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Volume2}
          title={t("settings.soundNormalization")}
          subtitle={t("settings.soundNormalizationSubtitle")}
          showToggle
          toggleValue={settings.soundNormalization}
          onToggleChange={(v) => updateSetting("soundNormalization", v)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={PlayCircle}
          title={t("settings.autoPlay")}
          subtitle={t("settings.autoPlaySubtitle")}
          showToggle
          toggleValue={settings.autoPlay}
          onToggleChange={(v) => updateSetting("autoPlay", v)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Clock}
          title={t("settings.sleepTimer")}
          subtitle={formatTimer(sleepTimerRemaining)}
          onPress={() => setIsSleepTimerModalVisible(true)}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Repeat}
          title={t("settings.repeatMode")}
          subtitle={t(LOOP_LABEL_KEYS[audioLoopMode])}
          onPress={handleLoopModeChange}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={Shuffle}
          title={t("settings.shuffle")}
          subtitle={isShuffled ? t("settings.on") : t("settings.off")}
          showToggle
          toggleValue={isShuffled}
          onToggleChange={audioShuffle}
          disabled={isLoggingOut}
        />

        <SectionTitle title={t("settings.other")} />
        <SettingItem
          icon={Info}
          title={t("settings.about")}
          subtitle="BeatNova v1.0.0"
          onPress={() =>
            alert({
              title: t("settings.aboutTitle"),
              message: t("settings.aboutDesc"),
              variant: "info",
            })
          }
          disabled={isLoggingOut}
        />

        <SectionTitle title={t("settings.permissions")} />
        <SettingItem
          icon={Music}
          title={t("settings.musicLibrary")}
          subtitle={permissionSubtitle}
          onPress={() => Linking.openSettings()}
          disabled={isLoggingOut}
        />
        <SettingItem
          icon={ImageIcon}
          title={t("settings.photoLibrary")}
          subtitle={permissionSubtitle}
          onPress={() => Linking.openSettings()}
          disabled={isLoggingOut}
        />

        {isAuthenticated ? (
          <SettingItem
            icon={LogOut}
            title={t("settings.logout")}
            isDangerous
            onPress={handleLogout}
            disabled={isLoggingOut}
          />
        ) : (
          <SettingItem
            icon={LogOut}
            title={t("nav.loginRegister")}
            onPress={() => router.replace("/(auth)/login")}
          />
        )}
      </ScrollView>

      <SleepTimerModal
        visible={isSleepTimerModalVisible}
        onClose={() => setIsSleepTimerModalVisible(false)}
      />

      <EqualizerModal
        visible={isEqualizerModalVisible}
        onClose={() => setIsEqualizerModalVisible(false)}
      />

      <LanguageSelector
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />
    </SafeAreaView>
  );
}