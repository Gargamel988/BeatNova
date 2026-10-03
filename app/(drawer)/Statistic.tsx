import React, { useMemo, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "@/components/ui/view";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { Headphones, Activity, Clock, ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
import { useQueries } from "@tanstack/react-query";
import { formathour } from "@/utils/format";
import { SummaryCard } from "@/components/statistics/SummaryCard";
import { WeeklyChart } from "@/components/statistics/WeeklyChart";
import { MostPlayedSongs } from "@/components/statistics/MostPlayedSongs";
import { HourlyChart } from "@/components/statistics/HourlyChart";
import { GenreChart } from "@/components/statistics/GenreChart";
import { PlaybackHabits } from "@/components/statistics/PlaybackHabits";
import { ReplayScore } from "@/components/statistics/ReplayScore";
import {
  getlisteninghistory,
  getListeningDaily,
  toLocalDateString,
} from "@/services/StatisticServices";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { LoadingState } from "@/components/ui/loading-state";
import { useAds } from "@/providers/AdsProvider";

const WEEKDAY_SHORT = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];



export default function Statistic() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const { showInterstitial } = useAds();

  useEffect(() => {
    showInterstitial('STATS_ENTRY');
  }, []);


  // Tarih aralıkları (yerel saat)
  const ranges = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const dayOfMonth = now.getDate();
    const daysInLastMonth = new Date(y, m, 0).getDate();
    const sevenDaysAgo = new Date(y, m, dayOfMonth - 6);
    const fourteenDaysAgo = new Date(y, m, dayOfMonth - 13);
    const startLastMonth = new Date(y, m - 1, 1);
    return {
      today: toLocalDateString(now),
      dayOfMonth,
      daysInLastMonth,
      thisMonthStart: toLocalDateString(new Date(y, m, 1)),
      lastMonthStart: toLocalDateString(startLastMonth),
      // Geçen ayın "aynı dönemi" (1..bugünün günü)
      lastMonthSamePeriodEnd: toLocalDateString(
        new Date(y, m - 1, Math.min(dayOfMonth, daysInLastMonth))
      ),
      lastMonthEnd: toLocalDateString(new Date(y, m, 0)),
      last7Start: toLocalDateString(sevenDaysAgo),
      prev7Start: toLocalDateString(fourteenDaysAgo),
      fetchFrom: startLastMonth < fourteenDaysAgo ? startLastMonth : fourteenDaysAgo,
    };
  }, []);

  const [listeninghistory, songs, daily] = useQueries({
    queries: [
      {
        queryKey: ["listeninghistory"],
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: ["songs-details"],
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: ["listening-daily", ranges.fetchFrom.toDateString()],
        queryFn: () => getListeningDaily(ranges.fetchFrom),
      },
    ],
  });

  const dailyRows = useMemo(() => daily.data ?? [], [daily.data]);
  const hasDaily = dailyRows.length > 0;

  const { summaryCards } = useMemo(() => {
    const totalListeningTime =
      listeninghistory.data?.reduce((acc, item) => acc + (item.total_seconds || 0), 0) || 0;

    const sumWhere = (
      pick: (r: (typeof dailyRows)[number]) => number,
      from: string,
      to: string
    ) =>
      dailyRows.reduce(
        (acc, r) => (r.day >= from && r.day <= to ? acc + (pick(r) || 0) : acc),
        0
      );

    const pctDelta = (cur: number, prev: number) => {
      if (cur === 0 && prev === 0) return undefined;
      if (prev === 0) return "Yeni";
      const pct = Math.round(((cur - prev) / prev) * 100);
      return `${pct >= 0 ? "+" : ""}${pct}%`;
    };

    const dayLabel = (iso: string) => {
      const [yy, mm, dd] = iso.split("-").map(Number);
      return new Date(yy, mm - 1, dd).toLocaleDateString("tr-TR", { weekday: "long" });
    };

    if (!hasDaily) {
      // Günlük veri henüz yok: kümülatif (tüm zamanlar) değerleri göster, fark gösterme
      const playedSongs =
        listeninghistory.data?.reduce((acc: number, item: any) => acc + (item.play_count || 0), 0) || 0;
      return {
        summaryCards: [
          { id: "total", label: "Toplam Dinleme", value: formathour(totalListeningTime), subLabel: "Tüm zamanlar", icon: Headphones },
          { id: "playedSongs", label: "Çalınan Şarkı", value: playedSongs, subLabel: "Tüm zamanlar", icon: Activity },
          { id: "mostActiveDay", label: "En Aktif Gün", value: "-", subLabel: "Veri toplanıyor", icon: Clock },
          { id: "daily", label: "Günlük Ortalama", value: "-", subLabel: "Veri toplanıyor", icon: Activity },
        ],
      };
    }

    const r = ranges;
    const secThisMonth = sumWhere((x) => x.seconds, r.thisMonthStart, r.today);
    const secLastSame = sumWhere((x) => x.seconds, r.lastMonthStart, r.lastMonthSamePeriodEnd);
    const secLastFull = sumWhere((x) => x.seconds, r.lastMonthStart, r.lastMonthEnd);
    const playsThisMonth = sumWhere((x) => x.play_count, r.thisMonthStart, r.today);
    const playsLastSame = sumWhere((x) => x.play_count, r.lastMonthStart, r.lastMonthSamePeriodEnd);
    const secLast7 = sumWhere((x) => x.seconds, r.last7Start, r.today);
    const secPrev7 = dailyRows.reduce(
      (acc, x) => (x.day >= r.prev7Start && x.day < r.last7Start ? acc + (x.seconds || 0) : acc),
      0
    );

    // Son 7 günde en çok dinlenen gün
    const perDay = new Map<string, number>();
    dailyRows.forEach((x) => {
      if (x.day >= r.last7Start && x.day <= r.today) {
        perDay.set(x.day, (perDay.get(x.day) ?? 0) + (x.seconds || 0));
      }
    });
    let bestDay: string | null = null;
    let maxSec = -1;
    for (const [d, sec] of Array.from(perDay.entries())) {
      if (sec > maxSec) {
        bestDay = d;
        maxSec = sec;
      }
    }

    const avgThisMonth = secThisMonth / r.dayOfMonth;
    const avgLastMonth = secLastFull / r.daysInLastMonth;

    return {
      summaryCards: [
        {
          id: "total",
          label: "Toplam Dinleme",
          value: formathour(secThisMonth),
          subLabel: "Bu ay • geçen ayın aynı dönemine göre",
          delta: pctDelta(secThisMonth, secLastSame),
          icon: Headphones,
        },
        {
          id: "playedSongs",
          label: "Çalınan Şarkı",
          value: playsThisMonth,
          subLabel: "Bu ay • geçen ayın aynı dönemine göre",
          delta: pctDelta(playsThisMonth, playsLastSame),
          icon: Activity,
        },
        {
          id: "mostActiveDay",
          label: "En Aktif Gün",
          value: bestDay ? dayLabel(bestDay) : "-",
          subLabel: "Son 7 gün • önceki 7 güne göre",
          delta: pctDelta(secLast7, secPrev7),
          icon: Clock,
        },
        {
          id: "daily",
          label: "Günlük Ortalama",
          value: formathour(avgThisMonth),
          subLabel: "Bu ay • geçen ay ortalamasına göre",
          delta: pctDelta(avgThisMonth, avgLastMonth),
          icon: Activity,
        },
      ],
    };
  }, [listeninghistory.data, dailyRows, hasDaily, ranges]);

  const weeklyListeningData = useMemo(() => {
    const order = [1, 2, 3, 4, 5, 6, 0]; // Pzt..Paz
    const totals = new Array(7).fill(0);

    if (hasDaily) {
      // Son 7 günün gerçek verisi
      dailyRows.forEach((x) => {
        if (x.day < ranges.last7Start || x.day > ranges.today) return;
        const [yy, mm, dd] = x.day.split("-").map(Number);
        totals[new Date(yy, mm - 1, dd).getDay()] += x.seconds || 0;
      });
    }

    return order.map((idx) => ({ day: WEEKDAY_SHORT[idx], value: totals[idx] }));
  }, [listeninghistory.data, dailyRows, hasDaily, ranges]);



  // Şarkı detaylarını MostPlayedSongs component'ine hazırla
  const songsForMostPlayed = useMemo(() => {
    if (!songs?.data) return [];

    return songs.data.map((song) => ({
      id: song.id,
      title: song.title || "Bilinmeyen Şarkı",
      artist: song.artist || "Bilinmeyen Sanatçı",
      plays: 0,
      duration: song.duration || 0,
      cover: song.cover_url || null,
    }));
  }, [songs.data]);




  const hourlyListeningData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    if (hasDaily) {
      dailyRows.forEach((x) => {
        if (x.hour >= 0 && x.hour < 24) buckets[x.hour].value += x.seconds || 0;
      });
    }
    return buckets;
  }, [listeninghistory.data, dailyRows, hasDaily]);

  // Dinleme geçmişinden genre istatistiklerini hesapla
  const genreData = useMemo(() => {
    if (!listeninghistory.data || !songs.data) {
      return [
        { genre: "Pop", value: 0, color: colors.purpleLight },
        { genre: "Rock", value: 0, color: colors.accent },
        { genre: "Electronic", value: 0, color: colors.blue },
        { genre: "Jazz", value: 0, color: colors.green },
        { genre: "Hip-Hop", value: 0, color: colors.orange },
        { genre: "Diğer", value: 0, color: colors.textMuted },
      ];
    }

    // Şarkı ID'lerine göre tür map'i oluştur
    const songGenreMap = new Map(
      songs.data.map((song) => [
        song.id,
        song.genre || "Diğer"
      ])
    );

    // Genre'lere göre dinleme süresini topla
    const genreTotals = new Map<string, number>();

    listeninghistory.data.forEach((history) => {
      const genre = songGenreMap.get(history.song_id) || "Diğer";
      const currentTotal = genreTotals.get(genre) || 0;
      genreTotals.set(genre, currentTotal + (history.total_seconds || 0));
    });

    // Toplam süreyi hesapla
    const totalSeconds = Array.from(genreTotals.values()).reduce((sum, val) => sum + val, 0);

    // Renkleri ata
    const genreColors: Record<string, string> = {
      "Pop": colors.purpleLight,
      "Rock": colors.accent,
      "Electronic": colors.blue,
      "Jazz": colors.green,
      "Hip-Hop": colors.orange,
      "Diğer": colors.textMuted,
      "Türkçe Pop": "#FF2D55",
      "Anadolu Rock": "#FF9500",
      "Arabesk": "#AF52DE",
      "Rap": "#5856D6",
    };

    const genres = Array.from(genreTotals.entries())
      .map(([genre, seconds]) => ({
        genre,
        value: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
        color: genreColors[genre] || colors.textMuted,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return genres.length > 0 ? genres : [
      { genre: "Veri Yok", value: 100, color: colors.textMuted },
    ];
  }, [listeninghistory.data, songs.data, colors]);

  // Oynatma alışkanlığı verilerini hesapla
  const playbackHabitsData = useMemo(() => {
    if (!listeninghistory.data || !songs.data || listeninghistory.data.length === 0) {
      return {
        averageCompletionRate: 0,
        mostSkippedSongs: [],
      };
    }

    // Şarkı detaylarını map'e çevir
    const songMap = new Map(
      songs.data.map((song) => [
        song.id,
        {
          title: song.title || "Bilinmeyen Şarkı",
          artist: song.artist || "Bilinmeyen Sanatçı",
          duration: song.duration || 0,
        },
      ])
    );

    // Şarkıları grupla ve toplam değerleri hesapla
    const songStatsMap = new Map<
      string,
      {
        title: string;
        artist: string;
        duration: number;
        totalSeconds: number;
        totalPlayCount: number;
        totalSkipCount: number;
      }
    >();

    listeninghistory.data.forEach((history) => {
      const song = songMap.get(history.song_id);
      if (!song || song.duration === 0) return;

      const existing = songStatsMap.get(history.song_id);
      if (existing) {
        existing.totalSeconds += history.total_seconds || 0;
        existing.totalPlayCount += history.play_count || 0;
        existing.totalSkipCount += history.skip_count || 0;
      } else {
        songStatsMap.set(history.song_id, {
          title: song.title,
          artist: song.artist,
          duration: song.duration,
          totalSeconds: history.total_seconds || 0,
          totalPlayCount: history.play_count || 0,
          totalSkipCount: history.skip_count || 0,
        });
      }
    });

    // Her şarkı için tamamlama oranı ve skip oranını hesapla
    const songStats: {
      completionRate: number;
      skipRate: number;
    }[] = [];

    const skippedSongs: {
      title: string;
      artist: string;
      skipCount: number;
    }[] = [];

    songStatsMap.forEach((stats) => {
      const totalPlays = stats.totalPlayCount + stats.totalSkipCount;

      // Tamamlama oranı: dinlenen süre / (şarkı süresi * (çalınma + geçme sayısı))
      let completionRate = 0;
      if (totalPlays > 0 && stats.duration > 0) {
        const expectedSeconds = stats.duration * totalPlays;
        completionRate = Math.min(100, Math.round((stats.totalSeconds / expectedSeconds) * 100));
      }

      // Skip oranı: skip sayısı / toplam çalınma sayısı
      let skipRate = 0;
      if (totalPlays > 0) {
        skipRate = Math.round((stats.totalSkipCount / totalPlays) * 100);
      }

      if (!isNaN(completionRate) && completionRate > 0) {
        songStats.push({ completionRate, skipRate });
      }

      // Skip sayısı 0'dan büyük olan şarkıları ekle
      if (stats.totalSkipCount > 0) {
        skippedSongs.push({
          title: stats.title,
          artist: stats.artist,
          skipCount: stats.totalSkipCount,
        });
      }
    });

    // Ortalama tamamlama oranını hesapla
    const averageCompletionRate =
      songStats.length > 0
        ? Math.round(
          songStats.reduce((sum, s) => sum + s.completionRate, 0) / songStats.length
        )
        : 0;

    // En çok skip yapılan şarkıları sırala (skip sayısına göre)
    const mostSkippedSongs = skippedSongs
      .sort((a, b) => b.skipCount - a.skipCount)
      .slice(0, 5);

    return {
      averageCompletionRate,
      mostSkippedSongs,
    };
  }, [listeninghistory.data, songs.data]);

  const averageCompletionRate = playbackHabitsData.averageCompletionRate;
  const mostSkippedSongs = playbackHabitsData.mostSkippedSongs;

  const replayScores = useMemo(() => {
    if (!listeninghistory.data || !songs.data) return [];

    const songMap = new Map(songs.data.map((s) => [s.id, s]));
    const aggregated = new Map<string, number>();

    listeninghistory.data.forEach((item) => {
      if (item.play_count) {
        aggregated.set(item.song_id, (aggregated.get(item.song_id) || 0) + item.play_count);
      }
    });

    return Array.from(aggregated.entries()).map(([songId, count]) => {
      const song = songMap.get(songId);
      return {
        title: song?.title || "Bilinmeyen Şarkı",
        artist: song?.artist || "Bilinmeyen Sanatçı",
        replayCount: count
      };
    })
      .sort((a, b) => b.replayCount - a.replayCount)
      .slice(0, 5);
  }, [listeninghistory.data, songs.data]);

  if (listeninghistory.isLoading || songs.isLoading || daily.isLoading) {
    return <LoadingState message="İstatistikler yükleniyor..." fullScreen />;
  }

  if (listeninghistory.isError || songs.isError || daily.isError) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: textPrimary, fontSize: fontSize(20), fontWeight: "700", marginBottom: hp(2) }}>Hata Oluştu</Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", paddingHorizontal: wp(10), marginBottom: hp(4) }}>
          Veriler yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </Text>
        <TouchableOpacity
          onPress={() => {
            listeninghistory.refetch();
            songs.refetch();
            daily.refetch();
          }}
          style={{ backgroundColor: colors.primary, paddingHorizontal: wp(6), paddingVertical: hp(1.5), borderRadius: radius(12) }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>Tekrar Dene</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (

    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      {/* Header with Back Button (Sabit) */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: hp(1),
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: wp(11),
            height: wp(11),
            borderRadius: radius(10),
            backgroundColor: cardBg,
            alignItems: "center",
            justifyContent: "center",
            marginRight: wp(3),
            borderWidth: 1,
            borderColor,
          }}
          activeOpacity={0.7}
        >
          <Icon name={ArrowLeft} size={22} color={textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(28),
            fontWeight: "900",
            letterSpacing: -0.5,
            flex: 1,
          }}
        >
          İstatistikler
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: hp(4),
          gap: hp(2.5),
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={listeninghistory.isRefetching || songs.isRefetching || daily.isRefetching}
            onRefresh={() => {
              listeninghistory.refetch();
              songs.refetch();
              daily.refetch();
            }}
            colors={[colors.primary]}
            tintColor={colors.accentForeground}
          />
        }
      >
        {/* Summary cards */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
            rowGap: hp(1.5),
          }}
        >
          {summaryCards.map((card) => (
            <SummaryCard key={card.id} {...card} />
          ))}
        </View>


        {/* Haftalık dinleme */}
        <WeeklyChart data={weeklyListeningData} />

        {/* En çok dinlenen şarkılar */}
        <MostPlayedSongs
          songs={songsForMostPlayed}
          listeningHistory={listeninghistory.data}
          dailyRows={dailyRows}
        />

        {/* En Aktif Dinleme Saatleri */}
        <HourlyChart data={hourlyListeningData} />

        {/* En Çok Dinlediğin Müzik Türleri */}
        <GenreChart data={genreData} />

        {/* Oynatma Alışkanlığı */}
        <PlaybackHabits
          averageCompletionRate={averageCompletionRate}
          mostSkippedSongs={mostSkippedSongs}
        />


        {/* Tekrarlı Dinleme Skoru */}
        <ReplayScore songs={replayScores} />
      </ScrollView>
    </SafeAreaView>
  );
}
