import React, { useMemo, useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useAudioPlayerContext } from "@/providers/player-context";
import { useQueries } from "@tanstack/react-query";
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

export default function Index() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { isPlaying, activeSong, play, sleepTimerRemaining, isSleepTimerActive } = useAudioPlayerContext();
  const { loadSongs, getPermissions, requestPermissions } = useSongsService();
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [isSleepTimerModalVisible, setIsSleepTimerModalVisible] = useState(false);
  const [playlist, setPlaylist] = useState<any>(null);
  const [permissionStatus, setPermissionStatus] = useState<string>("loading");

  const palette = {
    primary: useColor("primary"),
    textPrimary: useColor("authPrimaryText"),
    textSecondary: useColor("authSecondaryText"),
    card: useColor("card"),
    border: useColor("border"),
  };

  const formatTimerShort = (seconds: number | null) => {
    if (seconds === null || seconds <= 0) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // İzin durumunu kontrol et
  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const { status, canAskAgain } = await getPermissions();
    if (status === "undetermined" && canAskAgain) {
      const granted = await requestPermissions();
      setPermissionStatus(granted ? "granted" : "denied");
    } else {
      setPermissionStatus(status);
    }
  };

  const handleRequestPermission = async () => {
    const granted = await requestPermissions();
    if (granted) {
      setPermissionStatus("granted");
      deviceSongs.refetch();
    } else {
      setPermissionStatus("denied");
    }
  };

  // Verileri çek
  const queries = useQueries({
    queries: [
      {
        queryKey: ["songs-details"],
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: ["local-songs"],
        queryFn: () => loadSongs(),
        enabled: permissionStatus === "granted",
      },
      {
        queryKey: ["favorites"],
        queryFn: () => getFavorites(),
      },
      {
        queryKey: ["listeninghistory"],
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: ["playlists"],
        queryFn: () => getPlaylists(),
      },
    ],
  });

  const [songsDetails, deviceSongs, favorites, listeningHistory, playlists] = queries;

  // Son çalınan şarkılar
  const recentSongs = useMemo(() => {
    if (!listeningHistory.data || !songsDetails.data) return [];

    const recentHistory = listeningHistory.data
      ?.filter((item: any) => {
        const itemDate = new Date(item.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const uniqueSongIds = new Set<string>();
    return recentHistory
      ?.map((item: any) => {
        const song = songsDetails.data?.find((s: any) => s.id === item.song_id);
        if (song && !uniqueSongIds.has(song.id)) {
          uniqueSongIds.add(song.id);
          return {
            id: song.id,
            assetId: song.id,
            title: song.title,
            artist: song.artist,
            cover: song.cover_url || undefined,
            duration: song.duration,
          };
        }
        return null;
      })
      .filter((song): song is NonNullable<typeof song> => song !== null);
  }, [listeningHistory.data, songsDetails.data]);

  // En çok dinlenen şarkılar
  const popularSongs = useMemo(() => {
    if (!listeningHistory.data || !songsDetails.data) return [];

    const songStats = listeningHistory.data?.reduce((acc: any, item: any) => {
      if (!acc[item.song_id]) {
        acc[item.song_id] = { totalSeconds: 0, playCount: 0 };
      }
      acc[item.song_id].totalSeconds += item.total_seconds || 0;
      acc[item.song_id].playCount += item.play_count || 0;
      return acc;
    }, {} as Record<string, { totalSeconds: number; playCount: number }>);

    const sorted = Object.entries(songStats)
      .sort((a: any, b: any) => b[1].totalSeconds - a[1].totalSeconds)
      .slice(0, 5);

    return sorted
      .map(([songId]) => {
        const song = songsDetails.data?.find((s: any) => s.id === songId);
        if (song) {
          return {
            id: song.id,
            assetId: song.id,
            title: song.title,
            artist: song.artist,
            cover: song.cover_url || undefined,
            duration: song.duration,
          };
        }
        return null;
      })
      .filter((song): song is NonNullable<typeof song> => song !== null);
  }, [listeningHistory.data, songsDetails.data]);
  const isLoading =
    permissionStatus === "loading" ||
    songsDetails.isLoading ||
    (permissionStatus === "granted" && deviceSongs.isLoading) ||
    favorites.isLoading ||
    listeningHistory.isLoading ||
    playlists.isLoading;

  const handlePlaySong = (assetId: string) => {
    if (!deviceSongs.data) return;
    const song = deviceSongs.data?.find((s: any) => s.id === assetId);
    if (song) {
      play(song, deviceSongs.data);
    }
  };

  const handlePlayPlaylist = (playlist: any) => {
    setIsPlaylistModalVisible(true);
    setPlaylist(playlist);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <LoadingState message="Yükleniyor..." fullScreen />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: isPlaying ? hp(12) : hp(2),
        }}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader />

        <View style={{ marginBottom: hp(2) }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: hp(1) }}>
            <Text style={{ fontSize: fontSize(20), fontWeight: "800", color: palette.textPrimary }}>Artık Çalıyor</Text>
            {isSleepTimerActive && (
              <TouchableOpacity
                onPress={() => setIsSleepTimerModalVisible(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: palette.primary + "20",
                  paddingHorizontal: wp(3),
                  paddingVertical: hp(0.6),
                  borderRadius: radius(20),
                  gap: wp(1.5)
                }}
              >
                <Clock size={14} color={palette.primary} />
                <Text style={{ color: palette.primary, fontSize: fontSize(12), fontWeight: "700" }}>
                  {formatTimerShort(sleepTimerRemaining)}
                </Text>
              </TouchableOpacity>
            )}
          </View>
          <NowPlayingCard activeSong={activeSong} />
          {!isSleepTimerActive && isPlaying && (
            <TouchableOpacity
              onPress={() => setIsSleepTimerModalVisible(true)}
              style={{
                marginTop: hp(1),
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: hp(0.8),
                borderWidth: 1,
                borderColor: palette.border,
                borderStyle: 'dashed',
                borderRadius: radius(12),
                gap: wp(2)
              }}
            >
              <Clock size={16} color={palette.textSecondary} />
              <Text style={{ color: palette.textSecondary, fontSize: fontSize(13), fontWeight: "500" }}>
                Uyku Zamanlayıcısı Ayarla
              </Text>
            </TouchableOpacity>
          )}
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
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
        playlistId={playlist?.id}
        autoPlayShuffled={false}
      />

      <SleepTimerModal
        visible={isSleepTimerModalVisible}
        onClose={() => setIsSleepTimerModalVisible(false)}
      />
    </SafeAreaView>
  );
}
