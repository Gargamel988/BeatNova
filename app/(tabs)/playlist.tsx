import React, { useMemo, useState, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, TouchableOpacity, FlatList } from "react-native";
import { View } from "@/components/ui/view";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import { Search, Plus, Shuffle, Heart, Play, ArrowRightSquareIcon, ChevronRight, ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import PlaylistModal from "@/components/playlist/PlaylistModal";
import PinnedPlaylistCard from "@/components/playlist/PinnedPlaylistCard";
import PlaylistListItem from "@/components/playlist/PlaylistListItem";
import PlayListPlayModal from "@/components/playlist/PlayListPlayModal";
import SmartPlaylistSection from "@/components/playlist/SmartPlaylistSection";
import SuggestedPlaylistSection from "@/components/playlist/SuggestedPlaylistSection";
import { GalaxyPlaylistCta } from "@/components/playlist/GalaxyPlaylistCta";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getPlaylists } from "@/services/PlaylistServices";
import { useSmartPlaylists } from "@/hooks/useSmartPlaylists";
import { useSuggestedPlaylists } from "@/hooks/useSuggestedPlaylists";
import useSongsService from "@/hooks/useSongsService";
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

type PlaylistTab = "all" | "pinned" | "suggested";

export default function PlaylistsPage() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<PlaylistTab>("all");
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

  const { loadSongs } = useSongsService();
  const { data: deviceSongs = [] } = useQuery({
    queryKey: ["deviceSongs"],
    queryFn: loadSongs,
    staleTime: 5 * 60 * 1000,
  });
  const { data: smartPlaylists = [] } = useSmartPlaylists(deviceSongs);
  const { data: suggestedPlaylists = [] } = useSuggestedPlaylists(deviceSongs);

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
    if (isSearching) {
      return playlists.filter(
        (p) =>
          p.name.toLowerCase().includes(normalizedQuery) ||
          p.mood?.some((mood: string) => mood.toLowerCase().includes(normalizedQuery))
      );
    }

    if (selectedTab === "pinned") {
      return playlists.filter((p) => p.isPinned);
    }

    if (selectedTab === "suggested") {
      return [];
    }

    // "all" sekmesinde: pinned olanlar üstte yatay gösterildiği için listede unpinned olanlar (veya hepsi) listelenir
    const hasPinned = playlists.some((p) => p.isPinned);
    return hasPinned ? playlists.filter((p) => !p.isPinned) : playlists;
  }, [playlists, selectedTab, isSearching, normalizedQuery]);

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
      {/* Title & Stats */}
      <View>
        <Text style={{ color: textPrimary, fontSize: fontSize(28), fontWeight: "800" }}>
          {t("playlist.title")}
        </Text>
        <Text style={{ color: textSecondary, fontSize: fontSize(13), marginTop: hp(0.2) }}>
          {playlists?.length || 0} {t("playlist.playlists")} • {totalSongs} {t("playlists.songs", "şarkı")} • {formatTime(totalDuration)}
        </Text>
      </View>

      {/* Search Input */}
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

      {/* Action Buttons Row */}
      <View style={{ flexDirection: "row", gap: wp(3) }}>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("playlist.newPlaylist")}
          style={{
            flex: 1,
            backgroundColor: accent,
            borderRadius: radius(12),
            paddingVertical: hp(1.2),
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: wp(2),
          }}
          onPress={() => setIsPlaylistModalVisible(true)}
        >
          <Icon name={Plus} size={18} color={accentForeground} />
          <Text style={{ color: accentForeground, fontSize: fontSize(14), fontWeight: "700" }}>
            {t("playlist.newPlaylist")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t("playlist.shuffle")}
          style={{
            flex: 1,
            backgroundColor: cardBg,
            borderRadius: radius(12),
            paddingVertical: hp(1.2),
            minHeight: 44,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: wp(2),
            borderWidth: 1,
            borderColor,
          }}
          onPress={handleRandomPlaylist}
        >
          <Icon name={Shuffle} size={18} color={textPrimary} />
          <Text style={{ color: textPrimary, fontSize: fontSize(14), fontWeight: "700" }}>
            {t("playlist.shuffle")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Segmented Filter Pills */}
      {!isSearching && (
        <View style={{ flexDirection: "row", gap: wp(2), marginVertical: hp(0.5) }}>
          {(
            [
              { id: "all" as const, label: t("playlist.tabAll", "Tümü") },
              {
                id: "pinned" as const,
                label: t("playlist.tabPinned", "Sabitlenenler"),
                badge: pinnedPlaylists?.length,
              },
              {
                id: "suggested" as const,
                label: t("playlist.tabSuggested", "Önerilenler"),
                badge: (suggestedPlaylists.length > 0 ? 1 : 0) + (smartPlaylists.length > 0 ? 1 : 0),
              },
            ]
          ).map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setSelectedTab(tab.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={tab.label}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: wp(4),
                  paddingVertical: hp(0.9),
                  borderRadius: radius(99),
                  backgroundColor: isActive ? accent : cardBg,
                  borderWidth: 1,
                  borderColor: isActive ? accent : borderColor,
                  gap: wp(1.5),
                }}
              >
                <Text
                  style={{
                    color: isActive ? accentForeground : textSecondary,
                    fontSize: fontSize(13),
                    fontWeight: isActive ? "800" : "600",
                  }}
                >
                  {tab.label}
                </Text>
                {tab.badge != null && tab.badge > 0 && (
                  <View
                    style={{
                      paddingHorizontal: wp(1.8),
                      paddingVertical: hp(0.1),
                      borderRadius: radius(99),
                      backgroundColor: isActive
                        ? "rgba(0,0,0,0.18)"
                        : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text
                      style={{
                        color: isActive ? accentForeground : textSecondary,
                        fontSize: fontSize(11),
                        fontWeight: "700",
                      }}
                    >
                      {tab.badge}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* TAB: ALL */}
      {selectedTab === "all" && !isSearching && (
        <>
          {/* Favorites (Beğenilen Şarkılar) Card */}
          <TouchableOpacity
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${t("favorites.title", "Beğenilen Şarkılar")}. ${t("favorites.autoPlaylist", "Otomatik Liste")}`}
            onPress={() => router.push("/favorite" as any)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: wp(3.5),
              borderRadius: radius(16),
              backgroundColor: cardBg,
              borderWidth: 1,
              borderColor,
              gap: wp(3.5),
            }}
          >
            <LinearGradient
              colors={["#8B5CF6", "#6366F1", "#EC4899"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: wp(13),
                height: wp(13),
                borderRadius: radius(12),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={Heart} size={24} color="#FFFFFF" />
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={{ color: textPrimary, fontSize: fontSize(16), fontWeight: "700" }}>
                {t("favorites.title", "Beğenilen Şarkılar")}
              </Text>
              <Text style={{ color: textSecondary, fontSize: fontSize(12), marginTop: 2 }}>
                {t("favorites.autoPlaylist", "Otomatik Liste")} • {t("favorites.title", "Favorilerim")}
              </Text>
            </View>
            <Icon name={ArrowRight} size={25} color={accentForeground} />
          </TouchableOpacity>

          {/* Pinned Playlists Horizontal Carousel (if any) */}
          {pinnedPlaylists && pinnedPlaylists.length > 0 && (
            <>
              <SectionHeader
                title={t("playlist.pinned")}
                subtitle={t("playlist.pinnedSubtitle")}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: wp(3), paddingBottom: hp(0.5) }}
              >
                {pinnedPlaylists.map((playlist) => (
                  <PinnedPlaylistCard key={playlist.id} playlist={playlist} />
                ))}
              </ScrollView>
            </>
          )}

          <SectionHeader
            title={t("playlist.allPlaylists")}
            subtitle={t("playlist.allPlaylistsSubtitle")}
          />
        </>
      )}

      {/* TAB: SUGGESTED */}
      {selectedTab === "suggested" && !isSearching && (
        <View style={{ gap: hp(2) }}>
          {suggestedPlaylists.length > 0 && (
            <SuggestedPlaylistSection playlists={suggestedPlaylists} />
          )}
          {smartPlaylists.length > 0 && (
            <SmartPlaylistSection playlists={smartPlaylists} />
          )}
        </View>
      )}

      {/* TAB: PINNED */}
      {selectedTab === "pinned" && !isSearching && (
        <SectionHeader
          title={t("playlist.pinned")}
          subtitle={t("playlist.pinnedSubtitle")}
        />
      )}

      {/* SEARCHING */}
      {isSearching && (
        <SectionHeader
          title={t("playlist.searchResults")}
          subtitle={t("playlist.searchResultsCount", { count: visiblePlaylists.length })}
        />
      )}
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

    if (selectedTab === "suggested") {
      return null;
    }

    if (selectedTab === "pinned" && !isSearching) {
      return (
        <EmptyState
          title={t("playlist.pinned")}
          message={t("playlist.pinnedSubtitle")}
          icon="playlist"
        />
      );
    }

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
  }, [playlistsLoading, playlistsError, selectedTab, isSearching, searchQuery, refetchPlaylists, t]);

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
      <FlatList
        data={visiblePlaylists}
        renderItem={renderItem}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={header}
        ListFooterComponent={<GalaxyPlaylistCta />}
        ListEmptyComponent={renderEmpty}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: wp(5),
          paddingTop: hp(2),
          paddingBottom: isPlaying ? hp(22) : hp(12),
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