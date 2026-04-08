import { useCallback, Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as MediaLibrary from "expo-media-library";
import type { Asset } from "expo-media-library";

export interface SongMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUri?: string;
  genre?: string;
  mood?: string[];
  energyLevel?: "low" | "medium" | "high";
}

export interface Song extends Asset {
  metadata: SongMetadata;
  genre?: string;
  mood?: string[];
  energy_level?: string;
}

export default function useSongsService() {
  const queryClient = useQueryClient();

  // Sessizce izin durumunu kontrol eder
  const getPermissions = useCallback(async () => {
    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      return { status, canAskAgain };
    } catch (error) {
      return { status: "undetermined", canAskAgain: true };
    }
  }, []);

  // Kullanıcıdan aktif olarak izin ister
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      return false;
    }
  }, []);

  const fetchCoverFromiTunes = useCallback(
    async (title: string, artist: string): Promise<string | null> => {
      try {
        const query = encodeURIComponent(`${artist} ${title}`);

        const data = await queryClient.fetchQuery({
          queryKey: ["itunes-cover", title, artist],
          queryFn: () =>
            fetch(
              `https://itunes.apple.com/search?term=${query}&media=music&limit=1`
            ).then((res) => res.json()),
        });

        return (
          data.results[0].artworkUrl100?.replace("100x100", "600x600") || null
        );
      } catch {
        return null;
      }
    },
    [queryClient]
  );

  // Deezer API ile cover ara (alternatif)
  const fetchCoverFromDeezer = useCallback(
    async (title: string, artist: string): Promise<string | null> => {
      try {
        const query = encodeURIComponent(`${artist} ${title}`);
        const data = await queryClient.fetchQuery({
          queryKey: ["deezer-cover", title, artist],
          queryFn: () =>
            fetch(`https://api.deezer.com/search?q=${query}&limit=1`).then(
              (res) => res.json()
            ),
        });
        return (
          data.data[0].album?.cover_xl || data.data[0].album?.cover_big || null
        );
      } catch {
        return null;
      }
    },
    [queryClient]
  );

  // Dosya adından metadata çıkar
  const parseFilename = (
    filename: string
  ): { title: string; artist: string } => {
    if (!filename)
      return { title: "Bilinmeyen Şarkı", artist: "Bilinmeyen Sanatçı" };

    let name = filename.replace(/\.(mp3|m4a|flac|wav|aac|ogg)$/i, "");

    name = name
      .replace(/\([^)]+\)/g, "")
      .replace(/\[[^\]]+\]/g, "")
      .replace(/Official\s+(Music\s+)?Video/gi, "")
      .replace(/Audio\s+Only/gi, "")
      .replace(/Lyrics?/gi, "")
      .replace(/HD|4K|1080p|720p/gi, "")
      .replace(/_/g, " ")
      .trim();

    const separators = [" - ", " – ", " — ", "-"];
    for (const sep of separators) {
      if (name.includes(sep)) {
        const parts = name.split(sep);
        if (parts.length >= 2) {
          return {
            artist: parts[0].trim(),
            title: parts.slice(1).join(sep).trim(),
          };
        }
      }
    }

    return { title: name, artist: "Bilinmeyen Sanatçı" };
  };

  const loadSongs = async (): Promise<Song[]> => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();
      
      // Eğer izin yoksa sessizce boş dön
      if (status !== "granted") {
        return [];
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const processedSongs: Song[] = await Promise.all(
        media.assets.map(async (asset) => {
          const parsed = parseFilename(asset.filename);
          let uri = asset.uri;

          // Eğer URI eksik veya boşsa, detaylı bilgi almayı dene
          if (!uri || uri.trim() === "") {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
              uri = assetInfo.localUri || assetInfo.uri || uri;
            } catch (e) {
            }
          }

          return {
            ...asset,
            asset_id: asset.id,
            uri,
            metadata: {
              title: parsed.title || asset.filename.replace(/\.[^/.]+$/, ""),
              artist: parsed.artist,
              album: "Bilinmeyen Albüm",
              duration: asset.duration,
              coverUri: undefined,
            },
          };
        })
      );

      return processedSongs;
    } catch (error) {
      return [];
    }
  };

  // Cover'ları arka planda yükle
  const loadCoversInBackground = useCallback(
    async (songsList: Song[], setSongs: Dispatch<SetStateAction<Song[]>>) => {
      let pendingUpdates: Record<string, string> = {};
      let lastUpdateTime = Date.now();
      const BATCH_SIZE = 5;
      const BATCH_INTERVAL = 2000; // 2 seconds between updates

      const applyPendingUpdates = () => {
        if (Object.keys(pendingUpdates).length === 0) return;

        const updates = { ...pendingUpdates };
        pendingUpdates = {};
        lastUpdateTime = Date.now();

        setSongs((prevSongs) =>
          prevSongs.map((s) => {
            const newCover = updates[s.id];
            return newCover
              ? { ...s, metadata: { ...s.metadata, coverUri: newCover } }
              : s;
          })
        );
      };

      for (let i = 0; i < songsList.length; i++) {
        const song = songsList[i];
        if (!song?.metadata) continue;

        const { title, artist } = song.metadata;
        if (!title || !artist || title === "Bilinmeyen Şarkı" || artist === "Bilinmeyen Sanatçı") {
          continue;
        }

        try {
          // Pre-check if it already has a cover to avoid redundant fetching
          if (song.metadata.coverUri) continue;

          let coverUrl = await fetchCoverFromiTunes(title, artist);
          if (!coverUrl) {
            coverUrl = await fetchCoverFromDeezer(title, artist);
          }

          if (coverUrl) {
            pendingUpdates[song.id] = coverUrl;

            const now = Date.now();
            const shouldUpdate =
              Object.keys(pendingUpdates).length >= BATCH_SIZE ||
              (now - lastUpdateTime >= BATCH_INTERVAL &&
                Object.keys(pendingUpdates).length > 0);

            if (shouldUpdate) {
              applyPendingUpdates();
            }
          }

          // Rate limit / polite delay
          if (i % 3 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch (error) {
        }
      }

      // Final update for remaining items
      applyPendingUpdates();
    },
    [fetchCoverFromDeezer, fetchCoverFromiTunes]
  );


  return {
    getPermissions,
    requestPermissions,
    fetchCoverFromiTunes,
    fetchCoverFromDeezer,
    parseFilename,
    loadSongs,
    loadCoversInBackground,
  };
}