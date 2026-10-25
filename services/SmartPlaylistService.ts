import { Song } from "@/components/songs/songsService";
import { getlisteninghistory, ListeningHistoryRow } from "./StatisticServices";

export type SmartPlaylistId =
  | "heavy_rotation"
  | "time_capsule"
  | "weekly_top"
  | "night_owl"
  | "never_skipped";

export type SmartPlaylist = {
  id: SmartPlaylistId;
  titleKey: string;
  defaultTitle: string;
  subtitleKey: string;
  defaultSubtitle: string;
  gradient: [string, string];
  badgeColor: string;
  songs: Song[];
  songCount: number;
};

export const SMART_PLAYLIST_META: Record<
  SmartPlaylistId,
  {
    titleKey: string;
    defaultTitle: string;
    subtitleKey: string;
    defaultSubtitle: string;
    gradient: [string, string];
    badgeColor: string;
  }
> = {
  heavy_rotation: {
    titleKey: "smartPlaylists.heavyRotationTitle",
    defaultTitle: "En Çok Çaldıkların",
    subtitleKey: "smartPlaylists.heavyRotationSubtitle",
    defaultSubtitle: "Tekrar tekrar dinlediğin favori parçalar",
    gradient: ["#FF416C", "#FF4B2B"],
    badgeColor: "#FF4B2B",
  },
  time_capsule: {
    titleKey: "smartPlaylists.timeCapsuleTitle",
    defaultTitle: "Aylardır Dinlemediklerin",
    subtitleKey: "smartPlaylists.timeCapsuleSubtitle",
    defaultSubtitle: "Yeniden keşfetmeyi bekleyen unutulmuş parçalar",
    gradient: ["#8A2387", "#E94057"],
    badgeColor: "#E94057",
  },
  weekly_top: {
    titleKey: "smartPlaylists.weeklyTopTitle",
    defaultTitle: "Bu Haftanın Favorileri",
    subtitleKey: "smartPlaylists.weeklyTopSubtitle",
    defaultSubtitle: "Son 7 günde ritmini belirleyenler",
    gradient: ["#00c6ff", "#0072ff"],
    badgeColor: "#0072ff",
  },
  night_owl: {
    titleKey: "smartPlaylists.nightOwlTitle",
    defaultTitle: "Gece Ritimleri",
    subtitleKey: "smartPlaylists.nightOwlSubtitle",
    defaultSubtitle: "Gece geç saatlerde sana eşlik edenler",
    gradient: ["#141E30", "#243B55"],
    badgeColor: "#3a6073",
  },
  never_skipped: {
    titleKey: "smartPlaylists.neverSkippedTitle",
    defaultTitle: "Pas Geçmediklerin",
    subtitleKey: "smartPlaylists.neverSkippedSubtitle",
    defaultSubtitle: "Baştan sona kesintisiz dinlediğin parçalar",
    gradient: ["#11998e", "#38ef7d"],
    badgeColor: "#11998e",
  },
};

const DAY = 86_400_000;
const MAX_SONGS = 25;
const MIN_SONGS = 5; // Bunun altındaki liste gösterilmez

export type HistoryRow = {
  song_id: string;
  played_at?: string;
  created_at?: string;
  last_played_at?: string;
  completed?: boolean;
  skipped?: boolean;
  play_count?: number;
  skip_count?: number;
  total_seconds?: number;
};

function topBy(rows: HistoryRow[], songMap: Map<string, Song>): Song[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const sid = String(r.song_id);
    const weight = r.play_count ?? 1;
    counts.set(sid, (counts.get(sid) ?? 0) + weight);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => songMap.get(id))
    .filter((s): s is Song => !!s)
    .slice(0, MAX_SONGS);
}

/**
 * Mevcut listening_history satırları ve cihaz şarkıları üzerinden
 * tamamen istemci tarafında, ek ağ isteği atmadan 5 akıllı listeyi hesaplar.
 */
export function buildSmartPlaylists(
  history: HistoryRow[] | null | undefined,
  allSongs: Song[] | null | undefined,
  minCount: number = MIN_SONGS
): SmartPlaylist[] {
  if (!allSongs || allSongs.length === 0 || !history || history.length === 0) {
    return [];
  }

  const songMap = new Map<string, Song>();
  for (const s of allSongs) {
    songMap.set(String(s.id), s);
  }

  const now = Date.now();
  const at = (r: HistoryRow): number => {
    const raw = r.played_at || r.last_played_at || r.created_at;
    return raw ? new Date(raw).getTime() : now;
  };

  const last30 = history.filter((r) => now - at(r) < 30 * DAY);
  const last7 = history.filter((r) => now - at(r) < 7 * DAY);

  // 1. Yoğun dönüş: son 30 günün en çok çalınanları (veya son 30 günde veri yoksa genel en çok çalınanlar)
  const heavy = topBy(last30.length > 0 ? last30 : history, songMap);

  // 2. Haftanın en iyisi: son 7 gün
  const weekly = topBy(last7, songMap);

  // 3. Gece kuşu: 00:00-05:00 veya 23:00+ arası dinlenenler
  const nightRows = history.filter((r) => {
    const t = at(r);
    const h = new Date(t).getHours();
    return h < 5 || h >= 23;
  });
  const night = topBy(nightRows, songMap);

  // 4. Zaman kapsülü: 60+ gün önce çok dinlenip son 30 günde hiç dinlenmeyenler
  const recentIds = new Set(last30.map((r) => String(r.song_id)));
  const capsuleRows = history.filter((r) => {
    const t = at(r);
    return now - t > 60 * DAY && !recentIds.has(String(r.song_id));
  });
  const capsule = topBy(capsuleRows, songMap);

  // 5. Hiç atlanmayanlar: en az 3 kez çalınmış, hiç skipped olmamış
  const stat = new Map<string, { n: number; skip: number }>();
  for (const r of history) {
    const sid = String(r.song_id);
    const s = stat.get(sid) ?? { n: 0, skip: 0 };
    s.n += r.play_count ?? 1;
    if (r.skipped) s.skip++;
    if (r.skip_count) s.skip += r.skip_count;
    stat.set(sid, s);
  }
  const neverSkipped = [...stat.entries()]
    .filter(([, s]) => s.n >= 3 && s.skip === 0)
    .sort((a, b) => b[1].n - a[1].n)
    .map(([id]) => songMap.get(id))
    .filter((s): s is Song => !!s)
    .slice(0, MAX_SONGS);

  const defs: { id: SmartPlaylistId; songs: Song[] }[] = [
    { id: "heavy_rotation", songs: heavy },
    { id: "weekly_top", songs: weekly },
    { id: "night_owl", songs: night },
    { id: "time_capsule", songs: capsule },
    { id: "never_skipped", songs: neverSkipped },
  ];

  return defs
    .filter((d) => d.songs.length >= minCount)
    .map((d) => ({
      id: d.id,
      ...SMART_PLAYLIST_META[d.id],
      songs: d.songs,
      songCount: d.songs.length,
    }));
}

/**
 * Geriye dönük uyumluluk için async sarmalayıcı.
 */
export async function generateSmartPlaylists(
  allSongs: Song[]
): Promise<SmartPlaylist[]> {
  try {
    const history = await getlisteninghistory();
    return buildSmartPlaylists(history, allSongs);
  } catch {
    return [];
  }
}
