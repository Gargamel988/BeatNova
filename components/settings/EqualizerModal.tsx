import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  GestureHandlerRootView,
  Gesture,
  GestureDetector,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  FadeInDown,
  LinearTransition,
  ZoomIn,
  FadeIn,
  FadeOut,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  SlidersHorizontal,
  X,
  RotateCcw,
  Sparkles,
  Waves,
  Flame,
  Volume2,
  Check,
} from "lucide-react-native";
import {
  EqualizerSettings,
  EqualizerPresetKey,
  EQUALIZER_PRESETS,
  FREQUENCY_LABELS,
  DEFAULT_EQUALIZER_SETTINGS,
  loadEqualizerSettings,
  saveEqualizerSettings,
  flushEqualizerSettings,
} from "@/services/EqualizerService";

type EqualizerModalProps = {
  visible: boolean;
  onClose: () => void;
};

const CROSSFADE_PRESETS = [0, 2, 4, 6, 8, 10, 12] as const;
const BAR_H = 140;

// 1. Draggable Vertical EQ Band
type EqBandProps = {
  value: number;
  enabled: boolean;
  primary: string;
  label: string;
  onCommit: (v: number) => void;
};

const EqBand = React.memo(function EqBand({
  value,
  enabled,
  primary,
  label,
  onCommit,
}: EqBandProps) {
  const sv = useSharedValue(value);
  const startVal = useSharedValue(0);
  const lastStep = useSharedValue(Math.round(value));

  // preset değişince / reset'te yumuşakça kay
  useEffect(() => {
    sv.value = withSpring(value, { damping: 16, stiffness: 160 });
  }, [value]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          startVal.value = sv.value;
        })
        .onUpdate((e) => {
          const next = startVal.value - (e.translationY / BAR_H) * 24;
          sv.value = Math.max(-12, Math.min(12, next));
          const step = Math.round(sv.value);
          if (step !== lastStep.value) {
            lastStep.value = step;
            runOnJS(Haptics.selectionAsync)(); // her dB'de hafif tık
          }
        })
        .onEnd(() => {
          const snapped = Math.round(sv.value);
          sv.value = withSpring(snapped);
          runOnJS(onCommit)(snapped);
        }),
    [enabled, onCommit]
  );

  // 0 dB ortada, pozitif yukarı, negatif aşağı dolsun
  const fillStyle = useAnimatedStyle(() => {
    const h = (Math.abs(sv.value) / 24) * BAR_H;
    return {
      height: Math.max(2, h),
      top: sv.value >= 0 ? BAR_H / 2 - h : BAR_H / 2,
    };
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: BAR_H / 2 - (sv.value / 24) * BAR_H - 11 }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1, alignItems: "center", paddingVertical: 2 }}>
        {/* dB indicator */}
        <View style={{ height: 18, justifyContent: "center", marginBottom: 4 }}>
          <Text
            style={{
              color: value !== 0 ? primary : "#888",
              fontSize: 10,
              fontWeight: "700",
            }}
          >
            {value > 0 ? `+${value}` : value}
          </Text>
        </View>

        {/* Track Bar */}
        <View
          style={{
            width: 8,
            height: BAR_H,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          {/* 0 dB center reference line */}
          <View
            style={{
              position: "absolute",
              top: BAR_H / 2 - 0.75,
              left: -5,
              right: -5,
              height: 1.5,
              backgroundColor: "rgba(255,255,255,0.25)",
              zIndex: 1,
            }}
          />
          {/* Active fill */}
          <Animated.View
            style={[
              {
                position: "absolute",
                left: 0,
                right: 0,
                borderRadius: 4,
                backgroundColor: primary,
              },
              fillStyle,
            ]}
          />
          {/* Drag thumb */}
          <Animated.View
            style={[
              {
                position: "absolute",
                left: -7,
                width: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: "#fff",
                borderWidth: 3,
                borderColor: primary,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.35,
                shadowRadius: 3,
                elevation: 4,
                zIndex: 3,
              },
              thumbStyle,
            ]}
          />
        </View>

        {/* Frequency Label */}
        <Text style={{ color: "#aaa", fontSize: 10, fontWeight: "600", marginTop: 8 }}>
          {label}
        </Text>
      </View>
    </GestureDetector>
  );
});

// 4. Horizontal Slider for Bass Boost & 3D Virtualizer
type HorizontalSliderProps = {
  value: number; // 0 to 100
  enabled: boolean;
  primary: string;
  accentColor?: string;
  onCommit: (v: number) => void;
};

const HorizontalSlider = React.memo(function HorizontalSlider({
  value,
  enabled,
  primary,
  accentColor,
  onCommit,
}: HorizontalSliderProps) {
  const trackWidth = useSharedValue(0);
  const sv = useSharedValue(value);
  const startVal = useSharedValue(0);
  const lastStep = useSharedValue(Math.round(value));

  useEffect(() => {
    sv.value = withSpring(value, { damping: 18, stiffness: 180 });
  }, [value]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .onStart(() => {
          startVal.value = sv.value;
        })
        .onUpdate((e) => {
          if (trackWidth.value <= 0) return;
          const delta = (e.translationX / trackWidth.value) * 100;
          const next = Math.max(0, Math.min(100, startVal.value + delta));
          sv.value = next;
          const step = Math.round(next);
          if (Math.abs(step - lastStep.value) >= 5) {
            lastStep.value = step;
            runOnJS(Haptics.selectionAsync)();
          }
        })
        .onEnd(() => {
          const snapped = Math.round(sv.value);
          sv.value = withSpring(snapped);
          runOnJS(onCommit)(snapped);
        }),
    [enabled, onCommit]
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: `${Math.max(0, Math.min(100, sv.value))}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => {
    const usableW = Math.max(0, trackWidth.value - 20);
    const tx = (Math.max(0, Math.min(100, sv.value)) / 100) * usableW;
    return {
      transform: [{ translateX: tx }],
    };
  });

  const activeColor = accentColor || primary;

  return (
    <GestureDetector gesture={pan}>
      <View
        onLayout={(e) => {
          trackWidth.value = e.nativeEvent.layout.width;
        }}
        style={{
          height: 36,
          justifyContent: "center",
          position: "relative",
          marginTop: 6,
        }}
      >
        {/* Track */}
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={[
              {
                height: "100%",
                borderRadius: 4,
                backgroundColor: activeColor,
              },
              fillStyle,
            ]}
          />
        </View>

        {/* Thumb */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 8,
              left: 0,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#fff",
              borderWidth: 3,
              borderColor: activeColor,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.35,
              shadowRadius: 3,
              elevation: 4,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
});

export default function EqualizerModal({ visible, onClose }: EqualizerModalProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const primary = useColor("primary");
  const background = useColor("background");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");

  const [settings, setSettings] = useState<EqualizerSettings>(DEFAULT_EQUALIZER_SETTINGS);

  // Load settings on mount or when opening
  useEffect(() => {
    if (visible) {
      loadEqualizerSettings().then((loaded) => {
        setSettings(loaded);
      });
    }
  }, [visible]);

  const updateSettings = useCallback((newSettings: EqualizerSettings) => {
    setSettings(newSettings);
    saveEqualizerSettings(newSettings);
  }, []);

  const handleClose = useCallback(() => {
    flushEqualizerSettings();
    onClose();
  }, [onClose]);

  // 3. Switch dimming shared value
  const enabledSv = useSharedValue(settings.enabled ? 1 : 0);
  useEffect(() => {
    enabledSv.value = withTiming(settings.enabled ? 1 : 0, { duration: 250 });
  }, [settings.enabled]);
  const dimStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + enabledSv.value * 0.55,
  }));

  // 5. Reset button 360 rotation
  const resetRotation = useSharedValue(0);
  const resetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${resetRotation.value}deg` }],
  }));

  const handleReset = () => {
    resetRotation.value = 0;
    resetRotation.value = withTiming(360, { duration: 450 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateSettings(DEFAULT_EQUALIZER_SETTINGS);
  };

  const handleToggleEnabled = (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ ...settings, enabled: val });
  };

  const handleSelectPreset = (presetKey: EqualizerPresetKey) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const bands = EQUALIZER_PRESETS[presetKey];
    updateSettings({
      ...settings,
      preset: presetKey,
      bands: [...bands],
    });
  };

  // 1. Mutlak değer alan handleSetBand
  const handleSetBand = useCallback((index: number, val: number) => {
    setSettings((prev) => {
      const newBands = [...prev.bands] as [number, number, number, number, number];
      newBands[index] = Math.max(-12, Math.min(12, val));
      const next: EqualizerSettings = {
        ...prev,
        preset: "custom",
        bands: newBands,
      };
      saveEqualizerSettings(next);
      return next;
    });
  }, []);

  const handleSetBassBoost = useCallback((val: number) => {
    setSettings((prev) => {
      const next = { ...prev, bassBoost: Math.max(0, Math.min(100, val)) };
      saveEqualizerSettings(next);
      return next;
    });
  }, []);

  const handleSetVirtualizer = useCallback((val: number) => {
    setSettings((prev) => {
      const next = { ...prev, virtualizer: Math.max(0, Math.min(100, val)) };
      saveEqualizerSettings(next);
      return next;
    });
  }, []);

  const handleSetCrossfade = (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateSettings({ ...settings, crossfadeSeconds: seconds });
  };

  // 6. Swipe-down to dismiss sheet
  const sheetTranslateY = useSharedValue(0);
  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  const dragHandlePan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          if (e.translationY > 0) {
            sheetTranslateY.value = e.translationY;
          } else {
            sheetTranslateY.value = e.translationY * 0.2;
          }
        })
        .onEnd((e) => {
          if (e.translationY > 100 || e.velocityY > 500) {
            sheetTranslateY.value = withTiming(400, { duration: 200 }, () => {
              runOnJS(handleClose)();
            });
          } else {
            sheetTranslateY.value = withSpring(0, { damping: 18, stiffness: 200 });
          }
        }),
    [handleClose]
  );

  useEffect(() => {
    if (visible) {
      sheetTranslateY.value = 0;
    }
  }, [visible]);

  const presetKeys: EqualizerPresetKey[] = [
    "flat",
    "bass_boost",
    "vocal",
    "rock",
    "pop",
    "jazz",
    "electronic",
    "classical",
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      {/* 0. Android gesture root inside Modal */}
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(20, 16, 40, 0.45)", justifyContent: "flex-end" }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleClose}
            style={{ flex: 1 }}
            accessibilityLabel={t("common.close", "Kapat")}
          />
          <Animated.View style={[{ width: "100%" }, sheetAnimatedStyle]}>
            <SafeAreaView
              edges={["bottom"]}
              style={{
                backgroundColor: background,
                borderTopStartRadius: radius(28),
                borderTopEndRadius: radius(28),
                borderWidth: 1,
                borderColor,
                maxHeight: hp(78),
                shadowColor: primary + "30",
                shadowOffset: { width: 0, height: -6 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 20,
              }}
            >
              {/* 6. Drag Handle with Pan Gesture */}
              <GestureDetector gesture={dragHandlePan}>
                <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 6 }}>
                  <View
                    style={{
                      width: 44,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: textSecondary + "40",
                    }}
                  />
                </View>
              </GestureDetector>

              {/* Header */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: wp(5),
                  paddingTop: hp(1.5),
                  paddingBottom: hp(1.5),
                  borderBottomWidth: 1,
                  borderColor,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3), flex: 1 }}>
                  <View
                    style={{
                      width: wp(10),
                      height: wp(10),
                      borderRadius: radius(10),
                      backgroundColor: primary + "20",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={SlidersHorizontal} size={22} color={primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(18),
                        fontWeight: "800",
                      }}
                      numberOfLines={1}
                    >
                      {t("equalizer.title", "Ekolayzır & Ses Stüdyosu")}
                    </Text>
                    <Text
                      style={{
                        color: textSecondary,
                        fontSize: fontSize(12),
                        marginTop: 2,
                      }}
                      numberOfLines={1}
                    >
                      {t("equalizer.subtitle", "Ses frekanslarını ve geçiş süresini kişiselleştir")}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                  {/* 5. Reset button with rotation */}
                  <TouchableOpacity
                    onPress={handleReset}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Animated.View style={resetAnimatedStyle}>
                      <Icon name={RotateCcw} size={18} color={textSecondary} />
                    </Animated.View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    activeOpacity={0.7}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon name={X} size={20} color={textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView
                contentContainerStyle={{
                  paddingHorizontal: wp(5),
                  paddingTop: hp(2),
                  paddingBottom: hp(4),
                  gap: hp(2.5),
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* 2. Card 1: Master Switch */}
                <Animated.View
                  entering={FadeInDown.delay(0).springify()}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: wp(4),
                    borderRadius: radius(16),
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
                    <Icon name={Sparkles} size={20} color={settings.enabled ? primary : textSecondary} />
                    <View>
                      <Text style={{ color: textPrimary, fontSize: fontSize(15), fontWeight: "700" }}>
                        {t("equalizer.enableSoundEffects", "Ses Efektlerini Etkinleştir")}
                      </Text>
                      <Text style={{ color: textSecondary, fontSize: fontSize(11), marginTop: 2 }}>
                        {settings.enabled
                          ? t("equalizer.enabledDesc", "Ekolayzır ve bas güçlendirici aktif")
                          : t("equalizer.disabledDesc", "Ham ses profili uygulanıyor")}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={settings.enabled}
                    onValueChange={handleToggleEnabled}
                    trackColor={{ false: "#333", true: primary + "80" }}
                    thumbColor={settings.enabled ? primary : "#bbb"}
                  />
                </Animated.View>

                {/* 2. Card 2: Presets Horizontal Scroll */}
                <Animated.View entering={FadeInDown.delay(70).springify()}>
                  <Animated.View
                    style={dimStyle}
                    pointerEvents={settings.enabled ? "auto" : "none"}
                  >
                    <Text style={{ color: textSecondary, fontSize: fontSize(13), fontWeight: "600", marginBottom: hp(1) }}>
                      {t("equalizer.presetsTitle", "Hazır Müzik Profilleri")}
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: wp(2) }}
                    >
                      {presetKeys.map((key) => {
                        const isSelected = settings.preset === key;
                        return (
                          <Animated.View key={key} layout={LinearTransition.springify()}>
                            <TouchableOpacity
                              onPress={() => handleSelectPreset(key)}
                              activeOpacity={0.7}
                              style={{
                                paddingHorizontal: wp(3.5),
                                paddingVertical: hp(0.8),
                                borderRadius: radius(12),
                                backgroundColor: isSelected ? primary : "rgba(255,255,255,0.06)",
                                borderWidth: 1,
                                borderColor: isSelected ? primary : borderColor,
                                flexDirection: "row",
                                alignItems: "center",
                                gap: wp(1.5),
                              }}
                            >
                              {isSelected && (
                                <Animated.View entering={ZoomIn.duration(200)}>
                                  <Icon name={Check} size={14} color="#fff" />
                                </Animated.View>
                              )}
                              <Text
                                style={{
                                  color: isSelected ? "#fff" : textPrimary,
                                  fontSize: fontSize(12),
                                  fontWeight: isSelected ? "700" : "600",
                                }}
                              >
                                {t(`equalizer.presets.${key}`, key)}
                              </Text>
                            </TouchableOpacity>
                          </Animated.View>
                        );
                      })}
                    </ScrollView>
                  </Animated.View>
                </Animated.View>

                {/* 2. Card 3: 5-Band Graphic Equalizer */}
                <Animated.View entering={FadeInDown.delay(140).springify()}>
                  <Animated.View
                    style={[
                      {
                        backgroundColor: primary + "0A",
                        borderRadius: radius(18),
                        padding: wp(4),
                        borderWidth: 1,
                        borderColor,
                      },
                      dimStyle,
                    ]}
                    pointerEvents={settings.enabled ? "auto" : "none"}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: hp(1) }}>
                      <Text style={{ color: textPrimary, fontSize: fontSize(14), fontWeight: "700" }}>
                        {t("equalizer.graphicEq", "5-Bant Grafik Ekolayzır")}
                      </Text>
                      <Text style={{ color: primary, fontSize: fontSize(11), fontWeight: "700" }}>
                        -12 dB / +12 dB
                      </Text>
                    </View>

                    {/* 1. Vertical Draggable EqBands */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        paddingVertical: hp(0.5),
                        direction: "ltr",
                      }}
                    >
                      {settings.bands.map((db, idx) => (
                        <EqBand
                          key={idx}
                          value={db}
                          enabled={settings.enabled}
                          primary={primary}
                          label={FREQUENCY_LABELS[idx]}
                          onCommit={(v) => handleSetBand(idx, v)}
                        />
                      ))}
                    </View>
                  </Animated.View>
                </Animated.View>

                {/* 2. Card 4: Bass Boost & 3D Virtualizer */}
                <Animated.View entering={FadeInDown.delay(210).springify()}>
                  <Animated.View
                    style={[{ flexDirection: "row", gap: wp(3) }, dimStyle]}
                    pointerEvents={settings.enabled ? "auto" : "none"}
                  >
                    {/* Bass Boost Card */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        borderRadius: radius(16),
                        padding: wp(3.5),
                        borderWidth: 1,
                        borderColor,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(1.5) }}>
                          <Icon name={Flame} size={16} color="#FF5722" />
                          <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>
                            {t("equalizer.bassBoost", "Bas Güçlendir")}
                          </Text>
                        </View>
                        <Text style={{ color: "#FF5722", fontSize: fontSize(12), fontWeight: "800" }}>
                          %{settings.bassBoost}
                        </Text>
                      </View>

                      {/* 4. Horizontal Slider */}
                      <HorizontalSlider
                        value={settings.bassBoost}
                        enabled={settings.enabled}
                        primary={primary}
                        accentColor="#FF5722"
                        onCommit={handleSetBassBoost}
                      />
                    </View>

                    {/* Virtualizer Card */}
                    <View
                      style={{
                        flex: 1,
                        backgroundColor: "rgba(255,255,255,0.04)",
                        borderRadius: radius(16),
                        padding: wp(3.5),
                        borderWidth: 1,
                        borderColor,
                      }}
                    >
                      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: wp(1.5) }}>
                          <Icon name={Waves} size={16} color="#00E5FF" />
                          <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>
                            {t("equalizer.virtualizer", "3D Çevreleyen")}
                          </Text>
                        </View>
                        <Text style={{ color: "#00E5FF", fontSize: fontSize(12), fontWeight: "800" }}>
                          %{settings.virtualizer}
                        </Text>
                      </View>

                      {/* 4. Horizontal Slider */}
                      <HorizontalSlider
                        value={settings.virtualizer}
                        enabled={settings.enabled}
                        primary={primary}
                        accentColor="#00E5FF"
                        onCommit={handleSetVirtualizer}
                      />
                    </View>
                  </Animated.View>
                </Animated.View>

                {/* 2. Card 5: Crossfade Section */}
                <Animated.View
                  entering={FadeInDown.delay(280).springify()}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.04)",
                    borderRadius: radius(16),
                    padding: wp(4),
                    borderWidth: 1,
                    borderColor,
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: hp(0.5) }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                      <Icon name={Volume2} size={18} color={primary} />
                      <Text style={{ color: textPrimary, fontSize: fontSize(14), fontWeight: "700" }}>
                        {t("equalizer.crossfadeTitle", "Crossfade (Şarkılar Arası Yumuşak Geçiş)")}
                      </Text>
                    </View>

                    {/* 5. Crossfade animated text with FadeIn / FadeOut key */}
                    <Animated.Text
                      key={settings.crossfadeSeconds}
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(150)}
                      style={{ color: primary, fontSize: fontSize(13), fontWeight: "800" }}
                    >
                      {settings.crossfadeSeconds === 0
                        ? t("equalizer.off", "Kapalı")
                        : `${settings.crossfadeSeconds}s`}
                    </Animated.Text>
                  </View>

                  <Text style={{ color: textSecondary, fontSize: fontSize(11), marginBottom: hp(1.5) }}>
                    {t(
                      "equalizer.crossfadeDesc",
                      "Şarkı biterken sesi yavaşça kısar ve bir sonraki şarkıyı kesintisiz başlatır."
                    )}
                  </Text>

                  {/* Duration Chips */}
                  <View style={{ flexDirection: "row", gap: wp(2) }}>
                    {CROSSFADE_PRESETS.map((sec) => {
                      const isCur = settings.crossfadeSeconds === sec;
                      return (
                        <TouchableOpacity
                          key={sec}
                          onPress={() => handleSetCrossfade(sec)}
                          activeOpacity={0.7}
                          style={{
                            flex: 1,
                            minHeight: 34,
                            borderRadius: radius(10),
                            backgroundColor: isCur ? primary : "rgba(255,255,255,0.08)",
                            borderWidth: 1,
                            borderColor: isCur ? primary : borderColor,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text
                            style={{
                              color: isCur ? "#fff" : textPrimary,
                              fontSize: fontSize(11),
                              fontWeight: isCur ? "800" : "600",
                            }}
                          >
                            {sec === 0 ? t("equalizer.off", "Kapalı") : `${sec}s`}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Animated.View>
              </ScrollView>
            </SafeAreaView>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
