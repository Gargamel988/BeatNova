import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import useSongsService, { type Song } from "@/hooks/useSongsService";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { getGalaxyStats } from "@/services/GalaxyService";
import { buildGalaxy, type GalaxyStar, type BuildGalaxyOutput } from "@/utils/buildGalaxy";
import { queryKeys } from "@/constants/queryKeys";

export type UseGalaxyDataResult = {
  stars: GalaxyStar[];
  mergedSongs: Song[];
  isLoading: boolean;
  isError: boolean;
  galaxy: BuildGalaxyOutput;
  refetch: () => void;
};

/**
 * Cihaz şarkıları, DB detayları ve Supabase istatistiklerini paralel çeker,
 * sadece cihazda fiziken var olan şarkıları birleştirir ve Galaksi yıldız haritasını üretir.
 */
export function useGalaxyData(): UseGalaxyDataResult {
  const { loadSongs } = useSongsService();

  const [deviceSongsQuery, dbSongsQuery, galaxyStatsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.songs.all(),
        queryFn: () => loadSongs(),
      },
      {
        queryKey: queryKeys.songs.details(),
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: queryKeys.galaxy.stats(),
        queryFn: () => getGalaxyStats(),
      },
    ],
  });

  const isLoading =
    deviceSongsQuery.isLoading || dbSongsQuery.isLoading || galaxyStatsQuery.isLoading;
  const isError =
    deviceSongsQuery.isError || dbSongsQuery.isError || galaxyStatsQuery.isError;

  const deviceSongs = useMemo(() => deviceSongsQuery.data ?? [], [deviceSongsQuery.data]);
  const dbSongs = useMemo(() => dbSongsQuery.data ?? [], [dbSongsQuery.data]);
  const stats = useMemo(() => galaxyStatsQuery.data ?? [], [galaxyStatsQuery.data]);

  // Cihaz ve DB şarkılarını birleştir (Yalnızca cihazda fiziken var olan şarkılar)
  const mergedSongs = useMemo(() => {
    const dbMap = new Map((dbSongs || []).map((s) => [String(s.id), s]));

    const combined: Song[] = (deviceSongs || []).map((ds) => {
      const fromDb = dbMap.get(String(ds.id));
      return {
        ...ds,
        genre: fromDb?.genre || ds.genre || "Diğer",
        metadata: {
          ...ds.metadata,
          coverUri: fromDb?.cover_url || ds.metadata?.coverUri,
        },
      };
    });

    return combined;
  }, [deviceSongs, dbSongs]);

  // Saf fonksiyonla yıldız haritasını hesapla
  const galaxy = useMemo(() => {
    return buildGalaxy(mergedSongs, stats);
  }, [mergedSongs, stats]);

  const refetch = () => {
    deviceSongsQuery.refetch();
    dbSongsQuery.refetch();
    galaxyStatsQuery.refetch();
  };

  return {
    stars: galaxy.stars,
    mergedSongs,
    isLoading,
    isError,
    galaxy,
    refetch,
  };
}
