import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  StyleSheet,
  StatusBar,
  Platform,
  BackHandler,
} from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { RotateCcw, Check, AlertCircle } from "lucide-react-native";
import { useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useAudioPlayerContext } from "@/providers/player-context";
import { useGalaxyData } from "@/hooks/useGalaxyData";
import { GalaxyCanvas, type GalaxyCanvasRef } from "@/components/galaxy/GalaxyCanvas";
import { GalaxyBottomCard } from "@/components/galaxy/GalaxyBottomCard";
import { GalaxyListView } from "@/components/galaxy/GalaxyListView";
import { GalaxyHeader } from "@/components/galaxy/GalaxyHeader";
import { ConstellationSheet } from "@/components/galaxy/ConstellationSheet";
import { SaveConstellationModal } from "@/components/galaxy/SaveConstellationModal";
import { GalaxySongOptionsModal } from "@/components/galaxy/GalaxySongOptionsModal";
import { LoadingState } from "@/components/ui/loading-state";
import {
  pickStarsAlongPath,
  generateCenterOutPreset,
  generateOuterInPreset,
  generateCycle24hPreset,
  type Point2D,
} from "@/utils/constellation";
import type { GalaxyStar } from "@/utils/buildGalaxy";
import type { Song } from "@/hooks/useSongsService";

type PresetType = "center-out" | "outer-in" | "cycle-24h";

export default function GalaxyScreen() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const { play, activeSong } = useAudioPlayerContext();

  const canvasRef = useRef<GalaxyCanvasRef>(null);

  // Veri Katmanı Hook'u (Kurallar: UI ile veri ayrımı, 4 durum yönetimi)
  const { stars, isLoading, isError, refetch } = useGalaxyData();

  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [selectedStar, setSelectedStar] = useState<GalaxyStar | null>(null);
  const [optionsStar, setOptionsStar] = useState<GalaxyStar | null>(null);
  const [isReduceMotion, setIsReduceMotion] = useState(false);

  // Çizim modu ve takımyıldız stateleri
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState<Point2D[]>([]);
  const [capturedStars, setCapturedStars] = useState<GalaxyStar[]>([]);
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Alt kart animasyon shared value (gizliyken 180, açıkken 0)
  const cardTranslateY = useSharedValue(180);

  // Reduce motion kontrolü
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setIsReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", setIsReduceMotion);
    return () => sub.remove();
  }, []);

  // Android alt navigasyon çubuğunu gizleme (Sürükleyici tam ekran deneyimi)
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setVisibilityAsync("hidden").catch(() => {});
      NavigationBar.setBehaviorAsync("overlay-swipe").catch(() => {});
    }
    return () => {
      if (Platform.OS === "android") {
        NavigationBar.setVisibilityAsync("visible").catch(() => {});
      }
    };
  }, []);

  // Donanım geri tuşu yönetimi (Rules 17 / Android back button)
  useEffect(() => {
    const onBackPress = () => {
      if (isDrawingMode) {
        setIsDrawingMode(false);
        setDrawingPoints([]);
        setCapturedStars([]);
        return true;
      }
      if (viewMode === "list") {
        setViewMode("map");
        return true;
      }
      if (selectedStar) {
        handleSelectStar(null);
        return true;
      }
      router.back();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backHandler.remove();
  }, [isDrawingMode, viewMode, selectedStar]);

  // Seçilen yıldız değiştiğinde alt kartı aç/kapat
  const handleSelectStar = useCallback((star: GalaxyStar | null) => {
    setSelectedStar(star);
    if (star) {
      cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 180 });
    } else {
      cardTranslateY.value = withSpring(180, { damping: 18, stiffness: 180 });
    }
  }, [cardTranslateY]);

  // Karanlıktan keşfet: En sönük %20'den rastgele bir yıldız seç ve kamerayı ona götür
  const handleDiscoverFromDarkness = useCallback(() => {
    if (stars.length === 0) return;
    const sorted = [...stars].sort((a, b) => a.total_secs - b.total_secs);
    const candidateCount = Math.max(1, Math.floor(sorted.length * 0.2));
    const randomIdx = Math.floor(Math.random() * candidateCount);
    const chosen = sorted[randomIdx];
    if (chosen) {
      handleSelectStar(chosen);
      canvasRef.current?.focusOnStar(chosen);
    }
  }, [stars, handleSelectStar]);

  // Şarkı çalma fonksiyonu
  const handlePlayStar = useCallback((star: GalaxyStar) => {
    const songAsset: Song = {
      id: star.id,
      filename: star.title,
      uri: star.uri || "",
      mediaType: "audio" as any,
      width: 0,
      height: 0,
      creationTime: 0,
      modificationTime: 0,
      duration: star.duration,
      metadata: {
        title: star.title,
        artist: star.artist,
        album: star.album,
        duration: star.duration,
        coverUri: star.coverUri || undefined,
      },
    };
    play(songAsset);
  }, [play]);

  // Takımyıldız oynatma
  const handlePlayConstellation = useCallback(() => {
    if (capturedStars.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const playlistSongs: Song[] = capturedStars.map((s) => ({
      id: s.id,
      filename: s.title,
      uri: s.uri || "",
      mediaType: "audio" as any,
      width: 0,
      height: 0,
      creationTime: 0,
      modificationTime: 0,
      duration: s.duration,
      metadata: {
        title: s.title,
        artist: s.artist,
        album: s.album,
        duration: s.duration,
        coverUri: s.coverUri || undefined,
      },
    }));
    const firstSong = playlistSongs[0];
    if (firstSong) {
      play(firstSong, playlistSongs);
    }
  }, [capturedStars, play]);

  // Çizim jestleri
  const handleDrawingStart = useCallback((point: Point2D) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawingPoints([point]);
    const matched = pickStarsAlongPath([point], stars, 28);
    setCapturedStars(matched);
  }, [stars]);

  const handleDrawingAddPoint = useCallback((point: Point2D) => {
    setDrawingPoints((prev) => {
      const updated = [...prev, point];
      const matched = pickStarsAlongPath(updated, stars, 28);
      if (matched.length > capturedStars.length) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCapturedStars(matched);
      }
      return updated;
    });
  }, [stars, capturedStars.length]);

  const handleDrawingComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleClearConstellation = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDrawingPoints([]);
    setCapturedStars([]);
  }, []);

  // Şablon takımyıldızlar (Handler-map deseni - Rules 3.6 & 4)
  const presetHandlers: Record<PresetType, () => void> = {
    "center-out": () => setCapturedStars(generateCenterOutPreset(stars)),
    "outer-in": () => setCapturedStars(generateOuterInPreset(stars)),
    "cycle-24h": () => setCapturedStars(generateCycle24hPreset(stars)),
  };

  const handleApplyPreset = useCallback((preset: PresetType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDrawingPoints([]);
    const handler = presetHandlers[preset];
    if (handler) {
      handler();
    }
  }, [stars]);

  // Geri butonu davranışı
  const handleBackPress = useCallback(() => {
    if (isDrawingMode) {
      setIsDrawingMode(false);
      setDrawingPoints([]);
      setCapturedStars([]);
    } else if (viewMode === "list") {
      setViewMode("map");
    } else {
      router.back();
    }
  }, [isDrawingMode, viewMode]);

  // 1. DURUM: Yükleniyor (Loading state)
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#07090E" }}>
        <StatusBar hidden />
        <LoadingState />
      </View>
    );
  }

  // 2. DURUM: Hata (Error state)
  if (isError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#07090E",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: wp(6),
        }}
      >
        <StatusBar hidden />
        <AlertCircle size={48} color="#EF4444" style={{ marginBottom: hp(2) }} />
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: fontSize(18),
            fontWeight: "700",
            textAlign: "center",
            marginBottom: hp(1),
          }}
        >
          {t("galaxy.loadError", {
            defaultValue: "Galaksi yüklenemedi. Bağlantını kontrol edip tekrar dene.",
          })}
        </Text>
        <TouchableOpacity
          onPress={refetch}
          style={{
            marginTop: hp(2),
            paddingHorizontal: wp(6),
            paddingVertical: hp(1.4),
            borderRadius: radius(20),
            backgroundColor: colors.primary,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: fontSize(14) }}>
            {t("common.retry", { defaultValue: "Tekrar Dene" })}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 3. & 4. DURUM: Boş ve Başarılı (Empty & Success states)
  return (
    <View style={{ flex: 1, backgroundColor: "#07090E" }}>
      <StatusBar hidden />

      {/* Görünüm: Harita (Skia Canvas) veya Liste */}
      {viewMode === "map" ? (
        <View style={StyleSheet.absoluteFill}>
          <GalaxyCanvas
            ref={canvasRef}
            stars={stars}
            selectedStar={selectedStar}
            activeSongId={activeSong?.id || null}
            onSelectStar={handleSelectStar}
            isReduceMotion={isReduceMotion}
            isDrawingMode={isDrawingMode}
            drawingPoints={drawingPoints}
            capturedStars={capturedStars}
            onDrawingStart={handleDrawingStart}
            onDrawingAddPoint={handleDrawingAddPoint}
            onDrawingComplete={handleDrawingComplete}
          />
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: hp(10) }}>
          <GalaxyListView
            stars={stars}
            activeSongId={activeSong?.id || null}
            onPlaySong={handlePlayStar}
            onOptionsPress={setOptionsStar}
          />
        </View>
      )}

      {/* Boş Kütüphane Durumu */}
      {stars.length === 0 ? (
        <View
          pointerEvents="box-none"
          style={[
            StyleSheet.absoluteFill,
            { justifyContent: "center", alignItems: "center", paddingHorizontal: wp(8) },
          ]}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: fontSize(20),
              fontWeight: "600",
              textAlign: "center",
              marginBottom: hp(1),
            }}
          >
            {t("galaxy.emptyTitle", { defaultValue: "Dinledikçe galaksin parlar." })}
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: fontSize(14),
              textAlign: "center",
            }}
          >
            {t("galaxy.emptySubtitle", { defaultValue: "Bir şarkı çal, ilk yıldızın yansın." })}
          </Text>
        </View>
      ) : null}

      {/* Floating Glass Header (RTL uyumlu, i18n, dokunma alanları >= 44x44) */}
      <GalaxyHeader
        viewMode={viewMode}
        isDrawingMode={isDrawingMode}
        starCount={stars.length}
        onBackPress={handleBackPress}
        onToggleDrawMode={() => {
          setIsDrawingMode((prev) => !prev);
          handleSelectStar(null);
          setDrawingPoints([]);
          setCapturedStars([]);
        }}
        onDiscoverFromDarkness={handleDiscoverFromDarkness}
        onToggleViewMode={() => {
          setViewMode((prev) => (prev === "map" ? "list" : "map"));
        }}
      />

      {/* Haritada Kamerayı Sıfırlama Butonu */}
      {viewMode === "map" && selectedStar && !isDrawingMode ? (
        <TouchableOpacity
          onPress={() => {
            canvasRef.current?.resetCamera();
            handleSelectStar(null);
          }}
          accessibilityRole="button"
          accessibilityLabel={t("galaxy.resetCamera", { defaultValue: "Kamerayı Sıfırla" })}
          style={{
            position: "absolute",
            right: wp(4),
            bottom: hp(15),
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(15, 20, 32, 0.85)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.15)",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
          }}
        >
          <RotateCcw size={18} color="#FFFFFF" />
        </TouchableOpacity>
      ) : null}

      {/* Çizim Modu Takımyıldız Önizleme Paneli */}
      {viewMode === "map" && isDrawingMode ? (
        <ConstellationSheet
          stars={capturedStars}
          onPlay={handlePlayConstellation}
          onOpenSaveModal={() => setIsSaveModalVisible(true)}
          onClear={handleClearConstellation}
          onExitDrawMode={() => {
            setIsDrawingMode(false);
            setDrawingPoints([]);
            setCapturedStars([]);
          }}
          onApplyPreset={handleApplyPreset}
        />
      ) : null}

      {/* Seçili Yıldız Alt Kartı (Harita Modunda ve Çizim Modu Kapalıyken) */}
      {viewMode === "map" && !isDrawingMode ? (
        <GalaxyBottomCard
          star={selectedStar}
          isVisible={!!selectedStar}
          onPlay={handlePlayStar}
          onOptionsPress={setOptionsStar}
          onClose={() => handleSelectStar(null)}
          translateYValue={cardTranslateY}
        />
      ) : null}

      {/* Şarkı 3 Nokta Aksiyon Menüsü Modalı */}
      <GalaxySongOptionsModal
        visible={!!optionsStar}
        onClose={() => setOptionsStar(null)}
        star={optionsStar}
      />

      {/* Çalma Listesi Kaydetme Modalı */}
      <SaveConstellationModal
        visible={isSaveModalVisible}
        onClose={() => setIsSaveModalVisible(false)}
        stars={capturedStars}
        onSaved={(playlistTitle) => {
          setSaveSuccessMessage(playlistTitle);
          setTimeout(() => setSaveSuccessMessage(null), 3500);
        }}
      />

      {/* Başarı Toast Bildirimi */}
      {saveSuccessMessage ? (
        <SafeAreaView
          edges={["top"]}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: hp(7),
            alignSelf: "center",
            backgroundColor: "rgba(16, 185, 129, 0.95)",
            paddingVertical: 10,
            paddingHorizontal: 18,
            borderRadius: 20,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            zIndex: 100,
            shadowColor: "#10B981",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.35,
            shadowRadius: 12,
            elevation: 10,
          }}
        >
          <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
          <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>
            {t("galaxy.saveSuccessDesc", {
              title: saveSuccessMessage,
              defaultValue: `"${saveSuccessMessage}" çalma listesi olarak kaydedildi`,
            })}
          </Text>
        </SafeAreaView>
      ) : null}
    </View>
  );
}
