import React, { useEffect, useMemo, useState } from "react";
import MiniPlayer from "@/components/MiniPlayer";
import { useAudioPlayerContext } from "@/providers/player-context";
import { usePlaylistContext } from "@/providers/playlist-context";
import useSongsService, { Song } from "./songs/songsService";
import { useQuery } from "@tanstack/react-query";

export default function GlobalMiniPlayer({ bottomOffset }: { bottomOffset?: number } = {}) { 
  const {
    activeSong,
    pause,
    isPlaying,
    resume,
    next,
    previous,
  } = useAudioPlayerContext();
  const { sortedPlaylist } = usePlaylistContext();
  const [songsWithCovers, setSongs] = useState<Song[]>([]);
  const { loadSongs, loadCoversInBackground } = useSongsService();
  const { data } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: loadSongs,
  });
  const songsData = useMemo(() => data ?? [], [data]);

  useEffect(() => {
    if (songsData.length) {
      setSongs(songsData);
      loadCoversInBackground(songsData, setSongs);
    }
  }, [songsData, loadCoversInBackground]);

  const playlist = sortedPlaylist.length > 0 
    ? sortedPlaylist 
    : (songsWithCovers.length ? songsWithCovers : songsData);

  const hydratedActiveSong = useMemo(() => {
    if (!activeSong) return undefined;
    return playlist.find((song) => song.id === activeSong.id) ?? activeSong;
  }, [playlist, activeSong]);

  if (!activeSong) {
    return null;
  }

  return (
    <MiniPlayer
      coverUri={hydratedActiveSong?.metadata.coverUri ?? activeSong.metadata.coverUri}
      title={hydratedActiveSong?.metadata.title ?? activeSong.metadata.title}
      artist={hydratedActiveSong?.metadata.artist ?? activeSong.metadata.artist}
      isPlaying={isPlaying}
      resumeSound={resume}
      stopSound={() => pause()}
      nextSound={() => next(playlist, false)}
      previousSound={() => previous(playlist, false)}
      activeSong={activeSong}
      bottomOffset={bottomOffset}
    />
  );
}

