import { supabase } from "@/lib/supabase";
import type { PlaylistType, PlaylistCreatePayload } from "@/type/PlaylistType";
import type { Song } from "@/type/SongType";
import { getUser } from "@/lib/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

type RawPlaylistSong = {
  song_id: string;
  song_duration: number | null;
};

type RawPlaylist = {
  id: number;
  name: string;
  description: string;
  is_public: boolean;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
  cover_url?: string | null;
  isPinned?: boolean;
  mood?: string[];
  gradient?: [string, string];
  playlist_songs: RawPlaylistSong[] | null;
};

const getPlaylists = async (): Promise<PlaylistType[]> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }

    const { data: playlists, error: playlistsError } = await supabase
      .from("playlists")
      .select(`
        *,
        playlist_songs (
          song_id,
          song_duration
        )
      `)
      .order("created_at", { ascending: false })
      .eq("user_id", user.id);

    if (playlistsError) {
      throw playlistsError;
    }

    if (!playlists || playlists.length === 0) {
      return [];
    }

    const rawList = playlists as unknown as RawPlaylist[];

    // Kapak görselleri için ilk 4 şarkının ID'lerini topla
    const coverSongIds = new Set<string>();
    rawList.forEach((pl) => {
      (pl.playlist_songs ?? []).slice(0, 4).forEach((ps) => {
        if (ps.song_id) coverSongIds.add(ps.song_id);
      });
    });

    const coverMap = new Map<string, string>();
    if (coverSongIds.size > 0) {
      const { data: covers } = await supabase
        .from("songs")
        .select("id, cover_url")
        .in("id", Array.from(coverSongIds))
        .eq("users_id", user.id);

      (covers ?? []).forEach((c) => {
        if (c.cover_url) coverMap.set(c.id, c.cover_url);
      });
    }

    const playlistsWithCounts: PlaylistType[] = rawList.map((playlist) => {
      const pSongs = playlist.playlist_songs ?? [];
      const songCount = pSongs.length;

      let totalDuration = 0;
      const songCoverUrls: string[] = [];

      pSongs.forEach((ps) => {
        totalDuration += Number(ps.song_duration) || 0;

        if (songCoverUrls.length < 4 && ps.song_id) {
          const cover = coverMap.get(ps.song_id);
          if (cover && typeof cover === "string" && cover.trim() !== "") {
            songCoverUrls.push(cover.trim());
          }
        }
      });

      return {
        ...playlist,
        created_at: playlist.created_at ? new Date(playlist.created_at) : undefined,
        updated_at: playlist.updated_at ? new Date(playlist.updated_at) : undefined,
        song_count: songCount,
        songCount: songCount,
        duration: totalDuration,
        cover_url: playlist.cover_url ?? "",
        cover: playlist.cover_url ?? "",
        song_cover_urls: songCoverUrls,
        isPinned: playlist.isPinned ?? false,
        mood: playlist.mood ?? playlist.tags ?? [],
        gradient: playlist.gradient ?? ["#a855f7", "#ec4899"],
      };
    });

    return playlistsWithCounts;
  } catch (error: unknown) {
    if (__DEV__) {
      const errDetails = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      console.warn("getPlaylists error:", errDetails);
    }
    return [];
  }
};

const createPlaylist = async (playlist: PlaylistCreatePayload): Promise<PlaylistType | null> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from("playlists")
      .insert({ ...playlist, user_id: user?.id })
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as PlaylistType;
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn("createPlaylist error:", error instanceof Error ? error.message : String(error));
    }
    return null;
  }
};

const updatePlaylist = async (playlist: PlaylistType): Promise<PlaylistType | null> => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from("playlists")
      .update(playlist)
      .eq("id", playlist.id)
      .eq("user_id", user?.id)
      .select()
      .single();
    if (error) {
      throw error;
    }
    return data as PlaylistType;
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn("updatePlaylist error:", error instanceof Error ? error.message : String(error));
    }
    return null;
  }
};

const deletePlaylist = async (id: number | string) => {
  try {
    const user = await getUser();
    if (!user?.id) throw new Error("Kullanıcı bulunamadı");

    // 1. Önce playlist_songs tablosundaki şarkı bağlantılarını sil
    const { error: songsError } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("playlist_id", id);

    if (songsError) {
      throw songsError;
    }

    // 2. Playlist'in kendisini sil
    const { data, error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn("deletePlaylist error:", error instanceof Error ? error.message : String(error));
    }
    return null;
  }
};

// Playlistteki bir sonraki sıra numarası (en sona eklemek için)
const getNextPosition = async (playlistId: number | string): Promise<number> => {
  const { data } = await supabase
    .from("playlist_songs")
    .select("position")
    .eq("playlist_id", playlistId)
    .order("position", { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();
  return typeof data?.position === "number" ? data.position + 1 : 0;
};

const addSongToPlaylist = async (assetId: string, playlistId: number) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return null;
    }

    // Paralel sorgular: şarkı bilgisi + duplikat kontrolü aynı anda
    const [songResult, existingResult] = await Promise.all([
      supabase
        .from("songs")
        .select("id, duration")
        .eq("id", assetId)
        .eq("users_id", user.id)
        .single(),
      supabase
        .from("playlist_songs")
        .select("id")
        .eq("song_id", assetId)
        .eq("playlist_id", playlistId)
        .maybeSingle(),
    ]);

    if (songResult.error || !songResult.data) {
      throw new Error("Şarkı bulunamadı. Lütfen önce şarkıyı senkronize edin.");
    }

    if (existingResult.data) {
      throw new Error("Bu şarkı zaten playlist'te");
    }

    const position = await getNextPosition(playlistId);

    const { data, error } = await supabase
      .from("playlist_songs")
      .insert({
        song_id: songResult.data.id,
        playlist_id: playlistId,
        song_duration: songResult.data.duration,
        position,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const getPlaylistSongs = async (playlistId: number | string): Promise<Song[]> => {
  try {
    // Validate playlistId before making the query
    if (!playlistId) {
      return [];
    }

    // UUID string kontrolü
    if (typeof playlistId === "string" && playlistId.trim() === "") {
      return [];
    }

    // Number kontrolü
    if (typeof playlistId === "number" && playlistId <= 0) {
      return [];
    }

    const user = await getUser();
    if (!user?.id) {
      return [];
    }

    // 1. Playlist şarkı sıralamasını ve song_id'leri çek
    const { data: playlistSongs, error: playlistSongsError } = await supabase
      .from("playlist_songs")
      .select("id, song_id, position, song_duration")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (playlistSongsError) {
      throw playlistSongsError;
    }

    if (!playlistSongs || playlistSongs.length === 0) {
      return [];
    }

    const songIds = playlistSongs.map((ps) => ps.song_id).filter(Boolean);
    if (songIds.length === 0) {
      return [];
    }

    // 2. composite PK (users_id, id) ile sadece bu kullanıcının şarkılarını çek
    const { data: songsData, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .in("id", songIds)
      .eq("users_id", user.id);

    if (songsError) {
      throw songsError;
    }

    const songsMap = new Map((songsData ?? []).map((s) => [s.id, s as unknown as Song]));

    const orderedSongs = playlistSongs
      .map((item) => songsMap.get(item.song_id))
      .filter((song): song is Song => song !== null && song !== undefined);

    return orderedSongs;
  } catch (error: unknown) {
    if (__DEV__) {
      const errDetails = error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? JSON.stringify(error)
          : String(error);
      console.warn("getPlaylistSongs error:", errDetails);
    }
    return [];
  }
};

const addSongToFavorites = async (songId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { success: false, message: "Kullanıcı oturumu bulunamadı" };
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      let favorites: string[] = [];
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) favorites = parsed;
      } catch {
        favorites = [];
      }

      if (!favorites.includes(songId)) {
        favorites.push(songId);
        await AsyncStorage.setItem("favorites", JSON.stringify(favorites));
      } else {
        return {
          success: false,
          message: "Bu şarkı zaten favorilerde",
        };
      }
      return {
        success: true,
        message: "Şarkı başarıyla favorilere eklendi",
      };
    }
    await AsyncStorage.setItem("favorites", JSON.stringify([songId]));
    return {
      success: true,
      message: "Şarkı başarıyla favorilere eklendi",
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes("session missing")) return { success: false, message: "" };
    return { success: false, message: "Hata" };
  }
};

const removeSongFromFavorites = async (songId: string): Promise<boolean> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return false;
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filteredFavorites = parsed.filter((id) => typeof id === "string" && id !== songId);
          await AsyncStorage.setItem("favorites", JSON.stringify(filteredFavorites));
          return true;
        }
      } catch {
        return false;
      }
    }
    return false;
  } catch {
    return false;
  }
};

const getFavorites = async (): Promise<string[]> => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    }
    return [];
  } catch {
    return [];
  }
};

const removeSongFromPlaylist = async (songId: string, playlistId: number | string): Promise<boolean> => {
  try {
    const user = await getUser();
    if (!user?.id) throw new Error("Kullanıcı bulunamadı");

    const { error } = await supabase
      .from("playlist_songs")
      .delete()
      .eq("song_id", songId)
      .eq("playlist_id", playlistId);

    if (error) throw error;
    return true;
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const reorderPlaylistSongs = async (playlistId: number | string, songIds: string[]): Promise<boolean> => {
  const user = await getUser();
  if (!user?.id) throw new Error("Kullanıcı bulunamadı");

  const { data: existingSongs, error: fetchError } = await supabase
    .from("playlist_songs")
    .select("song_id, song_duration")
    .eq("playlist_id", playlistId);

  if (fetchError) throw fetchError;

  const durationMap = new Map<string, number>(
    (existingSongs ?? []).map((s) => [s.song_id, s.song_duration])
  );

  const rows = songIds.map((songId, index) => ({
    playlist_id: playlistId,
    song_id: songId,
    song_duration: durationMap.get(songId) ?? 0,
    position: index,
  }));

  const { error } = await supabase
    .from("playlist_songs")
    .upsert(rows, { onConflict: "playlist_id,song_id" });

  if (error) throw error;
  return true;
};

const clonePlaylist = async (playlistId: number | string) => {
  try {
    const user = await getUser();
    if (!user?.id) throw new Error("Kullanıcı bulunamadı");

    // Orijinal playlist'i al
    const { data: original, error: fetchError } = await supabase
      .from("playlists")
      .select("*")
      .eq("id", playlistId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !original) throw new Error("Playlist bulunamadı");

    // Yeni playlist oluştur
    const { data: newPlaylist, error: createError } = await supabase
      .from("playlists")
      .insert({
        name: `${original.name} (Kopya)`,
        description: original.description || "",
        is_public: original.is_public || false,
        tags: original.tags || [],
        user_id: user.id,
      })
      .select()
      .single();

    if (createError || !newPlaylist) throw new Error("Playlist kopyalanamadı");

    // Orijinal şarkıları yeni playlist'e kopyala
    const { data: songs, error: songsError } = await supabase
      .from("playlist_songs")
      .select("song_id, song_duration, position")
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (!songsError && songs && songs.length > 0) {
      const inserts = songs.map((s, index: number) => ({
        song_id: s.song_id,
        playlist_id: newPlaylist.id,
        song_duration: s.song_duration,
        position: index,
      }));
      await supabase.from("playlist_songs").insert(inserts);
    }

    return newPlaylist;
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const addMultipleSongsToPlaylist = async (songIds: string[], playlistId: number) => {
  try {
    const user = await getUser();
    if (!user?.id) throw new Error("Kullanıcı bulunamadı");

    // Paralel: şarkı bilgileri + mevcut şarkı kontrolü
    const [songsResult, existingResult] = await Promise.all([
      supabase
        .from("songs")
        .select("id, duration")
        .in("id", songIds)
        .eq("users_id", user.id),
      supabase
        .from("playlist_songs")
        .select("song_id")
        .eq("playlist_id", playlistId)
        .in("song_id", songIds),
    ]);

    if (songsResult.error) throw songsResult.error;

    const existingIds = new Set(existingResult.data?.map((e) => e.song_id));
    const durationMap = new Map<string, number>();
    songsResult.data?.forEach((s) => durationMap.set(s.id, s.duration));

    const newSongIds = songIds.filter((id) => !existingIds.has(id));

    if (newSongIds.length === 0) {
      return { added: 0, skipped: songIds.length };
    }

    const startPosition = await getNextPosition(playlistId);
    const inserts = newSongIds.map((songId, index) => ({
      song_id: songId,
      playlist_id: playlistId,
      song_duration: durationMap.get(songId) ?? 0,
      position: startPosition + index,
    }));

    const { error: insertError } = await supabase
      .from("playlist_songs")
      .insert(inserts);

    if (insertError) throw insertError;
    return { added: newSongIds.length, skipped: existingIds.size };
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

const getPlaylistShareData = async (playlistId: number | string) => {
  try {
    const [playlistResult, songsResult] = await Promise.all([
      supabase.from("playlists").select("*").eq("id", playlistId).single(),
      supabase
        .from("playlist_songs")
        .select("songs(title, artist, duration)")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: true }),
    ]);

    if (playlistResult.error || !playlistResult.data)
      throw new Error("Playlist bulunamadı");

    const playlist = playlistResult.data;
    const songs = songsResult.data || [];

    const songList = songs
      .map((item, index: number) => {
        const songData = Array.isArray(item.songs) ? item.songs[0] : item.songs;
        return `${index + 1}. ${songData?.title ?? "Bilinmeyen"} - ${songData?.artist ?? "Bilinmeyen"}`;
      })
      .join("\n");

    return {
      title: playlist.name,
      text: `🎵 ${playlist.name}\n${playlist.description ? `📝 ${playlist.description}\n` : ""}\n🎶 ${songs.length} şarkı\n\n${songList}\n\n📱 BeatNova ile paylaşıldı`,
    };
  } catch (error: unknown) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};

export {
  getPlaylists,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  getPlaylistSongs,
  addSongToFavorites,
  removeSongFromFavorites,
  getFavorites,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  clonePlaylist,
  addMultipleSongsToPlaylist,
  getPlaylistShareData,
  type PlaylistCreatePayload,
};
