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
