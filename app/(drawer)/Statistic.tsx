import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "@/components/ui/view";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { Headphones, Activity, Clock, ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
import { useQueries } from "@tanstack/react-query";
import { formathour, formatDailyAverage } from "@/utils/format";
import { SummaryCard } from "@/components/statistics/SummaryCard";
import { WeeklyChart } from "@/components/statistics/WeeklyChart";
import { MostPlayedSongs } from "@/components/statistics/MostPlayedSongs";
import { QuickInsights } from "@/components/statistics/QuickInsights";
import { HourlyChart } from "@/components/statistics/HourlyChart";
import { GenreChart } from "@/components/statistics/GenreChart";
import { PlaybackHabits } from "@/components/statistics/PlaybackHabits";
import { ReplayScore } from "@/components/statistics/ReplayScore";
import { getlisteninghistory } from "@/services/StatisticServices";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { getFavorites } from "@/services/PlaylistServices";
import { LoadingState } from "@/components/ui/loading-state";

export default function Statistic() {
  const { wp, hp , fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const textPrimary = useColor("authPrimaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");

  const [listeninghistory, songs, favorites] = useQueries({
    queries: [
      {
        queryKey: ["listeninghistory"],
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: ["songs"],
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: ["favorites"],
        queryFn: () => getFavorites(),
      },
    ],
  });
  const formatday = (day: string) => {
    return new Date(day).toLocaleDateString("tr-TR", { weekday: "long" });
  };

  const totalListeningTime =
    listeninghistory?.data?.reduce((acc, item) => acc + item.total_seconds, 0) || 0;

  const mostActiveDay = listeninghistory?.data?.reduce(
    (
      max: { created_at: string; total_seconds: number } | null,
      item: { created_at: string; total_seconds: number }
    ) => {
      if (!max || (item.total_seconds || 0) > (max.total_seconds || 0)) {
        return item;
      }
      return max;
    },
    null as { day: string; value: number } | null
  );

  const summaryCards = [
    {
      id: "total",
      label: "Toplam Dinleme",
      value: formathour(totalListeningTime),
      subLabel: "Bu ay",
      delta: "+12%",
      icon: Headphones,
    },
    {
      id: "playedSongs",
      label: "Çalınan Şarkı",
      value: listeninghistory?.data?.reduce((acc, item) => acc + item.play_count, 0),
      subLabel: "Bu ay",
      delta: "+4%",
      icon: Activity,
    },
    {
      id: "mostActiveDay",
      label: "En Aktif Gün",
      value: formatday(mostActiveDay?.created_at || "-"),
      subLabel: "Bu hafta",
      delta: "+8%",
      icon: Clock,
    },
    {
      id: "daily",
      label: "Günlük Ortalama",
      value: formatDailyAverage([totalListeningTime]),
      subLabel: "Bu ay",
      delta: "+15%",
      icon: Activity,
    },
  ] as const;

  const weeklyListeningData = useMemo(() => {
    if (!listeninghistory?.data || listeninghistory?.data?.length === 0) return [];

    const groupedByDay = listeninghistory?.data?.reduce(
      (acc, d: { created_at: string; total_seconds: number }) => {
        const day = new Date(d.created_at).toLocaleDateString("tr-TR", {
          weekday: "long",
        });
        if (!acc[day]) {
          acc[day] = 0;
        }
        acc[day] += d.total_seconds || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    const weekday = [
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
      "Pazar",
    ];
    return weekday.map((day) => ({
      day:
        day === "Pazartesi"
          ? "Pzt"
          : day === "Salı"
          ? "Sal"
          : day === "Çarşamba"
          ? "Çar"
          : day === "Perşembe"
          ? "Per"
          : day === "Cuma"
          ? "Cum"
          : day === "Cumartesi"
          ? "Cmt"
          : day === "Pazar"
          ? "Paz"
          : day,
      value: groupedByDay[day] || 0,
    }));
  }, [listeninghistory]);



  // Şarkı detaylarını MostPlayedSongs component'ine hazırla
  const songsForMostPlayed = useMemo(() => {
    if (!songs?.data) return [];
    
    return songs.data.map((song) => ({
      id: song.id,
      title: song.title || "Bilinmeyen Şarkı",
      artist: song.artist || "Bilinmeyen Sanatçı",
      plays: 0, // Component içinde hesaplanacak
      duration: song.duration || 0,
      cover: song.cover_url || null,
    }));
  }, [songs?.data]);

  const quickInsights = [
    {
      id: "favorites",
      label: "Favoriler",
      value: favorites?.data?.length || 0,
      hint: "+5 bu hafta",
    },
    {
      id: "activeDays",
      label: "Aktif Günler",
      value: "24/30",
      hint: "Harika gidiyorsun!",
    },
  ];

  const hourlyListeningData = [
    { hour: 0, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 0).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 1, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 1).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 2, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 2).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 3, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 3).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 4, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 4).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 5, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 5).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 6, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 6).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 7, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 7).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 8, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 8).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 9, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 9).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 10, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 10).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 11, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 11).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 12, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 12).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 13, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 13).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 14, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 14).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 15, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 15).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 16, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 16).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 17, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 17).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 18, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 18).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 19, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 19).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 20, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 20).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 21, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 21).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 22, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 22).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
    { hour: 23, value: listeninghistory?.data?.filter((item) => new Date(item.created_at).getHours() === 23).reduce((acc, item) => acc + item.total_seconds, 0) || 0 },
  ];

  // Genre tahmin fonksiyonu (artist'e göre basit bir tahmin)
  const getGenreFromArtist = (artist: string): string => {
    if (!artist) return "Diğer";
    const artistLower = artist.toLowerCase();
    
    // Türk sanatçılar
    if (artistLower.includes("tarkan") || artistLower.includes("sezen") || artistLower.includes("sertab") || 
        artistLower.includes("ajda") || artistLower.includes("hande") || artistLower.includes("ece")) {
      return "Pop";
    }
    if (artistLower.includes("duman") || artistLower.includes("mor ve ötesi") || artistLower.includes("teoman") ||
        artistLower.includes("şebnem") || artistLower.includes("pinhani") || artistLower.includes("yüksek sadakat")) {
      return "Rock";
    }
    if (artistLower.includes("ceza") || artistLower.includes("sagopa") || artistLower.includes("ezhel") ||
        artistLower.includes("gazapizm") || artistLower.includes("allame") || artistLower.includes("şanışer")) {
      return "Hip-Hop";
    }
    
    // Yabancı sanatçılar
    if (artistLower.includes("weeknd") || artistLower.includes("taylor swift") || artistLower.includes("ed sheeran") ||
        artistLower.includes("dua lipa") || artistLower.includes("billie eilish") || artistLower.includes("post malone")) {
      return "Pop";
    }
    if (artistLower.includes("imagine dragons") || artistLower.includes("coldplay") || artistLower.includes("linkin park") ||
        artistLower.includes("foo fighters") || artistLower.includes("ac/dc") || artistLower.includes("metallica")) {
      return "Rock";
    }
    if (artistLower.includes("drake") || artistLower.includes("kendrick") || artistLower.includes("eminem") ||
        artistLower.includes("travis scott") || artistLower.includes("kanye")) {
      return "Hip-Hop";
    }
    if (artistLower.includes("skrillex") || artistLower.includes("deadmau5") || artistLower.includes("avicii") ||
        artistLower.includes("calvin harris") || artistLower.includes("martin garrix")) {
      return "Electronic";
    }
    if (artistLower.includes("miles davis") || artistLower.includes("john coltrane") || artistLower.includes("ella fitzgerald") ||
        artistLower.includes("louis armstrong") || artistLower.includes("bill evans")) {
      return "Jazz";
    }
    
    return "Diğer";
  };

  // Dinleme geçmişinden genre istatistiklerini hesapla
  const genreData = useMemo(() => {
    if (!listeninghistory?.data || !songs?.data) {
      return [
        { genre: "Pop", value: 0, color: colors.purpleLight },
        { genre: "Rock", value: 0, color: colors.accent },
        { genre: "Electronic", value: 0, color: colors.blue },
        { genre: "Jazz", value: 0, color: colors.green },
        { genre: "Hip-Hop", value: 0, color: colors.orange },
        { genre: "Diğer", value: 0, color: colors.textMuted },
      ];
    }

    // Şarkı ID'lerine göre artist map oluştur
    const songArtistMap = new Map(
      songs.data.map((song) => [song.id, song.artist || "Bilinmeyen Sanatçı"])
    );

    // Genre'lere göre dinleme süresini topla
    const genreTotals = new Map<string, number>();
    
    listeninghistory.data.forEach((history) => {
      const artist = songArtistMap.get(history.song_id) || "Bilinmeyen Sanatçı";
      const genre = getGenreFromArtist(artist);
      const currentTotal = genreTotals.get(genre) || 0;
      genreTotals.set(genre, currentTotal + (history.total_seconds || 0));
    });

    // Toplam süreyi hesapla
    const totalSeconds = Array.from(genreTotals.values()).reduce((sum, val) => sum + val, 0);
    
    // Yüzdelik değerlere çevir
    const genreColors: Record<string, string> = {
      "Pop": colors.purpleLight,
      "Rock": colors.accent,
      "Electronic": colors.blue,
      "Jazz": colors.green,
      "Hip-Hop": colors.orange,
      "Diğer": colors.textMuted,
    };

    const genres = Array.from(genreTotals.entries())
      .map(([genre, seconds]) => ({
        genre,
        value: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 100) : 0,
        color: genreColors[genre] || colors.textMuted,
      }))
      .filter((item) => item.value > 0) // Sadece 0'dan büyük değerleri göster
      .sort((a, b) => b.value - a.value); // Büyükten küçüğe sırala

    return genres.length > 0 ? genres : [
      { genre: "Veri Yok", value: 100, color: colors.textMuted },
    ];
  }, [listeninghistory?.data, songs?.data, colors]);

  // Oynatma alışkanlığı verilerini hesapla
  const playbackHabitsData = useMemo(() => {
    if (!listeninghistory?.data || !songs?.data || listeninghistory.data.length === 0) {
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

      // Tamamlama oranı: dinlenen süre / (şarkı süresi * çalınma sayısı)
      let completionRate = 0;
      if (stats.totalPlayCount > 0 && stats.duration > 0) {
        const expectedSeconds = stats.duration * stats.totalPlayCount;
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
  }, [listeninghistory?.data, songs?.data]);

  const averageCompletionRate = playbackHabitsData.averageCompletionRate;
  const mostSkippedSongs = playbackHabitsData.mostSkippedSongs;

const replayScores = useMemo(() => {
  return listeninghistory?.data?.reduce((acc, item) => {
    if (item.play_count ) {
      const song = songs?.data?.find((song) => song.id === item.song_id);
      if (song) {
        acc.push({ title: song.title || "Bilinmeyen Şarkı", artist: song.artist || "Bilinmeyen Sanatçı", replayCount: item.play_count });
      }
    }
    return acc;
  }, [] as { title: string; artist: string; replayCount: number }[]);
}, [listeninghistory?.data, songs?.data]);
if(listeninghistory?.isLoading || songs?.isLoading || favorites?.isLoading) {

  return <LoadingState message="İstatistikler yükleniyor..." fullScreen />;
}
  return (

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
            paddingBottom: hp(4),
            gap: hp(2.5),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: hp(2),
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
          listeningHistory={listeninghistory?.data}
        />

        {/* Hızlı içgörüler */}
        <QuickInsights insights={quickInsights} />

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
