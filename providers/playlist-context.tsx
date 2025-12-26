import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { Song } from "@/components/songs/songsService";

type PlaylistContextValue = {
  sortedPlaylist: Song[];
  sortOption: "alphabetical" | "recent" | "duration";
  setSortedPlaylist: (playlist: Song[]) => void;
  setSortOption: (option: "alphabetical" | "recent" | "duration") => void;
};

const PlaylistContext = createContext<PlaylistContextValue | undefined>(
  undefined
);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [sortedPlaylist, setSortedPlaylist] = useState<Song[]>([]);
  const [sortOption, setSortOption] = useState<
    "alphabetical" | "recent" | "duration"
  >("recent");

  const value = useMemo(
    () => ({
      sortedPlaylist,
      sortOption,
      setSortedPlaylist,
      setSortOption,
    }),
    [sortedPlaylist, sortOption]
  );

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylistContext() {
  const context = useContext(PlaylistContext);
  if (!context) {
    throw new Error(
      "usePlaylistContext must be used within a PlaylistProvider"
    );
  }
  return context;
}

