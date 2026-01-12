import { Song } from "@/components/songs/songsService";
import { getsongs } from "@/services/SongsService";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProfile } from "./useProfil";
import { UpsertListeningTimeMutation } from "@/mutation/statictics";

type LoopMode = "all" | "one" | "none";

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
  const [loopMode, setLoopMode] = useState<LoopMode>("none");
  const [isShuffled, setIsShuffled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const upsertListeningTime = UpsertListeningTimeMutation();

  const totalTimePlayed = useRef(0);
  const prevTime = useRef(0);

  const {
    data: songs,
  } = useQuery({
    queryKey: ["songs"],
    queryFn: () => getsongs(),
  });

  const findSongUuidByAssetId = useCallback((assetId?: string | null) => {
    if (!assetId || !songs || songs.length === 0) return undefined;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(assetId)) {
      return assetId;
    }

    const foundByAssetId = songs.find((item) => item.asset_id === assetId);
    return foundByAssetId?.id;
  }, [songs]);

  const saveListeningTime = useCallback((
    songId: string | null | undefined,
    skipCount: number = 0,
    playCount: number = 0
  ) => {
    if (!songId) return;
    
    
    const songUuid = findSongUuidByAssetId(songId);
    if (songUuid) {
      upsertListeningTime({
        listeningTime: totalTimePlayed.current,
        songId: songUuid,
        skipCount,
        playCount,
      });
    }
    totalTimePlayed.current = 0;
  }, [findSongUuidByAssetId, upsertListeningTime]);

  const compareSongIds = useCallback((id1: string | null | undefined, id2: string | null | undefined): boolean => {
    if (!id1 || !id2) return false;
    if (id1 === id2) return true;
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const id1IsUuid = uuidRegex.test(id1);
    const id2IsUuid = uuidRegex.test(id2);
    
    if (id1IsUuid === id2IsUuid) return id1 === id2;
    
    if (!songs) return false;
    
    const song1 = songs.find((s) => s.id === id1 || s.asset_id === id1);
    const song2 = songs.find((s) => s.id === id2 || s.asset_id === id2);
    
    if (!song1 || !song2) return false;
    
    return song1.id === song2.id;
  }, [songs]);

  useEffect(() => {
    if (!activeSong?.id || !status?.currentTime) return;
    
    const delta = status.currentTime - prevTime.current;
    
    if (delta > 0 && delta < 5) {
      totalTimePlayed.current += delta;
      
      // 30 saniyeye ulaştığında kaydet ve sıfırla (skipCount ve playCount 0)
      if (totalTimePlayed.current >= 30) {
        const songUuid = findSongUuidByAssetId(activeSong.id);
        if (songUuid) {
          upsertListeningTime({
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

  }, [activeSong?.id, status?.currentTime, findSongUuidByAssetId, upsertListeningTime]);
  
  useEffect(() => {
    prevTime.current = 0;
    totalTimePlayed.current = 0;
  }, [activeSong?.id]);

  useEffect(() => {
    if (!status?.didJustFinish || !activeSong?.id) return;
    
    const songUuid = findSongUuidByAssetId(activeSong.id);
    if (songUuid && totalTimePlayed.current > 0) {
      upsertListeningTime({
        listeningTime: totalTimePlayed.current,
        songId: songUuid,
        skipCount: 0,
        playCount: 0,
      });
      totalTimePlayed.current = 0;
    }
  }, [status?.didJustFinish, activeSong?.id, findSongUuidByAssetId, upsertListeningTime]);
  
  useEffect(() => {
    setAudioModeAsync({
      playsInSilentMode: true, 
      shouldPlayInBackground: true, 
      interruptionModeAndroid: "duckOthers", 
      interruptionMode: "mixWithOthers",     
    });
  }, []);

  useEffect(() => {
    if (!activeSong) {
      audioPlayer.setActiveForLockScreen(false);
      return;
    }

    if (isPlaying) {
      const metadata = {
        title: activeSong.metadata?.title || activeSong.filename || "Bilinmeyen Şarkı",
        artist: activeSong.metadata?.artist || "Bilinmeyen Sanatçı",
        album: activeSong.metadata?.album || "Bilinmeyen Albüm",
        artwork: activeSong.metadata?.coverUri || undefined,
      };
     
      audioPlayer.setActiveForLockScreen(true, metadata, {
        showSeekBackward: true,
        showSeekForward: true,
      });
    } else {
      audioPlayer.setActiveForLockScreen(false);
    }
  }, [audioPlayer, activeSong, isPlaying, playlist, shuffledPlaylist, isShuffled]);



  const isLoadingSong = useMemo(() => {
    return isLoading;
  }, [isLoading]);

  const play = async (asset: Song, playlist?: Song[]) => {
    setIsLoading(true);
    try {
      // Önceki şarkıyı kaydet (eğer varsa) - skipCount ile
      if (activeSong?.id && activeSong.id !== asset.id) {
        saveListeningTime(activeSong.id, 1, 0); // skipCount: 1
      }
      
      setActiveSong(asset);
      if (playlist) {
        setPlaylist(playlist);
      }

      audioPlayer.replace(asset.uri);
      audioPlayer.play();
      setIsPlaying(true);

      // Yeni şarkı başlatıldığında playCount kaydet
      const newSongUuid = findSongUuidByAssetId(asset.id);
      if (newSongUuid) {
        mutateUpdateCurrentSong.mutate(newSongUuid);
        // playCount için kayıt yap (listeningTime 0 olsa bile)
        upsertListeningTime({
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
    // Pause'a basıldığında kayıt yap (skipCount ve playCount 0)
    if (activeSong?.id) {
      saveListeningTime(activeSong.id, 0, 0);
    }
    
    audioPlayer.pause();
    setIsPlaying(false);
    mutateUpdateCurrentSong.mutate(null);
  }, [audioPlayer, activeSong?.id, saveListeningTime, mutateUpdateCurrentSong]);

  const stop = useCallback(() => {
    // Stop'a basıldığında kayıt yap (skipCount ve playCount 0)
    if (activeSong?.id) {
      saveListeningTime(activeSong.id, 0, 0);
    }
    
    audioPlayer.pause();
    setIsPlaying(false);
    setActiveSong(null);
    mutateUpdateCurrentSong.mutate(null);
  }, [audioPlayer, activeSong?.id, saveListeningTime, mutateUpdateCurrentSong]);

  const resume = useCallback(async () => {
    audioPlayer.play();
    setIsPlaying(true);
    if (activeSong) {
      const songUuid = findSongUuidByAssetId(activeSong.id);
      if (songUuid) {
        mutateUpdateCurrentSong.mutate(songUuid);
      }
    }
  }, [audioPlayer, activeSong, findSongUuidByAssetId, mutateUpdateCurrentSong]);

  const next = useCallback(
     (data: Song[], useShuffle: boolean = false) => {
      setIsLoading(true);
      try {
        // Önceki şarkıyı kaydet - skipCount ile
        if (activeSong?.id) {
          saveListeningTime(activeSong.id, 1, 0); // skipCount: 1
        }
        
        const nextPlaylist =
          useShuffle && shuffledPlaylist ? shuffledPlaylist : playlist ?? data;
        if (!nextPlaylist) return;
        const currentIndex = nextPlaylist.findIndex(
          (songItem) => compareSongIds(songItem.id, activeSong?.id)
        );
        if (currentIndex === -1) return;
        const nextIndex = currentIndex + 1;
        if (nextIndex < nextPlaylist.length) {
          const nextSong = nextPlaylist[nextIndex];
          setActiveSong(nextSong);
          
          audioPlayer.replace(nextSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          const nextSongUuid = findSongUuidByAssetId(nextSong.id);
          if (nextSongUuid) {
            mutateUpdateCurrentSong.mutate(nextSongUuid);
          }
        } else if (useShuffle && shuffledPlaylist) {
          const nextSong = shuffledPlaylist[0];
          setActiveSong(nextSong);
          
          audioPlayer.replace(nextSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          const nextSongUuid = findSongUuidByAssetId(nextSong.id);
          if (nextSongUuid) {
            mutateUpdateCurrentSong.mutate(nextSongUuid);
          }
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
      mutateUpdateCurrentSong,
      compareSongIds,
      saveListeningTime,
    ]
  );



  const previous = useCallback(
    (data: Song[], useShuffle: boolean = false) => {
      setIsLoading(true);
      try {
        // Önceki şarkıyı kaydet - skipCount ile
        if (activeSong?.id) {
          saveListeningTime(activeSong.id, 1, 0); // skipCount: 1
        }
        
        const prevPlaylist =
          useShuffle && shuffledPlaylist ? shuffledPlaylist : playlist ?? data;
        if (!prevPlaylist) return;
        const currentIndex = prevPlaylist.findIndex(
          (songItem) => compareSongIds(songItem.id, activeSong?.id)
        );
        if (currentIndex === -1) return;
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          const prevSong = prevPlaylist[prevIndex];
          setActiveSong(prevSong);
          
          audioPlayer.replace(prevSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          const prevSongUuid = findSongUuidByAssetId(prevSong.id);
          if (prevSongUuid) {
            mutateUpdateCurrentSong.mutate(prevSongUuid);
          }
        } else if (useShuffle && shuffledPlaylist) {
          const prevSong = shuffledPlaylist[shuffledPlaylist.length - 1];
          setActiveSong(prevSong);
          
          audioPlayer.replace(prevSong.uri);
          audioPlayer.play();
          setIsPlaying(true);

          const prevSongUuid = findSongUuidByAssetId(prevSong.id);
          if (prevSongUuid) {
            mutateUpdateCurrentSong.mutate(prevSongUuid);
          }
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
      mutateUpdateCurrentSong,
      compareSongIds,
      saveListeningTime,
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

  useEffect(() => {
    if (!status?.didJustFinish || !activeSong) return;

    const currentPlaylist = isShuffled && shuffledPlaylist ? shuffledPlaylist : playlist;
    if (!currentPlaylist || currentPlaylist.length === 0) return;

    if (loopMode === "one") {
      return;
    } else if (loopMode === "all") {
      const currentIndex = currentPlaylist.findIndex(
        (song) => compareSongIds(song.id, activeSong.id)
      );
      
      if (currentIndex === currentPlaylist.length - 1) {
        const loopSong = currentPlaylist[0];
        setActiveSong(loopSong);
        audioPlayer.replace(loopSong.uri);
        audioPlayer.play();
        setIsPlaying(true);
        const loopSongUuid = findSongUuidByAssetId(loopSong.id);
        if (loopSongUuid) {
          mutateUpdateCurrentSong.mutate(loopSongUuid);
        }
      } else {
        next(currentPlaylist, isShuffled);
      }
    } else {
      if (isShuffled && shuffledPlaylist) {
        next(currentPlaylist, isShuffled);
      }
    }
  }, [status?.didJustFinish, loopMode, activeSong, isShuffled, shuffledPlaylist, playlist, audioPlayer, next, pause, compareSongIds, findSongUuidByAssetId, mutateUpdateCurrentSong]);

  const updateLoopMode = useCallback((mode: LoopMode) => {
    setLoopMode(mode);
    if (mode === "one") {
      audioPlayer.loop = true;
    } else {
      audioPlayer.loop = false;
    }
  }, [audioPlayer]);
  
  const shuffle = useCallback(
    (enable: boolean) => {
      setIsShuffled(enable);
      const sourcePlaylist = playlist ?? [];
      if (enable && sourcePlaylist.length > 0) {
        const otherSongs = activeSong
          ? sourcePlaylist.filter((song) => !compareSongIds(song.id, activeSong.id))
          : [...sourcePlaylist];
        const shuffled = [...otherSongs].sort(() => Math.random() - 0.5);
        const newPlaylist = activeSong ? [activeSong, ...shuffled] : shuffled;
        setShuffledPlaylist(newPlaylist);
      } else {
        setShuffledPlaylist(null);
      }
    },
    [activeSong, playlist, compareSongIds]
  );

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
    loop: updateLoopMode,
    loopMode,
    handleSeek,
    position,
    beginSeek,
    endSeek,
    shuffle,
    isShuffled,
    playlist,
    isLoading: isLoadingSong,
  };
}
