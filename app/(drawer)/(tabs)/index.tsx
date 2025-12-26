import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native";
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
import QuickAccess from "@/components/home/QuickAccess";
import PinnedPlaylists from "@/components/home/PinnedPlaylists";
import RecentSongs from "@/components/home/RecentSongs";
import PopularSongs from "@/components/home/PopularSongs";
import PlayListPlayModal from "@/components/playlist/PlayListPlayModal";

export default function Index() {
  const { wp, hp } = useResponsive();
  const { isPlaying, activeSong, play } = useAudioPlayerContext();
  const { loadSongs } = useSongsService();
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [playlist, setPlaylist] = useState<any>(null);
  // Verileri çek
  const [songsDetails, deviceSongs, favorites, listeningHistory, playlists] = useQueries({
    queries: [
      {
        queryKey: ["songs-details"],
        queryFn: () => getAllSongsWithDetails(),
      },
      {
        queryKey: ["songs"],
        queryFn: () => loadSongs(),
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

  const isLoading = songsDetails.isLoading || deviceSongs.isLoading || favorites.isLoading || listeningHistory.isLoading || playlists.isLoading;


  // Son çalınan şarkılar (listening history'den)
  const recentSongs = useMemo(() => {
    if (!listeningHistory.data || !songsDetails.data) return [];
    
    // Son 7 günün dinleme geçmişini al ve şarkıları eşleştir
    const recentHistory = listeningHistory
      .data?.filter((item: any) => {
        const itemDate = new Date(item.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return itemDate >= sevenDaysAgo;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Şarkıları eşleştir ve benzersiz yap
    const uniqueSongIds = new Set<string>();
    return recentHistory?.map((item: any) => {
      const song = songsDetails.data?.find((s: any) => s.id === item.song_id);
        if (song && !uniqueSongIds.has(song.id)) {
          uniqueSongIds.add(song.id);
          return {
            id: song.id,
            assetId: song.asset_id,
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

    // Şarkı ID'lerine göre toplam dinleme süresini hesapla
    const songStats = listeningHistory.data?.reduce((acc: any, item: any) => {
      if (!acc[item.song_id]) {
        acc[item.song_id] = {
          totalSeconds: 0,
          playCount: 0,
        };
      }
      acc[item.song_id].totalSeconds += item.total_seconds || 0;
      acc[item.song_id].playCount += item.play_count || 0;
      return acc;
    }, {} as Record<string, { totalSeconds: number; playCount: number }>);

    // En çok dinlenenleri sırala
    const sorted = Object.entries(songStats)
      .sort((a: any, b: any) => b[1].totalSeconds - a[1].totalSeconds)
      .slice(0, 5);

    return sorted
      .map(([songId]) => {
        const song = songsDetails.data?.find((s: any) => s.id === songId);
        if (song) {
          return {
            id: song.id,
            assetId: song.asset_id,
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

  // Sabitlenmiş playlist'ler


  const handlePlaySong = (assetId: string) => {
    if (!deviceSongs) return;
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
        <NowPlayingCard activeSong={activeSong} />
        <StatsCards
          totalSongs={songsDetails.data?.length || 0}
          totalPlaylists={playlists.data?.length || 0}
          totalFavorites={favorites.data?.length || 0}
        />
        <QuickAccess
          songsCount={songsDetails.data?.length || 0}
          playlistsCount={playlists.data?.length || 0}
          favoritesCount={favorites.data?.length || 0}
        />
        <PinnedPlaylists playlists={playlists.data?.slice(0, 3) || []} onPlayPlaylist={handlePlayPlaylist} />
        <RecentSongs songs={recentSongs} onPlaySong={handlePlaySong} />
        <PopularSongs songs={popularSongs} onPlaySong={handlePlaySong} />
      </ScrollView>
      <PlayListPlayModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
        playlistId={playlist?.id}
        autoPlayShuffled={false}
      />
    </SafeAreaView>
  );
}
