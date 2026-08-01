import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { Song } from "@/components/songs/songsService";
import useAudioPlayerHook from "@/hooks/useAudioPlayer";

type AudioPlayerContextValue = {
  play: (asset: Song, playlist?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  activeSong: Song | null;
  isPlaying: boolean;
  audioPlayer: any;
  next: (data: Song[], useShuffle?: boolean, isManual?: boolean) => void;
  previous: (data: Song[], useShuffle?: boolean, isManual?: boolean) => void;
  handleSeek: (durationSeconds: number) => (value: number) => void;
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

type AudioPositionContextValue = {
  position: number;
  positionShared: { value: number };
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(
  undefined
);

const AudioPositionContext = createContext<
  AudioPositionContextValue | undefined
>(undefined);

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
    positionShared,
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

  const playerValue = useMemo(
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

  const positionValue = useMemo(
    () => ({ position, positionShared }),
    [position, positionShared]
  );

  return (
    <AudioPlayerContext.Provider value={playerValue as unknown as AudioPlayerContextValue}>
      <AudioPositionContext.Provider value={positionValue}>
        {children}
      </AudioPositionContext.Provider>
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

export function useAudioPositionContext() {
  const context = useContext(AudioPositionContext);
  if (!context) {
    throw new Error(
      "useAudioPositionContext must be used within an AudioPlayerProvider"
    );
  }
  return context;
}
