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

interface MostPlayedSongsProps {
  songs: readonly Song[];
  listeningHistory?: ListeningHistoryItem[];
}

export function MostPlayedSongs({ songs, listeningHistory = [] }: MostPlayedSongsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("week");
  // Tarih filtresine göre listening history'yi filtrele
  const filteredHistory = React.useMemo(() => {
    if (!listeningHistory || listeningHistory.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case "week":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "all":
      default:
        return listeningHistory;
    }

    return listeningHistory.filter((item) => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate;
    });
  }, [listeningHistory, timeFilter]);

  // Filtrelenmiş verilere göre şarkıları yeniden hesapla
  const filteredSongs = React.useMemo(() => {
    if (!songs || songs.length === 0 || filteredHistory.length === 0) return [];

    // Filtrelenmiş history'yi song_id'ye göre grupla
    const historyBySongId = filteredHistory.reduce(
      (acc, item) => {
        if (!acc[item.song_id]) {
          acc[item.song_id] = {
            total_seconds: 0,
            play_count: 0,
          };
        }
        acc[item.song_id].total_seconds += item.total_seconds || 0;
        acc[item.song_id].play_count += item.play_count || 0;
        return acc;
      },
      {} as Record<string, { total_seconds: number; play_count: number }>
    );

    // Şarkıları history ile birleştir ve çalınma sayısını hesapla
    return songs
      .map((song) => {
        const history = historyBySongId[String(song.id)];
        if (!history || history.total_seconds === 0) return null;

        const playCount =
          song.duration > 0
            ? Math.round(history.total_seconds / song.duration)
            : history.play_count || 0;

        return {
          ...song,
          plays: playCount,
        };
      })
      .filter((song): song is Song => song !== null)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, [songs, filteredHistory]);

  return (
    <ChartContainer
      title="En Çok Dinlenen Şarkılar"
      description="Son dönemde en sık açtığın parçalar"
      style={{ gap: hp(1.2) ,borderWidth: 1, borderColor: colors.overlay.white12}}
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

