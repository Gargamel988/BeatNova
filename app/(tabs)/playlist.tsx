import React, { useMemo, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity, FlatList } from "react-native";
import { View } from "@/components/ui/view";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import { Search, Plus, Shuffle, Heart, Play } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import PlaylistModal from "@/components/playlist/PlaylistModal";
import QuickStatCard from "@/components/playlist/QuickStatCard";
import PinnedPlaylistCard from "@/components/playlist/PinnedPlaylistCard";
import PlaylistListItem from "@/components/playlist/PlaylistListItem";
import PlayListPlayModal from "@/components/playlist/PlayListPlayModal";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "@/services/PlaylistServices";
import { formatTime } from "@/utils/format";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useAudioPlayerContext } from "@/providers/player-context";

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const { hp, fontSize } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");

  return (
    <View style={{ marginBottom: hp(1) }}>
      <Text style={{ color: textPrimary, fontSize: fontSize(20), fontWeight: "800" }}>
        {title}
      </Text>
      {subtitle ? (
        <Text style={{ color: textSecondary, fontSize: fontSize(12), marginTop: 4 }}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export default function PlaylistsPage() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [isRandomPlaylistModalVisible, setIsRandomPlaylistModalVisible] = useState(false);
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  const { isPlaying } = useAudioPlayerContext();

  const {
    data: playlists,
    isLoading: playlistsLoading,
    error: playlistsError,
    refetch: refetchPlaylists,
  } = useQuery({
    queryKey: ["playlists"],
    queryFn: () => getPlaylists(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const [randomPlaylist, setRandomPlaylist] = useState<
    NonNullable<typeof playlists>[number] | null
  >(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const totalSongs = useMemo(
    () => playlists?.reduce((acc, p) => acc + (p?.song_count ?? 0), 0) ?? 0,
    [playlists]
  );

  const totalDuration = useMemo(
    () => playlists?.reduce((acc, p) => acc + (Number(p?.duration) || 0), 0) ?? 0,
    [playlists]
  );

  const libraryStats = [
    { label: t("playlist.totalSongs"), value: `${totalSongs}` },
    { label: t("playlist.playlists"), value: `${playlists?.length || 0}` },
    { label: t("playlist.totalDuration"), value: formatTime(totalDuration) },
  ];

  const pinnedPlaylists = useMemo(() => playlists?.filter((p) => p.isPinned), [playlists]);

  const visiblePlaylists = useMemo(() => {
    if (!playlists) return [];
    if (!isSearching) return playlists.filter((p) => !p.isPinned);
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(normalizedQuery) ||
        p.mood?.some((mood: string) => mood.toLowerCase().includes(normalizedQuery))
    );
  }, [playlists, isSearching, normalizedQuery]);

  const handleRandomPlaylist = useCallback(() => {
    const withSongs = playlists?.filter((p) => (p.song_count ?? 0) > 0);
    if (!withSongs || withSongs.length === 0) return;

    setRandomPlaylist(withSongs[Math.floor(Math.random() * withSongs.length)]);
    setIsRandomPlaylistModalVisible(true);
  }, [playlists]);

  // Fonksiyon değil, doğrudan element olarak veriliyor:
  // ListHeaderComponent'e her render'da yeni fonksiyon vermek Input'un
  // yeniden mount olmasına (yazarken klavyenin kapanmasına) yol açar.
  const header = (
    <View style={{ gap: hp(1.5), paddingBottom: hp(1) }}>
      <View>
        <Text style={{ color: textPrimary, fontSize: fontSize(32), fontWeight: "800" }}>
          {t("playlist.title")}
        </Text>
        <Text style={{ color: textSecondary, fontSize: fontSize(14) }}>
          {t("playlist.subtitle_counts", { count: playlists?.length || 0, songs: totalSongs })}
        </Text>
      </View>

      <Input
        placeholder={t("playlist.searchPlaceholder")}
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
        inputStyle={{ color: textPrimary, fontSize: fontSize(15) }}
      />

      <View style={{ flexDirection: "row", gap: wp(3) }}>
        {libraryStats.map((stat) => (
          <QuickStatCard key={stat.label} label={stat.label} value={stat.value} />
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: wp(3) }}>
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
          <Text style={{ color: accentForeground, fontSize: fontSize(15), fontWeight: "700" }}>
            {t("playlist.newPlaylist")}
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
          <Text style={{ color: textPrimary, fontSize: fontSize(15), fontWeight: "700" }}>
            {t("playlist.shuffle")}
          </Text>
        </TouchableOpacity>
      </View>

      {pinnedPlaylists && pinnedPlaylists.length > 0 && !isSearching && (
        <>
          <SectionHeader
            title={t("playlist.pinned")}
            subtitle={t("playlist.pinnedSubtitle")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: wp(3), paddingBottom: hp(1) }}
          >
            {pinnedPlaylists.map((playlist) => (
              <PinnedPlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </ScrollView>
        </>
      )}

      {!isSearching && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push("/favorite" as any)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: wp(4),
            borderRadius: radius(16),
            backgroundColor: cardBg,
            borderWidth: 1,
            borderColor,
            marginBottom: hp(2),
            gap: wp(3.5),
          }}
        >
          <LinearGradient
            colors={["#8B5CF6", "#6366F1", "#EC4899"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: wp(14),
              height: wp(14),
              borderRadius: radius(12),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Heart} size={26} color="#FFFFFF" />
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: textPrimary, fontSize: fontSize(17), fontWeight: "700" }}>
              {t("favorites.title", "Beğenilen Şarkılar")}
            </Text>
            <Text style={{ color: textSecondary, fontSize: fontSize(13), marginTop: 2 }}>
              {t("favorites.autoPlaylist", "Otomatik Liste")} • {t("favorites.title", "Favorilerim")}
            </Text>
          </View>
          <View
            style={{
              width: wp(9),
              height: wp(9),
              borderRadius: radius(99),
              backgroundColor: accent + "22",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Play} size={16} color={accent} />
          </View>
        </TouchableOpacity>
      )}

      <SectionHeader
        title={isSearching ? t("playlist.searchResults") : t("playlist.allPlaylists")}
        subtitle={
          isSearching
            ? t("playlist.searchResultsCount", { count: visiblePlaylists.length })
            : t("playlist.allPlaylistsSubtitle")
        }
      />
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <View style={{ marginBottom: hp(1.5) }}>
        <PlaylistListItem playlist={item} />
      </View>
    ),
    [hp]
  );

  const renderEmpty = useCallback(() => {
    if (playlistsLoading) return <LoadingState message={t("playlist.loading")} />;
    if (playlistsError)
      return (
        <ErrorState
          title={t("playlist.loadError")}
          message={t("playlist.loadErrorDesc")}
          onRetry={() => refetchPlaylists()}
        />
      );

    return (
      <EmptyState
        title={isSearching ? t("playlist.notFound") : t("playlist.noPlaylists")}
        message={
          isSearching
            ? t("playlist.noResultsFor", { query: searchQuery })
            : t("playlist.noPlaylistsDesc")
        }
        icon={isSearching ? "search" : "playlist"}
      />
    );
  }, [playlistsLoading, playlistsError, isSearching, searchQuery, refetchPlaylists, t]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <FlatList
        data={visiblePlaylists}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: isPlaying ? hp(20) : hp(8),
        }}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
      />
      <PlaylistModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
      />
      {randomPlaylist && (
        <PlayListPlayModal
          visible={isRandomPlaylistModalVisible}
          onClose={() => setIsRandomPlaylistModalVisible(false)}
          playlistId={randomPlaylist.id}
          playlistData={randomPlaylist}
          autoPlayShuffled
        />
      )}
    </SafeAreaView>
  );
}