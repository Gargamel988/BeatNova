import React, { useState, useEffect } from "react";
import { TouchableOpacity, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Icon } from "@/components/ui/icon";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import {
  Play,
  ArrowLeftToLine,
  ArrowRightToLine,
  Pause,
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
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";

export default function MiniPlayer({
  coverUri,
  title,
  artist,
  duration,
  currentTime,
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
  duration?: number;
  currentTime?: number;
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

  const screenWidth = Dimensions.get("window").width;
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const SWIPE_THRESHOLD = screenWidth * 0.3;

  const handleDismiss = () => {
    stopSound?.();
  };

  useEffect(() => {
    if (activeSong) {
      translateX.value = withSpring(0, {
        damping: 10,
        stiffness: 90,
      });
      opacity.value = withTiming(1, { duration: 300 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSong?.id]);

  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .onUpdate((event) => {
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        opacity.value = Math.max(0, 1 - event.translationX / screenWidth);
      }
    })
    .onEnd((event) => {
      if (event.translationX > SWIPE_THRESHOLD || event.velocityX > 500) {
        translateX.value = withSpring(screenWidth, {
          damping: 20,
          stiffness: 90,
        });
        opacity.value = withTiming(0, { duration: 200 });
        runOnJS(handleDismiss)();
      } else {
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

  // Şarkının ilk harfini al (title'dan)
  const getInitial = () => {
    if (title && title.length > 0) {
      return title.charAt(0).toUpperCase();
    }
    return "M";
  };

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="absolute left-0 right-0"
          style={[
            {
              bottom: bottomOffset !== undefined ? bottomOffset : hp(13),
              borderTopWidth: 2,
              borderTopColor: colors.border,
              overflow: "hidden",
            },
            animatedStyle,
          ]}
        >
          <LinearGradient
            colors={colors.gradient.main as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              minHeight: hp(10),
              paddingHorizontal: wp(4),
              paddingVertical: hp(1.5),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TouchableOpacity
              onPress={() => {
                setIsModalVisible(true);
              }}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <View
                className="flex-row items-center justify-between"
              >
                <View className="flex-row items-center"
                style={{
                  gap: wp(4),
                }}
                >
                {/* Sol tarafta gradient kare buton */}
                {coverUri ? (
                  <Image
                    source={{ uri: coverUri }}
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: radius(12),
                      borderWidth: 1,
                      borderColor: colors.overlay.white10,
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={colors.gradient.purplePink as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="items-center justify-center"
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: radius(12),
                      borderWidth: 1,
                      borderColor: colors.overlay.white20,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: fontSize(20),
                        fontWeight: "800",
                        color: colors.player.iconWhite,
                      }}
                    >
                      {getInitial()}
                    </Text>
                  </LinearGradient>
                )}
                <View
                  className="flex-col "
                  style={{ 
                    gap: hp(0.5), 
                    marginRight: wp(3) ,
                    overflow: "hidden",
                  maxWidth: wp(30),
                  }}
                >
                  <Text
                    style={{
                      fontSize: fontSize(16),
                      fontWeight: "600",
                      color: colors.player.iconWhite,
                    }}
                    numberOfLines={1}
                  >
                    {title}
                  </Text>
                  <Text
                    style={{
                      fontSize: fontSize(12),
                      fontWeight: "400",
                      color: colors.player.textMuted,
                    }}
                    numberOfLines={1}
                  >
                    {artist}
                  </Text>
                  </View>
                </View>
                {/* Sağ tarafta kontrol butonları */}
                <View
                  className="flex-row items-center"
                  style={{
                    gap: wp(3),
                  }}
                >
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      previousSound?.();
                    }}
                    style={{
                      padding: wp(2),
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ArrowLeftToLine}
                      size={fontSize(20)}
                      color={colors.player.iconWhite}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      if (isPlaying) {
                        stopSound?.();
                      } else {
                        resumeSound?.();
                      }
                    }}
                    className="rounded-full"
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: wp(6),
                      backgroundColor: colors.overlay.white10,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    activeOpacity={0.8}
                  >
                    {duration && currentTime !== undefined && duration > 0 ? (
                      <Svg
                        width={wp(12)}
                        height={wp(12)}
                        style={{ position: "absolute" }}
                      >
                        {/* Background circle */}
                        <Circle
                          cx={wp(6)}
                          cy={wp(6)}
                          r={wp(5.5)}
                          stroke={colors.overlay.white20}
                          strokeWidth={2}
                          fill="none"
                        />
                        {/* Progress circle */}
                        <Circle
                          cx={wp(6)}
                          cy={wp(6)}
                          r={wp(5.5)}
                          stroke={colors.player.iconWhite}
                          strokeWidth={2}
                          fill="none"
                          strokeDasharray={2 * Math.PI * wp(5.5)}
                          strokeDashoffset={
                            2 *
                            Math.PI *
                            wp(5.5) *
                            (1 - Math.min(1, currentTime / duration))
                          }
                          strokeLinecap="round"
                          transform={`rotate(-90 ${wp(6)} ${wp(6)})`}
                        />
                      </Svg>
                    ) : (
                      <View
                        style={{
                          position: "absolute",
                          width: wp(12),
                          height: wp(12),
                          borderRadius: wp(6),
                          borderWidth: 2,
                          borderColor: colors.overlay.white20,
                        }}
                      />
                    )}
                    <Icon
                      name={isPlaying ? Pause : Play}
                      size={fontSize(20)}
                      color={colors.player.iconWhite}
                      style={{ zIndex: 1 }}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      nextSound?.();
                    }}
                    style={{
                      padding: wp(2),
                    }}
                    activeOpacity={0.7}
                  >
                    <Icon
                      name={ArrowRightToLine}
                      size={fontSize(20)}
                      color={colors.player.iconWhite}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </GestureDetector>
      <AudioPlayer
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        selectedSong={activeSong as Song}
      />
    </>
  );
}
