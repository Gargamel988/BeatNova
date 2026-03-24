import { Song } from "@/components/songs/songsService";
import { getsongs } from "@/services/SongsService";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "./useProfil";
import { UpsertListeningTimeMutation } from "@/mutation/statictics";

type LoopMode = "all" | "one" | "none";

import { useAds } from "@/providers/AdsProvider";

export default function useAudioPlayerHook() {
  const audioPlayer = useAudioPlayer();
  const status = useAudioPlayerStatus(audioPlayer);
  const { mutateUpdateCurrentSong } = useProfile();

  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
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

  const { mutateUpdateCurrentSong: mutateUpdateCurrentSongMutation } =
    useProfile();
  const mutateUpdateCurrentSongRef = useRef(
    mutateUpdateCurrentSongMutation.mutate,
  );

  const totalTimePlayed = useRef(0);
  const prevTime = useRef(0);

  // Update refs every render to keep them current without triggering re-renders of effects
  useEffect(() => {
    upsertListeningTimeRef.current = upsertListeningTimeMutation;
    mutateUpdateCurrentSongRef.current = mutateUpdateCurrentSongMutation.mutate;
  });

  const { data: songs } = useQuery({
    queryKey: ["songs"],
    queryFn: () => getsongs(),
  });

  const findSongUuidByAssetId = useCallback(
    (assetId?: string | null) => {
      if (!assetId || !songs || songs.length === 0) return undefined;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(assetId)) return assetId;
      const foundByAssetId = songs.find((item) => item.asset_id === assetId);
      return foundByAssetId?.id;
    },
    [songs],
  );

  const saveListeningTime = useCallback(
    (songId: string | null | undefined, manualSkip: boolean = false) => {
      if (!songId) return;
      const songUuid = findSongUuidByAssetId(songId);
      if (!songUuid) return;

      // Skip heuristic: if manually skipped in first 15s, it's a skipCount
      const isIntentionalSkip = manualSkip && totalTimePlayed.current < 15;

      upsertListeningTimeRef.current({
        listeningTime: totalTimePlayed.current,
        songId: songUuid,
        skipCount: isIntentionalSkip ? 1 : 0,
        playCount: 0, // playCount is incremented at the start of 'play'
      });

      totalTimePlayed.current = 0;
    },
    [findSongUuidByAssetId],
  );

  const compareSongIds = useCallback(
    (
      id1: string | null | undefined,
      id2: string | null | undefined,
    ): boolean => {
      if (!id1 || !id2) return false;
      if (id1 === id2) return true;
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(id1) === uuidRegex.test(id2)) return id1 === id2;
      if (!songs) return false;
      const song1 = songs.find((s) => s.id === id1 || s.asset_id === id1);
      const song2 = songs.find((s) => s.id === id2 || s.asset_id === id2);
      if (!song1 || !song2) return false;
      return song1.id === song2.id;
    },
    [songs],
  );

  // Statistics & Listening Time Trace
  useEffect(() => {
    if (!activeSong?.id || !status?.currentTime) return;
    const delta = status.currentTime - prevTime.current;
    if (delta > 0 && delta < 5) {
      totalTimePlayed.current += delta;
      // Heartbeat: update stats periodically (e.g. every 30s)
      if (totalTimePlayed.current >= 30) {
        const songUuid = findSongUuidByAssetId(activeSong.id);
        if (songUuid) {
          upsertListeningTimeRef.current({
            listeningTime: totalTimePlayed.current,
            songId: songUuid,
            skipCount: 0,
            playCount: 0,
          });
        }
        totalTimePlayed.current = 0;
      }
    }
    prevTime.current = status.currentTime;
  }, [activeSong?.id, status?.currentTime, findSongUuidByAssetId]);

  useEffect(() => {
    prevTime.current = 0;
    totalTimePlayed.current = 0;
  }, [activeSong?.id]);

  useEffect(() => {
    if (!status?.didJustFinish || !activeSong?.id) return;
    const songUuid = findSongUuidByAssetId(activeSong.id);
    if (songUuid && totalTimePlayed.current > 0) {
      upsertListeningTimeRef.current({
        listeningTime: totalTimePlayed.current,
        songId: songUuid,
        skipCount: 0,
        playCount: 0,
      });
      totalTimePlayed.current = 0;
    }
  }, [status?.didJustFinish, activeSong?.id, findSongUuidByAssetId]);

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
      const newSongUuid = findSongUuidByAssetId(asset.id);
      if (newSongUuid) {
        mutateUpdateCurrentSongRef.current(newSongUuid);
        // Track a new play session
        upsertListeningTimeRef.current({
          listeningTime: 0,
          songId: newSongUuid,
          skipCount: 0,
          playCount: 1,
        });
      }
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
      const songUuid = findSongUuidByAssetId(activeSong.id);
      if (songUuid) mutateUpdateCurrentSongRef.current(songUuid);
    }
  }, [audioPlayer, activeSong, findSongUuidByAssetId]);

  const next = useCallback(
    (data: Song[], useShuffle: boolean = false) => {
      setIsLoading(true);
      try {
        if (activeSong?.id) saveListeningTime(activeSong.id, true);
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

          // Show Interstitial every 5 skips
          const newCount = nextCount + 1;
          if (newCount >= 5) {
            showInterstitial();
            setNextCount(0);
          } else {
            setNextCount(newCount);
          }

          const nextSongUuid = findSongUuidByAssetId(nextSong.id);
          if (nextSongUuid) mutateUpdateCurrentSongRef.current(nextSongUuid);
        } else if (useShuffle && shuffledPlaylist) {
          const nextSong = shuffledPlaylist[0];
          setActiveSong(nextSong);
          audioPlayer.replace(nextSong.uri);
          audioPlayer.play();
          setIsPlaying(true);
          const nextSongUuid = findSongUuidByAssetId(nextSong.id);
          if (nextSongUuid) mutateUpdateCurrentSongRef.current(nextSongUuid);
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
      findSongUuidByAssetId,
      compareSongIds,
      saveListeningTime,
    ],
  );

  const previous = useCallback(
    (data: Song[], useShuffle: boolean = false) => {
      setIsLoading(true);
      try {
        if (activeSong?.id) saveListeningTime(activeSong.id, true);
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

          // Show Interstitial every 5 skips
          const newCount = nextCount + 1;
          if (newCount >= 5) {
            showInterstitial();
            setNextCount(0);
          } else {
            setNextCount(newCount);
          }

          const prevSongUuid = findSongUuidByAssetId(prevSong.id);
          if (prevSongUuid) mutateUpdateCurrentSongRef.current(prevSongUuid);
        } else if (useShuffle && shuffledPlaylist) {
          const prevSong = shuffledPlaylist[shuffledPlaylist.length - 1];
          setActiveSong(prevSong);
          audioPlayer.replace(prevSong.uri);
          audioPlayer.play();
          setIsPlaying(true);
          const prevSongUuid = findSongUuidByAssetId(prevSong.id);
          if (prevSongUuid) mutateUpdateCurrentSongRef.current(prevSongUuid);
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
      findSongUuidByAssetId,
      compareSongIds,
      saveListeningTime,
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
      if (nextAppState === "active" && isSleepTimerActive) {
        tick();
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
    if (typeof status.currentTime === "number") setPosition(status.currentTime);
    if (typeof status.playing === "boolean") setIsPlaying(status.playing);
  }, [status, isSeeking]);

  const handleSeek = useCallback(
    (durationSeconds: number) => (value: number) => {
      if (durationSeconds <= 0 || !audioPlayer) return;
      const nextPositionSeconds = (value / 100) * durationSeconds;
      audioPlayer.seekTo(nextPositionSeconds);
      setPosition(nextPositionSeconds);
    },
    [audioPlayer],
  );

  const beginSeek = useCallback(() => setIsSeeking(true), []);
  const endSeek = useCallback(() => setIsSeeking(false), []);

  useEffect(() => {
    if (!status?.didJustFinish || !activeSong) return;
    const currentPlaylist =
      isShuffled && shuffledPlaylist ? shuffledPlaylist : playlist;
    if (!currentPlaylist || currentPlaylist.length === 0) return;
    if (loopMode === "one") {
      audioPlayer.seekTo(0);
      audioPlayer.play();
    } else if (loopMode === "all") {
      const currentIndex = currentPlaylist.findIndex((s) =>
        compareSongIds(s.id, activeSong.id),
      );
      if (currentIndex === currentPlaylist.length - 1) {
        const loopSong = currentPlaylist[0];
        setActiveSong(loopSong);
        audioPlayer.replace(loopSong.uri);
        audioPlayer.play();
        setIsPlaying(true);
        const loopSongUuid = findSongUuidByAssetId(loopSong.id);
        if (loopSongUuid) mutateUpdateCurrentSongRef.current(loopSongUuid);
      } else {
        next(currentPlaylist, isShuffled);
      }
    } else {
      next(currentPlaylist, isShuffled);
    }
  }, [
    status?.didJustFinish,
    loopMode,
    activeSong,
    isShuffled,
    shuffledPlaylist,
    playlist,
    audioPlayer,
    next,
    pause,
    compareSongIds,
    findSongUuidByAssetId,
  ]);

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
    beginSeek,
    endSeek,
    shuffle,
    loop: updateLoopMode,
    activeSong,
    audioPlayer,
    isPlaying,
    position,
    loopMode,
    isShuffled,
    playlist,
    isLoading: isLoadingSong,
    sleepTimerRemaining,
    isSleepTimerActive,
    setSleepTimer: updateSleepTimer,
  };
}
