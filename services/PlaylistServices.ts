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
const addSongToPlaylist = async (assetId: string, playlistId: number) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return null;
    }

    // Önce songs tablosundan ID ile eşleşen kaydı bul (duration'ı almak için)
    const { data: songData, error: songError } = await supabase
      .from("songs")
      .select("id, duration")
      .eq("id", assetId)
      .eq("users_id", user.id)
      .single();

    if (songError || !songData) {
      throw new Error("Şarkı bulunamadı. Lütfen önce şarkıyı senkronize edin.");
    }

    const songUuid = songData.id;

    // Şarkının zaten playlist'te olup olmadığını kontrol et
    const { data: existing } = await supabase
      .from("playlist_songs")
      .select("*")
      .eq("song_id", songUuid)
      .eq("playlist_id", playlistId)
      .single();

    if (existing) {
      throw new Error("Bu şarkı zaten playlist'te");
    }

    // Şarkıyı playlist'e ekle
    const { data, error } = await supabase
      .from("playlist_songs")
      .insert({
        song_id: songUuid,
        playlist_id: playlistId,
        song_duration: songData.duration, // Duration'ı playlist_songs'a kaydet
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
      .order("id", { ascending: true });

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
      }else {
        return{
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
};
