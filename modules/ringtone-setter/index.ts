import { requireNativeModule, Platform } from 'expo-modules-core';

export interface RingtoneSetterNativeModule {
  canWriteSettings(): Promise<boolean>;
  openWriteSettings(): Promise<void>;
  saveToRingtones(path: string, title: string): Promise<string>;
  setDefaultRingtone(uri: string): Promise<boolean>;
}

const isAndroid = Platform.OS === 'android';

let nativeModule: RingtoneSetterNativeModule | null = null;
if (isAndroid) {
  try {
    nativeModule = requireNativeModule<RingtoneSetterNativeModule>('RingtoneSetter');
  } catch (e) {
    // Development build olmadan Expo Go'da native modül bulunamaz
    console.warn('[RingtoneSetter] Native modül yüklenemedi. Bu özellik için development build gereklidir.', e);
  }
}

export function isRingtoneSetterAvailable(): boolean {
  return isAndroid && nativeModule !== null;
}

export async function canWriteSettings(): Promise<boolean> {
  if (!isAndroid || !nativeModule) {
    return false;
  }
  return nativeModule.canWriteSettings();
}

export async function openWriteSettings(): Promise<void> {
  if (!isAndroid || !nativeModule) {
    return;
  }
  return nativeModule.openWriteSettings();
}

export async function saveToRingtones(path: string, title: string): Promise<string> {
  if (!isAndroid || !nativeModule) {
    throw new Error('Zil sesi kaydetme özelliği sadece Android development build üzerinde desteklenir.');
  }
  return nativeModule.saveToRingtones(path, title);
}

export async function setDefaultRingtone(uri: string): Promise<boolean> {
  if (!isAndroid || !nativeModule) {
    throw new Error('Zil sesi ayarlama özelliği sadece Android development build üzerinde desteklenir.');
  }
  return nativeModule.setDefaultRingtone(uri);
}

export default {
  canWriteSettings,
  openWriteSettings,
  saveToRingtones,
  setDefaultRingtone,
  isRingtoneSetterAvailable,
};
