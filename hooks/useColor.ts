import { ThemeMode, systemColors } from "@/theme/colors";
import { useThemeModeContext } from "@/providers/theme-provider";

type Palette = typeof systemColors;
type StringColorKey = {
  [K in keyof Palette]: Palette[K] extends string ? K : never;
}[keyof Palette];
type ColorOverrides = Partial<Record<ThemeMode, string>>;

export function useColor(
  colorName: StringColorKey,
  props?: ColorOverrides
) {
  const { palette, mode } = useThemeModeContext();
  const colorFromProps = props?.[mode];

  if (colorFromProps) {
    return colorFromProps;
  }

  return palette[colorName];
}
