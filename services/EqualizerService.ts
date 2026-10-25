import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyNativeEqualizerSettings } from "@/modules/audio-equalizer";

export type EqualizerPresetKey =
  | "flat"
  | "bass_boost"
  | "vocal"
  | "rock"
  | "pop"
  | "jazz"
  | "electronic"
  | "classical"
  | "custom";

export type EqualizerSettings = {
  enabled: boolean;
  preset: EqualizerPresetKey;
  bands: [number, number, number, number, number]; // 60Hz, 230Hz, 910Hz, 3.6kHz, 14kHz (in dB: -12 to +12)
  bassBoost: number; // 0 to 100%
  virtualizer: number; // 0 to 100%
  crossfadeSeconds: number; // 0 to 12 seconds (0 = disabled)
};

export const FREQUENCY_LABELS = ["60 Hz", "230 Hz", "910 Hz", "3.6 kHz", "14 kHz"] as const;

export const EQUALIZER_PRESETS: Record<EqualizerPresetKey, [number, number, number, number, number]> = {
  flat: [0, 0, 0, 0, 0],
  bass_boost: [7, 5, 1, 0, -1],
  vocal: [-2, 2, 6, 3, 0],
  rock: [5, 3, -1, 3, 5],
  pop: [-1, 2, 5, 3, -1],
  jazz: [3, 2, 1, 2, 4],
  electronic: [6, 4, 0, 2, 5],
  classical: [4, 2, -2, 3, 4],
  custom: [0, 0, 0, 0, 0],
};

export const DEFAULT_EQUALIZER_SETTINGS: EqualizerSettings = {
  enabled: true,
  preset: "flat",
  bands: [0, 0, 0, 0, 0],
  bassBoost: 20,
  virtualizer: 15,
  crossfadeSeconds: 4,
};

const STORAGE_KEY = "beatnova_equalizer_settings_v1";

/**
 * Donanımsal Android DSP efektlerine ayarları canlı olarak aktarır.
 */
export async function applyEqualizerToHardware(settings: EqualizerSettings): Promise<boolean> {
  return applyNativeEqualizerSettings(
    settings.enabled,
    settings.bands,
    settings.bassBoost,
    settings.virtualizer
  );
}

export async function loadEqualizerSettings(): Promise<EqualizerSettings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const settings: EqualizerSettings = parsed
      ? { ...DEFAULT_EQUALIZER_SETTINGS, ...parsed }
      : DEFAULT_EQUALIZER_SETTINGS;

    // Yüklenen ayarları donanıma anında uygula
    applyEqualizerToHardware(settings).catch(() => {});
    return settings;
  } catch {
    applyEqualizerToHardware(DEFAULT_EQUALIZER_SETTINGS).catch(() => {});
    return DEFAULT_EQUALIZER_SETTINGS;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingSettings: EqualizerSettings | null = null;

export async function saveEqualizerSettings(settings: EqualizerSettings): Promise<void> {
  pendingSettings = settings;

  // Donanım efektini anında güncelle (0ms gecikme ile kulakta duyulsun)
  applyEqualizerToHardware(settings).catch(() => {});

  if (saveTimer) {
    clearTimeout(saveTimer);
  }
  return new Promise<void>((resolve) => {
    saveTimer = setTimeout(async () => {
      try {
        if (pendingSettings) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSettings));
        }
      } catch (e: unknown) {
        console.warn("Could not save equalizer settings:", e);
      } finally {
        saveTimer = null;
        resolve();
      }
    }, 350);
  });
}

export async function flushEqualizerSettings(): Promise<void> {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  if (pendingSettings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(pendingSettings));
    } catch (e: unknown) {
      console.warn("Could not flush equalizer settings:", e);
    }
  }
}

