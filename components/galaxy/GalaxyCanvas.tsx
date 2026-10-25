import React, { useEffect, useMemo, useImperativeHandle, forwardRef } from "react";
import { View, useWindowDimensions, StyleSheet } from "react-native";
import {
  Canvas,
  Circle,
  Group,
  Points,
  Line,
  Path,
  Skia,
  DashPathEffect,
  vec,
  type SkPoint,
} from "@shopify/react-native-skia";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useDerivedValue,
  withTiming,
  withSpring,
  withRepeat,
  withDecay,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { GalaxyStar } from "@/utils/buildGalaxy";
import type { Point2D } from "@/utils/constellation";

export type GalaxyCanvasRef = {
  focusOnStar: (star: GalaxyStar) => void;
  resetCamera: () => void;
};

type GalaxyCanvasProps = {
  stars: GalaxyStar[];
  selectedStar: GalaxyStar | null;
  activeSongId: string | null;
  onSelectStar: (star: GalaxyStar | null) => void;
  isReduceMotion?: boolean;
  isDrawingMode?: boolean;
  drawingPoints?: Point2D[];
  capturedStars?: GalaxyStar[];
  onDrawingStart?: (point: Point2D) => void;
  onDrawingAddPoint?: (point: Point2D) => void;
  onDrawingComplete?: () => void;
};

const MIN_SCALE = 0.4;
const MAX_SCALE = 6.0;

export const GalaxyCanvas = forwardRef<GalaxyCanvasRef, GalaxyCanvasProps>(
  (
    {
      stars,
      selectedStar,
      activeSongId,
      onSelectStar,
      isReduceMotion = false,
      isDrawingMode = false,
      drawingPoints = [],
      capturedStars = [],
      onDrawingStart,
      onDrawingAddPoint,
      onDrawingComplete,
    },
    ref
  ) => {
    const { width, height } = useWindowDimensions();
    const centerX = width / 2;
    const centerY = height / 2;

    // Kamera shared values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(isReduceMotion ? 1 : 0.88);

    // Jest başlangıç referansları
    const savedTranslateX = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);
    const savedScale = useSharedValue(1);

    // Animasyon shared values
    const openingProgress = useSharedValue(isReduceMotion ? 1 : 0);
    const breathingScale = useSharedValue(1);
    const selectionRingScale = useSharedValue(1);
    const selectionRingOpacity = useSharedValue(0);

    // Açılış koreografisi (stagger ~1000ms, kamera 0.88 -> 1)
    useEffect(() => {
      if (isReduceMotion) {
        openingProgress.value = 1;
        scale.value = 1;
        savedScale.value = 1;
      } else {
        openingProgress.value = withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        });
        scale.value = withTiming(1, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        });
        savedScale.value = 1;
      }
    }, [isReduceMotion, openingProgress, scale, savedScale]);

    // Çalan şarkı yıldızında boşta nefes animasyonu (~1.6 sn döngü)
    useEffect(() => {
      if (!isReduceMotion) {
        breathingScale.value = withRepeat(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.quad) }),
          -1,
          true
        );
      }
    }, [breathingScale, isReduceMotion]);

    // Seçilen yıldız değiştiğinde halka animasyonu (1 -> 1.6, 350ms'de sönme)
    useEffect(() => {
      if (selectedStar) {
        selectionRingScale.value = 1;
        selectionRingOpacity.value = 1;
        selectionRingScale.value = withTiming(1.6, {
          duration: 350,
          easing: Easing.out(Easing.quad),
        });
        selectionRingOpacity.value = withTiming(0, {
          duration: 350,
          easing: Easing.out(Easing.quad),
        });
      }
    }, [selectedStar, selectionRingScale, selectionRingOpacity]);

    // Kamerayı hedefe süzülerek taşı
    const animateCameraToStar = (star: GalaxyStar) => {
      const targetScale = Math.max(1.2, Math.min(2.4, scale.value));
      const targetX = -star.x * targetScale;
      // Yıldızı hafifçe ekranın üstüne al ki alttan açılan kart örtmesin
      const targetY = -star.y * targetScale - 70;

      translateX.value = withTiming(targetX, {
        duration: isReduceMotion ? 150 : 450,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(targetY, {
        duration: isReduceMotion ? 150 : 450,
        easing: Easing.out(Easing.cubic),
      });
      scale.value = withTiming(targetScale, {
        duration: isReduceMotion ? 150 : 450,
        easing: Easing.out(Easing.cubic),
      });

      savedTranslateX.value = targetX;
      savedTranslateY.value = targetY;
      savedScale.value = targetScale;
    };

    useImperativeHandle(ref, () => ({
      focusOnStar: (star: GalaxyStar) => {
        animateCameraToStar(star);
      },
      resetCamera: () => {
        translateX.value = withTiming(0, { duration: 350 });
        translateY.value = withTiming(0, { duration: 350 });
        scale.value = withTiming(1, { duration: 350 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
        savedScale.value = 1;
      },
    }));

    // Skia Groups transform matrix
    const canvasTransform = useDerivedValue(() => {
      return [
        { translateX: centerX + translateX.value },
        { translateY: centerY + translateY.value },
        { scale: scale.value },
      ];
    }, [centerX, centerY]);

    // Sönük / hiç dinlenmemiş yıldızları tek Skia Points dizisine dönüştür (ultra hızlı render)
    const faintPoints: SkPoint[] = useMemo(() => {
      return stars
        .filter((s) => !s.played)
        .map((s) => vec(s.x, s.y));
    }, [stars]);

    // Parlak / dinlenmiş yıldızlar (ayrıntılı render)
    const playedStars = useMemo(() => {
      return stars.filter((s) => s.played);
    }, [stars]);

    // En parlak ilk 35 yıldız (hale / outer glow için)
    const haloStars = useMemo(() => {
      return playedStars.slice(0, 35);
    }, [playedStars]);

    // Dokunma tespiti için callback
    const handleTapAt = (screenX: number, screenY: number) => {
      const currentScale = scale.value;
      const currentTx = translateX.value;
      const currentTy = translateY.value;

      // Ekran koordinatını dünya koordinatına çevir
      const worldX = (screenX - centerX - currentTx) / currentScale;
      const worldY = (screenY - centerY - currentTy) / currentScale;

      const hitRadius = 26 / currentScale;
      const hitRadiusSq = hitRadius * hitRadius;

      let closest: GalaxyStar | null = null;
      let minDistanceSq = hitRadiusSq;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]!;
        const dx = s.x - worldX;
        const dy = s.y - worldY;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          closest = s;
        }
      }

      if (closest) {
        Haptics.selectionAsync();
        onSelectStar(closest);
        animateCameraToStar(closest);
      } else {
        onSelectStar(null);
      }
    };

    // Çizilen yol Skia Path nesnesi
    const drawSkPath = useMemo(() => {
      if (!drawingPoints || drawingPoints.length < 2) return null;
      const path = Skia.Path.Make();
      path.moveTo(drawingPoints[0].x, drawingPoints[0].y);
      for (let i = 1; i < drawingPoints.length; i++) {
        path.lineTo(drawingPoints[i].x, drawingPoints[i].y);
      }
      return path;
    }, [drawingPoints]);

    // Çizilen parmağın ucundaki kuyruklu yıldız başı (Comet Flare)
    const drawingTip = useMemo(() => {
      if (!drawingPoints || drawingPoints.length === 0) return null;
      return drawingPoints[drawingPoints.length - 1];
    }, [drawingPoints]);

    // İz üzerindeki parıltılı yıldız tozu noktaları
    const stardustPoints: SkPoint[] = useMemo(() => {
      if (!drawingPoints || drawingPoints.length < 4) return [];
      const points: SkPoint[] = [];
      for (let i = 2; i < drawingPoints.length; i += 3) {
        const p = drawingPoints[i];
        if (p) points.push(vec(p.x, p.y));
      }
      return points;
    }, [drawingPoints]);

    // Yakalanan yıldızların takımyıldız bağlantı yolu
    const constellationSkPath = useMemo(() => {
      if (!capturedStars || capturedStars.length < 2) return null;
      const path = Skia.Path.Make();
      path.moveTo(capturedStars[0].x, capturedStars[0].y);
      for (let i = 1; i < capturedStars.length; i++) {
        path.lineTo(capturedStars[i].x, capturedStars[i].y);
      }
      return path;
    }, [capturedStars]);

    // ── GESTURES ──
    // Çizim modu jesti
    const drawGesture = Gesture.Pan()
      .minDistance(2)
      .onStart((e) => {
        const wx = (e.x - centerX - translateX.value) / scale.value;
        const wy = (e.y - centerY - translateY.value) / scale.value;
        if (onDrawingStart) {
          runOnJS(onDrawingStart)({ x: wx, y: wy });
        }
      })
      .onUpdate((e) => {
        const wx = (e.x - centerX - translateX.value) / scale.value;
        const wy = (e.y - centerY - translateY.value) / scale.value;
        if (onDrawingAddPoint) {
          runOnJS(onDrawingAddPoint)({ x: wx, y: wy });
        }
      })
      .onEnd(() => {
        if (onDrawingComplete) {
          runOnJS(onDrawingComplete)();
        }
      });

    const panGesture = Gesture.Pan()
      .onStart(() => {
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      })
      .onUpdate((e) => {
        translateX.value = savedTranslateX.value + e.translationX;
        translateY.value = savedTranslateY.value + e.translationY;
      })
      .onEnd((e) => {
        // Kaydırma bittiğinde withDecay ile doğal süzülüş
        const bound = 1600 * scale.value;
        translateX.value = withDecay({
          velocity: e.velocityX,
          clamp: [-bound, bound],
        });
        translateY.value = withDecay({
          velocity: e.velocityY,
          clamp: [-bound, bound],
        });
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    const pinchGesture = Gesture.Pinch()
      .onStart(() => {
        savedScale.value = scale.value;
      })
      .onUpdate((e) => {
        const nextScale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, savedScale.value * e.scale)
        );
        scale.value = nextScale;
      })
      .onEnd(() => {
        savedScale.value = scale.value;
      });

    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .onEnd((e) => {
        const targetScale = scale.value < 2.0 ? 2.8 : 1.0;
        scale.value = withTiming(targetScale, {
          duration: 350,
          easing: Easing.out(Easing.cubic),
        });
        savedScale.value = targetScale;
      });

    const singleTapGesture = Gesture.Tap()
      .numberOfTaps(1)
      .onEnd((e) => {
        runOnJS(handleTapAt)(e.x, e.y);
      });

    const tapComposed = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
    const combinedGesture = Gesture.Simultaneous(
      panGesture,
      pinchGesture,
      tapComposed
    );

    const activeGesture = isDrawingMode ? drawGesture : combinedGesture;

    return (
      <View style={StyleSheet.absoluteFill}>
        <GestureDetector gesture={activeGesture}>
          <Canvas style={{ flex: 1, backgroundColor: "#07090E" }}>
            <Group transform={canvasTransform}>
              {/* 1. Çizilen canlı kozmik yol (Çok katmanlı neon plazma izi) */}
              {drawSkPath ? (
                <Group>
                  {/* Katman 1: Geniş nebula ışıma aurası */}
                  <Path
                    path={drawSkPath}
                    style="stroke"
                    strokeWidth={18}
                    color="#818CF8"
                    opacity={0.2}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                  {/* Katman 2: Orta siyan plazma ışını */}
                  <Path
                    path={drawSkPath}
                    style="stroke"
                    strokeWidth={7.5}
                    color="#06B6D4"
                    opacity={0.5}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                  {/* Katman 3: Parlak elektrik mavi çekirdek */}
                  <Path
                    path={drawSkPath}
                    style="stroke"
                    strokeWidth={3}
                    color="#38BDF8"
                    opacity={0.92}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                  {/* Katman 4: Ultra sıcak saf beyaz lazer hattı */}
                  <Path
                    path={drawSkPath}
                    style="stroke"
                    strokeWidth={1.4}
                    color="#FFFFFF"
                    opacity={1}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                </Group>
              ) : null}

              {/* 2. Yol üzerindeki parıltılı yıldız tozu (Stardust) */}
              {stardustPoints.length > 0 ? (
                <Group>
                  <Points
                    points={stardustPoints}
                    mode="points"
                    strokeWidth={5}
                    color="#38BDF8"
                    opacity={0.35}
                    strokeCap="round"
                  />
                  <Points
                    points={stardustPoints}
                    mode="points"
                    strokeWidth={2}
                    color="#FFFFFF"
                    opacity={0.9}
                    strokeCap="round"
                  />
                </Group>
              ) : null}

              {/* 3. Çizim yapılan parmağın ucundaki Kuyruklu Yıldız Başı (Comet Flare & Diffraction Cross) */}
              {drawingTip ? (
                <Group>
                  {/* Dış parıltı aurası */}
                  <Circle
                    cx={drawingTip.x}
                    cy={drawingTip.y}
                    r={18}
                    color="#38BDF8"
                    opacity={0.25}
                  />
                  {/* İç plazma diski */}
                  <Circle
                    cx={drawingTip.x}
                    cy={drawingTip.y}
                    r={9}
                    color="#22D3EE"
                    opacity={0.65}
                  />
                  {/* Parlak beyaz çekirdek */}
                  <Circle
                    cx={drawingTip.x}
                    cy={drawingTip.y}
                    r={4}
                    color="#FFFFFF"
                    opacity={1}
                  />
                  {/* 4 köşeli teleskopik kırınım iğneleri (Diffraction Spikes) */}
                  <Line
                    p1={vec(drawingTip.x - 22, drawingTip.y)}
                    p2={vec(drawingTip.x + 22, drawingTip.y)}
                    strokeWidth={1.5}
                    color="#FFFFFF"
                    opacity={0.95}
                  />
                  <Line
                    p1={vec(drawingTip.x, drawingTip.y - 22)}
                    p2={vec(drawingTip.x, drawingTip.y + 22)}
                    strokeWidth={1.5}
                    color="#FFFFFF"
                    opacity={0.95}
                  />
                  {/* Çapraz mikro kırınım parıltıları */}
                  <Line
                    p1={vec(drawingTip.x - 9, drawingTip.y - 9)}
                    p2={vec(drawingTip.x + 9, drawingTip.y + 9)}
                    strokeWidth={1}
                    color="#A5F3FC"
                    opacity={0.65}
                  />
                  <Line
                    p1={vec(drawingTip.x - 9, drawingTip.y + 9)}
                    p2={vec(drawingTip.x + 9, drawingTip.y - 9)}
                    strokeWidth={1}
                    color="#A5F3FC"
                    opacity={0.65}
                  />
                </Group>
              ) : null}

              {/* 4. Takımyıldız bağlantı çizgileri (Dashed Pulsing Energy Line) */}
              {constellationSkPath ? (
                <Group>
                  {/* Dış parıltı kuşağı */}
                  <Path
                    path={constellationSkPath}
                    style="stroke"
                    strokeWidth={7}
                    color="#06B6D4"
                    opacity={0.28}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                  {/* Kesikli elektrikli enerji akımı */}
                  <Path
                    path={constellationSkPath}
                    style="stroke"
                    strokeWidth={2.4}
                    color="#22D3EE"
                    opacity={0.9}
                    strokeCap="round"
                    strokeJoin="round"
                  >
                    <DashPathEffect intervals={[12, 10]} />
                  </Path>
                  {/* Sıcak beyaz çekirdek ışın */}
                  <Path
                    path={constellationSkPath}
                    style="stroke"
                    strokeWidth={1.2}
                    color="#FFFFFF"
                    opacity={0.9}
                    strokeCap="round"
                    strokeJoin="round"
                  />
                </Group>
              ) : null}

              {/* 5. Yakalanan yıldızların patlama halkaları & Starburst düğümleri */}
              {capturedStars.map((cs, idx) => (
                <Group key={`captured-${cs.id}-${idx}`}>
                  {/* Dış şok dalgası halkası */}
                  <Circle
                    cx={cs.x}
                    cy={cs.y}
                    r={22 + cs.glow * 6}
                    style="stroke"
                    strokeWidth={1}
                    color="#38BDF8"
                    opacity={0.35}
                  />
                  {/* İç korona halkası */}
                  <Circle
                    cx={cs.x}
                    cy={cs.y}
                    r={13 + cs.glow * 4}
                    style="stroke"
                    strokeWidth={2}
                    color="#22D3EE"
                    opacity={0.85}
                  />
                  {/* Dolu yıldız çekirdeği */}
                  <Circle
                    cx={cs.x}
                    cy={cs.y}
                    r={6 + cs.glow * 2}
                    color={cs.color}
                    opacity={0.95}
                  />
                  {/* Beyaz merkez nokta */}
                  <Circle
                    cx={cs.x}
                    cy={cs.y}
                    r={2.5}
                    color="#FFFFFF"
                  />
                  {/* 4 köşeli parlak elmas kırınımı */}
                  <Line
                    p1={vec(cs.x - 14, cs.y)}
                    p2={vec(cs.x + 14, cs.y)}
                    strokeWidth={1.2}
                    color="#E0F2FE"
                    opacity={0.85}
                  />
                  <Line
                    p1={vec(cs.x, cs.y - 14)}
                    p2={vec(cs.x, cs.y + 14)}
                    strokeWidth={1.2}
                    color="#E0F2FE"
                    opacity={0.85}
                  />
                </Group>
              ))}
              {/* Kadran kılavuz çemberleri */}
              <Circle
                cx={0}
                cy={0}
                r={100}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.04)"
              />
              <Circle
                cx={0}
                cy={0}
                r={260}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.04)"
              />
              <Circle
                cx={0}
                cy={0}
                r={460}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.04)"
              />

              {/* Kadran eksen çizgileri (00:00 tepe, 06:00 sağ, 12:00 alt, 18:00 sol) */}
              <Line
                p1={vec(0, -490)}
                p2={vec(0, 490)}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.03)"
              />
              <Line
                p1={vec(-490, 0)}
                p2={vec(490, 0)}
                style="stroke"
                strokeWidth={1}
                color="rgba(255,255,255,0.03)"
              />

              {/* Sönük / hiç dinlenmemiş yıldızlar (tek GPU draw call) */}
              {faintPoints.length > 0 ? (
                <Points
                  points={faintPoints}
                  mode="points"
                  strokeWidth={2.4}
                  color="#3B4252"
                />
              ) : null}

              {/* En parlak ilk 35 yıldızın çevresindeki yumuşak hale (glow) */}
              {haloStars.map((s) => (
                <Circle
                  key={`halo-${s.id}`}
                  cx={s.x}
                  cy={s.y}
                  r={8 + s.glow * 14}
                  color={s.color}
                  opacity={0.18 + s.glow * 0.22}
                />
              ))}

              {/* Dinlenmiş şarkı yıldızları & parlayan gezegenler */}
              {playedStars.map((s) => {
                const starRadius = Math.max(3.2, 3.8 + s.glow * 6.5);
                const isSelected = selectedStar?.id === s.id;
                const isPlaying = activeSongId === s.id;
                const spikeLen = 8 + s.glow * 24;
                const diagLen = spikeLen * 0.42;

                return (
                  <Group key={s.id}>
                    {/* 1. Teleskopik Yıldız Işınları (4 Köşeli Kırınım / Diffraction Spikes) */}
                    {s.glow > 0.18 ? (
                      <Group opacity={0.35 + s.glow * 0.45}>
                        {/* Yatay Işık Kırınımı */}
                        <Line
                          p1={vec(s.x - spikeLen, s.y)}
                          p2={vec(s.x + spikeLen, s.y)}
                          style="stroke"
                          strokeWidth={0.9}
                          color={s.color}
                        />
                        {/* Dikey Işık Kırınımı */}
                        <Line
                          p1={vec(s.x, s.y - spikeLen)}
                          p2={vec(s.x, s.y + spikeLen)}
                          style="stroke"
                          strokeWidth={0.9}
                          color={s.color}
                        />
                        {/* En parlaklar için çapraz parıltı ışınları */}
                        {s.glow > 0.5 ? (
                          <Group opacity={0.4}>
                            <Line
                              p1={vec(s.x - diagLen, s.y - diagLen)}
                              p2={vec(s.x + diagLen, s.y + diagLen)}
                              style="stroke"
                              strokeWidth={0.6}
                              color="#FFFFFF"
                            />
                            <Line
                              p1={vec(s.x - diagLen, s.y + diagLen)}
                              p2={vec(s.x + diagLen, s.y - diagLen)}
                              style="stroke"
                              strokeWidth={0.6}
                              color="#FFFFFF"
                            />
                          </Group>
                        ) : null}
                      </Group>
                    ) : null}

                    {/* 2. Dış Atmosferik Korona / Yıldız Halesi */}
                    <Circle
                      cx={s.x}
                      cy={s.y}
                      r={starRadius * 2.8}
                      color={s.color}
                      opacity={0.12 + s.glow * 0.18}
                    />

                    {/* 3. İç Atmosfer / Gezegen Işıltısı */}
                    <Circle
                      cx={s.x}
                      cy={s.y}
                      r={starRadius * 1.6}
                      color={s.color}
                      opacity={0.3 + s.glow * 0.25}
                    />

                    {/* 4. En çok dinlenenler için Gezegen Halkası (Satürn benzeri orbital halka) */}
                    {s.glow > 0.65 ? (
                      <Line
                        p1={vec(s.x - starRadius * 2.4, s.y - starRadius * 0.8)}
                        p2={vec(s.x + starRadius * 2.4, s.y + starRadius * 0.8)}
                        style="stroke"
                        strokeWidth={1.2}
                        color={s.color}
                        opacity={0.65}
                      />
                    ) : null}

                    {/* 5. Gezegen / Yıldız Gövdesi (Ana katman) */}
                    <Circle
                      cx={s.x}
                      cy={s.y}
                      r={starRadius}
                      color={s.color}
                      opacity={0.88 + s.glow * 0.12}
                    />

                    {/* 6. Beyaz Sıcak Çekirdek (White-Hot Luminous Core) */}
                    <Circle
                      cx={s.x}
                      cy={s.y}
                      r={Math.max(1.4, starRadius * 0.38)}
                      color="#FFFFFF"
                      opacity={0.96}
                    />

                    {/* 7. Çalan şarkı nefes halkası */}
                    {isPlaying ? (
                      <Group>
                        <Circle
                          cx={s.x}
                          cy={s.y}
                          r={starRadius * 2.5}
                          style="stroke"
                          strokeWidth={2}
                          color="#38BDF8"
                          opacity={0.85}
                        />
                        <Circle
                          cx={s.x}
                          cy={s.y}
                          r={starRadius * 3.6}
                          style="stroke"
                          strokeWidth={1}
                          color="#818CF8"
                          opacity={0.4}
                        />
                      </Group>
                    ) : null}

                    {/* 8. Seçili yıldız kozmik hedef halkası */}
                    {isSelected ? (
                      <Group>
                        <Circle
                          cx={s.x}
                          cy={s.y}
                          r={starRadius * 2.6}
                          style="stroke"
                          strokeWidth={2}
                          color="#FFFFFF"
                          opacity={0.95}
                        />
                        <Circle
                          cx={s.x}
                          cy={s.y}
                          r={starRadius * 3.8}
                          style="stroke"
                          strokeWidth={1}
                          color="#38BDF8"
                          opacity={0.6}
                        />
                        {/* Hedefleme çizgileri */}
                        <Line
                          p1={vec(s.x - starRadius * 4.2, s.y)}
                          p2={vec(s.x - starRadius * 3.0, s.y)}
                          style="stroke"
                          strokeWidth={1.5}
                          color="#38BDF8"
                        />
                        <Line
                          p1={vec(s.x + starRadius * 3.0, s.y)}
                          p2={vec(s.x + starRadius * 4.2, s.y)}
                          style="stroke"
                          strokeWidth={1.5}
                          color="#38BDF8"
                        />
                        <Line
                          p1={vec(s.x, s.y - starRadius * 4.2)}
                          p2={vec(s.x, s.y - starRadius * 3.0)}
                          style="stroke"
                          strokeWidth={1.5}
                          color="#38BDF8"
                        />
                        <Line
                          p1={vec(s.x, s.y + starRadius * 3.0)}
                          p2={vec(s.x, s.y + starRadius * 4.2)}
                          style="stroke"
                          strokeWidth={1.5}
                          color="#38BDF8"
                        />
                      </Group>
                    ) : null}
                  </Group>
                );
              })}
            </Group>
          </Canvas>
        </GestureDetector>
      </View>
    );
  }
);
