import { Event, PlaybackState, type BackgroundEvent } from '@rntp/player';
import { upsertlisteningtime } from '@/services/StatisticServices';

// Arka plan handler: registerBackgroundEventHandler tek bir async fonksiyon alır.
// Bu fonksiyon her arka plan event'inde çağrılır (event.type ile ayırt edilir).
export const PlaybackService = async (event: BackgroundEvent): Promise<void> => {
  if (__DEV__) {
    console.log(`[HEADLESS STATS] Event: ${event.type}`);
  }

  switch (event.type) {
    case Event.IsPlayingChanged: {
      const { playing } = event;
      if (playing) {
        if (_playStartTime === null) {
          _playStartTime = Date.now();
        }
      } else {
        if (_playStartTime !== null) {
          const played = (Date.now() - _playStartTime) / 1000;
          _accumulatedTime += played;
          _sessionTime += played;
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
      if (_activeSongId) {
        if (_playStartTime !== null) {
          const played = (Date.now() - _playStartTime) / 1000;
          _accumulatedTime += played;
          _sessionTime += played;
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
      break;
    }

    case Event.PlaybackStateChanged: {
      if (event.state === PlaybackState.Ended) {
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
    try {
      await upsertlisteningtime(timeToSave, songId, skipCountDelta, playCountDelta);
    } catch (e: unknown) {
      if (__DEV__) {
        console.warn(`[HEADLESS STATS] Kayıt Hatası:`, e instanceof Error ? e.message : String(e));
      }
    }
  }
}
