import { Song } from "@/components/songs/songsService";
import { getsongs, insertSong } from "@/services/SongsService";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useProfile } from "./useProfil";
import { UpsertListeningTimeMutation } from "@/mutation/statictics";
import { useAds } from "@/providers/AdsProvider";

type LoopMode = "all" | "one" | "none";

export default function useAudioPlayerHook() {
  const queryClient = useQueryClient();
  const audioPlayer = useAudioPlayer();
  const status = useAudioPlayerStatus(audioPlayer);
  const { mutateUpdateCurrentSong: mutateUpdateCurrentSongMutation } =
    useProfile();

  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const positionShared = useSharedValue(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [nextCount, setNextCount] = useState(0);
  const { showInterstitial } = useAds();
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[] | null>(null);
  const [playlist, setPlaylist] = useState<Song[] | null>(null);
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sleep Timer States
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(
    null,
  );
  const [isSleepTimerActive, setIsSleepTimerActive] = useState(false);
  const sleepTimerEndTime = useRef<number | null>(null);

  const upsertListeningTimeMutation = UpsertListeningTimeMutation();
  const upsertListeningTimeRef = useRef(upsertListeningTimeMutation);

  const mutateUpdateCurrentSongRef = useRef(
    mutateUpdateCurrentSongMutation.mutate,
  );

  const totalTimePlayed = useRef(0);
  const lastSavedTime = useRef(0); // Tracking what we've already sent to Supabase
  const prevTime = useRef(0);
  const wasInBackground = useRef(false);
  const activeSongRef = useRef(activeSong);
  const playCounted = useRef(false);
  const statsHandlingRef = useRef(false);
  const prevActiveSongId = useRef<string | null>(null);
  const syncingSongs = useRef<Set<string>>(new Set());

  // Update refs every render to keep them current without triggering re-renders of effects
  useEffect(() => {
    upsertListeningTimeRef.current = upsertListeningTimeMutation;
    mutateUpdateCurrentSongRef.current = mutateUpdateCurrentSongMutation.mutate;
  }, [upsertListeningTimeMutation, mutateUpdateCurrentSongMutation.mutate]);

  useEffect(() => {
    activeSongRef.current = activeSong;
  }, [activeSong]);

  const { data: songs } = useQuery({
    queryKey: ["songs"],
    queryFn: () => getsongs(),
  });

  // Ensure song exists in Supabase with its asset ID
  const ensureSongInDb = useCallback(
    async (asset: Song) => {
      // Prevent concurrent syncs for the same song
      if (syncingSongs.current.has(asset.id)) return asset.id;

      // Small optimization: if we have it in our cache, skip DB check
      const { data: existingSongs } = (queryClient.getQueryData([
        "songs",
      ]) as any) || { data: [] };
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
    [queryClient],
  );

  const saveListeningTime = useCallback(
    (songId: string | null | undefined, isManual: boolean = false, forcePlayCount: number = 0) => {
      if (!songId) return;

      // Final remainder to save (total vs what we already saved)
      const deltaToSave = Math.max(
        0,
        totalTimePlayed.current - lastSavedTime.current,
      );
      // Skip logic: 30 saniyeden az dinlenmişse ve henüz "oynatıldı" sayılmamışsa atlama kabul et
      const isIntentionalSkip = isManual && totalTimePlayed.current < 30 && !playCounted.current;

      // Kaydedilecek anlamlı bir süre yoksa ve skip durumu değilse çık
      if (deltaToSave < 0.1 && !isIntentionalSkip) {
        return;
      }

      // Eğer doğal bitiş (heartbeat veya finish efekti) zaten süreyi kaydettiyse,
      // manuel skip çağrısı 0 saniye kaydederek mükerrer kayıt oluşturmasın.
      if (isIntentionalSkip && deltaToSave < 0.1 && lastSavedTime.current > 0) {
        return;
      }


      upsertListeningTimeRef.current({
        listeningTime: deltaToSave,
        songId: songId,
        skipCount: isIntentionalSkip ? 1 : 0,
        playCount: forcePlayCount,
      });

      lastSavedTime.current = totalTimePlayed.current; 
    },
    [],
  );

  const compareSongIds = useCallback(
    (
      id1: string | null | undefined,
      id2: string | null | undefined,
    ): boolean => {
      if (!id1 || !id2) return false;
      return id1 === id2;
    },
    [],
  );

  // Statistics & Listening Time Trace
  useEffect(() => {
    // Check if everything is there
    if (!activeSong?.id || typeof status?.currentTime !== "number") return;

    const currentPos = status.currentTime; // expo-audio uses seconds

    // Initialize prevTime on first status update of a song to avoid huge initial delta
    if (prevTime.current === 0 && currentPos > 0) {
      prevTime.current = currentPos;
      return;
    }

    const delta = currentPos - prevTime.current;
    if (delta > 0) {
      // If delta is huge (> 5s), it's a seek or first load, sync but don't accumulate
      if (delta < 5 || wasInBackground.current) {
        totalTimePlayed.current += delta;
        wasInBackground.current = false;
      }
    }

    // Heartbeat & Play Count: update stats periodically (30s)
    const currentDeltaSinceLastSave =
      totalTimePlayed.current - lastSavedTime.current;
    if (currentDeltaSinceLastSave >= 30) {
      let playCountToSend = 0;
      if (!playCounted.current && totalTimePlayed.current >= 30) {
        playCountToSend = 1;
        playCounted.current = true;
      }

      upsertListeningTimeRef.current({
        listeningTime: currentDeltaSinceLastSave,
        songId: activeSong.id,
        skipCount: 0,
        playCount: playCountToSend,
      });
      lastSavedTime.current = totalTimePlayed.current;
    }

    prevTime.current = currentPos;
  }, [activeSong?.id, status?.currentTime]);

  useEffect(() => {
    // Şarkı değiştiğinde:
    // 1. Eskiden kalan süre varsa eski şarkıya kaydet
    if (
      prevActiveSongId.current &&
      prevActiveSongId.current !== activeSong?.id
    ) {
      saveListeningTime(prevActiveSongId.current, false);
    }

    // 2. Yeni şarkı için sayaçları sıfırla
    prevTime.current = 0;
    totalTimePlayed.current = 0;
    lastSavedTime.current = 0;
    playCounted.current = false;

    // 3. Güncel ID'yi kaydet
    prevActiveSongId.current = activeSong?.id || null;
  }, [activeSong?.id]);

  useEffect(() => {
    if (status?.didJustFinish) {
      if (!statsHandlingRef.current && activeSong?.id) {
        statsHandlingRef.current = true;
        
        // Şarkı bittiğinde henüz playCount gönderilmemişse 1 gönder
        const playCountToSend = playCounted.current ? 0 : 1;
        if (playCountToSend === 1) playCounted.current = true;

        saveListeningTime(activeSong.id, false, playCountToSend);
      }
    } else {
      statsHandlingRef.current = false;
    }
  }, [status?.didJustFinish, activeSong?.id, saveListeningTime]);

  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionModeAndroid: "duckOthers",
      interruptionMode: "mixWithOthers",
    });
  }, []);

  const isLoadingSong = useMemo(() => isLoading, [isLoading]);

  // Audio Control Methods
  const play = async (asset: Song, playlist?: Song[]) => {
    setIsLoading(true);
    try {
      if (activeSong?.id && activeSong.id !== asset.id) {
        // Switching songs manually from a list
        saveListeningTime(activeSong.id, true);
      }
      setActiveSong(asset);
      if (playlist) setPlaylist(playlist);
      audioPlayer.replace(asset.uri);
      audioPlayer.play();
      setIsPlaying(true);

      // Update UI/Profile immediately, then ensure sync in background
      mutateUpdateCurrentSongRef.current(asset.id);

      await ensureSongInDb(asset);
    } finally {
      setIsLoading(false);
    }
  };

  const pause = useCallback(async () => {
    if (activeSong?.id) saveListeningTime(activeSong.id, false);
    audioPlayer.pause();
    setIsPlaying(false);
    mutateUpdateCurrentSongRef.current(null);
  }, [audioPlayer, activeSong?.id, saveListeningTime]);

  const stop = useCallback(() => {
    if (activeSong?.id) saveListeningTime(activeSong.id, false);
    audioPlayer.pause();
    setIsPlaying(false);
    setActiveSong(null);
    mutateUpdateCurrentSongRef.current(null);
  }, [audioPlayer, activeSong?.id, saveListeningTime]);

  const resume = useCallback(async () => {
    audioPlayer.play();
    setIsPlaying(true);
    if (activeSong) {
      const songId = await ensureSongInDb(activeSong);
      mutateUpdateCurrentSongRef.current(songId);
    }
  }, [audioPlayer, activeSong, ensureSongInDb]);

  const next = useCallback(
    async (
      data: Song[],
      useShuffle: boolean = false,
      isManual: boolean = true,
    ) => {
      setIsLoading(true);
      try {
        if (activeSong?.id) saveListeningTime(activeSong.id, isManual);
        const nextPlaylist =
          useShuffle && shuffledPlaylist
            ? shuffledPlaylist
            : (playlist ?? data);
        if (!nextPlaylist) return;
        const currentIndex = nextPlaylist.findIndex((s) =>
          compareSongIds(s.id, activeSong?.id),
        );
        if (currentIndex === -1) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < nextPlaylist.length) {
          const nextSong = nextPlaylist[nextIndex];
          setActiveSong(nextSong);
          audioPlayer.replace(nextSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          mutateUpdateCurrentSongRef.current(nextSong.id);
          await ensureSongInDb(nextSong);

          // Show Interstitial every few skips
          const newCount = nextCount + 1;
          if (newCount >= 5) {
            showInterstitial("SKIPS");
            setNextCount(0);
          } else {
            setNextCount(newCount);
          }
        } else if (useShuffle && shuffledPlaylist) {
          const nextSong = shuffledPlaylist[0];
          setActiveSong(nextSong);
          audioPlayer.replace(nextSong.uri);
          audioPlayer.play();
          setIsPlaying(true);
          mutateUpdateCurrentSongRef.current(nextSong.id);
          await ensureSongInDb(nextSong);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeSong,
      audioPlayer,
      playlist,
      shuffledPlaylist,
      ensureSongInDb,
      compareSongIds,
      saveListeningTime,
      nextCount,
      showInterstitial,
    ],
  );

  const previous = useCallback(
    async (
      data: Song[],
      useShuffle: boolean = false,
      isManual: boolean = true,
    ) => {
      setIsLoading(true);
      try {
        if (activeSong?.id) saveListeningTime(activeSong.id, isManual);
        const prevPlaylist =
          useShuffle && shuffledPlaylist
            ? shuffledPlaylist
            : (playlist ?? data);
        if (!prevPlaylist) return;
        const currentIndex = prevPlaylist.findIndex((s) =>
          compareSongIds(s.id, activeSong?.id),
        );
        if (currentIndex === -1) return;
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevSong = prevPlaylist[prevIndex];
          setActiveSong(prevSong);
          audioPlayer.replace(prevSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          mutateUpdateCurrentSongRef.current(prevSong.id);
          await ensureSongInDb(prevSong);

          // Show Interstitial every few skips
          const newCount = nextCount + 1;
          if (newCount >= 5) {
            showInterstitial("SKIPS");
            setNextCount(0);
          } else {
            setNextCount(newCount);
          }
        } else if (useShuffle && shuffledPlaylist) {
          const prevSong = prevPlaylist[prevPlaylist.length - 1];
          setActiveSong(prevSong);
          audioPlayer.replace(prevSong.uri);
          audioPlayer.play();
          setIsPlaying(true);
          mutateUpdateCurrentSongRef.current(prevSong.id);
          await ensureSongInDb(prevSong);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      activeSong,
      audioPlayer,
      playlist,
      shuffledPlaylist,
      ensureSongInDb,
      compareSongIds,
      saveListeningTime,
      nextCount,
      showInterstitial,
    ],
  );

  // Sleep Timer Logic (Timestamp BASED for Background Support)
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
        Math.floor((sleepTimerEndTime.current - now) / 1000),
      );

      setSleepTimerRemaining(remainingSeconds);

      if (remainingSeconds <= 0) {
        pause();
        audioPlayer.volume = 1.0;
        setIsSleepTimerActive(false);
        sleepTimerEndTime.current = null;
        if (interval) clearInterval(interval);
      } else if (remainingSeconds <= 120) {
        // Volume Fading (Last 2 minutes)
        audioPlayer.volume = remainingSeconds / 120;
      }
    };

    if (isSleepTimerActive) {
      tick();
      interval = setInterval(tick, 1000);
    }

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        if (isSleepTimerActive) tick();
        wasInBackground.current = true;
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // Use activeSongRef instead of activeSong state to avoid loop
        const currentActiveSong = activeSongRef.current;
        if (currentActiveSong?.id && totalTimePlayed.current > 0) {
          const deltaToSave = Math.max(
            0,
            totalTimePlayed.current - lastSavedTime.current,
          );
          if (deltaToSave > 0) {
            upsertListeningTimeRef.current({
              listeningTime: deltaToSave,
              songId: currentActiveSong.id,
              skipCount: 0,
              playCount: 0,
            });
            lastSavedTime.current = totalTimePlayed.current;
          }
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange,
    );

    return () => {
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, [isSleepTimerActive, audioPlayer, pause]);

  const updateSleepTimer = useCallback(
    (minutes: number | null) => {
      if (minutes === null) {
        sleepTimerEndTime.current = null;
        setSleepTimerRemaining(null);
        setIsSleepTimerActive(false);
        audioPlayer.volume = 1.0;
      } else {
        const endTime = Date.now() + minutes * 60 * 1000;
        sleepTimerEndTime.current = endTime;
        setSleepTimerRemaining(minutes * 60);
        setIsSleepTimerActive(true);
      }
    },
    [audioPlayer],
  );

  useEffect(() => {
    if (!status || isSeeking) return;
    if (typeof status.currentTime === "number") {
      const positionInSeconds = status.currentTime;
      positionShared.value = positionInSeconds;
      setPosition(positionInSeconds);
    }
    if (typeof status.playing === "boolean") setIsPlaying(status.playing);
  }, [status, isSeeking, positionShared]);

  const handleSeek = useCallback(
    (durationSeconds: number) => (value: number) => {
      if (durationSeconds <= 0 || !audioPlayer) return;
      const nextPositionSeconds = (value / 100) * durationSeconds;
      audioPlayer.seekTo(nextPositionSeconds);
      setPosition(nextPositionSeconds);
    },
    [audioPlayer],
  );

  const updateLoopMode = useCallback(
    (mode: LoopMode) => {
      setLoopMode(mode);
      audioPlayer.loop = mode === "one";
    },
    [audioPlayer],
  );

  const shuffle = useCallback(
    (enable: boolean) => {
      setIsShuffled(enable);
      const sourcePlaylist = playlist ?? [];
      if (enable && sourcePlaylist.length > 0) {
        const otherSongs = activeSong
          ? sourcePlaylist.filter((s) => !compareSongIds(s.id, activeSong.id))
          : [...sourcePlaylist];
        const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
        const newPlaylist = activeSong ? [activeSong, ...shuffled] : shuffled;
        setShuffledPlaylist(newPlaylist);
      } else {
        setShuffledPlaylist(null);
      }
    },
    [activeSong, playlist, compareSongIds],
  );

  useEffect(() => {
    if (!audioPlayer) return;
    // @ts-expect-error - Commands missing from type definition
    const playSub = audioPlayer.addListener("playCommand", () => resume());
    // @ts-expect-error
    const pauseSub = audioPlayer.addListener("pauseCommand", () => pause());
    // @ts-expect-error
    const nextSub = audioPlayer.addListener("nextCommand", () =>
      next(playlist || [], isShuffled),
    );
    // @ts-expect-error
    const prevSub = audioPlayer.addListener("previousCommand", () =>
      previous(playlist || [], isShuffled),
    );
    return () => {
      playSub.remove();
      pauseSub.remove();
      nextSub.remove();
      prevSub.remove();
    };
  }, [audioPlayer, resume, pause, next, previous, playlist, isShuffled]);

  useEffect(() => {
    if (!activeSong) {
      audioPlayer.setActiveForLockScreen(false);
      return;
    }
    const metadata = {
      title:
        activeSong.metadata?.title || activeSong.filename || "Bilinmeyen Şarkı",
      artist: activeSong.metadata?.artist || "Bilinmeyen Sanatçı",
      albumTitle: activeSong.metadata?.album || "Bilinmeyen Albüm",
      artworkUrl: activeSong.metadata?.coverUri || undefined,
    };
    audioPlayer.setActiveForLockScreen(true, metadata, {
      showSeekBackward: true,
      showSeekForward: true,
      showNextTrack: true,
      showPreviousTrack: true,
    } as any);
  }, [audioPlayer, activeSong, isPlaying]);

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
    audioPlayer,
    isPlaying,
    position,
    positionShared,
    loopMode,
    isShuffled,
    playlist,
    isLoading: isLoadingSong,
    sleepTimerRemaining,
    isSleepTimerActive,
    setSleepTimer: updateSleepTimer,
  };
}
