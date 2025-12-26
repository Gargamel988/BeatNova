import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import {
  DefaultTheme,
  ThemeProvider as RNThemeProvider,
} from "@react-navigation/native";
import {
  Colors,
  ThemeMode,
  ThemeModes,
  ThemePalette,
} from "@/theme/colors";

const MODE_SEQUENCE = ThemeModes;

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  palette: ThemePalette;
  availableModes: readonly ThemeMode[];
};

export const ThemeModeContext = createContext<ThemeContextValue | undefined>(
  undefined
);

export const useThemeModeContext = () => {
  const context = useContext(ThemeModeContext);
  if (!context) {
    throw new Error("useThemeModeContext must be used within ThemeProvider");
  }
  return context;
};

type Props = {
  children: React.ReactNode;
};

const buildNavigationTheme = (palette: ThemePalette) => ({
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: palette.primary,
    background: palette.background,
    card: palette.card,
    text: palette.text,
    border: palette.border,
    notification: palette.red,
    tint: palette.tint,
    icon: palette.icon,
    tabIconDefault: palette.tabIconDefault,
    tabIconSelected: palette.tabIconSelected,
  },
});

export const ThemeProvider = ({ children }: Props) => {
  const [mode, setMode] = useState<ThemeMode>("system");

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const currentIndex = MODE_SEQUENCE.indexOf(prev);
      const nextIndex = (currentIndex + 1) % MODE_SEQUENCE.length;
      return MODE_SEQUENCE[nextIndex];
    });
  }, []);

  const navigationThemes = useMemo(() => {
    return ThemeModes.reduce(
      (acc, key) => {
        acc[key] = buildNavigationTheme(Colors[key]);
        return acc;
      },
      {} as Record<ThemeMode, ReturnType<typeof buildNavigationTheme>>
    );
  }, []);

  const activeTheme = navigationThemes[mode];

  const palette = Colors[mode];

  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      toggleMode,
      palette,
      availableModes: ThemeModes,
    }),
    [mode, toggleMode, palette]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <RNThemeProvider value={activeTheme}>{children}</RNThemeProvider>
    </ThemeModeContext.Provider>
  );
};
