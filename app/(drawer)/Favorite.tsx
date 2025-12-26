import { FlatList, TouchableOpacity } from "react-native";
import React, { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { getFavorites } from "@/services/PlaylistServices";
import useSongsService, { Song } from "@/components/songs/songsService";
import FavoriteSongItem from "@/components/favorites/FavoriteSongItem";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  Heart,
  Search,
  ArrowUpDown,
  Shuffle,
  Play,
  ArrowLeft,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAudioPlayerContext } from "@/providers/player-context";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ScrollView } from "@/components/ui/scroll-view";
import { SearchBar } from "@/components/ui/searchbar";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

type SortOption = "newest" | "popular" | "alphabetical";

export default function Favorite() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const { play, shuffle } = useAudioPlayerContext();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
  const textPrimary = useColor("authPrimaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("alphabetical");

  const { loadSongs } = useSongsService();
  const [favoritesQuery, songsQuery] = useQueries({
    queries: [
      {
        queryKey: ["favorites"],
        queryFn: () => getFavorites(),
      },
      {
        queryKey: ["songs"],
        queryFn: () => loadSongs(),
      },
    ],
  });

  const songs = useMemo(() => songsQuery.data ?? [], [songsQuery.data]);

  const favorites = useMemo(() => {
    if (!favoritesQuery.data || !songs.length) return [];
    const favoriteSongs = favoritesQuery.data
      .map((id: string) => songs.find((song) => song.id === id))
      .filter((song: Song | undefined): song is Song => song !== undefined);
    return favoriteSongs;
  }, [favoritesQuery.data, songs]);

  // Filtered and sorted favorites
  const filteredAndSortedFavorites = useMemo(() => {
    let result = [...favorites];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (song) =>
          song.metadata?.title?.toLowerCase().includes(query) ||
          song.metadata?.artist?.toLowerCase().includes(query) ||
          song.metadata?.album?.toLowerCase().includes(query)
      );
    }

    // Sort
    if (sortOption === "alphabetical") {
      result.sort((a, b) =>
        (a.metadata?.title || "").localeCompare(b.metadata?.title || "", "tr")
      );
    } else if (sortOption === "newest") {
      result.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
    } else if (sortOption === "popular") {
      // Mock: sort by title for now (would need play count data)
      result.sort((a, b) =>
        (a.metadata?.title || "").localeCompare(b.metadata?.title || "", "tr")
      );
    }

    return result;
  }, [favorites, searchQuery, sortOption]);

  if (favoritesQuery.isLoading || songsQuery.isLoading) {
    return <LoadingState message="Favoriler yükleniyor..." fullScreen />;
  }

  if (favoritesQuery.error || songsQuery.error) {
    return (
      <ErrorState
        title="Bir Hata Oluştu"
        message={
          favoritesQuery.error?.message ||
          songsQuery.error?.message ||
          "Favoriler yüklenirken bir hata oluştu"
        }
        onRetry={() => {
          favoritesQuery.refetch();
          songsQuery.refetch();
        }}
      />
    );
  }

  const handlePlayAll = () => {
    if (filteredAndSortedFavorites.length > 0) {
      shuffle(false);
      play(filteredAndSortedFavorites[0], filteredAndSortedFavorites);
    }
  };

  const handleShuffle = () => {
    if (filteredAndSortedFavorites.length > 0) {
      const shuffled = [...filteredAndSortedFavorites].sort(
        () => Math.random() - 0.5
      );
      shuffle(true);
      play(shuffled[0], shuffled);
    }
  };

  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={{
            paddingBottom: hp(15),
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
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
              Favoriler
            </Text>
          </View>
      <SearchBar
        placeholder="Şarkı, sanatçı veya albüm ara..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        leftIcon={
          <Icon name={Search} size={fontSize(18)} color={colors.textMuted} />
        }
        containerStyle={{
          backgroundColor: colors.overlay.white12,
          borderRadius: radius(14),
          borderWidth: 1,
          borderColor: colors.overlay.white15,
          marginTop: hp(2),
        }}
      />
      {/* Play Buttons */}
      {favorites.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            gap: wp(3),
            marginTop: hp(4),
            marginBottom: hp(2),
          }}
        >
          <TouchableOpacity
            onPress={handlePlayAll}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: wp(2),
              backgroundColor: colors.purpleLight,
              borderRadius: radius(14),
              paddingVertical: hp(2),
              borderWidth: 1,
              borderColor: colors.purpleLight,
            }}
          >
            <Icon name={Play} size={fontSize(20)} color={colors.text} />
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(16),
                fontWeight: "700",
              }}
            >
              Çal
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleShuffle}
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: wp(2),
              backgroundColor: colors.overlay.white12,
              borderRadius: radius(14),
              paddingVertical: hp(2),
              borderWidth: 1,
              borderColor: colors.overlay.white15,
            }}
          >
            <Icon name={Shuffle} size={fontSize(20)} color={colors.text} />
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(16),
                fontWeight: "700",
              }}
            >
              Karıştır ve Çal
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search Bar */}

      {/* Sort Options */}
      {favorites.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: hp(2),
            gap: wp(2),
          }}
        >
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: wp(1.5) }}
          >
            <Icon
              name={ArrowUpDown}
              size={fontSize(16)}
              color={colors.textSecondary}
            />
            <Text
              style={{
                color: colors.text,
                fontSize: fontSize(14),
                fontWeight: "600",
                marginRight: wp(2),
              }}
            >
              Sırala:
            </Text>
          </View>
          {(["newest", "popular", "alphabetical"] as SortOption[]).map(
            (option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setSortOption(option)}
                style={{
                  paddingHorizontal: wp(3),
                  paddingVertical: hp(0.8),
                  borderRadius: radius(10),
                  backgroundColor:
                    sortOption === option
                      ? colors.purpleLight
                      : colors.overlay.white12,
                  borderWidth: 1,
                  borderColor:
                    sortOption === option
                      ? colors.purpleLight
                      : colors.overlay.white15,
                }}
              >
                <Text
                  style={{
                    color:
                      sortOption === option
                        ? colors.text
                        : colors.textSecondary,
                    fontSize: fontSize(12),
                    fontWeight: sortOption === option ? "700" : "500",
                  }}
                >
                  {option === "newest"
                    ? "En Yeni"
                    : option === "popular"
                    ? "En Popüler"
                    : "A-Z"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}

      {/* Songs List */}
      {favorites.length === 0 ? (
        <View style={{ marginTop: hp(8) }}>
          <EmptyState
            title="Henüz Favori Yok"
            message="Beğendiğiniz şarkıları favorilere ekleyin"
            icon={Heart}
            fullScreen={false}
          />
        </View>
      ) : filteredAndSortedFavorites.length === 0 ? (
        <View style={{ marginTop: hp(8) }}>
          <EmptyState
            title="Sonuç Bulunamadı"
            message={`"${searchQuery}" için sonuç bulunamadı`}
            icon={Search}
            fullScreen={false}
          />
        </View>
      ) : (
        <View style={{ marginTop: hp(1) }}>
          <FlatList
            data={filteredAndSortedFavorites}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <FavoriteSongItem
                item={item}
                playlist={filteredAndSortedFavorites}
              />
            )}
            contentContainerStyle={{ paddingBottom: hp(2) }}
          />
        </View>
      )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
