import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/constants/queryKeys";
import { Song } from "@/components/songs/songsService";
import {
  getSuggestedPlaylists,
  SuggestedPlaylist,
} from "@/services/RecommendationService";

export function useSuggestedPlaylists(allSongs: Song[] = []) {
  return useQuery<SuggestedPlaylist[]>({
    queryKey: queryKeys.playlists.suggestions(),
    queryFn: () => getSuggestedPlaylists(allSongs),
    enabled: Boolean(allSongs && allSongs.length > 0),
    staleTime: 5 * 60_000,
  });
}
