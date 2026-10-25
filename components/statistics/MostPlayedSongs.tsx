import React, { useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";

type TimeFilter = "week" | "month" | "all";

interface Song {
  id: string | number;
  title: string;
  artist: string;
  plays: number;
  duration: number;
  cover: string | null;
}

interface ListeningHistoryItem {
  song_id: string;
  created_at?: string;
  total_seconds?: number;
  listening_time?: number;
  play_count?: number;
}

interface ListeningDailyRow {
  song_id: string;
  day: string;
  play_count: number;
  seconds: number;
}

interface MostPlayedSongsProps {
  songs: readonly Song[];
  listeningHistory?: ListeningHistoryItem[];
  dailyRows?: ListeningDailyRow[];
}

export function MostPlayedSongs({ songs, listeningHistory = [], dailyRows = [] }: MostPlayedSongsProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");

  const filterLabels: Record<TimeFilter, string> = {
    week: t("stats.thisWeek"),
    month: t("stats.thisMonth"),
    all: t("stats.allTime"),
  };
  const filteredSongs = React.useMemo(() => {
    const historyBySongId: Record<string, { seconds: number; plays: number }> = {};

    if (timeFilter === "all") {
      listeningHistory.forEach((h) => {
        if (!h.song_id) return;
        if (!historyBySongId[h.song_id]) historyBySongId[h.song_id] = { seconds: 0, plays: 0 };
        historyBySongId[h.song_id].seconds += h.total_seconds || 0;
        historyBySongId[h.song_id].plays += h.play_count || 0;
      });
    } else {
      const now = new Date();
      let startStr = "";
      if (timeFilter === "week") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        startStr = `${y}-${m}-${dd}`;
      } else {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        startStr = `${y}-${m}-01`;
      }

      dailyRows.forEach((r) => {
        if (r.day >= startStr && r.song_id) {
          if (!historyBySongId[r.song_id]) historyBySongId[r.song_id] = { seconds: 0, plays: 0 };
          historyBySongId[r.song_id].seconds += r.seconds || 0;
          historyBySongId[r.song_id].plays += r.play_count || 0;
        }
      });

      // Eğer seçilen periyotta kayıt yoksa genel dinleme geçmişinden besle
      if (Object.keys(historyBySongId).length === 0 && listeningHistory.length > 0) {
        listeningHistory.forEach((h) => {
          if (!h.song_id) return;
          if (!historyBySongId[h.song_id]) historyBySongId[h.song_id] = { seconds: 0, plays: 0 };
          historyBySongId[h.song_id].seconds += h.total_seconds || 0;
          historyBySongId[h.song_id].plays += h.play_count || 0;
        });
      }
    }

    const songMap = new Map((songs || []).map((s) => [String(s.id), s]));

    const items: Song[] = [];
    Object.entries(historyBySongId).forEach(([songId, stats]) => {
      const existingSong = songMap.get(songId);
      const duration = existingSong?.duration || 0;
      const computedPlays = duration > 0 ? Math.round(stats.seconds / duration) : stats.plays;
      const plays = Math.max(stats.plays, computedPlays);

      if (plays > 0) {
        items.push({
          id: songId,
          title: existingSong?.title || `Şarkı #${songId}`,
          artist: existingSong?.artist || "Bilinmeyen Sanatçı",
          duration,
          cover: existingSong?.cover || null,
          plays,
        });
      }
    });

    return items.sort((a, b) => b.plays - a.plays).slice(0, 5);
  }, [songs, listeningHistory, dailyRows, timeFilter]);

  return (
    <ChartContainer
      title={t("stats.mostPlayedTitle")}
      description={t("stats.mostPlayedDesc")}
      style={{
        gap: hp(1.2),
        borderRadius: radius(18),
        padding: wp(3.5),
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.overlay.white12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: wp(2),
          marginBottom: hp(1),
        }}
      >
        {(["week", "month", "all"] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTimeFilter(filter)}
            style={{
              paddingHorizontal: wp(3),
              paddingVertical: hp(0.7),
              borderRadius: radius(10),
              backgroundColor: timeFilter === filter ? colors.primary : colors.overlay.white10,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontSize: fontSize(12),
                fontWeight: "600",
                color: timeFilter === filter ? "#FFFFFF" : colors.textSecondary,
              }}
            >
              {filterLabels[filter]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredSongs.length === 0 ? (
        <View
          style={{
            paddingVertical: hp(3),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: colors.textSecondary, fontSize: fontSize(13) }}>
            {t("stats.noDataDesc", { defaultValue: "Bu dönemde dinleme kaydı bulunamadı" })}
          </Text>
        </View>
      ) : (
        filteredSongs.map((song, index) => (
        <View
          key={song.id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingVertical: hp(0.8),
          }}
        >
          <View style={{ width: wp(7) }}>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(12),
                fontWeight: "600",
              }}
            >
              #{index + 1}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: wp(2),
              flex: 1,
            }}
          >
            {song.cover ? (
              <Image
                source={{ uri: song.cover }}
                style={{
                  width: wp(9),
                  height: wp(9),
                  borderRadius: radius(10),
                }}
              />
            ) : (
              <View
                style={{
                  width: wp(9),
                  height: wp(9),
                  borderRadius: radius(10),
                  backgroundColor: colors.overlay.white12,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ color: colors.textSecondary, fontSize: fontSize(10) }}>
                  🎵
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(14),
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize(12),
                }}
                numberOfLines={1}
              >
                {song.artist}
              </Text>
            </View>
          </View>

          <View
            style={{
              alignItems: "flex-end",
              minWidth: wp(12),
            }}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(14),
                fontWeight: "700",
              }}
            >
              {song.plays}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(11),
              }}
            >
              {t("fav.plays", { count: song.plays }).replace(String(song.plays), "").trim() || "plays"}
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(10),
                marginTop: 2,
              }}
            >
              {Math.round((song.plays * song.duration) / 60)} {t("stats.minutesShort")}
            </Text>
          </View>
        </View>
      )))}
    </ChartContainer>
  );
}

