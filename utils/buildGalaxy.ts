export type GalaxyInputSong = {
  id: string | number;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  uri?: string;
  filename?: string;
  cover_url?: string;
  coverUri?: string;
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
    duration?: number;
    coverUri?: string;
    [key: string]: any;
  };
  [key: string]: any;
};

export type GalaxyStat = {
  sid: string;
  total_secs: number;
  mean_angle: number; // radians from RPC (-PI to PI)
  play_count?: number;
  last_played_at?: string;
};

export type GalaxyStar = {
  id: string;
  x: number;
  y: number;
  radius: number;
  glow: number; // 0..1
  angle: number;
  played: boolean;
  total_secs: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  uri?: string;
  coverUri?: string | null;
  play_count: number;
  last_played_at?: string;
  color: string;
};

export type BuildGalaxyOutput = {
  stars: GalaxyStar[];
  maxTotalSecs: number;
  playedCount: number;
  unplayedCount: number;
};

/**
 * String'i [0, 1) aralığında deterministik bir float'a dönüştürür.
 */
export function stringToNormalizedHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  const unsigned = hash >>> 0;
  return unsigned / 4294967296;
}

/**
 * Açının günün saatine karşılık gelen renk değerini döner:
 * 00:00 (tepe, -pi/2): Gece İndigo-Mavi (#5068A8)
 * 06:00 (sağ, 0): Sabah Amber (#F4A261)
 * 12:00 (alt, pi/2): Öğle Soluk Krem (#FFF3E0)
 * 18:00 (sol, pi): Akşam Gül-Pembe (#E76F51)
 */
export function getStarColorByAngle(angle: number, played: boolean): string {
  if (!played) {
    return "#4C566A"; // Soluk, doymamış stardust
  }

  // Açıyı [0, 2pi) aralığına normalize et (-pi/2 tepe = 0 saatinden başlasın)
  const normalized = (((angle + Math.PI / 2) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  const hour = (normalized / (2 * Math.PI)) * 24;

  if (hour < 6) {
    // 00:00 - 06:00: İndigo -> Amber
    const t = hour / 6;
    return interpolateRgb([80, 104, 168], [244, 162, 97], t);
  } else if (hour < 12) {
    // 06:00 - 12:00: Amber -> Krem
    const t = (hour - 6) / 6;
    return interpolateRgb([244, 162, 97], [255, 243, 224], t);
  } else if (hour < 18) {
    // 12:00 - 18:00: Krem -> Gül-Pembe
    const t = (hour - 12) / 6;
    return interpolateRgb([255, 243, 224], [231, 111, 81], t);
  } else {
    // 18:00 - 24:00: Gül-Pembe -> İndigo
    const t = (hour - 18) / 6;
    return interpolateRgb([231, 111, 81], [80, 104, 168], t);
  }
}

function interpolateRgb(rgb1: [number, number, number], rgb2: [number, number, number], t: number): string {
  const clampedT = Math.max(0, Math.min(1, t));
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * clampedT);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * clampedT);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * clampedT);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Şarkı listesi ve dinleme istatistiklerinden yıldız haritası koordinatlarını üretir.
 * Saf (pure) fonksiyondur, deterministiktir ve test edilebilir.
 */
export function buildGalaxy(
  songs: GalaxyInputSong[],
  stats: GalaxyStat[] = []
): BuildGalaxyOutput {
  if (!songs || songs.length === 0) {
    return {
      stars: [],
      maxTotalSecs: 0,
      playedCount: 0,
      unplayedCount: 0,
    };
  }

  // Stat map oluştur
  const statMap = new Map<string, GalaxyStat>();
  stats.forEach((s) => {
    if (s.sid) statMap.set(String(s.sid), s);
  });

  // Her şarkı için total_secs ve mean_angle'ı bağla
  const decorated = songs.map((song) => {
    const s = statMap.get(String(song.id));
    const total_secs = s ? Math.max(0, Number(s.total_secs) || 0) : 0;
    const mean_angle = s ? Number(s.mean_angle) || 0 : 0;
    const play_count = s?.play_count ?? 0;
    const last_played_at = s?.last_played_at;

    return {
      song,
      total_secs,
      mean_angle,
      play_count,
      last_played_at,
    };
  });

  // Şarkıları total_secs'e göre azalan sırala
  decorated.sort((a, b) => b.total_secs - a.total_secs);

  const n = decorated.length;
  const maxTotalSecs = decorated[0]?.total_secs || 0;
  const logMax = Math.log1p(maxTotalSecs);

  let playedCount = 0;
  let unplayedCount = 0;

  const stars: GalaxyStar[] = decorated.map((item, index) => {
    const { song, total_secs, mean_angle, play_count, last_played_at } = item;
    const played = total_secs > 0;

    if (played) {
      playedCount++;
    } else {
      unplayedCount++;
    }

    // rank: 0 (en çok dinlenen) .. 1 (en az/hiç dinlenmeyen)
    const rank = n > 1 ? index / (n - 1) : 0;
    const radius = 40 + Math.sqrt(rank) * 460;

    let angle: number;
    if (played) {
      // Dinlenmiş şarkıda mean_angle (mod 2pi) - pi/2
      // 00:00 tepede (-pi/2), 06:00 sağda (0), 12:00 altta (pi/2), 18:00 solda (pi)
      const modAngle = (((mean_angle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI));
      angle = modAngle - Math.PI / 2;
    } else {
      // Hiç dinlenmemişte açı = hash(artist veya id) * 2pi
      const artist = (song.metadata?.artist || song.artist || "").trim();
      const isUnknownArtist =
        !artist ||
        artist === "Bilinmeyen Sanatçı" ||
        artist.toLowerCase() === "unknown artist";

      const hashKey = isUnknownArtist ? String(song.id) : artist;
      angle = stringToNormalizedHash(hashKey) * 2 * Math.PI;
    }

    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    // glow: log1p(total_secs) / log1p(max_total_secs)
    const glow = logMax > 0 && total_secs > 0 ? Math.min(1, Math.max(0, Math.log1p(total_secs) / logMax)) : 0;
    const color = getStarColorByAngle(angle, played);

    return {
      id: String(song.id),
      x,
      y,
      radius,
      glow,
      angle,
      played,
      total_secs,
      title: song.metadata?.title || song.title || song.filename || "Şarkı",
      artist: song.metadata?.artist || song.artist || "Bilinmeyen Sanatçı",
      album: song.metadata?.album || song.album || "Bilinmeyen Albüm",
      duration: song.metadata?.duration || song.duration || 0,
      uri: song.uri,
      coverUri: song.metadata?.coverUri || song.cover_url || null,
      play_count,
      last_played_at,
      color,
    };
  });

  return {
    stars,
    maxTotalSecs,
    playedCount,
    unplayedCount,
  };
}
