import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";

export type ListeningDailyRow = {
  song_id: string;
  day: string; // YYYY-MM-DD (yerel saat)
  hour: number; // 0-23
  seconds: number;
  play_count: number;
  skip_count: number;
};

const toLocalDateString = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fetchAll = async <T,>(build: () => any): Promise<T[]> => {
  const PAGE = 1000;
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build().range(from, from + PAGE - 1);
    if (error) throw error;
    out.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return out;
};

// Gün + saat bazlı kayıt (listening_daily). Tablo henüz yoksa sessizce geçer.
const logDailyListening = async (
  songId: string,
  seconds: number,
  playCount: number,
  skipCount: number
) => {
  try {
    const now = new Date();
    const { error } = await supabase.rpc("increment_listening_daily", {
      p_song_id: songId,
      p_day: toLocalDateString(now),
      p_hour: now.getHours(),
      p_seconds: seconds,
      p_play: playCount,
      p_skip: skipCount,
    });
    if (error) console.log("[STATS] listening_daily yazılamadı:", error.message);
  } catch (e) {
    console.log("[STATS] listening_daily hatası:", e);
  }
};

const upsertlisteningtime = async (
  listeningTime: number,
  songId: string,
  skipCount: number = 0,
  playCount: number = 0,
) => {
  try {
    if (!songId) return null;

    const safeListeningDelta = Math.max(0, Math.round(listeningTime));
    const safeSkipDelta = Math.max(0, Math.round(skipCount));
    const safePlayCount = Math.max(0, Math.round(playCount));

    if (safeListeningDelta === 0 && safeSkipDelta === 0 && safePlayCount === 0) {
      return null;
    }

    const { error } = await supabase.rpc("increment_listening_history", {
      p_song_id: songId,
      p_seconds: safeListeningDelta,
      p_play: safePlayCount,
      p_skip: safeSkipDelta,
    });
    
    if (error) throw error;

    await logDailyListening(songId, safeListeningDelta, safePlayCount, safeSkipDelta);

    return true;
  } catch (error: any) {
    if (error?.message?.includes("session missing")) return null;
    console.log("[STATS] upsert error:", error);
    return null;
  }
};

const getlisteninghistory = async () => {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }
    return await fetchAll<any>(() => 
      supabase
        .from("listening_history")
        .select("*")
        .eq("user_id", user.id)
    );
  } catch (error: any) {
    if (error?.message?.includes("session missing")) return [];
    return [];
  }
}

// Belirtilen tarihten (dahil) itibaren günlük kayıtlar
const getListeningDaily = async (fromDate: Date): Promise<ListeningDailyRow[]> => {
  try {
    const user = await getUser();
    if (!user?.id) return [];
    
    return await fetchAll<ListeningDailyRow>(() => 
      supabase
        .from("listening_daily")
        .select("song_id, day, hour, seconds, play_count, skip_count")
        .eq("user_id", user.id)
        .gte("day", toLocalDateString(fromDate))
        .order("day")
    );
  } catch {
    return [];
  }
};

export { upsertlisteningtime, getlisteninghistory, getListeningDaily, toLocalDateString };
