import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";
import { Song } from "@/components/songs/songsService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createPlaylist, addSongToPlaylist } from "@/services/PlaylistServices";

export type PlaylistKind = "now" | "favorites" | "forgotten" | "undiscovered";
export type DayPart = "night" | "morning" | "afternoon" | "evening";

export type SuggestedPlaylist = {
  kind: PlaylistKind;
  dayPart?: DayPart;
  titleKey: string;
  defaultTitle: string;
  reasonKey: string;
  defaultReason: string;
  gradient: readonly [string, string, ...string[]];
  badgeColor: string;
  songs: Song[];
  songCount: number;
};

export const getDayPart = (h: number = new Date().getHours()): DayPart => {
  if (h < 6) return "night";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
};

// Meta bilgisi handler-map
export const DAY_PART_META: Record<
  DayPart,
  {
    titleKey: string;
    defaultTitle: string;
    reasonKey: string;
    defaultReason: string;
    gradient: readonly [string, string, ...string[]];
    badgeColor: string;
  }
> = {
  night: {
    titleKey: "suggestions.nowNightTitle",
    defaultTitle: "Gece Modu 🌙",
    reasonKey: "suggestions.nowNightReason",
    defaultReason: "Bu saatlerde genelde bunları açıyorsun",
    gradient: ["#141E30", "#243B55"],
    badgeColor: "#3a6073",
  },
  morning: {
    titleKey: "suggestions.nowMorningTitle",
    defaultTitle: "Sabah Enerjisi ☀️",
    reasonKey: "suggestions.nowMorningReason",
    defaultReason: "Güne bunlarla başlıyorsun",
    gradient: ["#FF512F", "#F09819"],
    badgeColor: "#F09819",
  },
  afternoon: {
    titleKey: "suggestions.nowAfternoonTitle",
    defaultTitle: "Öğleden Sonra Ritmi ☕",
    reasonKey: "suggestions.nowAfternoonReason",
    defaultReason: "Günün bu saatlerindeki favorilerin",
    gradient: ["#00b09b", "#96c93d"],
    badgeColor: "#00b09b",
  },
  evening: {
    titleKey: "suggestions.nowEveningTitle",
    defaultTitle: "Akşam Keyfi 🌆",
    reasonKey: "suggestions.nowEveningReason",
    defaultReason: "Akşamları dinlemeyi en çok sevdiklerin",
    gradient: ["#8A2387", "#E94057"],
    badgeColor: "#E94057",
  },
};

export const STATIC_KIND_META: Record<
  Exclude<PlaylistKind, "now">,
  {
    titleKey: string;
    defaultTitle: string;
    reasonKey: string;
    defaultReason: string;
    gradient: readonly [string, string, ...string[]];
    badgeColor: string;
  }
> = {
  favorites: {
    titleKey: "suggestions.favoritesTitle",
    defaultTitle: "Vazgeçemediklerin",
    reasonKey: "suggestions.favoritesReason",
    defaultReason: "En yüksek tamamlanma oranına sahip favorilerin",
    gradient: ["#FF416C", "#FF4B2B"],
    badgeColor: "#FF416C",
  },
  forgotten: {
    titleKey: "suggestions.forgottenTitle",
    defaultTitle: "Unutulan Cevherler",
    reasonKey: "suggestions.forgottenReason",
    defaultReason: "5'ten fazla dinlediğin ama son 30 gündür çalmadığın parçalar",
    gradient: ["#4e54c8", "#8f94fb"],
    badgeColor: "#4e54c8",
  },
  undiscovered: {
    titleKey: "suggestions.undiscoveredTitle",
    defaultTitle: "Henüz Keşfetmediklerin",
    reasonKey: "suggestions.undiscoveredReason",
    defaultReason: "Kütüphanende olup henüz dinlemediğin gizli parçalar",
    gradient: ["#11998e", "#38ef7d"],
    badgeColor: "#11998e",
  },
};

/**
 * 70/30 Kuralı ve Sanatçı Çeşitlendirmesi:
 * - Listede aynı sanatçıdan peş peşe en fazla 2 şarkı yer alır.
 * - Maksimum 25 şarkı seçilir.
 */
function diversifyAndTrim(primary: Song[], secondary: Song[], targetCount: number = 25): Song[] {
  const primaryQuota = Math.round(targetCount * 0.7);
  const secondaryQuota = targetCount - primaryQuota;

  const pool = [
    ...primary.slice(0, primaryQuota),
    ...secondary.slice(0, secondaryQuota),
    ...primary.slice(primaryQuota),
    ...secondary.slice(secondaryQuota),
  ];

  const result: Song[] = [];
  const seenIds = new Set<string>();

  for (const song of pool) {
    if (result.length >= targetCount) break;
    const sid = String(song.id);
    if (seenIds.has(sid)) continue;

    const len = result.length;
    const currentArtist = (song.metadata?.artist || "").trim().toLowerCase();

    // Üst üste aynı sanatçıdan en fazla 2 şarkı kuralı
    if (
      len >= 2 &&
      currentArtist &&
      (result[len - 1]?.metadata?.artist || "").trim().toLowerCase() === currentArtist &&
      (result[len - 2]?.metadata?.artist || "").trim().toLowerCase() === currentArtist
    ) {
      continue; // Bu adımı atla, çeşitlilik sağla
    }

    result.push(song);
    seenIds.add(sid);
  }

  // Havuz yetmediyse kalan benzersizleri doldur
  if (result.length < Math.min(targetCount, pool.length)) {
    for (const song of pool) {
      if (result.length >= targetCount) break;
      const sid = String(song.id);
      if (!seenIds.has(sid)) {
        result.push(song);
        seenIds.add(sid);
      }
    }
  }

  return result;
}

/**
 * Şarkı ID listesi üreten generator handler-map
 */
const generators: Record<
  PlaylistKind,
  (allSongs: Song[], songMap: Map<string, Song>) => Promise<string[]>
> = {
  now: async () => {
    const currentHour = new Date().getHours();
    const { data, error } = await supabase.rpc("suggested_for_now", {
      p_hour: currentHour,
      p_limit: 40,
    });
    if (error) {
      return [];
    }
    return (data ?? []).map((r: { sid: string }) => String(r.sid));
  },
  favorites: async () => {
    const { data, error } = await supabase
      .from("listening_history")
      .select("song_id")
      .gte("play_count", 5)
      .order("play_count", { ascending: false })
      .limit(40);
    if (error) {
      return [];
    }
    return (data ?? []).map((r: { song_id: string }) => String(r.song_id));
  },
  forgotten: async () => {
    const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { data, error } = await supabase
      .from("listening_history")
      .select("song_id")
      .gte("play_count", 5)
      .lt("last_played_at", cutoff)
      .order("play_count", { ascending: false })
      .limit(40);
    if (error) {
      return [];
    }
    return (data ?? []).map((r: { song_id: string }) => String(r.song_id));
  },
  undiscovered: async (allSongs) => {
    const { data } = await supabase.from("listening_history").select("song_id");
    const played = new Set((data ?? []).map((r: { song_id: string }) => String(r.song_id)));
    return allSongs.filter((s) => !played.has(String(s.id))).map((s) => String(s.id));
  },
};

/**
 * Tüm akıllı öneri listelerini üretir ve saat dilimine göre AsyncStorage ile cache'ler.
 */
export async function getSuggestedPlaylists(
  allSongs: Song[],
  forceRefresh = false
): Promise<SuggestedPlaylist[]> {
  if (!allSongs || allSongs.length === 0) {
    return [];
  }

  const user = await getUser();
  const userId = user?.id ?? "guest";
  const now = new Date();
  const hour = now.getHours();
  const dayPart = getDayPart(hour);
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
  const cacheKey = `@beatnova_suggested_${userId}_${dateStr}_${dayPart}`;

  // Cache kontrolü (manuel yenileme istenmediyse)
  if (!forceRefresh) {
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { kind: PlaylistKind; songIds: string[] }[];
        const songMap = new Map<string, Song>(allSongs.map((s) => [String(s.id), s]));
        const reconstructed: SuggestedPlaylist[] = [];

        for (const item of parsed) {
          const songs = item.songIds
            .map((id) => songMap.get(id))
            .filter((s): s is Song => Boolean(s));

          if (songs.length >= 4) {
            if (item.kind === "now") {
              const meta = DAY_PART_META[dayPart];
              reconstructed.push({
                kind: "now",
                dayPart,
                titleKey: meta.titleKey,
                defaultTitle: meta.defaultTitle,
                reasonKey: meta.reasonKey,
                defaultReason: meta.defaultReason,
                gradient: meta.gradient,
                badgeColor: meta.badgeColor,
                songs,
                songCount: songs.length,
              });
            } else {
              const meta = STATIC_KIND_META[item.kind];
              reconstructed.push({
                kind: item.kind,
                titleKey: meta.titleKey,
                defaultTitle: meta.defaultTitle,
                reasonKey: meta.reasonKey,
                defaultReason: meta.defaultReason,
                gradient: meta.gradient,
                badgeColor: meta.badgeColor,
                songs,
                songCount: songs.length,
              });
            }
          }
        }

        if (reconstructed.length > 0) {
          return reconstructed;
        }
      }
    } catch {
      // Cache okuma hatasında doğrudan üretime devam et
    }
  }

  const songMap = new Map<string, Song>(allSongs.map((s) => [String(s.id), s]));

  // Soğuk Başlangıç Kontrolü: Kullanıcının toplam dinleme sayısı
  let totalPlays = 0;
  try {
    const { data } = await supabase
      .from("listening_history")
      .select("play_count");
    totalPlays = (data ?? []).reduce((acc, r: { play_count?: number }) => acc + (r.play_count ?? 0), 0);
  } catch {
    totalPlays = 0;
  }

  const result: SuggestedPlaylist[] = [];
  const cachePayload: { kind: PlaylistKind; songIds: string[] }[] = [];

  // 1. "Şu An İçin" (Now)
  if (totalPlays >= 20) {
    try {
      const nowIds = await generators.now(allSongs, songMap);
      const nowSongs = nowIds.map((id) => songMap.get(id)).filter((s): s is Song => Boolean(s));
      const undiscoveredIds = await generators.undiscovered(allSongs, songMap);
      const undiscoveredSongs = undiscoveredIds.map((id) => songMap.get(id)).filter((s): s is Song => Boolean(s));

      const blended = diversifyAndTrim(nowSongs, undiscoveredSongs, 25);
      if (blended.length >= 4) {
        const meta = DAY_PART_META[dayPart];
        result.push({
          kind: "now",
          dayPart,
          titleKey: meta.titleKey,
          defaultTitle: meta.defaultTitle,
          reasonKey: meta.reasonKey,
          defaultReason: meta.defaultReason,
          gradient: meta.gradient,
          badgeColor: meta.badgeColor,
          songs: blended,
          songCount: blended.length,
        });
        cachePayload.push({ kind: "now", songIds: blended.map((s) => String(s.id)) });
      }
    } catch {
      // Sessizce geç
    }
  }

  // 2. Favorilerin
  if (totalPlays >= 10) {
    try {
      const favIds = await generators.favorites(allSongs, songMap);
      const favSongs = favIds.map((id) => songMap.get(id)).filter((s): s is Song => Boolean(s));
      const blendedFav = diversifyAndTrim(favSongs, [], 25);
      if (blendedFav.length >= 4) {
        const meta = STATIC_KIND_META.favorites;
        result.push({
          kind: "favorites",
          titleKey: meta.titleKey,
          defaultTitle: meta.defaultTitle,
          reasonKey: meta.reasonKey,
          defaultReason: meta.defaultReason,
          gradient: meta.gradient,
          badgeColor: meta.badgeColor,
          songs: blendedFav,
          songCount: blendedFav.length,
        });
        cachePayload.push({ kind: "favorites", songIds: blendedFav.map((s) => String(s.id)) });
      }
    } catch {
      // Sessizce geç
    }
  }

  // 3. Eskiden Çok Dinlediklerin (Unutulanlar)
  try {
    const forgottenIds = await generators.forgotten(allSongs, songMap);
    const forgottenSongs = forgottenIds.map((id) => songMap.get(id)).filter((s): s is Song => Boolean(s));
    const trimmedForgotten = diversifyAndTrim(forgottenSongs, [], 20);
    if (trimmedForgotten.length >= 4) {
      const meta = STATIC_KIND_META.forgotten;
      result.push({
        kind: "forgotten",
        titleKey: meta.titleKey,
        defaultTitle: meta.defaultTitle,
        reasonKey: meta.reasonKey,
        defaultReason: meta.defaultReason,
        gradient: meta.gradient,
        badgeColor: meta.badgeColor,
        songs: trimmedForgotten,
        songCount: trimmedForgotten.length,
      });
      cachePayload.push({ kind: "forgotten", songIds: trimmedForgotten.map((s) => String(s.id)) });
    }
  } catch {
    // Sessizce geç
  }

  // 4. Henüz Keşfetmediklerin (Undiscovered)
  try {
    const undiscoveredIds = await generators.undiscovered(allSongs, songMap);
    const undiscoveredSongs = undiscoveredIds
      .map((id) => songMap.get(id))
      .filter((s): s is Song => Boolean(s));

    const trimmedUndiscovered = undiscoveredSongs.slice(0, 25);
    if (trimmedUndiscovered.length >= 4) {
      const meta = STATIC_KIND_META.undiscovered;
      result.push({
        kind: "undiscovered",
        titleKey: meta.titleKey,
        defaultTitle: meta.defaultTitle,
        reasonKey: meta.reasonKey,
        defaultReason: meta.defaultReason,
        gradient: meta.gradient,
        badgeColor: meta.badgeColor,
        songs: trimmedUndiscovered,
        songCount: trimmedUndiscovered.length,
      });
      cachePayload.push({
        kind: "undiscovered",
        songIds: trimmedUndiscovered.map((s) => String(s.id)),
      });
    }
  } catch {
    // Sessizce geç
  }

  // Cache'e kaydet
  if (cachePayload.length > 0) {
    try {
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cachePayload));
    } catch {
      // Sessizce geç
    }
  }

  return result;
}

/**
 * Öneri listesini kullanıcının gerçek bir çalma listesine dönüştürür.
 */
export async function saveSuggestedPlaylist(
  playlist: SuggestedPlaylist
): Promise<boolean> {
  try {
    const newPl = await createPlaylist({
      name: playlist.defaultTitle,
      description: playlist.defaultReason,
      is_public: false,
      tags: ["smart", playlist.kind],
    });

    if (!newPl?.id) {
      return false;
    }

    const playlistId = typeof newPl.id === "string" ? parseInt(newPl.id, 10) : newPl.id;

    for (const song of playlist.songs) {
      await addSongToPlaylist(String(song.id), playlistId);
    }

    return true;
  } catch {
    return false;
  }
}
