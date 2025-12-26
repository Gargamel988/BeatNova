












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
	next: (data: Song[], useShuffle?: boolean) => Promise<void>;
	previous: (data: Song[], useShuffle?: boolean) => Promise<void>;
	handleSeek: (durationSeconds: number) => (value: number) => void;
	position: number;
	beginSeek: () => void;
	endSeek: () => void;
	loop: (loop: "all" | "one" | "none", data: Song[], useShuffle?: boolean) => Promise<void>;
	shuffle: (enable: boolean) => void;
	playlist: Song[] | null;
	listeningTime: number;
	isSongUuidLoading: boolean;
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
	  listeningTime,
	  isSongUuidLoading,
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
		listeningTime,
		isSongUuidLoading,
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
		listeningTime,
		isSongUuidLoading,
	  ]
	);
  
	return (
	  <AudioPlayerContext.Provider value={value}>
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




