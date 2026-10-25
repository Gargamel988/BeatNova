import { supabase } from "@/lib/supabase";

export type Period = "week" | "month" | "year";

export type WrappedTrack = {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  plays: number;
  secs: number;
};

export type WrappedArtist = {
  artist: string;
  secs: number;
  plays?: number;
};

export type WrappedPeakHour = {
  hour: number;
  secs: number;
  plays?: number;
};

export type WrappedMood = {
  mood: string;
  secs: number;
};

export type WrappedSkipped = {
  id?: string;
  title: string;
  artist: string;
  cover_url?: string | null;
  skips: number;
};

export type WrappedStats = {
  total_minutes: number;
  top_tracks: WrappedTrack[];
  top_artists: WrappedArtist[];
  peak_hours: WrappedPeakHour[];
  top_genre: string | null;
  top_moods: WrappedMood[];
  most_skipped: WrappedSkipped | null;
  longest_streak: number;
};

/**
 * Yerel saatle YYYY-MM-DD dizesi üretir (UTC kaymasını önler).
 */
const ymd = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * Handler-map ile dönem aralığı hesaplama.
 */
export const periodRange: Record<Period, () => [string, string]> = {
  week: () => [ymd(new Date(Date.now() - 6 * 864e5)), ymd(new Date())],
  month: () => {
    const n = new Date();
    return [ymd(new Date(n.getFullYear(), n.getMonth(), 1)), ymd(n)];
  },
  year: () => {
    const n = new Date();
    return [ymd(new Date(n.getFullYear(), 0, 1)), ymd(n)];
  },
};

/**
 * Belirtilen dönem için Wrapped özetini Supabase RPC ile tek seferde çeker.
 */
export const loadWrapped = async (period: Period): Promise<WrappedStats> => {
  const [from, to] = periodRange[period]();
  const { data, error } = await supabase.rpc("wrapped_stats", {
    p_from: from,
    p_to: to,
  });

  if (error) {
    throw error;
  }

  const raw = (data ?? {}) as Partial<WrappedStats>;

  return {
    total_minutes: Number(raw.total_minutes ?? 0),
    top_tracks: Array.isArray(raw.top_tracks) ? raw.top_tracks : [],
    top_artists: Array.isArray(raw.top_artists) ? raw.top_artists : [],
    peak_hours: Array.isArray(raw.peak_hours) ? raw.peak_hours : [],
    top_genre: raw.top_genre ?? null,
    top_moods: Array.isArray(raw.top_moods) ? raw.top_moods : [],
    most_skipped: raw.most_skipped ?? null,
    longest_streak: Number(raw.longest_streak ?? 0),
  };
};
