import { useState, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { trim, deleteFile } from 'react-native-video-trim';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/toast';
import { useConfirmDialog } from '@/components/ui/confirm-modal';
import { Song } from '@/components/songs/songsService';
import {
  canWriteSettings,
  openWriteSettings,
  saveToRingtones,
  setDefaultRingtone,
} from '@/modules/ringtone-setter';

export type RingtoneErrorCode =
  | 'PLATFORM_NOT_SUPPORTED'
  | 'INVALID_DURATION'
  | 'TRIM_FAILED'
  | 'SAVE_FAILED'
  | 'SET_DEFAULT_FAILED'
  | 'UNKNOWN';

export type RingtoneStep =
  | 'idle'
  | 'trimming'
  | 'saving'
  | 'setting_default'
  | 'completed'
  | 'error';

export const RINGTONE_ERROR_KEYS: Record<RingtoneErrorCode, string> = {
  PLATFORM_NOT_SUPPORTED: 'ringtone.errors.platformNotSupported',
  INVALID_DURATION: 'ringtone.errors.invalidDuration',
  TRIM_FAILED: 'ringtone.errors.trimFailed',
  SAVE_FAILED: 'ringtone.errors.saveFailed',
  SET_DEFAULT_FAILED: 'ringtone.errors.setDefaultFailed',
  UNKNOWN: 'ringtone.errors.unknown',
};

export type SetRingtoneParams = {
  song: Song;
  startSec: number;
  endSec: number;
  setAsDefault?: boolean;
};

export function useSetRingtone() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { confirm } = useConfirmDialog();

  const [step, setStep] = useState<RingtoneStep>('idle');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  /**
   * Şarkıyı kesip Android MediaStore Zil Sesleri klasörüne kaydeder.
   * WRITE_SETTINGS izni varsa doğrudan varsayılan zil sesi yapar.
   * İzin yoksa veya verilmediyse bile zil sesini cihaz kütüphanesine başarıyla ekler.
   */
  const makeRingtone = useCallback(
    async ({
      song,
      startSec,
      endSec,
      setAsDefault = true,
    }: SetRingtoneParams): Promise<boolean> => {
      if (Platform.OS !== 'android') {
        toast({
          title: t('common.error', 'Hata'),
          description: t(RINGTONE_ERROR_KEYS.PLATFORM_NOT_SUPPORTED),
          variant: 'error',
        });
        return false;
      }

      const duration = endSec - startSec;
      if (duration < 2.9 || duration > 60.1) {
        toast({
          title: t('common.error', 'Hata'),
          description: t(RINGTONE_ERROR_KEYS.INVALID_DURATION),
          variant: 'error',
        });
        return false;
      }

      setIsProcessing(true);
      let tempTrimmedPath: string | null = null;

      try {
        // 1. Kesme işlemi (Headless trim, m4a ve -vn ile)
        setStep('trimming');
        const startTimeMs = Math.round(startSec * 1000);
        const endTimeMs = Math.round(endSec * 1000);

        const trimResult = await trim(song.uri, {
          startTime: startTimeMs,
          endTime: endTimeMs,
          type: 'audio',
          outputExt: 'm4a',
        });

        if (!trimResult || !trimResult.outputPath) {
          throw new Error('TRIM_FAILED');
        }

        tempTrimmedPath = trimResult.outputPath;

        // 2. MediaStore Zil Sesleri (DIRECTORY_RINGTONES) dizinine kaydetme
        // Bu işlem WRITE_SETTINGS izni gerektirmez, doğrudan zil seslerine eklenir
        setStep('saving');
        const songTitle =
          song.metadata?.title ||
          song.filename?.replace(/\.[^/.]+$/, '') ||
          'BeatNova_Ringtone';
        const ringtoneTitle = `${songTitle}_Ringtone`;

        const contentUri = await saveToRingtones(tempTrimmedPath, ringtoneTitle);
        if (!contentUri) {
          throw new Error('SAVE_FAILED');
        }

        // 3. Varsayılan zil sesi yapma (İsteğe bağlı)
        if (setAsDefault) {
          setStep('setting_default');
          const hasWriteSettings = await canWriteSettings();

          if (hasWriteSettings) {
            try {
              await setDefaultRingtone(contentUri);
              toast({
                title: t('ringtone.successTitle', 'Zil Sesi Ayarlandı'),
                description: t(
                  'ringtone.successDesc',
                  'Zil sesi başarıyla kaydedildi ve varsayılan zil sesiniz yapıldı!'
                ),
                variant: 'success',
              });
              setStep('completed');
              return true;
            } catch (setErr) {
              console.warn('[useSetRingtone] setDefaultRingtone hatası:', setErr);
            }
          }

          // WRITE_SETTINGS izni yoksa kullanıcıya seçenek sun
          confirm({
            title: t('ringtone.savedTitle', 'Zil Sesi Kaydedildi! 🔔'),
            message: t(
              'ringtone.savedDescPrompt',
              'Zil sesi telefonunuzun zil sesleri listesine eklendi. Şimdi doğrudan gelen çağrı zil sesiniz olarak atamak ister misiniz?'
            ),
            confirmText: t('ringtone.makeDefaultNow', 'Varsayılan Yap'),
            cancelText: t('common.close', 'Kapat'),
            variant: 'info',
            onConfirm: async () => {
              await openWriteSettings();
              // Kullanıcı döndüğünde kontrol et
              const sub = AppState.addEventListener(
                'change',
                async (state: AppStateStatus) => {
                  if (state === 'active') {
                    sub.remove();
                    const granted = await canWriteSettings();
                    if (granted) {
                      await setDefaultRingtone(contentUri);
                      toast({
                        title: t('ringtone.successTitle', 'Varsayılan Yapıldı'),
                        description: t(
                          'ringtone.defaultSetDesc',
                          'Şarkı varsayılan zil sesiniz olarak ayarlandı.'
                        ),
                        variant: 'success',
                      });
                    }
                  }
                }
              );
            },
          });
        }

        // Başarıyla MediaStore'a kaydedildi
        toast({
          title: t('ringtone.savedTitle', 'Zil Sesi Kaydedildi'),
          description: t(
            'ringtone.savedListDesc',
            'Zil sesi telefonunuza kaydedildi. Telefonunuzun Ses & Zil Sesi ayarlarından da seçebilirsiniz.'
          ),
          variant: 'success',
        });

        setStep('completed');
        return true;
      } catch (err: unknown) {
        setStep('error');
        const errStr = err instanceof Error ? err.message : String(err);
        const errorCode: RingtoneErrorCode = (
          errStr in RINGTONE_ERROR_KEYS ? errStr : 'UNKNOWN'
        ) as RingtoneErrorCode;

        const errorDesc = t(RINGTONE_ERROR_KEYS[errorCode], {
          defaultValue: err instanceof Error ? err.message : t('ringtone.errorGeneric'),
        });

        toast({
          title: t('common.error', 'Hata'),
          description: errorDesc,
          variant: 'error',
        });
        return false;
      } finally {
        // 4. Geçici kesilmiş dosyayı her koşulda temizle
        if (tempTrimmedPath) {
          try {
            await deleteFile(tempTrimmedPath);
          } catch (cleanErr) {
            console.warn('[useSetRingtone] Geçici dosya silinirken hata:', cleanErr);
          }
        }
        setIsProcessing(false);
      }
    },
    [confirm, t, toast]
  );

  return {
    makeRingtone,
    isProcessing,
    step,
  };
}
