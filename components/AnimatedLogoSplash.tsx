import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming, 
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useColor } from '@/hooks/useColor';
import { useResponsive } from '@/hooks/useResponsive';
import { Text } from './ui/text';

const { width } = Dimensions.get('window');

interface AnimatedLogoSplashProps {
  message?: string;
}

export const AnimatedLogoSplash: React.FC<AnimatedLogoSplashProps> = ({ message }) => {
  const { fontSize } = useResponsive();
  
  // Theme colors
  const start = useColor("authBackgroundGradientStart");
  const mid = useColor("authBackgroundGradientMid");
  const end = useColor("authBackgroundGradientEnd");
  const primaryText = useColor("authPrimaryText");
  const accent = useColor("accent");

  // Animation values
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Entrance animation
    scale.value = withTiming(1, {
      duration: 1200,
      easing: Easing.out(Easing.back(1.5)),
    });
    opacity.value = withTiming(1, { duration: 1000 });

    // Continuous pulse
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: interpolate(opacity.value, [0, 1], [20, 0]) }],
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[start, mid, end] as [string, string, string]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      
      <Animated.View style={[styles.logoContainer, logoStyle]}>
        <View style={[styles.logoOutline, { borderColor: accent }]}>
          <Image
            source={require('@/assets/images/beatnovalogo.jpeg')}
            style={styles.logo}
            contentFit="cover"
          />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, textStyle]}>
        <Text style={[styles.title, { color: primaryText, fontSize: fontSize(32) }]}>
          BeatNova
        </Text>
        {message && (
          <Text style={[styles.subtitle, { color: primaryText, fontSize: fontSize(16) }]}>
            {message}
          </Text>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 40,
  },
  logoOutline: {
    padding: 10,
    borderRadius: 999,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    borderRadius: (width * 0.45) / 2,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 15,
    opacity: 0.8,
    fontWeight: '600',
    textAlign: 'center',
  },
});
