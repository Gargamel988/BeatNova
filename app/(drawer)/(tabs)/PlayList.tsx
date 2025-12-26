import React, { useMemo, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  Search,
  Plus,
  Music2,
  Shuffle,
  Library,
  Timer,
} from "lucide-react-native";
import PlaylistModal from "@/components/playlist/PlaylistModal";
import QuickStatCard from "@/components/playlist/QuickStatCard";
import PinnedPlaylistCard from "@/components/playlist/PinnedPlaylistCard";
import PlaylistListItem from "@/components/playlist/PlaylistListItem";
import PlayListPlayModal from "@/components/playlist/PlayListPlayModal";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "@/services/PlaylistServices";
import { formatTime } from "@/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";

function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onPressAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onPressAction?: () => void;
}) {
  const { wp, fontSize } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");

  return (
    <View
      style={{
        marginBottom: wp(2),
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: textPrimary,
            fontSize: fontSize(20),
            fontWeight: "800",
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
              marginTop: 4,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onPressAction} activeOpacity={0.8}>
          <Text
            style={{
              color: accent,
              fontSize: fontSize(13),
              fontWeight: "600",
            }}
          >
            {actionLabel}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function PlaylistsPage() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [isRandomPlaylistModalVisible, setIsRandomPlaylistModalVisible] = useState(false);
  const [randomPlaylist, setRandomPlaylist] = useState<number>(0);
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");

  const { data: playlists, isLoading: playlistsLoading, error: playlistsError, refetch: refetchPlaylists } = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getPlaylists(),
  });
  const totalSongs = useMemo(
    () =>
      playlists?.reduce(
        (acc, playlist) => acc + (playlist?.song_count ?? 0),
        0
      ) ?? 0,
    [playlists]
  );

  const libraryStats = useMemo(
    () => [
      { label: "Toplam Şarkı", value: `${totalSongs || 0}`, icon: Music2 },
      { label: "Playlist", value: `${playlists?.length || 0}`, icon: Library },
      {
        label: "Toplam Süre",
        value: `${formatTime(
          playlists?.reduce(
            (acc, playlist) => acc + (playlist?.duration ?? 0),
            0
          ) ?? 0
        )}`,
        icon: Timer,
      },
    ],
    [totalSongs, playlists]
  );

  const pinnedPlaylists = useMemo(
    () => playlists?.filter((playlist) => playlist.isPinned),
    [playlists]
  );
  const regularPlaylists = useMemo(
    () => playlists?.filter((playlist) => !playlist.isPinned),
    [playlists]
  );
  const filteredPlaylists = useMemo(
    () =>
      playlists?.filter(
        (playlist) =>
          playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          playlist.mood?.some((mood: string) =>
            mood.toLowerCase().includes(searchQuery.toLowerCase())
          )
      ),
    [searchQuery, playlists]
  );

  const visiblePlaylists = searchQuery ? filteredPlaylists : regularPlaylists;
  const isSearching = searchQuery.trim().length > 0;

  const handleRandomPlaylist = () => {
    // Tüm playlist'lerden seç (sadece şarkısı olanlar)
    const playlistsWithSongs = playlists?.filter((playlist) => (playlist.song_count ?? 0) > 0);
    
    if (!playlistsWithSongs || playlistsWithSongs.length === 0) {
      // Toast veya alert göster - şimdilik sadece return
      return;
    }
    
    const randomIndex = Math.floor(Math.random() * playlistsWithSongs.length);
    const randomPlaylist = playlistsWithSongs[randomIndex];
    
    setRandomPlaylist(randomPlaylist.id);
    setIsRandomPlaylistModalVisible(true);
  };

  return (
    <SafeAreaView style={{ flex: 1, paddingHorizontal: wp(5) }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: hp(2),
          paddingBottom: hp(12),
          gap: hp(1.5),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(32),
              fontWeight: "800",
            }}
          >
            Playlistlerim
          </Text>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(14),
            }}
          >
            {`${playlists?.length || 0} playlist • ${totalSongs || 0} şarkı`}
          </Text>
        </View>

        {/* Search + Quick Add */}

        <Input
          placeholder="Playlist ara..."
          placeholderTextColor={textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          icon={Search}
          containerStyle={{
            backgroundColor: cardBg,
            borderRadius: radius(99),
            borderWidth: 1,
            borderColor,
          }}
          inputStyle={{
            color: textPrimary,
            fontSize: fontSize(15),
          }}
        />

        {/* Quick Stats */}

        <View
          style={{
            flexDirection: "row",
            gap: wp(3),
          }}
        >
          {libraryStats.map((stat) => (
            <QuickStatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
            />
          ))}
        </View>

        {/* Quick Actions */}
        <View
          style={{
            flexDirection: "row",
            gap: wp(3),
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: accent,
              borderRadius: radius(14),
              paddingVertical: hp(2),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: wp(2),
            }}
            onPress={() => setIsPlaylistModalVisible(true)}
          >
            <Icon name={Plus} size={20} color={accentForeground} />
            <Text
              style={{
                color: accentForeground,
                fontSize: fontSize(15),
                fontWeight: "700",
              }}
            >
              Yeni Playlist
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: cardBg,
              borderRadius: radius(14),
              paddingVertical: hp(2),
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: wp(2),
              borderWidth: 1,
              borderColor,
            }}
            onPress={handleRandomPlaylist}
          >
            <Icon name={Shuffle} size={20} color={textPrimary} />
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(15),
                fontWeight: "700",
              }}
            >
              Karıştır
            </Text>
          </TouchableOpacity>
        </View>

        {/* Pinned Playlists */}
        {pinnedPlaylists && pinnedPlaylists.length > 0 && !isSearching && (
          <>
            <SectionHeader
              title="📌 Sabitlenmiş Playlistler"
              subtitle="Sık dinlediklerin burada"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: wp(3) }}
            >
              {pinnedPlaylists.map((playlist) => (
                <PinnedPlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </ScrollView>
          </>
        )}

        {/* All Playlists */}
        <>
          <SectionHeader
            title={isSearching ? "Arama Sonuçları" : "Tüm Playlistler"}
            subtitle={
              isSearching
                ? `${filteredPlaylists?.length || 0} sonuç`
                : "Favori müziklerini listelerde düzenle"
            }
          />

          <View style={{ gap: hp(1.5) }}>
            {visiblePlaylists && visiblePlaylists.map((playlist) => (
              <PlaylistListItem key={playlist.id} playlist={playlist} />
            ))}
          </View>
        </>

        {/* Empty State */}
        {isSearching &&
          (!filteredPlaylists || filteredPlaylists.length === 0) && (
            <EmptyState 
              title="Playlist Bulunamadı"
              message={`"${searchQuery}" için sonuç bulunamadı`}
              icon="search"
            />
          )}

        {/* Loading State */}
        {playlistsLoading && !playlists && (
          <LoadingState message="Playlistler yükleniyor..." />
        )}

        {/* Error State */}
        {playlistsError && (
          <ErrorState 
            title="Playlistler Yüklenemedi"
            message="Playlistler yüklenirken bir hata oluştu."
            onRetry={() => refetchPlaylists()}
          />
        )}
      </ScrollView>
      <PlaylistModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
      />
      <PlayListPlayModal
        visible={isRandomPlaylistModalVisible}
        onClose={() => setIsRandomPlaylistModalVisible(false)}
        playlistId={randomPlaylist}
        autoPlayShuffled={true}
      />
    </SafeAreaView>
  );
}
