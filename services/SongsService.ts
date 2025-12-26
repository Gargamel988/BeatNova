import { Song } from "@/components/songs/songsService";
import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";

type SongInsertPayload = {
  asset_id: string;
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
  if (!uri || typeof uri !== 'string' || uri.trim() === '') {
    console.warn(`Şarkı URI bulunamadı, atlanıyor. Asset ID: ${asset_id}`);
    return null;
  }
  
  const fallbackTitle = metadata.title || `Şarkı-${asset_id}`;
  const normalizeDuration = (value?: number) =>
    Number.isFinite(value) ? Math.round(value as number) : 0;
  
  // coverUri'yi normalize et: undefined, null veya boş string ise null yap
  const normalizeCoverUrl = (coverUri?: string | null): string | null => {
    if (!coverUri || typeof coverUri !== 'string' || coverUri.trim() === '') {
      return null;
    }
    return coverUri.trim();
  };

  const normalizedCoverUrl = normalizeCoverUrl(metadata.coverUri);
  
  return {
    asset_id,
    audio_url: uri.trim(),
    duration: normalizeDuration(metadata.duration ?? duration),
    title: fallbackTitle,
    artist: metadata.artist || "Bilinmeyen Sanatçı",
    album: metadata.album || "Bilinmeyen Albüm",
    cover_url: normalizedCoverUrl,
    users_id: userId,
  };
};

const insertSong = async (song: Song) => {
  try {
    // Önce oturum kontrolü yap
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session) {
      console.error("Oturum hatası:", sessionError);
      throw new Error("Kullanıcı oturumu bulunamadı.");
    }

    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı.");
    }

    // users_id'nin auth.uid() ile eşleştiğinden emin ol
    const payload = sanitizeSong(song, user.id);

    // Payload null ise (URI eksik), işlemi atla
    if (!payload) {
      return null;
    }

    // RLS politikası için auth.uid() kontrolü
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser?.id !== user.id) {
      console.warn("User ID mismatch:", { authId: authUser?.id, userId: user.id });
    }

    const { data, error } = await supabase
      .from("songs")
      .upsert(payload, { onConflict: "asset_id,users_id" })
      .select()
      .single();

    if (error) {
      // RLS hatası için daha açıklayıcı mesaj
      if (error.code === "42501") {
        console.error("RLS Politikası Hatası: songs tablosuna ekleme yetkisi yok. Kullanıcı ID:", user.id);
        console.error("Payload:", payload);
      }
      throw error;
    }
    return data;
  } catch (error) {
    console.error("insertSong hatası:", error);
    return null;
  }
};

// Belirli bir cihaz şarkısı (MediaLibrary asset) için Supabase'deki şarkı UUID'sini döner
const getsongs = async (): Promise<{ id: string, asset_id: string }[] | null> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı.");
    }

    const { data, error } = await supabase
      .from("songs")
      .select("id, asset_id")
      .eq("users_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    return data as { id: string, asset_id: string }[] | null;
  } catch (error) {
    console.error("getsongs hatası:", error);
    return [];
  }
};

// Tüm şarkı detaylarını çeker (istatistikler için)
const getAllSongsWithDetails = async (): Promise<{
  id: string;
  asset_id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string | null;
}[] | null> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı.");
    }

    const { data, error } = await supabase
      .from("songs")
      .select("id, asset_id, title, artist, album, duration, cover_url")
      .eq("users_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("getAllSongsWithDetails hatası:", error);
    return [];
  }
};
export { insertSong, getsongs, getAllSongsWithDetails };