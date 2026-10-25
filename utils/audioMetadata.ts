export function parseFilename(filename: string): { title: string; artist: string } {
  if (!filename) {
    return { title: "Bilinmeyen Şarkı", artist: "Bilinmeyen Sanatçı" };
  }

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
          artist: parts[0]?.trim() || "Bilinmeyen Sanatçı",
          title: parts.slice(1).join(sep).trim(),
        };
      }
    }
  }

  return { title: name, artist: "Bilinmeyen Sanatçı" };
}

export function extractYoutubeId(filename: string): string | null {
  // 1. `(_ID_)` formatı
  let match = filename.match(/\(_([a-zA-Z0-9_-]{11})_\)/);
  if (match?.[1]) return match[1];

  // 2. `[ID]` formatı
  match = filename.match(/\[([a-zA-Z0-9_-]{11})\]/);
  if (match?.[1]) return match[1];

  // 3. `-ID.uzantı` veya `(ID)` formatları
  match = filename.match(/[-(]([a-zA-Z0-9_-]{11})[)\.]/);
  if (match?.[1]) return match[1];

  return null;
}

/**
 * Sanatçı adı boşsa veya varsayılan "Bilinmeyen Sanatçı" ise aktif dildeki çeviriyi döner.
 */
export function getLocalizedArtist(
  artist: string | undefined | null,
  t: (key: string, options?: any) => string
): string {
  if (!artist || artist.trim() === "") {
    return t("songs.unknownArtist", { defaultValue: "Bilinmeyen Sanatçı" });
  }
  const clean = artist.trim().toLowerCase();
  if (
    clean === "bilinmeyen sanatçı" ||
    clean === "bilinmeyen" ||
    clean === "unknown artist" ||
    clean === "unknown" ||
    clean === "<unknown>" ||
    clean === "<bilinmiyor>"
  ) {
    return t("songs.unknownArtist", { defaultValue: "Bilinmeyen Sanatçı" });
  }
  return artist;
}

/**
 * Şarkı adı boşsa veya varsayılan "Bilinmeyen Şarkı" ise aktif dildeki çeviriyi döner.
 */
export function getLocalizedTitle(
  title: string | undefined | null,
  t: (key: string, options?: any) => string
): string {
  if (!title || title.trim() === "") {
    return t("songs.unknownTitle", { defaultValue: "Bilinmeyen Şarkı" });
  }
  const clean = title.trim().toLowerCase();
  if (
    clean === "bilinmeyen şarkı" ||
    clean === "bilinmeyen" ||
    clean === "unknown title" ||
    clean === "unknown song" ||
    clean === "unknown" ||
    clean === "<unknown>" ||
    clean === "<bilinmiyor>"
  ) {
    return t("songs.unknownTitle", { defaultValue: "Bilinmeyen Şarkı" });
  }
  return title;
}

/**
 * Albüm adı boşsa veya varsayılan "Bilinmeyen Albüm" ise aktif dildeki çeviriyi döner.
 */
export function getLocalizedAlbum(
  album: string | undefined | null,
  t: (key: string, options?: any) => string
): string {
  if (!album || album.trim() === "") {
    return t("songs.unknownAlbum", { defaultValue: "Bilinmeyen Albüm" });
  }
  const clean = album.trim().toLowerCase();
  if (
    clean === "bilinmeyen albüm" ||
    clean === "bilinmeyen" ||
    clean === "unknown album" ||
    clean === "unknown" ||
    clean === "<unknown>" ||
    clean === "<bilinmiyor>"
  ) {
    return t("songs.unknownAlbum", { defaultValue: "Bilinmeyen Albüm" });
  }
  return album;
}
