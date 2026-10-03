import React, { useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

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
  created_at: string;
  total_seconds: number;
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
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  const filteredSongs = React.useMemo(() => {
    if (!songs || songs.length === 0) return [];

    const historyBySongId: Record<string, { seconds: number; plays: number }> = {};

    if (timeFilter === "all") {
      listeningHistory.forEach((h) => {
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
        if (r.day >= startStr) {
          if (!historyBySongId[r.song_id]) historyBySongId[r.song_id] = { seconds: 0, plays: 0 };
          historyBySongId[r.song_id].seconds += r.seconds || 0;
          historyBySongId[r.song_id].plays += r.play_count || 0;
        }
      });
    }

    return songs
      .map((song) => {
        const stats = historyBySongId[String(song.id)];
        if (!stats) return { ...song, plays: 0 };

        const computedPlays =
          song.duration > 0
            ? Math.round(stats.seconds / song.duration)
            : stats.plays;

        return {
          ...song,
          plays: computedPlays > 0 ? computedPlays : stats.plays,
        };
      })
      .filter((song) => song.plays > 0)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, [songs, listeningHistory, dailyRows, timeFilter]);

  return (
    <ChartContainer
      title="En Çok Dinlenen Şarkılar"
      description="Son dönemde en sık açtığın parçalar"
      style={{ gap: hp(1.2), borderWidth: 1, borderColor: colors.overlay.white12 }}
    >
      <View
        style={{
          flexDirection: "row",
          gap: wp(1),
          marginBottom: hp(0.8),
        }}
      >
        {(["week", "month", "all"] as TimeFilter[]).map((filter) => (
          <TouchableOpacity
            key={filter}
            onPress={() => setTimeFilter(filter)}
            style={{
              paddingHorizontal: wp(1.5),
              paddingVertical: hp(0.4),
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
                color: timeFilter === filter ? colors.foreground : colors.textSecondary,
              }}
            >
              {filter === "week"
                ? "Bu hafta"
                : filter === "month"
                  ? "Bu ay"
                  : "Tüm zamanlar"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredSongs.map((song, index) => (
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
              çalma
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(10),
                marginTop: 2,
              }}
            >
              {Math.round((song.plays * song.duration) / 60)} dk
            </Text>
          </View>
        </View>
      ))}
    </ChartContainer>
  );
}

