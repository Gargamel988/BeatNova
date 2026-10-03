import { supabase } from "@/lib/supabase";
import { PlaylistType, PlaylistCreatePayload } from "@/type/PlaylistType";
import { getUser } from "@/lib/user";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getPlaylists = async () => {
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
          song_duration,
          songs (
            cover_url,
            duration
          )
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

    // Tek sorguda gelen verileri yerel olarak (istemcide) işle (N+1 sorununu çözer)
    const playlistsWithCounts = playlists.map((playlist: any) => {
      const pSongs = playlist.playlist_songs || [];
      const songCount = pSongs.length;

      let totalDuration = 0;
      const songCoverUrls: string[] = [];

      pSongs.forEach((ps: any, index: number) => {
        // Süre hesaplama
        let duration = ps.song_duration;
        if (duration == null) {
          const songsObj = Array.isArray(ps.songs) ? ps.songs[0] : ps.songs;
          duration = songsObj?.duration || 0;
        }
        totalDuration += Number(duration) || 0;

        // İlk 4 şarkının kapak resmini al
        if (songCoverUrls.length < 4) {
          const songsObj = Array.isArray(ps.songs) ? ps.songs[0] : ps.songs;
          const coverUrl = songsObj?.cover_url;
          if (coverUrl && typeof coverUrl === "string" && coverUrl.trim() !== "") {
            songCoverUrls.push(coverUrl.trim());
          }
        }
      });

      return {
        ...playlist,
        song_count: songCount,
        songCount: songCount,
        duration: totalDuration,
        cover_url: playlist.cover_url || "",
        cover: playlist.cover_url || "",
        song_cover_urls: songCoverUrls,
        isPinned: playlist.isPinned || false,
        mood: playlist.mood || playlist.tags || [],
        gradient: playlist.gradient || ["#a855f7", "#ec4899"],
        playlist_songs: [],
      };
    });

    return playlistsWithCounts;
  } catch (error) {
    return [];
  }
};
const createPlaylist = async (playlist: PlaylistCreatePayload) => {
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
    return data;
  } catch (error) {
    console.error(error);
    return null;
  }
};
const updatePlaylist = async (playlist: PlaylistType) => {
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
    return data;
  } catch (error) {
    console.error(error);
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
  } catch (error) {
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
  } catch (error: any) {
    throw error;
  }
};
const getPlaylistSongs = async (playlistId: number | string) => {
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

    // Tek sorguda playlist şarkılarını ve song detaylarını getir
    const { data: playlistSongs, error: playlistSongsError } = await supabase
      .from("playlist_songs")
      .select(`
        id,
        songs (*)
      `)
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (playlistSongsError) {
      throw playlistSongsError;
    }

    if (!playlistSongs || playlistSongs.length === 0) {
      return [];
    }

    // Gelen veriden songs objelerini çıkart
    const orderedSongs = playlistSongs
      .map((item: any) => {
        const songObj = Array.isArray(item.songs) ? item.songs[0] : item.songs;
        return songObj;
      })
      .filter((song: any) => song !== null && song !== undefined);

    return orderedSongs;
  } catch {
    return [];
  }
};
const addSongToFavorites = async (songId: string) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return { success: false, message: "Kullanıcı oturumu bulunamadı" };
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      const favorites = JSON.parse(saved);
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
    return {
      success: true,
      message: "Şarkı başarıyla favorilere eklendi",
    };
  } catch (error: any) {
    if (error?.message?.includes("session missing")) return { success: false, message: "" };
    return { success: false, message: "Hata" };
  }
};
const removeSongFromFavorites = async (songId: string) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return false;
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      const favorites = JSON.parse(saved);
      const filteredFavorites = favorites.filter((id: string) => id !== songId);
      await AsyncStorage.setItem(
        "favorites",
        JSON.stringify(filteredFavorites)
      );
      return true;
    }
    return false;
  } catch (error: any) {
    return false;
  }
};

const getFavorites = async () => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error: any) {
    return [];
  }
};
const removeSongFromPlaylist = async (songId: string, playlistId: number | string) => {
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
  } catch (error: any) {
    throw error;
  }
};

const reorderPlaylistSongs = async (playlistId: number | string, songIds: string[]) => {
  const user = await getUser();
  if (!user?.id) throw new Error("Kullanıcı bulunamadı");

  const { data: existingSongs, error: fetchError } = await supabase
    .from("playlist_songs")
    .select("song_id, song_duration")
    .eq("playlist_id", playlistId);

  if (fetchError) throw fetchError;

  const durationMap = new Map<string, number>(
    (existingSongs ?? []).map((s: any) => [s.song_id, s.song_duration])
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
      const inserts = songs.map((s: any, index: number) => ({
        song_id: s.song_id,
        playlist_id: newPlaylist.id,
        song_duration: s.song_duration,
        position: index,
      }));
      await supabase.from("playlist_songs").insert(inserts);
    }

    return newPlaylist;
  } catch (error: any) {
    throw error;
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

    const existingIds = new Set(existingResult.data?.map((e: any) => e.song_id));
    const durationMap = new Map<string, number>();
    songsResult.data?.forEach((s: any) => durationMap.set(s.id, s.duration));

    const newSongIds = songIds.filter((id) => !existingIds.has(id));

    if (newSongIds.length === 0) {
      return { added: 0, skipped: songIds.length };
    }

    const startPosition = await getNextPosition(playlistId);
    const inserts = newSongIds.map((songId, index) => ({
      song_id: songId,
      playlist_id: playlistId,
      song_duration: durationMap.get(songId) || 0,
      position: startPosition + index,
    }));

    const { error: insertError } = await supabase
      .from("playlist_songs")
      .insert(inserts);

    if (insertError) throw insertError;
    return { added: newSongIds.length, skipped: existingIds.size };
  } catch (error: any) {
    throw error;
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
      .map((item: any, index: number) => {
        const song = Array.isArray(item.songs) ? item.songs[0] : item.songs;
        return `${index + 1}. ${song?.title || "Bilinmeyen"} - ${song?.artist || "Bilinmeyen"}`;
      })
      .join("\n");

    return {
      title: playlist.name,
      text: `🎵 ${playlist.name}\n${playlist.description ? `📝 ${playlist.description}\n` : ""}\n🎶 ${songs.length} şarkı\n\n${songList}\n\n📱 BeatNova ile paylaşıldı`,
    };
  } catch (error: any) {
    throw error;
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
};
