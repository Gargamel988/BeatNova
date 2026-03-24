import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { Song } from "@/components/songs/songsService";
import useAudioPlayerHook from "@/hooks/useAudioPlayer";
import { AudioPlayer } from "expo-audio";

type AudioPlayerContextValue = {
  play: (asset: Song, playlist?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  activeSong: Song | null;
  isPlaying: boolean;
  audioPlayer: AudioPlayer;
  next: (data: Song[], useShuffle?: boolean) => void;
  previous: (data: Song[], useShuffle?: boolean) => void;
  handleSeek: (durationSeconds: number) => (value: number) => void;
  position: number;
  beginSeek: () => void;
  endSeek: () => void;
  loop: (mode: "all" | "one" | "none") => void;
  shuffle: (enable: boolean) => void;
  playlist: Song[] | null;
  isLoading: boolean;
  isShuffled: boolean;
  loopMode: "all" | "one" | "none";
  stop: () => void;
  sleepTimerRemaining: number | null;
  isSleepTimerActive: boolean;
  setSleepTimer: (minutes: number | null) => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const {
    play,
    pause,
    resume,
    activeSong,
    isPlaying,
    audioPlayer,
    next,
    previous,
    handleSeek,
    position,
    beginSeek,
    endSeek,
    loop,
    shuffle,
    playlist,
    isLoading,
    isShuffled,
    loopMode,
    stop,
    sleepTimerRemaining,
    isSleepTimerActive,
    setSleepTimer,
  } = useAudioPlayerHook();

  const value = useMemo(
    () => ({
      play,
      pause,
      resume,
      isPlaying,
      activeSong,
      audioPlayer,
      next,
      previous,
      handleSeek,
      position,
      beginSeek,
      endSeek,
      loop,
      shuffle,
      playlist,
      isLoading,
      isShuffled,
      loopMode,
      stop,
      sleepTimerRemaining,
      isSleepTimerActive,
      setSleepTimer,
    }),
    [
      play,
      pause,
      resume,
      isPlaying,
      activeSong,
      audioPlayer,
      next,
      previous,
      handleSeek,
      position,
      beginSeek,
      endSeek,
      loop,
      shuffle,
      playlist,
      isLoading,
      isShuffled,
      loopMode,
      stop,
      sleepTimerRemaining,
      isSleepTimerActive,
      setSleepTimer,
    ]
  );

  return (
    <AudioPlayerContext.Provider
      value={value as unknown as AudioPlayerContextValue}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayerContext() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error(
      "useAudioPlayerContext must be used within an AudioPlayerProvider"
    );
  }
  return context;
}
