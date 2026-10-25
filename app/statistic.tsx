import React, { useMemo, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "@/components/ui/view";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { Headphones, Activity, Clock, ArrowLeft, Sparkles, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { RefreshControl, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
import { LinearGradient } from "expo-linear-gradient";
import { useQueries } from "@tanstack/react-query";
import WrappedModal from "@/components/statistics/WrappedModal";
import { formathour } from "@/utils/format";
import { getLocalizedArtist, getLocalizedTitle } from "@/utils/audioMetadata";
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
import useSongsService from "@/hooks/useSongsService";
import { LoadingState } from "@/components/ui/loading-state";
import { useAds } from "@/providers/AdsProvider";
import { useTranslation } from "react-i18next";
import {
  getStatsDateRanges,
  calculatePercentageDelta,
  formatDayLabel,
} from "@/utils/stats";
import { queryKeys } from "@/constants/queryKeys";

export default function Statistic() {
  const { t, i18n } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const { showInterstitial } = useAds();
  const { loadSongs } = useSongsService();

  useEffect(() => {
    showInterstitial('STATS_ENTRY');
  }, []);


  const [isWrappedVisible, setIsWrappedVisible] = useState(false);

  // Tarih aralıkları (yerel saat)
  const ranges = useMemo(() => getStatsDateRanges(), []);

  const [listeninghistory, songs, daily, deviceSongsQuery] = useQueries({
    queries: [
      {
        queryKey: queryKeys.statistics.listeningHistory(),
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: queryKeys.songs.details(),
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: queryKeys.statistics.listeningDaily(ranges.fetchFrom.toDateString()),
        queryFn: () => getListeningDaily(ranges.fetchFrom),
      },
      {
        queryKey: queryKeys.songs.all(),
        queryFn: () => loadSongs(),
      },
    ],
  });

  const dailyRows = useMemo(() => daily.data ?? [], [daily.data]);
  const hasDaily = dailyRows.length > 0;

  const deviceSongs = useMemo(() => deviceSongsQuery.data ?? [], [deviceSongsQuery.data]);
  const dbSongs = useMemo(() => songs.data ?? [], [songs.data]);

  // Cihaz şarkıları + Supabase şarkılarını birleştirerek eksiksiz metadata havuzu oluştur
  const mergedSongs = useMemo(() => {
    const dbMap = new Map((dbSongs || []).map((s) => [String(s.id), s]));
    const localMap = new Map((deviceSongs || []).map((s) => [String(s.id), s]));

    // 1. Cihazdaki yerel şarkıları ekle
    const combined = (deviceSongs || []).map((ds) => {
      const fromDb = dbMap.get(String(ds.id));
      return {
        id: String(ds.id),
        title: ds.metadata?.title || ds.filename || "Şarkı",
        artist: ds.metadata?.artist || "Bilinmeyen Sanatçı",
        duration: ds.metadata?.duration || ds.duration || 0,
        cover: ds.metadata?.coverUri || fromDb?.cover_url || null,
        genre: fromDb?.genre || ds.genre || "Diğer",
      };
    });

    // 2. DB'de olup yerelde olmayan şarkıları ekle
    (dbSongs || []).forEach((dbSong) => {
      if (!localMap.has(String(dbSong.id))) {
        combined.push({
          id: String(dbSong.id),
          title: dbSong.title || "Şarkı",
          artist: dbSong.artist || "Bilinmeyen Sanatçı",
          duration: dbSong.duration || 0,
          cover: dbSong.cover_url || null,
          genre: dbSong.genre || "Diğer",
        });
      }
    });

    // 3. Dinleme geçmişinde olup henüz hiçbir listede yer almayan şarkılar için güvenli fallback ekle
    if (listeninghistory.data) {
      const existingIds = new Set(combined.map((c) => c.id));
      listeninghistory.data.forEach((lh) => {
        if (!existingIds.has(String(lh.song_id))) {
          existingIds.add(String(lh.song_id));
          combined.push({
            id: String(lh.song_id),
            title: `Şarkı #${lh.song_id}`,
            artist: "Bilinmeyen Sanatçı",
            duration: 180,
            cover: null,
            genre: "Diğer",
          });
        }
      });
    }

    return combined;
  }, [deviceSongs, dbSongs, listeninghistory.data]);

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

    const pctDelta = (cur: number, prev: number) =>
      calculatePercentageDelta(cur, prev, t("stats.newBadge"));

    const dayLabel = (iso: string) => formatDayLabel(iso, i18n.language);

    if (!hasDaily) {
      // Günlük veri henüz yoksa: dinleme geçmişi üzerinden en aktif günü ve ortalama dinlemeyi hesapla
      const playedSongs =
        listeninghistory.data?.reduce((acc: number, item: any) => acc + (item.play_count || 0), 0) || 0;

      const daySecondsMap = new Map<string, number>();
      listeninghistory.data?.forEach((item) => {
        const dateStr = item.last_played_at || item.created_at;
        if (dateStr) {
          const d = dateStr.slice(0, 10);
          daySecondsMap.set(d, (daySecondsMap.get(d) || 0) + (item.total_seconds || 0));
        }
      });

      let mostActiveDayStr: string | null = null;
      let maxDaySec = -1;
      daySecondsMap.forEach((sec, day) => {
        if (sec > maxDaySec) {
          maxDaySec = sec;
          mostActiveDayStr = day;
        }
      });

      const dayCount = Math.max(1, daySecondsMap.size);
      const avgSec = totalListeningTime / dayCount;

      return {
        summaryCards: [
          { id: "total", label: t("stats.totalListening"), value: formathour(totalListeningTime), subLabel: t("stats.allTime"), icon: Headphones },
          { id: "playedSongs", label: t("stats.playedSongs"), value: playedSongs, subLabel: t("stats.allTime"), icon: Activity },
          { id: "mostActiveDay", label: t("stats.mostActiveDay"), value: mostActiveDayStr ? dayLabel(mostActiveDayStr) : "-", subLabel: t("stats.allTime"), icon: Clock },
          { id: "daily", label: t("stats.dailyAverage"), value: avgSec > 0 ? formathour(avgSec) : "-", subLabel: t("stats.allTime"), icon: Activity },
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
          label: t("stats.totalListening"),
          value: formathour(secThisMonth),
          subLabel: t("stats.thisMonthVsLastSame"),
          delta: pctDelta(secThisMonth, secLastSame),
          icon: Headphones,
        },
        {
          id: "playedSongs",
          label: t("stats.playedSongs"),
          value: playsThisMonth,
          subLabel: t("stats.thisMonthVsLastSame"),
          delta: pctDelta(playsThisMonth, playsLastSame),
          icon: Activity,
        },
        {
          id: "mostActiveDay",
          label: t("stats.mostActiveDay"),
          value: bestDay ? dayLabel(bestDay) : "-",
          subLabel: t("stats.last7VsPrev7"),
          delta: pctDelta(secLast7, secPrev7),
          icon: Clock,
        },
        {
          id: "daily",
          label: t("stats.dailyAverage"),
          value: formathour(avgThisMonth),
          subLabel: t("stats.thisMonthVsLastAvg"),
          delta: pctDelta(avgThisMonth, avgLastMonth),
          icon: Activity,
        },
      ],
    };
  }, [listeninghistory.data, dailyRows, hasDaily, ranges, i18n.language, t]);

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
    } else if (listeninghistory.data && listeninghistory.data.length > 0) {
      // dailyRows henüz toplanmadıysa dinleme geçmişi kayıtlarının günlerine göre dağıt
      listeninghistory.data.forEach((x) => {
        const dateStr = x.last_played_at || x.created_at;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          totals[d.getDay()] += x.total_seconds || 0;
        }
      });
    }

    const getShortDayName = (dayIndex: number) => {
      const baseDate = new Date(2026, 9, 18 + dayIndex);
      return baseDate.toLocaleDateString(i18n.language, { weekday: "short" });
    };

    return order.map((idx) => ({ day: getShortDayName(idx), value: totals[idx] }));
  }, [listeninghistory.data, dailyRows, hasDaily, ranges, i18n.language]);

  // Şarkı detaylarını MostPlayedSongs component'ine hazırla (Cihaz + DB merged)
  const songsForMostPlayed = useMemo(() => {
    return mergedSongs.map((song) => ({
      id: song.id,
      title: getLocalizedTitle(song.title, t),
      artist: getLocalizedArtist(song.artist, t),
      plays: 0,
      duration: song.duration || 0,
      cover: song.cover || null,
    }));
  }, [mergedSongs, t]);

  const hourlyListeningData = useMemo(() => {
    const buckets = Array.from({ length: 24 }, (_, hour) => ({ hour, value: 0 }));
    if (hasDaily) {
      dailyRows.forEach((x) => {
        if (x.hour >= 0 && x.hour < 24) buckets[x.hour].value += x.seconds || 0;
      });
    } else if (listeninghistory.data && listeninghistory.data.length > 0) {
      // dailyRows henüz yoksa dinleme geçmişi saatlerine göre dağıt
      listeninghistory.data.forEach((x) => {
        const dateStr = x.last_played_at || x.created_at;
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const h = d.getHours();
          if (h >= 0 && h < 24) buckets[h].value += x.total_seconds || 0;
        }
      });
    }
    return buckets;
  }, [listeninghistory.data, dailyRows, hasDaily]);

  // Dinleme geçmişinden genre istatistiklerini hesapla
  const genreData = useMemo(() => {
    if (!listeninghistory.data || listeninghistory.data.length === 0) {
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
      mergedSongs.map((song) => [
        song.id,
        song.genre || "Diğer"
      ])
    );

    // Genre'lere göre dinleme süresini topla
    const genreTotals = new Map<string, number>();

    listeninghistory.data.forEach((history) => {
      const genre = songGenreMap.get(String(history.song_id)) || "Diğer";
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
      { genre: t("stats.noData"), value: 100, color: colors.textMuted },
    ];
  }, [listeninghistory.data, mergedSongs, colors, t]);

  // Oynatma alışkanlığı verilerini hesapla
  const playbackHabitsData = useMemo(() => {
    if (!listeninghistory.data || listeninghistory.data.length === 0) {
      return {
        averageCompletionRate: 0,
        mostSkippedSongs: [],
      };
    }

    // Şarkı detaylarını map'e çevir
    const songMap = new Map(
      mergedSongs.map((song) => [
        song.id,
        {
          title: getLocalizedTitle(song.title, t),
          artist: getLocalizedArtist(song.artist, t),
          duration: song.duration || 180,
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
      const song = songMap.get(String(history.song_id)) || {
        title: `Şarkı #${history.song_id}`,
        artist: "Bilinmeyen Sanatçı",
        duration: 180,
      };

      const existing = songStatsMap.get(String(history.song_id));
      if (existing) {
        existing.totalSeconds += history.total_seconds || 0;
        existing.totalPlayCount += history.play_count || 0;
        existing.totalSkipCount += history.skip_count || 0;
      } else {
        songStatsMap.set(String(history.song_id), {
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

      let completionRate = 0;
      if (totalPlays > 0 && stats.duration > 0) {
        const expectedSeconds = stats.duration * totalPlays;
        completionRate = Math.min(100, Math.round((stats.totalSeconds / expectedSeconds) * 100));
      }

      let skipRate = 0;
      if (totalPlays > 0) {
        skipRate = Math.round((stats.totalSkipCount / totalPlays) * 100);
      }

      if (!isNaN(completionRate) && completionRate > 0) {
        songStats.push({ completionRate, skipRate });
      }

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

    // En çok skip yapılan şarkıları sırala
    const mostSkippedSongs = skippedSongs
      .sort((a, b) => b.skipCount - a.skipCount)
      .slice(0, 5);

    return {
      averageCompletionRate,
      mostSkippedSongs,
    };
  }, [listeninghistory.data, mergedSongs, t]);

  const averageCompletionRate = playbackHabitsData.averageCompletionRate;
  const mostSkippedSongs = playbackHabitsData.mostSkippedSongs;

  const replayScores = useMemo(() => {
    if (!listeninghistory.data || listeninghistory.data.length === 0) return [];

    const songMap = new Map(mergedSongs.map((s) => [s.id, s]));
    const aggregated = new Map<string, number>();

    listeninghistory.data.forEach((item) => {
      if (item.play_count) {
        aggregated.set(String(item.song_id), (aggregated.get(String(item.song_id)) || 0) + item.play_count);
      }
    });

    return Array.from(aggregated.entries()).map(([songId, count]) => {
      const song = songMap.get(songId);
      return {
        title: getLocalizedTitle(song?.title || `Şarkı #${songId}`, t),
        artist: getLocalizedArtist(song?.artist || "Bilinmeyen Sanatçı", t),
        replayCount: count
      };
    })
      .sort((a, b) => b.replayCount - a.replayCount)
      .slice(0, 5);
  }, [listeninghistory.data, mergedSongs, t]);

  // Sadece ana dinleme geçmişi sorgusu yüklenirken tam ekran loading göster
  if (listeninghistory.isLoading && !listeninghistory.data) {
    return <LoadingState message={t("stats.loading")} fullScreen />;
  }

  // Sadece dinleme geçmişi tamamen başarısız olursa ve hiç veri yoksa hata ekranı göster
  if (listeninghistory.isError && !listeninghistory.data) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: textPrimary, fontSize: fontSize(20), fontWeight: "700", marginBottom: hp(2) }}>
          {t("common.error", { defaultValue: "Hata Oluştu" })}
        </Text>
        <Text style={{ color: colors.textMuted, textAlign: "center", paddingHorizontal: wp(10), marginBottom: hp(4) }}>
          {t("stats.loadError")}
        </Text>
        <TouchableOpacity
          onPress={() => {
            listeninghistory.refetch();
            songs.refetch();
            daily.refetch();
            deviceSongsQuery.refetch();
          }}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("stats.retry")}
          style={{
            backgroundColor: colors.primary,
            paddingHorizontal: wp(6),
            paddingVertical: hp(1.5),
            borderRadius: radius(12),
            minHeight: 48,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>{t("stats.retry")}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
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
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t("common.back", "Geri")}
          style={{
            width: wp(11),
            height: wp(11),
            borderRadius: radius(10),
            backgroundColor: cardBg,
            alignItems: "center",
            justifyContent: "center",
            marginEnd: wp(3),
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
          {t("stats.title")}
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
            refreshing={
              listeninghistory.isRefetching ||
              songs.isRefetching ||
              daily.isRefetching ||
              deviceSongsQuery.isRefetching
            }
            onRefresh={() => {
              listeninghistory.refetch();
              songs.refetch();
              daily.refetch();
              deviceSongsQuery.refetch();
            }}
            colors={[colors.primary]}
            tintColor={colors.accentForeground}
          />
        }
      >
        {/* BeatNova Wrapped Banner */}
        <TouchableOpacity
          onPress={() => setIsWrappedVisible(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={t("wrapped.bannerTitle", "Müzik Özetin Hazır!")}
          style={{
            borderRadius: radius(16),
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#8A2387", "#E94057", "#F27121"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingHorizontal: wp(4.5),
              paddingVertical: hp(1.8),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <View style={{ flex: 1, gap: hp(0.4), paddingEnd: wp(2) }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                <Icon name={Sparkles} size={18} color="#FFD700" />
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: fontSize(16),
                    fontWeight: "900",
                    letterSpacing: -0.3,
                  }}
                >
                  {t("wrapped.bannerTitle", "Müzik Özetin Hazır!")}
                </Text>
              </View>
              <Text
                style={{
                  color: "rgba(255,255,255,0.9)",
                  fontSize: fontSize(12),
                  fontWeight: "500",
                }}
              >
                {t(
                  "wrapped.bannerSubtitle",
                  "Bu haftanın, ayın ve yılın en iyi ritimlerini keşfet"
                )}
              </Text>
            </View>

            <View
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                paddingHorizontal: wp(3),
                paddingVertical: hp(0.8),
                borderRadius: radius(20),
                flexDirection: "row",
                alignItems: "center",
                gap: wp(1),
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: fontSize(12),
                  fontWeight: "800",
                }}
              >
                {t("wrapped.openButton", "Özetini Gör")}
              </Text>
              <Icon name={ChevronRight} size={14} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

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

      <WrappedModal
        visible={isWrappedVisible}
        onClose={() => setIsWrappedVisible(false)}
      />
    </SafeAreaView>
  );
}
