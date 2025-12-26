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
      .select("*")
      .order("created_at", { ascending: false })
      .eq("user_id", user.id);

    if (playlistsError) {
      throw playlistsError;
    }

    if (!playlists || playlists.length === 0) {
      return [];
    }

    // Her playlist için şarkı sayısını ve toplam süreyi al
    const playlistsWithCounts = await Promise.all(
      playlists.map(async (playlist) => {
        // Şarkı sayısını al
        const { count, error: countError } = await supabase
          .from("playlist_songs")
          .select("*", { count: "exact", head: true })
          .eq("playlist_id", playlist.id);

        const songCount = countError ? 0 : count || 0;

        // Duration'ları al ve ilk 4 şarkının cover_url'lerini al
        let totalDuration = 0;
        let songCoverUrls: string[] = [];

        if (songCount > 0) {
          // İlk 4 şarkıyı al (cover_url için)
          const { data: firstPlaylistSongs, error: firstSongError } =
            await supabase
              .from("playlist_songs")
              .select("song_id, songs(cover_url)")
              .eq("playlist_id", playlist.id)
              .order("id", { ascending: true })
              .limit(4);

          if (
            !firstSongError &&
            firstPlaylistSongs &&
            firstPlaylistSongs.length > 0
          ) {
            songCoverUrls = firstPlaylistSongs
              .map((item: any) => {
                // songs bir array olabilir veya tek obje olabilir
                let songsData = item.songs;

                // Eğer array ise ilk elemanı al
                if (Array.isArray(songsData) && songsData.length > 0) {
                  songsData = songsData[0];
                }

                if (
                  songsData &&
                  typeof songsData === "object" &&
                  songsData !== null
                ) {
                  const coverUrl = songsData.cover_url;
                  if (
                    coverUrl &&
                    typeof coverUrl === "string" &&
                    coverUrl.trim() !== ""
                  ) {
                    return coverUrl;
                  }
                }
                return null;
              })
              .filter((url): url is string => url !== null);
          }

          // Tüm şarkıların duration'larını topla
          const { data: playlistSongs, error: durationError } = await supabase
            .from("playlist_songs")
            .select("song_duration, songs(duration)")
            .eq("playlist_id", playlist.id);

          if (!durationError && playlistSongs && playlistSongs.length > 0) {
            totalDuration = playlistSongs.reduce((acc, item) => {
              // Önce song_duration alanını kontrol et, yoksa songs.duration kullan
              const duration =
                item.song_duration ??
                (typeof item.songs === "object" &&
                item.songs !== null &&
                "duration" in item.songs
                  ? (item.songs as any).duration
                  : 0);
              return acc + (Number(duration) || 0);
            }, 0);
          }
        }

        // PlaylistListItem'ın beklediği formata dönüştür
        return {
          ...playlist,
          song_count: songCount,
          songCount: songCount, // PlaylistListItem için
          duration: totalDuration, // Toplam süre (saniye cinsinden)
          cover_url: (playlist as any).cover_url || "", // Playlist'teki cover_url
          cover: (playlist as any).cover_url || "", // PinnedPlaylistCard için
          song_cover_urls: songCoverUrls, // İlk 4 şarkının cover_url'leri
          isPinned: (playlist as any).isPinned || false, // Eğer yoksa false
          mood: (playlist as any).mood || playlist.tags || [], // İlk tag'i mood olarak kullan
          gradient: (playlist as any).gradient || ["#a855f7", "#ec4899"] as [string, string], // PinnedPlaylistCard için fallback gradient
          playlist_songs: [], // Boş array
        };
      })
    );

    return playlistsWithCounts;
  } catch (error) {
    console.error("getPlaylists hatası:", error);
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
const deletePlaylist = async (id: number) => {
  try {
    const user = await getUser();
    const { data, error } = await supabase
      .from("playlists")
      .delete()
      .eq("id", id)
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
const addSongToPlaylist = async (assetId: string, playlistId: number) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
    }

    // Önce songs tablosundan asset_id ile eşleşen kaydı bul (UUID id'yi almak için)
    const { data: songData, error: songError } = await supabase
      .from("songs")
      .select("id, duration")
      .eq("asset_id", assetId)
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
      })
      .select()
      .single();

    if (error) {
      throw error;
    }
    return data;
  } catch (error: any) {
    console.error("addSongToPlaylist hatası:", error);
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

    // Önce playlist_songs tablosundan song_id'leri al
    const { data: playlistSongs, error: playlistSongsError } = await supabase
      .from("playlist_songs")
      .select("song_id, id")
      .eq("playlist_id", playlistId)
      .order("id", { ascending: true });

    if (playlistSongsError) {
      throw playlistSongsError;
    }

    // song_id'leri çıkar
    const songIds = playlistSongs
      .map((item: any) => item.song_id)
      .filter((id: any) => id !== null && id !== undefined);

    // songs tablosundan bu ID'lere göre şarkıları çek
    const { data: songs, error: songsError } = await supabase
      .from("songs")
      .select("*")
      .in("id", songIds);

    if (songsError) {
      throw songsError;
    }

    // Eğer songs boşsa veya null ise
    if (!songs || songs.length === 0) {
      return [];
    }

    // Şarkıları playlist_songs'daki sıraya göre sırala
    const orderedSongs = playlistSongs
      .map((playlistSong: any) => {
        return songs.find((song: any) => song.id === playlistSong.song_id);
      })
      .filter((song: any) => song !== null && song !== undefined);

    return orderedSongs || [];
  } catch {
    return [];
  }
};
const addSongToFavorites = async (songId: string) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
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
    console.error("addSongToFavorites hatası:", error);
    throw error;
  }
};
const removeSongFromFavorites = async (songId: string) => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
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
    console.error("removeSongFromFavorites hatası:", error);
    return false;
  }
};

const getFavorites = async () => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
    }
    const saved = await AsyncStorage.getItem("favorites");
    if (saved) {
      return JSON.parse(saved);
    }
    return [];
  } catch (error: any) {
    console.error("getFavorites hatası:", error);
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
