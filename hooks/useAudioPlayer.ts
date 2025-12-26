import { Song } from "@/components/songs/songsService";
import { UpsertListeningTimeMutation } from "@/mutation/statictics";
import { getsongs } from "@/services/SongsService";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "./useProfil";

export default function useAudioPlayerHook() {
  const audioPlayer = useAudioPlayer();
  const status = useAudioPlayerStatus(audioPlayer);
  const { mutateUpdateCurrentSong } = useProfile();
  const [activeSong, setActiveSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [shuffledPlaylist, setShuffledPlaylist] = useState<Song[] | null>(null);
  const [playlist, setPlaylist] = useState<Song[] | null>(null);
  const [listeningTime, setListeningTime] = useState(0);
 
  const lastTimeRef = useRef<number | null>(null);
  const accumulatedRef = useRef(0); 
  const lastSongIdRef = useRef<string | null>(null);
  const skipCountRef = useRef(0);

  const {
    data: songs,
    isLoading: songsLoading,
    isFetching: songsFetching,
  } = useQuery({
    queryKey: ["songs"],
    queryFn: () => getsongs(),
  });

  const song = useMemo(() => {
    if (!activeSong?.id || !songs) return undefined;
    
    const foundByUuid = songs.find((s) => s.id === activeSong.id);
    if (foundByUuid) return foundByUuid;
    
    return songs.find((s) => s.asset_id === activeSong.id);
  }, [activeSong?.id, songs]);
  
  const findSongUuidByAssetId = useCallback(
    (assetId?: string | null) => {
      if (!assetId || !songs) return undefined;
      
      const foundByUuid = songs.find((item) => item.id === assetId);
      if (foundByUuid) return foundByUuid.id;
      
      const foundByAssetId = songs.find((item) => item.asset_id === assetId);
      return foundByAssetId?.id;
    },
    [songs]
  );

  useEffect(() => {
    audioPlayer.setPlaybackRate(1.0)
  }, [audioPlayer]);


  const upsertListeningTime = UpsertListeningTimeMutation();

  type FlushTarget = {
    songUuid?: string | null;
    assetId?: string | null;
  };

  const flushAccumulatedListeningTime = useCallback(
    (target?: FlushTarget) => {
      const hasListeningDelta = accumulatedRef.current > 0;
      const hasSkipDelta = skipCountRef.current > 0;

      if (!hasListeningDelta && !hasSkipDelta) {
        return;
      }

      if (songsLoading || songsFetching) {
        return;
      }

      const resolvedSongUuid =
        target?.songUuid ??
        (target?.assetId
          ? findSongUuidByAssetId(target.assetId)
          : song?.id);

      if (!resolvedSongUuid) {
        if (!songsLoading && !songsFetching) {
          console.warn(
            "Dinleme geçmişi kaydedilemedi, şarkı UUID bulunamadı."
          );
        }
        return;
      }

      const flushAmount = hasListeningDelta
        ? Math.round(accumulatedRef.current)
        : 0;
      const skipDelta = skipCountRef.current;
      const playCount = 1;
      accumulatedRef.current = 0;
      skipCountRef.current = 0;
      upsertListeningTime({
        listeningTime: flushAmount,
        songId: resolvedSongUuid,
        skipCount: skipDelta,
        playCount: playCount,
      });
    },
    [findSongUuidByAssetId, song?.id, upsertListeningTime, songsLoading, songsFetching]
  );

  const registerSkip = useCallback(() => {
    if (!activeSong) return;

    const duration =
      activeSong.metadata?.duration ?? activeSong.duration ?? 0;
    const currentTime =
      typeof status?.currentTime === "number" ? status.currentTime : 0;
    const isNearEnd =
      duration > 0 ? currentTime >= duration * 0.9 : false;

    if (status?.didJustFinish || isNearEnd) {
      return;
    }

    skipCountRef.current += 1;
  }, [activeSong, status?.currentTime, status?.didJustFinish]);

  const isSongUuidLoading =
    !!activeSong && ((songsLoading || songsFetching) || !song);


  useEffect(() => {
    if (!isSongUuidLoading && activeSong && accumulatedRef.current > 0) {
      flushAccumulatedListeningTime();
    }
  }, [isSongUuidLoading, activeSong, flushAccumulatedListeningTime]);

  useEffect(() => {
    if (!status || isSeeking) return;

    const isCurrentlyPlaying = status.playing === true;
    const currentTime =
      typeof status.currentTime === "number" ? status.currentTime : null;
    const currentSongId = activeSong?.id ?? null;

    if (currentSongId !== lastSongIdRef.current) {
      if (lastSongIdRef.current) {
        flushAccumulatedListeningTime({ assetId: lastSongIdRef.current });
      }
      lastSongIdRef.current = currentSongId;
      lastTimeRef.current = currentTime;
      return;
    }

    if (isSongUuidLoading) {
      return;
    }

    if (isCurrentlyPlaying && currentTime !== null) {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
        return;
      }

      const delta = currentTime - lastTimeRef.current;

      if (delta > 0) {
        accumulatedRef.current += delta;
        setListeningTime((prev) => prev + delta);

        if (accumulatedRef.current >= 60) {
          flushAccumulatedListeningTime();
        }
      }

      lastTimeRef.current = currentTime;
    }

    if (!isCurrentlyPlaying) {
      flushAccumulatedListeningTime();
      lastTimeRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    status?.playing,
    status?.currentTime,
    activeSong?.id,
    isSeeking,
    flushAccumulatedListeningTime,
    isSongUuidLoading,
  ]);

  const play = async (asset: Song, playlist?: Song[]) => {
    if (activeSong) {
      flushAccumulatedListeningTime({
        songUuid: song?.id,
        assetId: activeSong.id,
      });
    }

    setActiveSong(asset);
    if (playlist) {
      setPlaylist(playlist);
    }

    // Ana çalma: expo-audio ile
    audioPlayer.replace(asset.uri);
    audioPlayer.play();
    setIsPlaying(true);
    
    const newSongUuid = findSongUuidByAssetId(asset.id);
    if (newSongUuid) {
      mutateUpdateCurrentSong.mutate(newSongUuid);
    }
  };

  const pause = async () => {
    // Ana pause: expo-audio ile
    audioPlayer.pause();
    setIsPlaying(false);
    mutateUpdateCurrentSong.mutate(null);
  };

  const stop = useCallback(() => {
    if (activeSong) {
      flushAccumulatedListeningTime({
        songUuid: song?.id,
        assetId: activeSong.id,
      });
    }
    audioPlayer.pause();
    setIsPlaying(false);
    setActiveSong(null);
    mutateUpdateCurrentSong.mutate(null);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSong, audioPlayer, flushAccumulatedListeningTime, song?.id]);

  const resume = async () => {
    // Ana resume: expo-audio ile
    audioPlayer.play();
    setIsPlaying(true);
    if (activeSong) {
      const songUuid = findSongUuidByAssetId(activeSong.id);
      if (songUuid) {
        mutateUpdateCurrentSong.mutate(songUuid);
      }
    }
  };

  const next = useCallback(
    async (data: Song[], useShuffle: boolean = false) => {
      if (activeSong) {
        registerSkip();
        flushAccumulatedListeningTime({
          songUuid: song?.id,
          assetId: activeSong.id,
        });
      }

      const nextPlaylist =
        useShuffle && shuffledPlaylist ? shuffledPlaylist : playlist ?? data;
      if (!nextPlaylist) return;
      const currentIndex = nextPlaylist.findIndex(
        (songItem) => songItem.id === activeSong?.id
      );
      if (currentIndex === -1) return;
      const nextIndex = currentIndex + 1;
      if (nextIndex < nextPlaylist.length) {
        setIsPlaying(true);
        const nextSong = nextPlaylist[nextIndex];
        
        // Ana çalma: expo-audio ile
        audioPlayer.replace(nextSong.uri);
        audioPlayer.play();
        setActiveSong(nextSong);
        
        const nextSongUuid = findSongUuidByAssetId(nextSong.id);
        if (nextSongUuid) {
          mutateUpdateCurrentSong.mutate(nextSongUuid);
        }
      } else if (useShuffle && shuffledPlaylist) {
        setIsPlaying(true);
        const nextSong = shuffledPlaylist[0];
        
        // Ana çalma: expo-audio ile
        audioPlayer.replace(nextSong.uri);
        audioPlayer.play();
        setActiveSong(nextSong);
        
        const nextSongUuid = findSongUuidByAssetId(nextSong.id);
        if (nextSongUuid) {
          mutateUpdateCurrentSong.mutate(nextSongUuid);
        }
      }
    },
    [
      activeSong,
      audioPlayer,
      flushAccumulatedListeningTime,
      playlist,
      registerSkip,
      shuffledPlaylist,
      song?.id,
      findSongUuidByAssetId,
      mutateUpdateCurrentSong,
    ]
  );

  const previous = useCallback(
    async (data: Song[], useShuffle: boolean = false) => {
      if (activeSong) {
        flushAccumulatedListeningTime({
          songUuid: song?.id,
          assetId: activeSong.id,
        });
      }

      const prevPlaylist =
        useShuffle && shuffledPlaylist ? shuffledPlaylist : playlist ?? data;
      if (!prevPlaylist) return;
      const currentIndex = prevPlaylist.findIndex(
        (songItem) => songItem.id === activeSong?.id
      );
      if (currentIndex === -1) return;
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0) {
        setIsPlaying(true);
        const prevSong = prevPlaylist[prevIndex];
        
        // Ana çalma: expo-audio ile
        audioPlayer.replace(prevSong.uri);
        audioPlayer.play();
        setActiveSong(prevSong);
        
        const prevSongUuid = findSongUuidByAssetId(prevSong.id);
        if (prevSongUuid) {
          mutateUpdateCurrentSong.mutate(prevSongUuid);
        }
      } else if (useShuffle && shuffledPlaylist) {
        setIsPlaying(true);
        const prevSong = shuffledPlaylist[shuffledPlaylist.length - 1];
        
        // Ana çalma: expo-audio ile
        audioPlayer.replace(prevSong.uri);
        audioPlayer.play();
        setActiveSong(prevSong);
        
        const prevSongUuid = findSongUuidByAssetId(prevSong.id);
        if (prevSongUuid) {
          mutateUpdateCurrentSong.mutate(prevSongUuid);
        }
      }
    },
    [
      activeSong,
      audioPlayer,
      flushAccumulatedListeningTime,
      playlist,
      shuffledPlaylist,
      song?.id,
      findSongUuidByAssetId,
      mutateUpdateCurrentSong,
    ]
  );

  
  useEffect(() => {
    if (!status || isSeeking) return;
    if (typeof status.currentTime === "number") {
      setPosition(status.currentTime);
    }
    if (typeof status.playing === "boolean") {
      setIsPlaying(status.playing);
    }
  }, [status, isSeeking]);

  const handleSeek = useCallback(
    (durationSeconds: number) => (value: number) => {
      if (durationSeconds <= 0 || !audioPlayer) return;
      const nextPositionSeconds = (value / 100) * durationSeconds;
      audioPlayer.seekTo(nextPositionSeconds);
      setPosition(nextPositionSeconds);
    },
    [audioPlayer]
  );

  const beginSeek = useCallback(() => {
    setIsSeeking(true);
  }, []);

  const endSeek = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const loop = useCallback(async (loopMode: "all" | "one" | "none", data: Song[], useShuffle: boolean = false) => {
    if (loopMode === "one") {
      audioPlayer.loop = true;
    } else {
      audioPlayer.loop = false;
      if (loopMode === "all" && status?.didJustFinish) {
        const loopPlaylist = useShuffle && shuffledPlaylist ? shuffledPlaylist : playlist ?? data;
        if (!loopPlaylist) return;
        const currentIndex = loopPlaylist.findIndex((song) => song.id === activeSong?.id);
        if (currentIndex === loopPlaylist.length - 1) {
          const loopSong = loopPlaylist[0];
          audioPlayer.replace(loopSong.uri);
          audioPlayer.play();
          setActiveSong(loopSong);
          const loopSongUuid = findSongUuidByAssetId(loopSong.id);
          if (loopSongUuid) {
            mutateUpdateCurrentSong.mutate(loopSongUuid);
          }
        } else {
          await next(data, useShuffle);
        }
      } else if (loopMode === "none" && status?.didJustFinish && useShuffle && shuffledPlaylist) {
        await next(data, useShuffle);
      }
    }
  }, [activeSong, shuffledPlaylist, audioPlayer, status, next, playlist, findSongUuidByAssetId, mutateUpdateCurrentSong]);
  const shuffle = useCallback((enable: boolean) => {
    const sourcePlaylist = playlist ?? [];
    if (enable && sourcePlaylist.length > 0) {
      const otherSongs = activeSong
        ? sourcePlaylist.filter((song) => song.id !== activeSong.id)
        : [...sourcePlaylist];
      const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
      const newPlaylist = activeSong ? [activeSong, ...shuffled] : shuffled;
      setShuffledPlaylist(newPlaylist);
    } else {
      setShuffledPlaylist(null);
    }
  }, [activeSong, playlist]);

  return {
    play,
    pause,
    stop,
    resume,
    activeSong,
    audioPlayer,
    next,
    previous,
    isPlaying,
    loop,
    handleSeek,
    position,
    beginSeek,
    endSeek,
    shuffle,
    playlist,
    listeningTime,
    isSongUuidLoading,
  };
}
