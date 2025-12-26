import { Platform } from "react-native";

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// System theme - BeatNova uygulamasının mevcut renk paleti
export const systemColors = {
  // Base colors
  background: "#000000",
  foreground: "#FFFFFF",

  // Card colors
  card: "rgba(59, 7, 100, 0.35)", // purple-900/35 - more contrast on dark bg
  cardForeground: "#FFFFFF",
  icon: "#3b0764",
  // Popover colors
  popover: "rgba(30, 20, 40, 0.98)", // Dark purple-gray matching theme - slightly transparent for depth
  popoverForeground: "#FFFFFF",
  popoverCard: "rgba(59,7,100,0.30)", // purple-900/30 - Slightly darker than card

  // Primary colors - Purple theme
  primary: "#9333ea", // Violet-600
  primaryForeground: "#FFFFFF",
  primaryDark: "#3b0764", // Dark purple for text

  // Secondary colors
  secondary: "#1C1C1E",
  secondaryForeground: "#FFFFFF",

  // Muted colors
  muted: "rgba(255, 255, 255, 0.08)",
  mutedForeground: "#b0b0b0",

  // Accent colors
  accent: "#ec4899", // Pink-500
  accentForeground: "#FFFFFF",

  // Destructive colors
  destructive: "#FF453A",
  destructiveForeground: "#FFFFFF",

  // Border and input
  border: "rgba(147, 51, 234, 0.35)", // purple border for better visibility
  input: "rgba(255, 255, 255, 0.08)",
  ring: "#9333ea",

  // Text colors
  text: "#FFFFFF",
  textMuted: "#cbd5f5", // slightly lighter for better contrast
  textSecondary: "rgba(255, 255, 255, 0.7)", // WCAG-friendly contrast on dark bg

  // Legacy support for existing components
  tint: "#4B0082", // Indigo for tab bar
  tabIconDefault: "#FFFFFF",
  tabIconSelected: "#4B0082",

  // Gradient colors
  gradient: {
    // Ana layout gradient
    main: ["#000000", "#4B0082", "#000000"],
    // Purple to pink gradient (MiniPlayer, buttons)
    purplePink: ["#9333ea", "#ec4899"],
    // Player modal gradient
    playerModal: ["#0f0024", "#40016f", "#05000c"],
    // Cover art placeholder gradient
    coverArt: ["#a855f7", "#ec4899"],
  },
    background1: "#1C1C1E",
    foreground1: "#FFFFFF",
  // Brand colors
  purple: "#9333ea", // Violet-600
  purpleDark: "#3b0764",
  purpleLight: "#a855f7", // Violet-500
  pink: "#ec4899", // Pink-500
  indigo: "#4B0082", // Indigo for tab bar

  // Status colors
  blue: "#0A84FF",
  green: "#30D158",
  red: "#FF453A",
  orange: "#FF9F0A",
  yellow: "#FFD60A",

  // Transparent overlays
  overlay: {
    white08: "rgba(255, 255, 255, 0.08)",
    white10: "rgba(255, 255, 255, 0.10)",
    white12: "rgba(255, 255, 255, 0.12)",
    white15: "rgba(255, 255, 255, 0.15)",
    white20: "rgba(255, 255, 255, 0.20)",
    white30: "rgba(255, 255, 255, 0.30)",
    white40: "rgba(255, 255, 255, 0.4)",
    white60: "rgba(255, 255, 255, 0.6)",
    white70: "rgba(255, 255, 255, 0.7)", // #ffffffb3 equivalent
    purple30: "rgba(147, 51, 234, 0.3)",
  },

  // AudioPlayer specific colors
  player: {
    // Icon colors
    iconActive: "#3b0764", // primaryDark
    iconInactive: "rgba(255, 255, 255, 0.7)", // white70
    iconWhite: "#FFFFFF",
    iconDark: "#0f172a", // Dark slate for play/pause buttons

    // Background colors
    queueItemBg: "#130027", // Dark purple background for queue items

    // Text colors
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.8)", // a bit brighter for active elements
    textMuted: "rgba(255, 255, 255, 0.6)", // white60
    textDimmed: "rgba(255, 255, 255, 0.5)", // white50
    textVeryDimmed: "rgba(255, 255, 255, 0.4)", // white40
  },

  // Auth specific palette (mirrors light/dark defaults)
  authBackgroundGradientStart: "#0f0024",
  authBackgroundGradientMid: "#40016f",
  authBackgroundGradientEnd: "#05000c",
  authIconBackground: "rgba(255, 255, 255, 0.1)",
  authPrimaryText: "#FFFFFF",
  authSecondaryText: "rgba(255, 255, 255, 0.7)",
  authDividerText: "rgba(255, 255, 255, 0.5)",
  authButtonGradientStart: "#9333ea",
  authButtonGradientEnd: "#ec4899",
  authButtonText: "#FFFFFF",
  authGoogleButtonBackground: "rgba(147, 51, 234, 0.3)",
  authGoogleButtonText: "#FFFFFF",
  authLink: "#FFFFFF",
  authRightIcon: "rgba(255, 255, 255, 0.7)",
};

const auroraColors: typeof systemColors = {
  ...systemColors,
  background: "#020617",
  background1: "#0f172a",
  foreground: "#E0F2FE",
  foreground1: "#E0F2FE",
  card: "rgba(37, 99, 235, 0.2)",
  cardForeground: "#E0F2FE",
  popover: "rgba(15, 23, 42, 0.95)", // background1 with slight transparency - dark slate blue
  popoverForeground: "#E0F2FE",
  popoverCard: "rgba(37, 99, 235, 0.30)", // Blue card with slight opacity - matches theme
  primary: "#38bdf8",
  primaryForeground: "#020617",
  secondary: "rgba(15, 23, 42, 0.75)",
  secondaryForeground: "#E0E7FF",
  accent: "#6366f1",
  accentForeground: "#E0E7FF",
  border: "rgba(224, 242, 254, 0.25)",
  input: "rgba(224, 242, 254, 0.2)",
  ring: "#38bdf8",
  text: "#E0F2FE",
  textMuted: "rgba(224, 242, 254, 0.7)",
  textSecondary: "rgba(224, 242, 254, 0.5)",
  tint: "#38bdf8",
  icon: "#38bdf8",
  tabIconDefault: "#94a3b8",
  tabIconSelected: "#38bdf8",
  gradient: {
    ...systemColors.gradient,
    main: ["#020617", "#0f172a", "#1e3a8a"],
    purplePink: ["#22d3ee", "#6366f1"],
    playerModal: ["#010817", "#07122a", "#122554"],
    coverArt: ["#38bdf8", "#a5f3fc"],
  },
  overlay: {
    ...systemColors.overlay,
    white20: "rgba(56, 189, 248, 0.2)",
    white30: "rgba(56, 189, 248, 0.3)",
  },
  player: {
    ...systemColors.player,
    iconActive: "#38bdf8",
    iconInactive: "rgba(224, 242, 254, 0.7)",
    queueItemBg: "#04172f",
  },
  authBackgroundGradientStart: "#010617",
  authBackgroundGradientMid: "#0f172a",
  authBackgroundGradientEnd: "#1e3a8a",
  authIconBackground: "rgba(56, 189, 248, 0.15)",
  authPrimaryText: "#E0F2FE",
  authSecondaryText: "rgba(224, 242, 254, 0.75)",
  authDividerText: "rgba(224, 242, 254, 0.45)",
  authButtonGradientStart: "#22d3ee",
  authButtonGradientEnd: "#6366f1",
  authButtonText: "#010617",
  authGoogleButtonBackground: "rgba(56, 189, 248, 0.25)",
  authGoogleButtonText: "#E0F2FE",
  authLink: "#22d3ee",
  authRightIcon: "rgba(224, 242, 254, 0.75)",
};

const sunsetColors: typeof systemColors = {
  ...systemColors,
  background: "#140400",
  background1: "#2a0a05",
  foreground: "#FFEFE6",
  foreground1: "#FFEFE6",
  card: "rgba(248, 113, 113, 0.25)",
  cardForeground: "#FFEFE6",
  popover: "rgba(42, 10, 5, 0.95)", // background1 with slight transparency - dark red/orange
  popoverForeground: "#FFEFE6",
  popoverCard: "rgba(248, 113, 113, 0.35)", // Red card with slight opacity - matches theme
  primary: "#fb7185",
  primaryForeground: "#140400",
  secondary: "rgba(127, 29, 29, 0.8)",
  secondaryForeground: "#FFEFE6",
  accent: "#f97316",
  accentForeground: "#140400",
  border: "rgba(255, 239, 230, 0.25)",
  input: "rgba(255, 239, 230, 0.15)",
  ring: "#fb7185",
  text: "#FFEFE6",
  textMuted: "rgba(255, 239, 230, 0.65)",
  textSecondary: "rgba(255, 239, 230, 0.45)",
  tint: "#fb7185",
  icon: "#f97316",
  tabIconDefault: "#fcd0c1",
  tabIconSelected: "#fb7185",
  gradient: {
    ...systemColors.gradient,
    main: ["#140400", "#4a0400", "#ff6b6b"],
    purplePink: ["#fb7185", "#f97316"],
    playerModal: ["#1b0401", "#4a0400", "#7c1d0d"],
    coverArt: ["#fb7185", "#fbbf24"],
  },
  overlay: {
    ...systemColors.overlay,
    white08: "rgba(255, 239, 230, 0.08)",
    white12: "rgba(255, 239, 230, 0.12)",
    white20: "rgba(255, 239, 230, 0.2)",
    white30: "rgba(255, 239, 230, 0.3)",
  },
  player: {
    ...systemColors.player,
    iconActive: "#fb7185",
    iconInactive: "rgba(255, 239, 230, 0.7)",
    queueItemBg: "#2a0a05",
  },
  authBackgroundGradientStart: "#1b0401",
  authBackgroundGradientMid: "#4a0400",
  authBackgroundGradientEnd: "#a33d1d",
  authIconBackground: "rgba(249, 115, 22, 0.18)",
  authPrimaryText: "#FFEFE6",
  authSecondaryText: "rgba(255, 239, 230, 0.75)",
  authDividerText: "rgba(255, 239, 230, 0.45)",
  authButtonGradientStart: "#fb7185",
  authButtonGradientEnd: "#f97316",
  authButtonText: "#1b0401",
  authGoogleButtonBackground: "rgba(249, 115, 22, 0.25)",
  authGoogleButtonText: "#FFEFE6",
  authLink: "#fb7185",
  authRightIcon: "rgba(255, 239, 230, 0.75)",
};

const THEME_ORDER = ["system", "aurora", "sunset"] as const;

export type ThemeMode = (typeof THEME_ORDER)[number];

export const Colors: Record<ThemeMode, typeof systemColors> = {
  system: systemColors,
  aurora: auroraColors,
  sunset: sunsetColors,
} as const;

export type ThemePalette = (typeof Colors)[ThemeMode];
export const ThemeModes = THEME_ORDER;
