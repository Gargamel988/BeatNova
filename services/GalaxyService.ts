import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";
import type { GalaxyStat } from "@/utils/buildGalaxy";

export const GALAXY_STATS_RPC_SQL = `
create or replace function galaxy_stats()
returns table (sid text, total_secs integer, mean_angle double precision)
language sql stable security invoker as $$
  select d.song_id, sum(d.seconds)::int,
         atan2(sum(d.seconds::float8 * sin(d.hour * 2 * pi() / 24)),
               sum(d.seconds::float8 * cos(d.hour * 2 * pi() / 24)))
  from listening_daily d
  where d.user_id = auth.uid()
  group by d.song_id;
$$;
`.trim();

/**
 * Galaksi istatistiklerini RPC ile çeker, RPC henüz DB'de yoksa veya offline ise
 * listening_daily / listening_history üzerinden aynı formülle hesaplar.
 */
export async function getGalaxyStats(): Promise<GalaxyStat[]> {
  try {
    const user = await getUser();
    if (!user?.id) {
      return [];
    }

    // 1. Doğrudan optimize RPC'yi dene
    const rpcRes = await supabase.rpc("galaxy_stats");
    if (!rpcRes.error && Array.isArray(rpcRes.data) && rpcRes.data.length > 0) {
      return rpcRes.data.map((row: any) => ({
        sid: String(row.sid),
        total_secs: Number(row.total_secs) || 0,
        mean_angle: Number(row.mean_angle) || 0,
      }));
    }

    // 2. RPC bulunamadıysa listening_daily üzerinden istemci tarafında dairesel ortalama hesapla
    const { data: dailyRows, error: dailyError } = await supabase
      .from("listening_daily")
      .select("song_id, hour, seconds, play_count")
      .eq("user_id", user.id);

    if (!dailyError && dailyRows && dailyRows.length > 0) {
      type Accumulator = {
        totalSecs: number;
        playCount: number;
        sinSum: number;
        cosSum: number;
      };
      const map = new Map<string, Accumulator>();

      dailyRows.forEach((row) => {
        const sid = String(row.song_id);
        const secs = Number(row.seconds) || 0;
        const hour = Number(row.hour) || 0;
        const play = Number(row.play_count) || 0;

        const theta = (hour * 2 * Math.PI) / 24;
        const current = map.get(sid) || {
          totalSecs: 0,
          playCount: 0,
          sinSum: 0,
          cosSum: 0,
        };

        current.totalSecs += secs;
        current.playCount += play;
        current.sinSum += secs * Math.sin(theta);
        current.cosSum += secs * Math.cos(theta);
        map.set(sid, current);
      });

      const stats: GalaxyStat[] = [];
      map.forEach((val, sid) => {
        const mean_angle = Math.atan2(val.sinSum, val.cosSum);
        stats.push({
          sid,
          total_secs: val.totalSecs,
          mean_angle,
          play_count: val.playCount,
        });
      });

      return stats;
    }

    // 3. listening_daily henüz boşsa listening_history tablosundan besle
    const { data: historyRows } = await supabase
      .from("listening_history")
      .select("song_id, total_seconds, play_count, last_played_at, created_at")
      .eq("user_id", user.id);

    if (historyRows && historyRows.length > 0) {
      return historyRows.map((h) => {
        const total_secs = Number(h.total_seconds) || 0;
        const play_count = Number(h.play_count) || 0;
        const dateStr = h.last_played_at || h.created_at;

        let hour = 12; // Varsayılan öğle
        if (dateStr) {
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            hour = d.getHours();
          }
        }

        const theta = (hour * 2 * Math.PI) / 24;
        // theta: 00:00=0 -> sin=0, cos=1 -> atan2=0
        const mean_angle = Math.atan2(Math.sin(theta), Math.cos(theta));

        return {
          sid: String(h.song_id),
          total_secs,
          mean_angle,
          play_count,
          last_played_at: dateStr,
        };
      });
    }

    return [];
  } catch (error: unknown) {
    if (__DEV__) {
      console.warn("[GalaxyService] getGalaxyStats exception:", error);
    }
    return [];
  }
}
