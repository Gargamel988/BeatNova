import { useMemo } from "react";
import { buildSmartPlaylists, SmartPlaylist, HistoryRow } from "@/services/SmartPlaylistService";
import { Song } from "@/components/songs/songsService";

export function useSmartPlaylists(
  allSongs: Song[] = [],
  history: HistoryRow[] = []
): { data: SmartPlaylist[] } {
  const data = useMemo(() => {
    return buildSmartPlaylists(history, allSongs);
  }, [allSongs, history]);

  return { data };
}
