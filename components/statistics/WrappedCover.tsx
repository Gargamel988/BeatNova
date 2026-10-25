import React, { useState } from "react";
import { View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/icon";
import { Music2 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";

type WrappedCoverProps = {
  coverUrl?: string | null;
  size?: number;
  borderRadius?: number;
  iconSize?: number;
  gradientColors?: readonly [string, string, ...string[]];
  accessibilityLabel?: string;
};

const DEFAULT_GRADIENT = ["#8A2387", "#E94057", "#F27121"] as const;

export const WrappedCover: React.FC<WrappedCoverProps> = React.memo(
  ({
    coverUrl,
    size,
    borderRadius,
    iconSize,
    gradientColors = DEFAULT_GRADIENT,
    accessibilityLabel,
  }) => {
    const { wp, radius } = useResponsive();
    const finalSize = size ?? wp(12);
    const finalRadius = borderRadius ?? radius(10);
    const finalIconSize = iconSize ?? wp(5);

    const [hasError, setHasError] = useState(false);
    const validUrl = !hasError && Boolean(coverUrl && coverUrl.trim().length > 0);

    if (validUrl) {
      return (
        <View
          accessible={Boolean(accessibilityLabel)}
          accessibilityRole="image"
          accessibilityLabel={accessibilityLabel}
          style={{
            width: finalSize,
            height: finalSize,
            borderRadius: finalRadius,
            overflow: "hidden",
          }}
        >
          <Image
            source={{ uri: coverUrl! }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
            onError={() => setHasError(true)}
          />
        </View>
      );
    }

    return (
      <LinearGradient
        accessible={Boolean(accessibilityLabel)}
        accessibilityRole="image"
        accessibilityLabel={accessibilityLabel}
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: finalSize,
          height: finalSize,
          borderRadius: finalRadius,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon name={Music2} size={finalIconSize} color="#FFFFFF" />
      </LinearGradient>
    );
  }
);
