import React, { useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
import { ListeningTrend } from "@/components/statistics/ListeningTrend";
import { ReplayScore } from "@/components/statistics/ReplayScore";
import { getlisteninghistory } from "@/services/StatisticServices";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { getFavorites } from "@/services/PlaylistServices";

export default function Statistic() {
  const { wp, hp , fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
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
    { hour: 0, value: 5 },
    { hour: 1, value: 2 },
    { hour: 2, value: 1 },
    { hour: 3, value: 0 },
    { hour: 4, value: 0 },
    { hour: 5, value: 0 },
    { hour: 6, value: 3 },
    { hour: 7, value: 8 },
    { hour: 8, value: 12 },
    { hour: 9, value: 15 },
    { hour: 10, value: 18 },
    { hour: 11, value: 20 },
    { hour: 12, value: 25 },
    { hour: 13, value: 22 },
    { hour: 14, value: 19 },
    { hour: 15, value: 16 },
    { hour: 16, value: 14 },
    { hour: 17, value: 18 },
    { hour: 18, value: 28 },
    { hour: 19, value: 32 },
    { hour: 20, value: 35 },
    { hour: 21, value: 30 },
    { hour: 22, value: 22 },
    { hour: 23, value: 12 },
  ];

  const genreData = [
    { genre: "Pop", value: 35, color: colors.purpleLight },
    { genre: "Rock", value: 25, color: colors.accent },
    { genre: "Electronic", value: 20, color: colors.blue },
    { genre: "Jazz", value: 12, color: colors.green },
    { genre: "Hip-Hop", value: 8, color: colors.orange },
  ];

  const averageCompletionRate = 68;
  const mostSkippedSongs = [
    { title: "Intro Track", artist: "Various", skipRate: 85 },
    { title: "Ad Break", artist: "Podcast", skipRate: 92 },
    { title: "Old Favorite", artist: "Classic", skipRate: 45 },
  ];

  const replayScores = [
    { title: "Midnight Dreams", artist: "The Neon Lights", replayCount: 5 },
    { title: "Electric Soul", artist: "Luna Nova", replayCount: 4 },
    { title: "Violet Pulse", artist: "Violet Waves", replayCount: 3 },
  ];

  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
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

        {/* Dinleme Trendi */}
        <ListeningTrend data={weeklyListeningData} />

        {/* Tekrarlı Dinleme Skoru */}
        <ReplayScore songs={replayScores} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
