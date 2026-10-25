import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { useConfirmDialog } from "@/components/ui/confirm-modal";
import { SafeAreaView } from "react-native-safe-area-context";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  Scissors,
  X,
  Play,
  Pause,
  Save,
  Clock,
  RotateCcw,
  Sparkles,
  Bell,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import TrackPlayer from "@rntp/player";
import { Song } from "@/components/songs/songsService";
import { formatTime } from "@/utils/format";
import { trimAudio, saveTrimmedAudioToDevice } from "@/utils/audioTrimmer";
import { useToast } from "@/components/ui/toast";
import { useTranslation } from "react-i18next";
import { getLocalizedTitle, getLocalizedArtist } from "@/utils/audioMetadata";
import { useSetRingtone } from "@/hooks/useSetRingtone";
import { useAudioPlayerContext } from "@/providers/player-context";

type AudioTrimmerModalProps = {
  visible: boolean;
  onClose: () => void;
  song: Song | null;
};

const PRESET_DURATIONS = [15, 30, 45, 60] as const;
const NUM_BARS = 60;

export default function AudioTrimmerModal({
  visible,
  onClose,
  song,
}: AudioTrimmerModalProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { toast } = useToast();
  const { alert } = useConfirmDialog();
  const { play: playGlobalSong, activeSong } = useAudioPlayerContext();

  const primary = useColor("primary");
  const background = useColor("background");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");

  const totalDuration = useMemo(() => {
    return Math.max(
      1,
      song?.duration || song?.metadata?.duration || 180
    );
  }, [song]);

  const [startSec, setStartSec] = useState(0);
  const [endSec, setEndSec] = useState(Math.min(30, totalDuration));
  const [isPlayingSlice, setIsPlayingSlice] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { makeRingtone, isProcessing: isRingtoneProcessing } = useSetRingtone();
  const [activeHandle, setActiveHandle] = useState<"start" | "end">("start");
  const [waveformWidth, setWaveformWidth] = useState(0);

  // UI thread Reanimated Shared Values
  const startSv = useSharedValue(0);
  const endSv = useSharedValue(Math.min(30, totalDuration));
  const widthSv = useSharedValue(0);
  const startCtx = useSharedValue(0);
  const endCtx = useSharedValue(0);
  const isDraggingSv = useSharedValue<number>(0); // 0: none, 1: start, 2: end, 3: window

  const sliceCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Throttled live update of JS state during drag (smooth numbers without dropping UI frames)
  const lastUpdateMs = useSharedValue(0);
  const lastReportedStart = useSharedValue(0);
  const lastReportedEnd = useSharedValue(0);

  useAnimatedReaction(
    () => ({
      start: startSv.value,
      end: endSv.value,
      dragging: isDraggingSv.value,
    }),
    (cur) => {
      if (cur.dragging > 0) {
        const now = Date.now();
        const timeDiff = now - lastUpdateMs.value;
        const deltaStart = Math.abs(cur.start - lastReportedStart.value);
        const deltaEnd = Math.abs(cur.end - lastReportedEnd.value);

        if (timeDiff > 75 && (deltaStart >= 0.2 || deltaEnd >= 0.2)) {
          lastUpdateMs.value = now;
          lastReportedStart.value = cur.start;
          lastReportedEnd.value = cur.end;
          runOnJS(setStartSec)(Math.round(cur.start * 10) / 10);
          runOnJS(setEndSec)(Math.round(cur.end * 10) / 10);
        }
      }
    }
  );

  // Handle dragging the START marker (left handle)
  const startHandleGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-4, 4])
      .onStart(() => {
        startCtx.value = startSv.value;
        isDraggingSv.value = 1;
        runOnJS(setActiveHandle)("start");
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      })
      .onUpdate((event) => {
        if (widthSv.value <= 0) return;
        const deltaSec = (event.translationX / widthSv.value) * totalDuration;
        let newStart = startCtx.value + deltaSec;
        newStart = Math.max(0, Math.min(endSv.value - 3, newStart));
        if (endSv.value - newStart > 60) {
          newStart = endSv.value - 60;
        }
        startSv.value = newStart;
      })
      .onEnd(() => {
        isDraggingSv.value = 0;
        const finalSec = Math.round(startSv.value * 10) / 10;
        runOnJS(setStartSec)(finalSec);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      });
  }, [totalDuration]);

  // Handle dragging the END marker (right handle)
  const endHandleGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-4, 4])
      .onStart(() => {
        endCtx.value = endSv.value;
        isDraggingSv.value = 2;
        runOnJS(setActiveHandle)("end");
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      })
      .onUpdate((event) => {
        if (widthSv.value <= 0) return;
        const deltaSec = (event.translationX / widthSv.value) * totalDuration;
        let newEnd = endCtx.value + deltaSec;
        newEnd = Math.min(totalDuration, Math.max(startSv.value + 3, newEnd));
        if (newEnd - startSv.value > 60) {
          newEnd = startSv.value + 60;
        }
        endSv.value = newEnd;
      })
      .onEnd(() => {
        isDraggingSv.value = 0;
        const finalSec = Math.round(endSv.value * 10) / 10;
        runOnJS(setEndSec)(finalSec);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      });
  }, [totalDuration]);

  // Handle dragging the entire selection BOX (sliding the window)
  const windowGesture = useMemo(() => {
    return Gesture.Pan()
      .activeOffsetX([-4, 4])
      .onStart(() => {
        startCtx.value = startSv.value;
        endCtx.value = endSv.value;
        isDraggingSv.value = 3;
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      })
      .onUpdate((event) => {
        if (widthSv.value <= 0) return;
        const dur = endCtx.value - startCtx.value;
        const deltaSec = (event.translationX / widthSv.value) * totalDuration;
        let newStart = startCtx.value + deltaSec;
        let newEnd = newStart + dur;

        if (newStart < 0) {
          newStart = 0;
          newEnd = Math.min(totalDuration, dur);
        } else if (newEnd > totalDuration) {
          newEnd = totalDuration;
          newStart = Math.max(0, totalDuration - dur);
        }

        startSv.value = newStart;
        endSv.value = newEnd;
      })
      .onEnd(() => {
        isDraggingSv.value = 0;
        const finalStart = Math.round(startSv.value * 10) / 10;
        const finalEnd = Math.round(endSv.value * 10) / 10;
        runOnJS(setStartSec)(finalStart);
        runOnJS(setEndSec)(finalEnd);
        runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      });
  }, [totalDuration]);

  // Handle tapping on the background waveform track to quickly move selection
  const trackTapGesture = useMemo(() => {
    return Gesture.Tap().onEnd((event) => {
      if (widthSv.value <= 0) return;
      const tapSec = (event.x / widthSv.value) * totalDuration;
      const dur = Math.max(3, endSv.value - startSv.value);
      let newStart = tapSec - dur / 2;
      let newEnd = tapSec + dur / 2;

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(totalDuration, dur);
      } else if (newEnd > totalDuration) {
        newEnd = totalDuration;
        newStart = Math.max(0, totalDuration - dur);
      }

      startSv.value = newStart;
      endSv.value = newEnd;
      const finalStart = Math.round(newStart * 10) / 10;
      const finalEnd = Math.round(newEnd * 10) / 10;
      runOnJS(setStartSec)(finalStart);
      runOnJS(setEndSec)(finalEnd);
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    });
  }, [totalDuration]);

  // Animated styles for smooth 60fps transform without re-renders
  const startHandleAnimStyle = useAnimatedStyle(() => {
    const isDraggingThis = isDraggingSv.value === 1;
    const leftPx =
      totalDuration > 0 && widthSv.value > 0
        ? (startSv.value / totalDuration) * widthSv.value - 22
        : -22;
    return {
      transform: [
        { translateX: leftPx },
        { scale: withSpring(isDraggingThis ? 1.15 : 1, { damping: 15, stiffness: 250 }) },
      ],
    };
  });

  const endHandleAnimStyle = useAnimatedStyle(() => {
    const isDraggingThis = isDraggingSv.value === 2;
    const leftPx =
      totalDuration > 0 && widthSv.value > 0
        ? (endSv.value / totalDuration) * widthSv.value - 22
        : -22;
    return {
      transform: [
        { translateX: leftPx },
        { scale: withSpring(isDraggingThis ? 1.15 : 1, { damping: 15, stiffness: 250 }) },
      ],
    };
  });

  const windowBoxAnimStyle = useAnimatedStyle(() => {
    if (totalDuration <= 0 || widthSv.value <= 0) {
      return { left: 0, width: 0, borderColor: primary };
    }
    const left = Math.max(0, (startSv.value / totalDuration) * widthSv.value);
    const width = Math.max(16, ((endSv.value - startSv.value) / totalDuration) * widthSv.value);
    const isDraggingThis = isDraggingSv.value === 3;
    return {
      left,
      width,
      borderColor: isDraggingThis ? "#fff" : primary,
    };
  });

  const windowMaskStyle = useAnimatedStyle(() => {
    if (totalDuration <= 0 || widthSv.value <= 0) {
      return { left: 0, width: 0 };
    }
    const left = Math.max(0, (startSv.value / totalDuration) * widthSv.value);
    const width = Math.max(16, ((endSv.value - startSv.value) / totalDuration) * widthSv.value);
    return {
      left,
      width,
    };
  });

  const innerBarsStyle = useAnimatedStyle(() => {
    if (totalDuration <= 0 || widthSv.value <= 0) {
      return { width: 0, transform: [{ translateX: 0 }] };
    }
    const left = Math.max(0, (startSv.value / totalDuration) * widthSv.value);
    return {
      width: widthSv.value,
      transform: [{ translateX: -left }],
    };
  });

  // Reset markers when song changes or modal opens
  useEffect(() => {
    if (visible && song) {
      const initStart = 0;
      const initEnd = Math.min(30, totalDuration);
      setStartSec(initStart);
      setEndSec(initEnd);
      startSv.value = initStart;
      endSv.value = initEnd;
      isDraggingSv.value = 0;
      setIsPlayingSlice(false);
    }
    return () => {
      if (sliceCheckInterval.current) {
        clearInterval(sliceCheckInterval.current);
      }
    };
  }, [visible, song, totalDuration]);

  // Deterministic pseudo-waveform heights based on song ID & title
  const waveformBars = useMemo(() => {
    const seedStr =
      (song?.id || "seed") + (song?.metadata?.title || song?.filename || "audio");
    let hash = 0;
    for (let i = 0; i < seedStr.length; i++) {
      hash = (hash << 5) - hash + seedStr.charCodeAt(i);
      hash |= 0;
    }
    return Array.from({ length: NUM_BARS }, (_, i) => {
      const v = Math.abs(Math.sin((i + 1) * 0.28 + hash) * 0.75 + 0.25);
      return Math.max(0.15, Math.min(1.0, v));
    });
  }, [song?.id, song?.metadata?.title, song?.filename]);

  const sliceDuration = Math.max(0, endSec - startSec);

  // Monitor preview playback to loop or stop at endSec
  const stopSlicePlayback = useCallback(async () => {
    if (sliceCheckInterval.current) {
      clearInterval(sliceCheckInterval.current);
      sliceCheckInterval.current = null;
    }
    setIsPlayingSlice(false);
    try {
      await TrackPlayer.pause();
    } catch (e) {
      // player idle
    }
  }, []);

  const handlePlaySlice = async () => {
    if (isPlayingSlice) {
      await stopSlicePlayback();
      return;
    }

    if (!song) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Şarkı şu an TrackPlayer'da aktif/yüklü mü kontrol et
      const isSongActive = activeSong?.id === song.id;

      // Şarkı çalmıyorsa veya başka bir şarkıdaysa, kesilmek istenen şarkıyı başlat
      if (!isSongActive) {
        await playGlobalSong(song);
      }

      await TrackPlayer.seekTo(startSec);
      await TrackPlayer.play();
      setIsPlayingSlice(true);

      if (sliceCheckInterval.current) {
        clearInterval(sliceCheckInterval.current);
      }

      sliceCheckInterval.current = setInterval(async () => {
        try {
          const prog = TrackPlayer.getProgress();
          if (prog.position >= endSec || prog.position < startSec - 0.5) {
            // Loop back to startSec seamlessly so user can preview slice continuously
            await TrackPlayer.seekTo(startSec);
          }
        } catch (err: unknown) {
          await stopSlicePlayback();
        }
      }, 100);
    } catch (e: unknown) {
      console.warn("Could not play slice preview:", e);
      setIsPlayingSlice(false);
    }
  };

  const handleApplyPreset = (seconds: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const targetEnd = Math.min(totalDuration, startSec + seconds);
    const targetStart = targetEnd === totalDuration ? Math.max(0, targetEnd - seconds) : startSec;
    setStartSec(targetStart);
    setEndSec(targetEnd);
    startSv.value = targetStart;
    endSv.value = targetEnd;
  };

  const adjustTime = (type: "start" | "end", delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (type === "start") {
      const next = Math.max(0, Math.min(endSec - 1, startSec + delta));
      const rounded = Math.round(next * 10) / 10;
      setStartSec(rounded);
      startSv.value = rounded;
    } else {
      const next = Math.min(totalDuration, Math.max(startSec + 1, endSec + delta));
      const rounded = Math.round(next * 10) / 10;
      setEndSec(rounded);
      endSv.value = rounded;
    }
  };

  const handleSaveRingtone = async () => {
    if (!song?.uri) {
      alert({
        title: t("common.error", "Hata"),
        message: t("trimmer.noSourceFile", "Şarkı dosyası bulunamadı."),
        variant: "destructive",
      });
      return;
    }

    if (sliceDuration < 3) {
      alert({
        title: t("common.warning", "Uyarı"),
        message: t("trimmer.minDurationWarning", "Seçilen aralık en az 3 saniye olmalıdır."),
        variant: "warning",
      });
      return;
    }

    if (sliceDuration > 60) {
      alert({
        title: t("common.warning", "Uyarı"),
        message: t("trimmer.maxDurationWarning", "Zil sesi en fazla 60 saniye olabilir."),
        variant: "warning",
      });
      return;
    }

    await stopSlicePlayback();
    setIsProcessing(true);

    try {
      const cleanTitle =
        song.metadata?.title || song.filename || "BeatNova_Ringtone";
      const trimmedFileUri = await trimAudio(
        song.uri,
        startSec,
        endSec,
        `${cleanTitle}_Ringtone`
      );

      await saveTrimmedAudioToDevice(trimmedFileUri, "BeatNova Ringtones");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      toast({
        title: t("trimmer.saveSuccess", "Zil sesi başarıyla kaydedildi!"),
        description: t(
          "trimmer.saveSuccessDesc",
          "Kırpılan ses cihazınızın Müzik/Zil Sesleri kütüphanesine eklendi."
        ),
        variant: "success",
      });

      onClose();
    } catch (err: unknown) {
      console.error("Trim and save error:", err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg = err instanceof Error ? err.message : String(err);
      alert({
        title: t("trimmer.saveError", "Kırpma Başarısız"),
        message: errorMsg || t("trimmer.saveErrorDesc", "Ses kırpılırken bir hata oluştu."),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMakeRingtone = async () => {
    if (!song?.uri) {
      alert({
        title: t("common.error", "Hata"),
        message: t("trimmer.noSourceFile", "Şarkı dosyası bulunamadı."),
        variant: "destructive",
      });
      return;
    }

    if (sliceDuration < 3) {
      alert({
        title: t("common.warning", "Uyarı"),
        message: t("trimmer.minDurationWarning", "Seçilen aralık en az 3 saniye olmalıdır."),
        variant: "warning",
      });
      return;
    }

    if (sliceDuration > 60) {
      alert({
        title: t("common.warning", "Uyarı"),
        message: t("trimmer.maxDurationWarning", "Zil sesi en fazla 60 saniye olabilir."),
        variant: "warning",
      });
      return;
    }

    await stopSlicePlayback();
    const success = await makeRingtone({
      song,
      startSec,
      endSec,
      setAsDefault: true,
    });

    if (success) {
      onClose();
    }
  };

  const handleClose = async () => {
    await stopSlicePlayback();
    onClose();
  };

  if (!song) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(20, 16, 40, 0.45)", justifyContent: "flex-end" }}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={handleClose}
            style={{ flex: 1 }}
            accessibilityLabel={t("common.close", "Kapat")}
          />
          <SafeAreaView
            edges={["bottom"]}
            style={{
              backgroundColor: background,
              borderTopStartRadius: radius(28),
              borderTopEndRadius: radius(28),
              borderWidth: 1,
              borderColor,
              maxHeight: hp(80),
              shadowColor: primary + "30",
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 20,
            }}
          >
            {/* Drag Handle Indicator */}
            <View style={{ alignItems: "center", paddingTop: 10, paddingBottom: 4 }}>
              <View
                style={{
                  width: 44,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: textSecondary + "40",
                }}
              />
            </View>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: wp(5),
                paddingTop: hp(2.5),
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
                  <Icon name={Scissors} size={22} color={primary} />
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
                    {t("trimmer.title", "Zil Sesi & Şarkı Kırpıcı")}
                  </Text>
                  <Text
                    style={{
                      color: textSecondary,
                      fontSize: fontSize(12),
                      marginTop: 2,
                    }}
                    numberOfLines={1}
                  >
                    {getLocalizedTitle(song.metadata?.title, t)} • {getLocalizedArtist(song.metadata?.artist, t)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={t("common.close", "Kapat")}
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

            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: wp(5),
                paddingTop: hp(2),
                paddingBottom: hp(3),
                gap: hp(2.5),
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* Visual Waveform Area with Touch Gestures */}
              <View
                style={{
                  backgroundColor: primary + "0A",
                  borderRadius: radius(18),
                  padding: wp(4),
                  borderWidth: 1,
                  borderColor: borderColor,
                }}
              >
                {/* Drag Hint at top of waveform */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(1.5),
                      backgroundColor: primary + "15",
                      paddingHorizontal: wp(3),
                      paddingVertical: hp(0.5),
                      borderRadius: radius(12),
                      borderWidth: 1,
                      borderColor: primary + "40",
                    }}
                  >
                    <Icon name={Sparkles} size={13} color={primary} />
                    <Text
                      style={{
                        color: primary,
                        fontSize: fontSize(11),
                        fontWeight: "700",
                      }}
                    >
                      {t("trimmer.gestureHint", "Kutuyu veya tutamaçları parmağınızla sürükleyin")}
                    </Text>
                  </View>
                </View>

                {/* Waveform Track Container with Gesture Layer */}
                <View
                  onLayout={(e) => {
                    const w = e.nativeEvent.layout.width;
                    widthSv.value = w;
                    setWaveformWidth(w);
                  }}
                  style={{
                    height: hp(12),
                    position: "relative",
                    direction: "ltr",
                    justifyContent: "center",
                  }}
                >
                  {/* 1. Background Waveform Bars (Base Neutral Layer) */}
                  <View
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      bottom: 0,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {waveformBars.map((barRatio, index) => (
                      <View
                        key={index}
                        style={{
                          width: 3,
                          height: `${Math.round(barRatio * 90)}%`,
                          borderRadius: 2,
                          backgroundColor: "rgba(255,255,255,0.18)",
                        }}
                      />
                    ))}
                  </View>

                  {/* 2. Top Layer: Active Primary Bars revealed via moving window mask (GPU clipped, no per-bar re-renders) */}
                  <Animated.View
                    pointerEvents="none"
                    style={[
                      {
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        overflow: "hidden",
                        zIndex: 5,
                      },
                      windowMaskStyle,
                    ]}
                  >
                    <Animated.View
                      style={[
                        {
                          height: "100%",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        },
                        innerBarsStyle,
                      ]}
                    >
                      {waveformBars.map((barRatio, index) => (
                        <View
                          key={index}
                          style={{
                            width: 3,
                            height: `${Math.round(barRatio * 90)}%`,
                            borderRadius: 2,
                            backgroundColor: primary,
                          }}
                        />
                      ))}
                    </Animated.View>
                  </Animated.View>

                  {/* 3. Tap to seek/position layer */}
                  <GestureDetector gesture={trackTapGesture}>
                    <View
                      style={{
                        position: "absolute",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        zIndex: 1,
                      }}
                    />
                  </GestureDetector>

                  {/* 4. Active slice draggable box */}
                  <GestureDetector gesture={windowGesture}>
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          top: 0,
                          bottom: 0,
                          backgroundColor: primary + "24",
                          borderRadius: radius(10),
                          borderWidth: 1.5,
                          zIndex: 10,
                          justifyContent: "center",
                          alignItems: "center",
                        },
                        windowBoxAnimStyle,
                      ]}
                    >
                      {/* Center duration badge with slide indicator */}
                      <View
                        style={{
                          paddingHorizontal: wp(2.5),
                          paddingVertical: hp(0.4),
                          borderRadius: radius(10),
                          backgroundColor: background,
                          borderWidth: 1,
                          borderColor: primary,
                          flexDirection: "row",
                          alignItems: "center",
                          gap: wp(1.5),
                        }}
                      >
                        <Text style={{ color: primary, fontSize: fontSize(9), fontWeight: "900" }}>◀</Text>
                        <Text style={{ color: textPrimary, fontSize: fontSize(11), fontWeight: "800" }}>
                          {sliceDuration.toFixed(1)}s
                        </Text>
                        <Text style={{ color: primary, fontSize: fontSize(9), fontWeight: "900" }}>▶</Text>
                      </View>
                    </Animated.View>
                  </GestureDetector>

                  {/* 5. Left Handle (Start Marker) */}
                  <GestureDetector gesture={startHandleGesture}>
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 30,
                        },
                        startHandleAnimStyle,
                      ]}
                    >
                      {/* Floating Time Bubble */}
                      <View
                        style={{
                          position: "absolute",
                          top: -18,
                          backgroundColor: background,
                          paddingHorizontal: wp(2),
                          paddingVertical: 2,
                          borderRadius: radius(6),
                          borderWidth: 1,
                          borderColor: primary,
                          shadowColor: primary + "30",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 2,
                          elevation: 5,
                        }}
                      >
                        <Text style={{ color: textPrimary, fontSize: fontSize(9), fontWeight: "700" }}>
                          {formatTime(startSec)}
                        </Text>
                      </View>

                      {/* Vertical Grab Handle Bar */}
                      <View
                        style={{
                          width: 14,
                          height: hp(7.5),
                          borderRadius: radius(7),
                          backgroundColor: primary,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primary + "50",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.45,
                          shadowRadius: 4,
                          elevation: 8,
                          borderWidth: 1.5,
                          borderColor: "#fff",
                        }}
                      >
                        <View style={{ flexDirection: "row", gap: 2 }}>
                          <View style={{ width: 1.5, height: 18, borderRadius: 1, backgroundColor: "#fff" }} />
                          <View style={{ width: 1.5, height: 18, borderRadius: 1, backgroundColor: "#fff" }} />
                        </View>
                      </View>
                    </Animated.View>
                  </GestureDetector>

                  {/* 6. Right Handle (End Marker) */}
                  <GestureDetector gesture={endHandleGesture}>
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 44,
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 30,
                        },
                        endHandleAnimStyle,
                      ]}
                    >
                      {/* Floating Time Bubble */}
                      <View
                        style={{
                          position: "absolute",
                          top: -18,
                          backgroundColor: background,
                          paddingHorizontal: wp(2),
                          paddingVertical: 2,
                          borderRadius: radius(6),
                          borderWidth: 1,
                          borderColor: primary,
                          shadowColor: primary + "30",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 2,
                          elevation: 5,
                        }}
                      >
                        <Text style={{ color: textPrimary, fontSize: fontSize(9), fontWeight: "700" }}>
                          {formatTime(endSec)}
                        </Text>
                      </View>

                      {/* Vertical Grab Handle Bar */}
                      <View
                        style={{
                          width: 14,
                          height: hp(7.5),
                          borderRadius: radius(7),
                          backgroundColor: primary,
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: primary + "50",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.45,
                          shadowRadius: 4,
                          elevation: 8,
                          borderWidth: 1.5,
                          borderColor: "#fff",
                        }}
                      >
                        <View style={{ flexDirection: "row", gap: 2 }}>
                          <View style={{ width: 1.5, height: 18, borderRadius: 1, backgroundColor: "#fff" }} />
                          <View style={{ width: 1.5, height: 18, borderRadius: 1, backgroundColor: "#fff" }} />
                        </View>
                      </View>
                    </Animated.View>
                  </GestureDetector>
                </View>

                {/* Time Indicators */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginTop: hp(1.2),
                    direction: "ltr",
                  }}
                >
                  <Text style={{ color: textSecondary, fontSize: fontSize(11), fontWeight: "600" }}>
                    {formatTime(0)}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(1.5),
                      backgroundColor: primary + "20",
                      paddingHorizontal: wp(2.5),
                      paddingVertical: hp(0.3),
                      borderRadius: radius(8),
                    }}
                  >
                    <Icon name={Clock} size={12} color={primary} />
                    <Text style={{ color: primary, fontSize: fontSize(12), fontWeight: "700" }}>
                      {sliceDuration.toFixed(1)}s
                    </Text>
                  </View>
                  <Text style={{ color: textSecondary, fontSize: fontSize(11), fontWeight: "600" }}>
                    {formatTime(totalDuration)}
                  </Text>
                </View>
              </View>

              {/* Range Selectors / Fine Adjustment Cards */}
              <View style={{ flexDirection: "row", gap: wp(3) }}>
                {/* Start Time Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: activeHandle === "start" ? primary + "15" : background,
                    borderRadius: radius(16),
                    padding: wp(3.5),
                    borderWidth: 1.5,
                    borderColor: activeHandle === "start" ? primary : borderColor,
                  }}
                >
                  <Text style={{ color: textSecondary, fontSize: fontSize(12), fontWeight: "600" }}>
                    {t("trimmer.start", "Başlangıç")}
                  </Text>
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(20),
                      fontWeight: "800",
                      marginVertical: hp(0.5),
                    }}
                  >
                    {formatTime(startSec)}
                  </Text>

                  <View style={{ flexDirection: "row", gap: wp(1.5), marginTop: hp(0.5) }}>
                    <TouchableOpacity
                      onPress={() => adjustTime("start", -1)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        borderRadius: radius(8),
                        backgroundColor: "rgba(255,255,255,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>-1s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => adjustTime("start", 1)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        borderRadius: radius(8),
                        backgroundColor: "rgba(255,255,255,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>+1s</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* End Time Card */}
                <View
                  style={{
                    flex: 1,
                    backgroundColor: activeHandle === "end" ? primary + "15" : background,
                    borderRadius: radius(16),
                    padding: wp(3.5),
                    borderWidth: 1.5,
                    borderColor: activeHandle === "end" ? primary : borderColor,
                  }}
                >
                  <Text style={{ color: textSecondary, fontSize: fontSize(12), fontWeight: "600" }}>
                    {t("trimmer.end", "Bitiş")}
                  </Text>
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(20),
                      fontWeight: "800",
                      marginVertical: hp(0.5),
                    }}
                  >
                    {formatTime(endSec)}
                  </Text>

                  <View style={{ flexDirection: "row", gap: wp(1.5), marginTop: hp(0.5) }}>
                    <TouchableOpacity
                      onPress={() => adjustTime("end", -1)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        borderRadius: radius(8),
                        backgroundColor: "rgba(255,255,255,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>-1s</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => adjustTime("end", 1)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{
                        flex: 1,
                        minHeight: 36,
                        borderRadius: radius(8),
                        backgroundColor: "rgba(255,255,255,0.08)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text style={{ color: textPrimary, fontSize: fontSize(12), fontWeight: "700" }}>+1s</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* Quick Duration Presets */}
              <View>
                <Text style={{ color: textSecondary, fontSize: fontSize(13), fontWeight: "600", marginBottom: hp(1) }}>
                  {t("trimmer.presets", "Hazır Süreler")}
                </Text>
                <View style={{ flexDirection: "row", gap: wp(2.5) }}>
                  {PRESET_DURATIONS.map((dur) => {
                    const isActive = Math.round(sliceDuration) === dur;
                    return (
                      <TouchableOpacity
                        key={dur}
                        onPress={() => handleApplyPreset(dur)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityRole="button"
                        accessibilityLabel={`${dur} saniye`}
                        style={{
                          flex: 1,
                          minHeight: 40,
                          borderRadius: radius(12),
                          backgroundColor: isActive ? primary : "rgba(255,255,255,0.06)",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1,
                          borderColor: isActive ? primary : borderColor,
                        }}
                      >
                        <Text
                          style={{
                            color: isActive ? "#fff" : textPrimary,
                            fontSize: fontSize(13),
                            fontWeight: "700",
                          }}
                        >
                          {dur}s
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Action Buttons: Preview, Ringtone, Save */}
              <View style={{ gap: hp(1.5), marginTop: hp(1) }}>
                {/* Preview with Loop */}
                <TouchableOpacity
                  onPress={handlePlaySlice}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPlayingSlice
                      ? t("trimmer.pauseSlice", "Durdur")
                      : t("trimmer.playSlice", "Aralığı Çal")
                  }
                  style={{
                    minHeight: 48,
                    borderRadius: radius(14),
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderWidth: 1,
                    borderColor,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: wp(2),
                  }}
                >
                  <Icon
                    name={isPlayingSlice ? Pause : Play}
                    size={20}
                    color={textPrimary}
                  />
                  <Text
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(15),
                      fontWeight: "700",
                    }}
                  >
                    {isPlayingSlice
                      ? t("trimmer.pauseSlice", "Durdur")
                      : t("trimmer.playSlice", "Aralığı Önizle (Döngü)")}
                  </Text>
                </TouchableOpacity>

                {/* Primary & Secondary Action Buttons */}
                <View style={{ flexDirection: "row", gap: wp(2.5) }}>
                  {Platform.OS === "android" && (
                    <TouchableOpacity
                      onPress={handleMakeRingtone}
                      disabled={isProcessing || isRingtoneProcessing}
                      activeOpacity={0.7}
                      accessibilityRole="button"
                      accessibilityLabel={t("trimmer.setRingtone", "Zil Sesi Yap")}
                      style={{
                        flex: 1.2,
                        minHeight: 52,
                        borderRadius: radius(16),
                        backgroundColor: primary,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: wp(2),
                        opacity: isRingtoneProcessing ? 0.7 : 1,
                      }}
                    >
                      {isRingtoneProcessing ? (
                        <>
                          <ActivityIndicator size="small" color="#fff" />
                          <Text style={{ color: "#fff", fontSize: fontSize(15), fontWeight: "700" }}>
                            {t("trimmer.settingRingtone", "İşleniyor...")}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Icon name={Bell} size={19} color="#fff" />
                          <Text style={{ color: "#fff", fontSize: fontSize(15), fontWeight: "700" }}>
                            {t("trimmer.setRingtone", "Zil Sesi Yap")}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    onPress={handleSaveRingtone}
                    disabled={isProcessing || isRingtoneProcessing}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t("trimmer.saveAudio", "Cihaza Kaydet")}
                    style={{
                      flex: 1,
                      minHeight: 52,
                      borderRadius: radius(16),
                      backgroundColor: Platform.OS === "android" ? "rgba(255,255,255,0.08)" : primary,
                      borderWidth: Platform.OS === "android" ? 1 : 0,
                      borderColor: borderColor,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: wp(2),
                      opacity: isProcessing ? 0.7 : 1,
                    }}
                  >
                    {isProcessing ? (
                      <>
                        <ActivityIndicator size="small" color={Platform.OS === "android" ? textPrimary : "#fff"} />
                        <Text
                          style={{
                            color: Platform.OS === "android" ? textPrimary : "#fff",
                            fontSize: fontSize(15),
                            fontWeight: "700",
                          }}
                        >
                          {t("trimmer.saving", "Kaydediliyor...")}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Icon
                          name={Save}
                          size={19}
                          color={Platform.OS === "android" ? textPrimary : "#fff"}
                        />
                        <Text
                          style={{
                            color: Platform.OS === "android" ? textPrimary : "#fff",
                            fontSize: fontSize(15),
                            fontWeight: "700",
                          }}
                        >
                          {t("trimmer.saveAudio", "Cihaza Kaydet")}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
