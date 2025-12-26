import { useThemeModeContext } from "@/providers/theme-provider";
import { ThemeMode } from "@/theme/colors";

interface UseModeToggleReturn {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  currentMode: ThemeMode;
  toggleMode: () => void;
  availableModes: readonly ThemeMode[];
}

export function useModeToggle(): UseModeToggleReturn {
  const { mode, setMode, toggleMode, availableModes } = useThemeModeContext();

  return {
    mode,
    setMode,
    currentMode: mode,
    toggleMode,
    availableModes,
  };
}
