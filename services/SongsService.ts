import { Song } from "@/components/songs/songsService";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";

type SongInsertPayload = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string | null;
  audio_url: string;
  users_id: string;
};

const sanitizeSong = (song: Song, userId: string): SongInsertPayload | null => {
  const {
    id: asset_id,
    duration,
    uri,
    metadata = {
      title: "Bilinmeyen Şarkı",
      artist: "Bilinmeyen Sanatçı",
      album: "Bilinmeyen Albüm",
      duration: song.duration ?? 0,
      coverUri: undefined,
    },
  } = song;

  // audio_url zorunlu, null veya undefined ise null döndür
  if (!uri || typeof uri !== "string" || uri.trim() === "") {
    return null;
  }

  const fallbackTitle = metadata.title || `Şarkı-${asset_id}`;
  const normalizeDuration = (value?: number) =>
    Number.isFinite(value) ? Math.round(value as number) : 0;

  // coverUri'yi normalize et: undefined, null veya boş string ise null yap
  const normalizeCoverUrl = (coverUri?: string | null): string | null => {
    if (!coverUri || typeof coverUri !== "string" || coverUri.trim() === "") {
      return null;
    }
    return coverUri.trim();
  };

  const normalizedCoverUrl = normalizeCoverUrl(metadata.coverUri);

  return {
    id: asset_id, // Map device asset_id to our DB primary key
    audio_url: uri.trim(),
    duration: normalizeDuration(metadata.duration ?? duration),
    title: fallbackTitle,
    artist: metadata.artist || "Bilinmeyen Sanatçı",
    album: metadata.album || "Bilinmeyen Albüm",
    cover_url: normalizedCoverUrl,
    users_id: userId,
  };
};

const insertSongsBatch = async (songs: Song[]) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return null;
    }

    const payloads = songs
      .map((song) => sanitizeSong(song, user.id))
      .filter((payload) => payload !== null);

    if (payloads.length === 0) {
      return null;
    }

    // Supabase can batch upsert arrays
    const { data, error } = await supabase
      .from("songs")
      .upsert(payloads, { onConflict: "id" })
      .select();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

const insertSong = async (song: Song) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return null;
    }

    const payload = sanitizeSong(song, user.id);
    if (!payload) {
      return null;
    }

    const { data, error } = await supabase
      .from("songs")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    return null;
  }
};

// Belirli bir cihaz şarkısı (MediaLibrary asset) için Supabase'deki şarkı UUID'sini döner
const getsongs = async (): Promise<
  { id: string }[] | null
> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from("songs")
      .select("id")
      .eq("users_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    return data as { id: string }[] | null;
  } catch (error) {
    return [];
  }
};

// Tüm şarkı detaylarını çeker (istatistikler için)
const getAllSongsWithDetails = async (): Promise<
  | {
      id: string;
      title: string;
      artist: string;
      album: string;
      duration: number;
      cover_url: string | null;
      genre: string | null;
      mood: string[] | null;
      energy_level: string | null;
    }[]
  | null
> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }

    const { data, error } = await supabase
      .from("songs")
      .select(
        "id, title, artist, album, duration, cover_url, genre, mood, energy_level",
      )
      .eq("users_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    return [];
  }
};

// AI tarafından sınıflandırılan metadata'yı günceller
const updateSongsMetadata = async (
  results: { id: string; genre: string; energyLevel: string; mood: string[] }[],
) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return false;
    }

    // Her sonuç için veritabanını güncelle
    const updates = results.map(async (result) => {
      const { error } = await supabase
        .from("songs")
        .update({
          genre: result.genre,
          energy_level: result.energyLevel,
          mood: result.mood,
        })
        .eq("id", result.id)
        .eq("users_id", user.id);

      if (error) {
      }
    });

    await Promise.all(updates);
    return true;
  } catch (error) {
    return false;
  }
};

// Şarkıyı veritabanından siler (id'ye göre)
const deleteSong = async (assetId: string): Promise<boolean> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return false;
    }

    // Since ID is now the device's asset_id, we can delete directly
    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", assetId)
      .eq("users_id", user.id);

    if (deleteError) {
      throw deleteError;
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export {
  insertSong,
  insertSongsBatch,
  getsongs,
  getAllSongsWithDetails,
  deleteSong,
  updateSongsMetadata,
};
