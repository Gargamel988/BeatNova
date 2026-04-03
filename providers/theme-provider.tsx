import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProfile } from "@/services/ProfilServices";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  
  const queryClient = useQueryClient();

  // Load theme from database
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });

  // Load theme from storage on initial mount
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem("user_theme");
        if (saved && ThemeModes.includes(saved as ThemeMode)) {
          setMode(saved as ThemeMode);
        }
      } catch (e) {
        console.error("Error loading theme from storage:", e);
      }
    };
    loadSavedTheme();
  }, []);

  // Set theme from database when profile loads and persist it
  useEffect(() => {
    if (profile?.data?.theme) {
      const dbTheme = profile.data.theme as ThemeMode;
      if (ThemeModes.includes(dbTheme)) {
        setMode(dbTheme);
        AsyncStorage.setItem("user_theme", dbTheme);
      }
    }
  }, [profile?.data?.theme]);

  const handleSetMode = useCallback(async (newMode: ThemeMode) => {
    setMode(newMode);
    try {
      await AsyncStorage.setItem("user_theme", newMode);
      // Optional: Refresh profile query to stay in sync
      queryClient.setQueryData(["profile"], (old: any) => ({
        ...old,
        data: { ...old?.data, theme: newMode }
      }));
    } catch (e) {
      console.error("Error saving theme:", e);
    }
  }, [queryClient]);

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
      setMode: handleSetMode,
      toggleMode,
      palette,
      availableModes: ThemeModes,
    }),
    [mode, handleSetMode, toggleMode, palette]
  );

  return (
    <ThemeModeContext.Provider value={contextValue}>
      <RNThemeProvider value={activeTheme}>{children}</RNThemeProvider>
    </ThemeModeContext.Provider>
  );
};
