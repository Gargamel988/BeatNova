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
      console.error("getPermissions error:", error);
      return { status: "undetermined", canAskAgain: true };
    }
  }, []);

  // Kullanıcıdan aktif olarak izin ister
  const requestPermissions = useCallback(async () => {
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      return status === "granted";
    } catch (error) {
      console.error("requestPermissions error:", error);
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

      const processedSongs: Song[] = media.assets.map((asset) => {
        const parsed = parseFilename(asset.filename);

        return {
          ...asset,
          metadata: {
            title: parsed.title || asset.filename.replace(/\.[^/.]+$/, ""),
            artist: parsed.artist,
            album: "Bilinmeyen Albüm",
            duration: asset.duration,
            coverUri: undefined,
          },
        };
      });

      return processedSongs;
    } catch (error) {
      console.error("loadSongs error:", error);
      return [];
    }
  };

  // Cover'ları arka planda yükle
  const loadCoversInBackground = useCallback(
    async (songsList: Song[], setSongs: Dispatch<SetStateAction<Song[]>>) => {
      // Her şarkı için sırayla cover ara (rate limit için)
      for (let i = 0; i < songsList.length; i++) {
        const song = songsList[i];
        
        // Song veya metadata yoksa atla
        if (!song || !song.metadata) {
          continue;
        }
        
        const { title = "Bilinmeyen Şarkı", artist = "Bilinmeyen Sanatçı" } = song.metadata;

        // Title veya artist yoksa atla
        if (!title || !artist || title === "Bilinmeyen Şarkı" || artist === "Bilinmeyen Sanatçı") {
          continue;
        }

        try {
          // Önce iTunes'dan dene
          let coverUrl = await fetchCoverFromiTunes(title, artist);

          // iTunes'da bulamazsa Deezer'dan dene
          if (!coverUrl) {
            coverUrl = await fetchCoverFromDeezer(title, artist);
          }

          if (coverUrl) {
            // State'i güncelle
            setSongs((prevSongs) =>
              prevSongs.map((s) =>
                s.id === song.id
                  ? { ...s, metadata: { ...s.metadata, coverUri: coverUrl } }
                  : s
              )
            );
          }

          // Rate limit için bekleme (her 5 şarkıda bir)
          if (i % 5 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        } catch (error) {
          // Hata durumunda sessizce devam et
          console.debug("Cover yükleme hatası:", error);
        }
      }
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