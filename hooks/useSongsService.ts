import { useCallback, Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import * as MediaLibrary from "expo-media-library";
import type { Asset } from "expo-media-library";
import { parseFilename, extractYoutubeId } from "@/utils/audioMetadata";
import { queryKeys } from "@/constants/queryKeys";

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
  asset_id?: string;
  metadata: SongMetadata;
  genre?: string;
  mood?: string[];
  energy_level?: string;
}

export default function useSongsService() {
  const queryClient = useQueryClient();

  const getPermissions = useCallback(async () => {
    try {
      const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
      return { status, canAskAgain };
    } catch {
      return { status: "undetermined", canAskAgain: true };
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === "granted";
    } catch {
      return false;
    }
  }, []);

  const fetchCoverFromiTunes = useCallback(
    async (title: string, artist: string): Promise<string | null> => {
      try {
        const query = encodeURIComponent(`${artist} ${title}`);

        const data = await queryClient.fetchQuery({
          queryKey: queryKeys.songs.itunesCover(title, artist),
          queryFn: () =>
            fetch(
              `https://itunes.apple.com/search?term=${query}&media=music&limit=1`
            ).then((res) => res.json()),
        });

        return (
          data.results?.[0]?.artworkUrl100?.replace("100x100", "600x600") || null
        );
      } catch {
        return null;
      }
    },
    [queryClient]
  );

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
          data.data?.[0]?.album?.cover_xl || data.data?.[0]?.album?.cover_big || null
        );
      } catch {
        return null;
      }
    },
    [queryClient]
  );

function isRingtoneOrSystemAsset(filename?: string, uri?: string): boolean {
  const name = (filename || "").toLowerCase();
  const path = (uri || "").toLowerCase();

  return (
    name.includes("_ringtone") ||
    name.includes("beatnova_ringtone") ||
    name.startsWith("ringtone_") ||
    name.startsWith("alarm_") ||
    name.startsWith("notification_") ||
    path.includes("/ringtones/") ||
    path.includes("/notifications/") ||
    path.includes("/alarms/") ||
    path.includes("beatnova_ringtone") ||
    path.includes("beatnova%20ringtones") ||
    path.includes("beatnova ringtones")
  );
}

  const loadSongs = async (): Promise<Song[]> => {
    try {
      const { status } = await MediaLibrary.getPermissionsAsync();

      if (status !== "granted") {
        return [];
      }

      const media = await MediaLibrary.getAssetsAsync({
        mediaType: MediaLibrary.MediaType.audio,
        first: 1000,
        sortBy: MediaLibrary.SortBy.creationTime,
      });

      const rawSongs = await Promise.all<Song | null>(
        media.assets.map(async (asset): Promise<Song | null> => {
          // 1. Dosya adından ve mevcut URI'den kontrol et
          if (isRingtoneOrSystemAsset(asset.filename, asset.uri)) {
            return null;
          }

          const parsed = parseFilename(asset.filename);
          let uri = asset.uri;

          if (!uri || uri.trim() === "") {
            try {
              const assetInfo = await MediaLibrary.getAssetInfoAsync(asset.id);
              uri = assetInfo.localUri || assetInfo.uri || uri;
            } catch (e) {
              console.error("Asset info error:", e);
            }
          }

          // 2. Çözümlenmiş yerel dizin yolundan da kontrol et
          if (isRingtoneOrSystemAsset(asset.filename, uri)) {
            return null;
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

      const processedSongs: Song[] = rawSongs.filter(
        (song): song is Song => song !== null
      );

      return processedSongs;
    } catch {
      return [];
    }
  };

  const loadCoversInBackground = useCallback(
    async (songsList: Song[], setSongs: Dispatch<SetStateAction<Song[]>>) => {
      let pendingUpdates: Record<string, string> = {};
      let lastUpdateTime = Date.now();
      const BATCH_SIZE = 5;
      const BATCH_INTERVAL = 2000;

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
        const isUnknown =
          !title ||
          !artist ||
          title === "Bilinmeyen Şarkı" ||
          artist === "Bilinmeyen Sanatçı";

        try {
          if (song.metadata.coverUri) continue;

          const youtubeId = extractYoutubeId(song.filename);
          let coverUrl = youtubeId
            ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`
            : null;

          if (!coverUrl && !isUnknown) {
            coverUrl = await fetchCoverFromiTunes(title, artist);
            if (!coverUrl) {
              coverUrl = await fetchCoverFromDeezer(title, artist);
            }
          }

          if (!coverUrl && isUnknown) {
            continue;
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

          if (i % 3 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 300));
          }
        } catch {}
      }

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
