import { supabase } from "@/lib/supabase";
import { getUser } from "@/lib/user";

const upsertlisteningtime = async (
  listeningTime: number,
  songId: string,
  skipCount: number = 0,
  playCount: number = 0,
) => {
  try {

    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
    }


    const { data: existing, error: selectError } = await supabase
      .from("listening_history")
      .select("id, total_seconds, skip_count, play_count")
      .eq("user_id", user.id)
      .eq("song_id", songId)
      .maybeSingle();

    if (selectError && selectError.code !== "PGRST116") {
      throw selectError;
    }

    const safeListeningDelta = Math.max(0, Math.round(listeningTime));
    const safeSkipDelta = Math.max(0, Math.round(skipCount));
    const safePlayCount = Math.max(0, Math.round(playCount));

    // Eğer hiçbir değer yoksa kayıt yapma
    if (safeListeningDelta === 0 && safeSkipDelta === 0 && safePlayCount === 0) {
      return existing ?? null;
    }

    const { data, error } = await supabase
      .from("listening_history")
      .upsert(
        {
          user_id: user.id,
          song_id: songId,
          total_seconds: safeListeningDelta + (existing?.total_seconds ?? 0),
          skip_count: safeSkipDelta + (existing?.skip_count ?? 0),
          play_count: safePlayCount + (existing?.play_count ?? 0),
        },
        {
          onConflict: "user_id, song_id",
        }
      )
      .select();

    if (error) {
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error updating total played:", error);
    throw error;
  }
};
 const getlisteninghistory = async () => {
  try {
    const user = await getUser();
    if (!user?.id) {
      throw new Error("Kullanıcı oturumu bulunamadı");
    }
    const { data, error } = await supabase
      .from("listening_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      throw error;
    }
    return data;
  }
  catch (error) {
    console.error("Error getting listening history:", error);
    throw error;
  }
 }
 

export { upsertlisteningtime, getlisteninghistory };
