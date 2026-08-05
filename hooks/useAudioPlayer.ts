import { Song } from "@/components/songs/songsService";
import { insertSong } from "@/services/SongsService";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useQueryClient } from "@tanstack/react-query";
import { useProfile } from "./useProfil";
import { upsertlisteningtime } from "@/services/StatisticServices";

import { useAds } from "@/providers/AdsProvider";
import TrackPlayer, {
  Event,
  PlaybackState,
  RepeatMode,
  PlayerCommand,
  useIsPlaying,
  usePlaybackState,
  useProgress,
} from "@rntp/player";

type LoopMode = "all" | "one" | "none";

let isPlayerSetup = false;
let setupPromise: Promise<void> | null = null;

async function ensureTrackPlayerSetup() {
  if (isPlayerSetup) return;
  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        TrackPlayer.setupPlayer({
          contentType: "music",
          handleAudioBecomingNoisy: true,
          audioMixing: "exclusive",
          android: {
            wakeMode: "network",
            skipSilenceEnabled: true,
            taskRemovedBehavior: "stop",

            notification: {
              channelId: "beatnova-player",
              channelName: "BeatNova Oynatıcı",
              smallIcon: "ic_notification",
            },
          },
        });

        // Bildirim paneli ve kilit ekranı butonlarını ayarla
        TrackPlayer.setCommands({
          capabilities: [
            PlayerCommand.PlayPause,
            PlayerCommand.Next,
            PlayerCommand.Previous,
            PlayerCommand.Stop,
            PlayerCommand.Seek,
            PlayerCommand.SkipForward,
            PlayerCommand.SkipBackward,
          ],
          handling: "native",
          forwardInterval: 10,
          backwardInterval: 10,
        });
      } catch (e) {
        if (!String((e as Error)?.message ?? e).includes("already")) {
          console.error("TrackPlayer setup error:", e);
        }
      } finally {
        isPlayerSetup = true;
      }
    })();
  }
  return setupPromise;
}

export default function useAudioPlayerHook() {
  const queryClient = useQueryClient();
  const { position: currentPositionSec, duration: currentDurationSec } =
    useProgress(0.5);
  const { mutateUpdateCurrentSong: mutateUpdateCurrentSongMutation } =
    useProfile();

  // @rntp/player hooks — doğrudan native player state'ini yansıtır
  const isPlaying = useIsPlaying();
  const playbackState = usePlaybackState();

  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [position, setPosition] = useState(0);
  const positionShared = useSharedValue(0);
  const [nextCount, setNextCount] = useState(0);
  const { showInterstitial } = useAds();
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[] | null>(null);
  const [playlist, setPlaylist] = useState<Song[] | null>(null);
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sleep Timer States
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(
    null
  );
  const [isSleepTimerActive, setIsSleepTimerActive] = useState(false);
  const sleepTimerEndTime = useRef<number | null>(null);


  const mutateUpdateCurrentSongRef = useRef(
    mutateUpdateCurrentSongMutation.mutate
  );

  const activeSongRef = useRef(activeSong);

  const syncingSongs = useRef<Set<string>>(new Set());

  // Ref'ler: event listener'larının stale closure sorunu yaşamaması için
  const loopModeRef = useRef(loopMode);
  const isShuffledRef = useRef(isShuffled);
  const playlistRef = useRef(playlist);
  const shuffledPlaylistRef = useRef(shuffledPlaylist);

  useEffect(() => { loopModeRef.current = loopMode; }, [loopMode]);
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);
  useEffect(() => { playlistRef.current = playlist; }, [playlist]);
  useEffect(() => { shuffledPlaylistRef.current = shuffledPlaylist; }, [shuffledPlaylist]);

  // Setup @rntp/player on hook init
  useEffect(() => {
    ensureTrackPlayerSetup();
  }, []);

  // Loading state'ini playbackState'e göre güncelle
  useEffect(() => {
    if (playbackState === PlaybackState.Buffering) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [playbackState]);

  // Sync progress
  useEffect(() => {
    if (typeof currentPositionSec === "number") {
      positionShared.value = currentPositionSec;
      setPosition(currentPositionSec);
    }
  }, [currentPositionSec, positionShared]);

  useEffect(() => {
    mutateUpdateCurrentSongRef.current = mutateUpdateCurrentSongMutation.mutate;
  }, [mutateUpdateCurrentSongMutation.mutate]);

  useEffect(() => {
    activeSongRef.current = activeSong;
  }, [activeSong]);

  const ensureSongInDb = useCallback(
    async (asset: Song) => {
      if (syncingSongs.current.has(asset.id)) return asset.id;

      const { data: existingSongs } =
        (queryClient.getQueryData(["songs"]) as any) || { data: [] };
      const exists = existingSongs?.some((s: any) => s.id === asset.id);

      if (!exists) {
        try {
          syncingSongs.current.add(asset.id);
          const savedSong = await insertSong(asset);
          if (savedSong) {
            queryClient.invalidateQueries({ queryKey: ["songs"] });
          }
        } finally {
          syncingSongs.current.delete(asset.id);
        }
      }
      return asset.id;
    },
    [queryClient]
  );



  // ── Event Listeners ──
  useEffect(() => {
    let fgActiveSongId: string | null = null;
    let fgPlayStartTime: number | null = null;
    let fgAccumulatedTime = 0;
    let fgSessionTime = 0;
    let fgHasCountedPlay = false;

    const saveFgStats = async (songId: string, playCountDelta: number = 0, skipCountDelta: number = 0) => {
      let timeToSave = fgAccumulatedTime;
      fgAccumulatedTime = 0;
      if (timeToSave >= 1 || playCountDelta > 0 || skipCountDelta > 0) {
        try {
          await upsertlisteningtime(timeToSave, songId, skipCountDelta, playCountDelta);
        } catch (e) {
          console.log(`[FOREGROUND STATS] ❌ Kayıt Hatası:`, e);
        }
      }
    };

    const trackTransitionSub = TrackPlayer.addEventListener(
      Event.MediaItemTransition,
      async (e) => {
        if (fgActiveSongId) {
          if (fgPlayStartTime !== null) {
            const played = (Date.now() - fgPlayStartTime) / 1000;
            fgAccumulatedTime += played;
            fgSessionTime += played;
            fgPlayStartTime = null;
          }

          let skipDelta = 0;
          if (!fgHasCountedPlay && fgSessionTime > 0 && fgSessionTime < 30) {
            skipDelta = 1;
          }
          await saveFgStats(fgActiveSongId, 0, skipDelta);
        }

        fgActiveSongId = e.item?.mediaId ?? null;
        fgAccumulatedTime = 0;
        fgSessionTime = 0;
        fgHasCountedPlay = false;
        fgPlayStartTime = Date.now();

        if (e.item && typeof e.item.mediaId === "string") {
          const list = playlistRef.current || [];
          const foundSong = list.find((s) => s.id === e.item?.mediaId);
          if (foundSong) {
            setActiveSong(foundSong);
            mutateUpdateCurrentSongRef.current(foundSong.id);
          }
        }
      }
    );

    const isPlayingChangedSub = TrackPlayer.addEventListener(
      Event.IsPlayingChanged,
      async (e) => {
        const { playing } = e;
        if (playing) {
          if (fgPlayStartTime === null) {
            fgPlayStartTime = Date.now();
          }
        } else {
          if (fgPlayStartTime !== null) {
            const played = (Date.now() - fgPlayStartTime) / 1000;
            fgAccumulatedTime += played;
            fgSessionTime += played;
            fgPlayStartTime = null;
          }
          if (fgActiveSongId && fgAccumulatedTime >= 5) {
            let playDelta = 0;
            if (!fgHasCountedPlay && fgSessionTime >= 30) {
              playDelta = 1;
              fgHasCountedPlay = true;
            }
            await saveFgStats(fgActiveSongId, playDelta, 0);
          }
        }
      }
    );

    const playbackStateSub = TrackPlayer.addEventListener(
      Event.PlaybackStateChanged,
      async (e) => {
        if (e.state === PlaybackState.Ended) {
          if (fgPlayStartTime !== null) {
            const played = (Date.now() - fgPlayStartTime) / 1000;
            fgAccumulatedTime += played;
            fgSessionTime += played;
            fgPlayStartTime = null;
          }
          if (fgActiveSongId) {
            let playDelta = 0;
            if (!fgHasCountedPlay && fgSessionTime >= 30) {
              playDelta = 1;
              fgHasCountedPlay = true;
            }
            await saveFgStats(fgActiveSongId, playDelta, 0);
          }
        }
      }
    );

    return () => {
      trackTransitionSub.remove();
      isPlayingChangedSub.remove();
      playbackStateSub.remove();
    };
  }, []);

  // ── play fonksiyonu ──
  const play = useCallback(async (asset: Song, newPlaylist?: Song[]) => {
    setIsLoading(true);
    try {
      await ensureTrackPlayerSetup();

      setActiveSong(asset);
      const targetPlaylist = newPlaylist || playlistRef.current || [asset];
      if (newPlaylist) setPlaylist(newPlaylist);

      const mediaItems = targetPlaylist.map((s) => ({
        mediaId: s.id,
        url: s.uri,
        title: s.metadata?.title || s.filename || "Bilinmeyen Şarkı",
        artist: s.metadata?.artist || "Bilinmeyen Sanatçı",
        albumTitle: s.metadata?.album || "Bilinmeyen Albüm",
        artworkUrl: s.metadata?.coverUri || undefined,
        duration: s.duration || s.metadata?.duration || undefined,
      }));

      const startIndex = targetPlaylist.findIndex(s => s.id === asset.id);
      const safeIndex = startIndex >= 0 ? startIndex : 0;

      await TrackPlayer.setMediaItems(mediaItems, safeIndex);
      await TrackPlayer.play();

      mutateUpdateCurrentSongRef.current(asset.id);
      await ensureSongInDb(asset);
    } catch (e) {
      console.error("TrackPlayer play error:", e);
    } finally {
      setIsLoading(false);
    }
  }, [ensureSongInDb]);

  const pause = useCallback(async () => {
    await TrackPlayer.pause();
    mutateUpdateCurrentSongRef.current(null);
  }, []);

  const stop = useCallback(async () => {
    await TrackPlayer.stop();
    await TrackPlayer.clear();
    setActiveSong(null);
    mutateUpdateCurrentSongRef.current(null);
  }, []);

  const resume = useCallback(async () => {
    await TrackPlayer.play();
    if (activeSong) {
      const songId = await ensureSongInDb(activeSong);
      mutateUpdateCurrentSongRef.current(songId);
    }
  }, [activeSong, ensureSongInDb]);

  const next = useCallback(async () => {
    try {
      await TrackPlayer.skipToNext();

      const newCount = nextCount + 1;
      if (newCount >= 5) {
        showInterstitial("SKIPS");
        setNextCount(0);
      } else {
        setNextCount(newCount);
      }
    } catch (error) {
      if (loopModeRef.current === "all") {
        await TrackPlayer.skipToIndex(0);
      }
    }
  }, [nextCount, showInterstitial]);

  const previous = useCallback(async () => {
    try {
      await TrackPlayer.skipToPrevious();

      const newCount = nextCount + 1;
      if (newCount >= 5) {
        showInterstitial("SKIPS");
        setNextCount(0);
      } else {
        setNextCount(newCount);
      }
    } catch (error) {
      // Ignore, already at beginning
    }
  }, [nextCount, showInterstitial]);

  // Sleep Timer Logic
  useEffect(() => {
    let interval: any;

    const tick = () => {
      if (!sleepTimerEndTime.current) {
        setIsSleepTimerActive(false);
        setSleepTimerRemaining(null);
        return;
      }

      const now = Date.now();
      const remainingSeconds = Math.max(
        0,
        Math.floor((sleepTimerEndTime.current - now) / 1000)
      );
      setSleepTimerRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        pause();
        TrackPlayer.setVolume(1.0);
        setIsSleepTimerActive(false);
        sleepTimerEndTime.current = null;
        if (interval) clearInterval(interval);
      } else if (remainingSeconds <= 120) {
        TrackPlayer.setVolume(remainingSeconds / 120);
      }
    };

    if (isSleepTimerActive) {
      tick();
      interval = setInterval(tick, 1000);
    }

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        if (isSleepTimerActive) tick();
        const currentTrack = await TrackPlayer.getActiveMediaItem();
        if (currentTrack?.mediaId) {
          const list = playlistRef.current || [];
          const foundSong = list.find((s) => s.id === currentTrack.mediaId);
          if (foundSong && foundSong.id !== activeSongRef.current?.id) {
            setActiveSong(foundSong);
            mutateUpdateCurrentSongRef.current(foundSong.id);
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, [isSleepTimerActive, pause]);

  const updateSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null) {
      sleepTimerEndTime.current = null;
      setSleepTimerRemaining(null);
      setIsSleepTimerActive(false);
      TrackPlayer.setVolume(1.0);
    } else {
      const endTime = Date.now() + minutes * 60 * 1000;
      sleepTimerEndTime.current = endTime;
      setSleepTimerRemaining(minutes * 60);
      setIsSleepTimerActive(true);
    }
  }, []);

  const handleSeek = useCallback(
    (durationSeconds: number) => (value: number) => {
      if (durationSeconds <= 0) return;
      const nextPositionSeconds = (value / 100) * durationSeconds;
      TrackPlayer.seekTo(nextPositionSeconds);
      setPosition(nextPositionSeconds);
    },
    []
  );

  const updateLoopMode = useCallback((mode: LoopMode) => {
    setLoopMode(mode);
    if (mode === "one") {
      TrackPlayer.setRepeatMode(RepeatMode.One);
    } else if (mode === "all") {
      TrackPlayer.setRepeatMode(RepeatMode.All);
    } else {
      TrackPlayer.setRepeatMode(RepeatMode.Off);
    }
  }, []);

  const shuffle = useCallback(
    async (enable: boolean) => {
      setIsShuffled(enable);
      TrackPlayer.setShuffleEnabled(enable);
    },
    []
  );

  // Player object compatible with components using audioPlayer properties
  const audioPlayerAdapter = useMemo(() => {
    return {
      isLoaded: !!activeSong,
      duration: currentDurationSec || activeSong?.duration || 0,
      currentTime: position,
      playing: isPlaying,
      seekTo: (sec: number) => TrackPlayer.seekTo(sec),
      play: () => TrackPlayer.play(),
      pause: () => TrackPlayer.pause(),
      volume: 1.0,
    };
  }, [activeSong, currentDurationSec, position, isPlaying]);

  return {
    play,
    pause,
    stop,
    resume,
    next,
    previous,
    handleSeek,
    shuffle,
    loop: updateLoopMode,
    activeSong,
    audioPlayer: audioPlayerAdapter,
    isPlaying,
    position,
    positionShared,
    loopMode,
    isShuffled,
    playlist,
    isLoading,
    sleepTimerRemaining,
    isSleepTimerActive,
    setSleepTimer: updateSleepTimer,
  };
}
