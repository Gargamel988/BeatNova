import { requireNativeModule, Platform } from "expo-modules-core";

export interface AudioEqualizerNativeModule {
  isAvailable(): Promise<boolean>;
  getBandFrequencies(): Promise<number[]>;
  applySettings(
    enabled: boolean,
    bands: number[],
    bass: number,
    virt: number
  ): Promise<boolean>;
  setEnabled(enabled: boolean): Promise<boolean>;
}

const isAndroid = Platform.OS === "android";

let nativeModule: AudioEqualizerNativeModule | null = null;
if (isAndroid) {
  try {
    nativeModule = requireNativeModule<AudioEqualizerNativeModule>("AudioEqualizer");
  } catch (e: unknown) {
    console.warn(
      "[AudioEqualizer] Native modül yüklenemedi. Bu özellik için development build gereklidir.",
      e
    );
  }
}

export function isAudioEqualizerSupported(): boolean {
  return isAndroid && nativeModule !== null;
}

export async function isAudioEqualizerAvailable(): Promise<boolean> {
  if (!isAndroid || !nativeModule) return false;
  try {
    return await nativeModule.isAvailable();
  } catch {
    return false;
  }
}

export async function getBandFrequencies(): Promise<number[]> {
  if (!isAndroid || !nativeModule) return [];
  try {
    return await nativeModule.getBandFrequencies();
  } catch {
    return [];
  }
}

export async function applyNativeEqualizerSettings(
  enabled: boolean,
  bands: number[],
  bassBoost: number,
  virtualizer: number
): Promise<boolean> {
  if (!isAndroid || !nativeModule) return false;
  try {
    return await nativeModule.applySettings(enabled, bands, bassBoost, virtualizer);
  } catch (err: unknown) {
    console.warn("[AudioEqualizer] Ayarlar uygulanırken hata:", err);
    return false;
  }
}

export async function setNativeEqualizerEnabled(enabled: boolean): Promise<boolean> {
  if (!isAndroid || !nativeModule) return false;
  try {
    return await nativeModule.setEnabled(enabled);
  } catch {
    return false;
  }
}

export default {
  isSupported: isAudioEqualizerSupported,
  isAvailable: isAudioEqualizerAvailable,
  getBandFrequencies,
  applySettings: applyNativeEqualizerSettings,
  setEnabled: setNativeEqualizerEnabled,
};
