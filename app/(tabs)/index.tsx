import React, { useMemo, useState, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useAudioPlayerContext } from "@/providers/player-context";
import { useQuery } from "@tanstack/react-query";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { getPlaylists, getFavorites } from "@/services/PlaylistServices";
import { getlisteninghistory } from "@/services/StatisticServices";
import { LoadingState } from "@/components/ui/loading-state";
import useSongsService from "@/components/songs/songsService";
import HomeHeader from "@/components/home/HomeHeader";
import NowPlayingCard from "@/components/home/NowPlayingCard";
import StatsCards from "@/components/home/StatsCards";
import AIBanner from "@/components/home/AIBanner";
import QuickAccess from "@/components/home/QuickAccess";
import PinnedPlaylists from "@/components/home/PinnedPlaylists";
import RecentSongs from "@/components/home/RecentSongs";
import PopularSongs from "@/components/home/PopularSongs";
import PlayListPlayModal from "@/components/playlist/PlayListPlayModal";
import { useColor } from "@/hooks/useColor";
import { AppBannerAd } from "@/components/AppBannerAd";
import { SleepTimerModal } from "@/components/settings/SleepTimerModal";
import { Clock } from "lucide-react-native";
import { useTranslation } from "react-i18next";

const LIST_LIMIT = 5;
const RECENT_DAYS = 7;

const toSongItem = (song: any) => ({
  id: song.id,
  assetId: song.id,
  title: song.title,
  artist: song.artist,
  cover: song.cover_url || undefined,
  duration: song.duration,
});

const formatTimerShort = (seconds: number | null) => {
  if (seconds === null || seconds <= 0) return "";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

export default function Index() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { isPlaying, activeSong, play, sleepTimerRemaining, isSleepTimerActive } =
    useAudioPlayerContext();
  const { loadSongs, getPermissions, requestPermissions } = useSongsService();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [isSleepTimerModalVisible, setIsSleepTimerModalVisible] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>("loading");

  const palette = {
    primary: useColor("primary"),
    textPrimary: useColor("authPrimaryText"),
    textSecondary: useColor("authSecondaryText"),
    border: useColor("border"),
  };

  // İzin durumunu kontrol et
  useEffect(() => {
    const checkPermission = async () => {
      const { status, canAskAgain } = await getPermissions();
      if (status === "undetermined" && canAskAgain) {
        const granted = await requestPermissions();
        setPermissionStatus(granted ? "granted" : "denied");
      } else {
        setPermissionStatus(status);
      }
    };
    checkPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestPermissions();
    // enabled: permissionStatus === "granted" olduğu için query otomatik çalışır
    setPermissionStatus(granted ? "granted" : "denied");
  };

  // Verileri çek
  const songsDetails = useQuery({
    queryKey: ["songs-details"],
    queryFn: () => getAllSongsWithDetails(),
  });
  const deviceSongs = useQuery({
    queryKey: ["local-songs"],
    queryFn: () => loadSongs(),
    enabled: permissionStatus === "granted",
  });
  const favorites = useQuery({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
  });
  const listeningHistory = useQuery({
    queryKey: ["listeninghistory"],
    queryFn: () => getlisteninghistory(),
  });
  const playlists = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getPlaylists(),
  });

  // id -> şarkı haritası (O(1) erişim)
  const songMap = useMemo(() => {
    const map = new Map<string, any>();
    songsDetails.data?.forEach((s: any) => map.set(s.id, s));
    return map;
  }, [songsDetails.data]);

  // Son çalınan şarkılar (son 7 gün, benzersiz, en yeni 5)
  const recentSongs = useMemo(() => {
    if (!listeningHistory.data || songMap.size === 0) return [];

    const threshold = new Date();
    threshold.setDate(threshold.getDate() - RECENT_DAYS);

    const sortedHistory = listeningHistory.data
      .filter((item: any) => new Date(item.created_at) >= threshold)
      .sort(
        (a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    const seen = new Set<string>();
    const result: ReturnType<typeof toSongItem>[] = [];

    for (const item of sortedHistory) {
      if (result.length >= LIST_LIMIT) break;
      if (seen.has(item.song_id)) continue;
      const song = songMap.get(item.song_id);
      if (!song) continue;
      seen.add(item.song_id);
      result.push(toSongItem(song));
    }

    return result;
  }, [listeningHistory.data, songMap]);

  // En çok dinlenen şarkılar (toplam süreye göre)
  const popularSongs = useMemo(() => {
    if (!listeningHistory.data || songMap.size === 0) return [];

    const totals: Record<string, number> = {};
    for (const item of listeningHistory.data as any[]) {
      totals[item.song_id] = (totals[item.song_id] || 0) + (item.total_seconds || 0);
    }

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([songId]) => songMap.get(songId))
      .filter(Boolean)
      .slice(0, LIST_LIMIT)
      .map(toSongItem);
  }, [listeningHistory.data, songMap]);

  const handlePlaySong = useCallback(
    (assetId: string) => {
      if (!deviceSongs.data) return;
      const song = deviceSongs.data.find((s: any) => s.id === assetId);
      if (song) {
        play(song, deviceSongs.data);
      }
    },
    [deviceSongs.data, play]
  );

  const handlePlayPlaylist = (playlist: any) => {
    setSelectedPlaylistId(playlist?.id ?? null);
  };

  if (permissionStatus === "loading") {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoadingState message={t("home.loading", "Yükleniyor...")} fullScreen />
      </SafeAreaView>
    );
  }

  const showSleepTimerButton = isSleepTimerActive || isPlaying;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["bottom", "top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: isPlaying ? hp(20) : hp(8),
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        {permissionStatus === "denied" && (
          <TouchableOpacity
            onPress={handleRequestPermission}
            style={{
              marginBottom: hp(2),
              padding: wp(4),
              borderWidth: 1,
              borderColor: palette.border,
              borderRadius: radius(12),
            }}
          >
            <Text style={{ color: palette.textPrimary, fontSize: fontSize(14), fontWeight: "700" }}>
              {t("home.permissionTitle", "Müzik erişimi gerekli")}
            </Text>
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: fontSize(12),
                marginTop: hp(0.5),
              }}
            >
              {t("home.permissionAction", "Cihazdaki şarkıları görmek için dokun ve izin ver")}
            </Text>
          </TouchableOpacity>
        )}

        <View style={{ marginBottom: hp(2) }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: hp(1),
            }}
          >
            <Text style={{ fontSize: fontSize(20), fontWeight: "800", color: palette.textPrimary }}>
              {t("home.nowPlaying", "Şimdi Çalıyor")}
            </Text>

            {showSleepTimerButton && (
              <TouchableOpacity
                onPress={() => setIsSleepTimerModalVisible(true)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: palette.primary + "20",
                  paddingHorizontal: wp(3),
                  paddingVertical: hp(0.6),
                  borderRadius: radius(20),
                  gap: wp(1.5),
                }}
              >
                <Clock size={14} color={palette.primary} />
                <Text style={{ color: palette.primary, fontSize: fontSize(12), fontWeight: "700" }}>
                  {isSleepTimerActive
                    ? formatTimerShort(sleepTimerRemaining)
                    : t("home.sleepTimer", "Uyku Zamanlayıcısı")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <NowPlayingCard activeSong={activeSong} />
        </View>

        <StatsCards
          totalSongs={deviceSongs.data?.length || 0}
          totalPlaylists={playlists.data?.length || 0}
          totalFavorites={favorites.data?.length || 0}
        />
        <AIBanner />
        <QuickAccess
          songsCount={deviceSongs.data?.length || 0}
          playlistsCount={playlists.data?.length || 0}
          favoritesCount={favorites.data?.length || 0}
        />
        <AppBannerAd placement="home" style={{ marginVertical: hp(1) }} />
        <PinnedPlaylists
          playlists={playlists.data?.slice(0, 3) || []}
          onPlayPlaylist={handlePlayPlaylist}
        />
        <RecentSongs songs={recentSongs} onPlaySong={handlePlaySong} />
        <PopularSongs songs={popularSongs} onPlaySong={handlePlaySong} />
      </ScrollView>

      <PlayListPlayModal
        visible={selectedPlaylistId !== null}
        onClose={() => setSelectedPlaylistId(null)}
        playlistId={selectedPlaylistId!}
        autoPlayShuffled={false}
      />

      <SleepTimerModal
        visible={isSleepTimerModalVisible}
        onClose={() => setIsSleepTimerModalVisible(false)}
      />
    </SafeAreaView>
  );
}