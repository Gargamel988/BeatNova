import React, { useState, useEffect } from "react";
import { TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { LinearGradient } from "expo-linear-gradient";
import {
  Play,
  ArrowLeftToLine,
  ArrowRightToLine,
  Pause,
  Music,
} from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import AudioPlayer from "@/components/AudioPlayer";
import { useThemeModeContext } from "@/providers/theme-provider";
import { Song } from "@/components/songs/songsService";
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS 
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

export default function MiniPlayer({
  coverUri,
  title,
  artist,
  isPlaying,
  resumeSound,
  stopSound,
  nextSound,
  previousSound,
  activeSong,
  bottomOffset,
}: {
  coverUri?: string;
  title?: string;
  artist?: string;
  isPlaying?: boolean;
  resumeSound?: () => void;
  stopSound?: () => void;
  nextSound?: () => void;
  previousSound?: () => void;
  activeSong?: Song;
  bottomOffset?: number;
}) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const screenWidth = Dimensions.get('window').width;
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const SWIPE_THRESHOLD = screenWidth * 0.3; 

  const handleDismiss = () => {
    stopSound?.();
  };

  useEffect(() => {
    if (activeSong) {
      translateX.value = withSpring(0, {
        damping: 0,
        stiffness: 90,
      });
      opacity.value = withTiming(1, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSong?.id]); 

  const panGesture = Gesture.Pan()
    .activeOffsetX(10) // En az 10px yatay hareket gerektir (dikey scroll ile çakışmasın)
    .onUpdate((event) => {
      // Sadece sağa kaydırma (pozitif değer)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        // Opacity'yi kaydırma miktarına göre azalt
        opacity.value = Math.max(0, 1 - (event.translationX / screenWidth));
      }
    })
    .onEnd((event) => {
      // Eşik değeri geçildi mi veya hızlı kaydırma var mı?
      if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 500) {
        // Dismiss - sağa kaydır ve gizle
        translateX.value = withSpring(screenWidth, {
          damping: 20,
          stiffness: 90,
        });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleDismiss)();
      } else {
        // Geri dön - başlangıç pozisyonuna
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
        opacity.value = withTiming(1, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  return (
    <>
    <GestureDetector gesture={panGesture}>
      <Animated.View
        className="absolute left-0 right-0 flex-row items-center justify-between"
        style={[
          {
            minHeight: hp(10),
            paddingVertical: hp(1.5),
            bottom: bottomOffset !== undefined ? bottomOffset : hp(13),
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.overlay.white10,
          },
          animatedStyle,
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            setIsModalVisible(true);
          }}
          className="flex-1 flex-row items-center justify-between"
          activeOpacity={0.8}
          style={{ flex: 1 }}
        >
      <View 
        className="flex-1 flex-row items-center"
        style={{ gap: wp(3) }}
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={{
              width: wp(15),
              height: wp(15),
              borderRadius: radius(10),
            }}
          />
        ) : (
          <LinearGradient
            colors={colors.gradient.purplePink as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="items-center justify-center"
            style={{
              width: wp(15),
              height: wp(15),
              borderRadius: radius(10),
            }}
          >
            <Icon name={Music} size={fontSize(24)} color={colors.player.iconWhite} />
          </LinearGradient>
        )}
        <View 
          className="flex-1 flex-col overflow-hidden"
          style={{ gap: hp(0.5) }}
        >
          <Text
            className="font-semibold"
            style={{
              fontSize: fontSize(16),
              color: colors.player.textPrimary,
            }}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={{
              fontSize: fontSize(12),
              color: colors.player.textMuted,
            }}
            numberOfLines={1}
          >
            {artist}
          </Text>
        </View>
      </View>
      <View 
        className="flex-row items-center"
        style={{ 
          gap: wp(4),
          paddingLeft: wp(4),
        }}
      >
        <TouchableOpacity
          style={{ padding: wp(2) }}
          onPress={() => {
            previousSound?.();
          }}
        >
          <Icon name={ArrowLeftToLine} size={fontSize(24)} color={colors.player.iconWhite} />
        </TouchableOpacity>
        <TouchableOpacity
          className="rounded-full"
          style={{ 
            padding: wp(2),
            backgroundColor: colors.overlay.white10 
          }}
          onPress={() => isPlaying ? stopSound?.() : resumeSound?.()}
        >
          <Icon name={isPlaying ? Pause : Play} size={fontSize(24)} color={colors.player.iconWhite} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: wp(2) }}
          onPress={() => {
            nextSound?.();
          }}
        >
          <Icon name={ArrowRightToLine} size={fontSize(24)} color={colors.player.iconWhite} />
        </TouchableOpacity>
      </View>
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
    <AudioPlayer visible={isModalVisible} onClose={() => setIsModalVisible(false)} selectedSong={activeSong as Song} />
    </>
  );
}
