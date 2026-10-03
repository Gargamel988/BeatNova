import { useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useTabBarLayout() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scale = Math.min(Math.max(width / 390, 0.85), 1.2);
  const side = Math.round(Math.min(Math.max(width * 0.04, 12), 24));
  const barHeight = Math.round(64 * scale);
  const bottom = Math.max(insets.bottom, 10) + 6;
  const barWidth = Math.min(width - side * 2, 560);
  const miniPlayerHeight = Math.round(68 * scale);
  const gap = 8;

  return {
    scale,
    side,
    barHeight,
    barWidth,
    bottom,
    miniPlayerHeight,
    miniPlayerBottom: bottom + barHeight + gap,
    // ScrollView / FlatList contentContainerStyle.paddingBottom
    contentPadding: bottom + barHeight + 16,
    contentPaddingWithPlayer: bottom + barHeight + gap + miniPlayerHeight + 16,
  };
}
