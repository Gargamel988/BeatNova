import { Event, PlaybackState, type BackgroundEvent } from '@rntp/player';
import { upsertlisteningtime } from '@/services/StatisticServices';

// Arka plan handler: registerBackgroundEventHandler tek bir async fonksiyon alır.
// Bu fonksiyon her arka plan event'inde çağrılır (event.type ile ayırt edilir).
export const PlaybackService = async (event: BackgroundEvent): Promise<void> => {
  console.log(`[HEADLESS STATS] ====== EVENT TETIKLENDI ======`);
  console.log(`[HEADLESS STATS] Event Tipi: ${event.type}`);
  console.log(`[HEADLESS STATS] Mevcut Durum -> _activeSongId: ${_activeSongId}, _playStartTime: ${_playStartTime}, _accumulatedTime: ${_accumulatedTime}`);

  switch (event.type) {
    case Event.IsPlayingChanged: {
      const { playing } = event;
      console.log(`[HEADLESS STATS] IsPlayingChanged -> playing: ${playing}`);
      if (playing) {
        if (_playStartTime === null) {
          _playStartTime = Date.now();
          console.log(`[HEADLESS STATS] Zamanlayıcı başlatıldı: ${_playStartTime}`);
        }
      } else {
        if (_playStartTime !== null) {
          const played = (Date.now() - _playStartTime) / 1000;
          _accumulatedTime += played;
          _sessionTime += played;
          console.log(`[HEADLESS STATS] Duraklatıldı. Eklenen süre: ${played.toFixed(1)}s`);
          _playStartTime = null;
        }
        if (_activeSongId && _accumulatedTime >= 5) {
          let playDelta = 0;
          if (!_hasCountedPlay && _sessionTime >= 30) {
            playDelta = 1;
            _hasCountedPlay = true;
          }
          await _saveStats(_activeSongId, playDelta, 0);
        }
      }
      break;
    }

    case Event.MediaItemTransition: {
      console.log(`[HEADLESS STATS] MediaItemTransition -> Yeni Şarkı: ${event.item?.mediaId}`);
      if (_activeSongId) {
        if (_playStartTime !== null) {
          const played = (Date.now() - _playStartTime) / 1000;
          _accumulatedTime += played;
          _sessionTime += played;
          console.log(`[HEADLESS STATS] Şarkı değişiyor. Önceki şarkıya eklenen süre: ${played.toFixed(1)}s`);
          _playStartTime = null;
        }
        
        let skipDelta = 0;
        if (!_hasCountedPlay && _sessionTime > 0 && _sessionTime < 30) {
          skipDelta = 1;
        }
        await _saveStats(_activeSongId, 0, skipDelta);
      }

      _activeSongId = event.item?.mediaId ?? null;
      _accumulatedTime = 0;
      _sessionTime = 0;
      _hasCountedPlay = false;
      _playStartTime = Date.now();
      console.log(`[HEADLESS STATS] Yeni şarkı için zamanlayıcı sıfırlandı. Yeni _activeSongId: ${_activeSongId}`);
      break;
    }

    case Event.PlaybackStateChanged: {
      console.log(`[HEADLESS STATS] PlaybackStateChanged -> state: ${event.state}`);
      if (event.state === PlaybackState.Ended) {
        console.log(`[HEADLESS STATS] Şarkı bitti (Ended state).`);
        if (_playStartTime !== null) {
          const played = (Date.now() - _playStartTime) / 1000;
          _accumulatedTime += played;
          _sessionTime += played;
          _playStartTime = null;
        }
        if (_activeSongId) {
          let playDelta = 0;
          if (!_hasCountedPlay && _sessionTime >= 30) {
            playDelta = 1;
            _hasCountedPlay = true;
          }
          await _saveStats(_activeSongId, playDelta, 0);
        }
      }
      break;
    }
  }
};

let _activeSongId: string | null = null;
let _playStartTime: number | null = null;
let _accumulatedTime = 0;
let _sessionTime = 0;
let _hasCountedPlay = false;

async function _saveStats(songId: string, playCountDelta: number = 0, skipCountDelta: number = 0) {
  let timeToSave = _accumulatedTime;
  _accumulatedTime = 0;

  if (timeToSave >= 1 || playCountDelta > 0 || skipCountDelta > 0) {
    console.log(
      `[HEADLESS STATS] 🚀 VERİTABANINA KAYDEDİLİYOR: songId=${songId}, süre=${timeToSave.toFixed(1)}s, play=${playCountDelta}, skip=${skipCountDelta}`
    );
    try {
      await upsertlisteningtime(timeToSave, songId, skipCountDelta, playCountDelta);
      console.log(`[HEADLESS STATS] ✅ Kayıt Başarılı!`);
    } catch (e) {
      console.log(`[HEADLESS STATS] ❌ Kayıt Hatası:`, e);
    }
  } else {
    console.log(`[HEADLESS STATS] ⚠️ Kaydedilecek süre çok kısa (${timeToSave.toFixed(1)}s), es geçildi.`);
  }
}
