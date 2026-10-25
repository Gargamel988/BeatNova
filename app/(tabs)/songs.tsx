import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import useSongsService, { Song } from "@/components/songs/songsService";
import { usePlaylistContext } from "@/providers/playlist-context";
import { useAudioPlayerContext } from "@/providers/player-context";
import { useResponsive } from "@/hooks/useResponsive";
import { getFavorites } from "@/services/PlaylistServices";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useBottomSheet } from "@/components/ui/bottom-sheet";
import { insertSongsBatch } from "@/services/SongsService";
import { useToast } from "@/components/ui/toast";

//components
import SongItem from "@/components/songs/SongItem";
import FilterSheet from "@/components/songs/FilterSheet";
import SortSheet from "@/components/songs/SortSheet";
import SearchAndFilterBar from "@/components/songs/SearchAndFilterBar";

type FilterKey = "favorites" | "downloaded" | "recent" | "hasArtwork";
type SongActionKey = "addToQueue" | "addToPlaylist" | "addToFavorites" | "info" | "remove";

const INITIAL_FILTERS: Record<FilterKey, boolean> = {
  favorites: false,
  downloaded: false,
  recent: false,
  hasArtwork: false,
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const COVER_SYNC_DELAY_MS = 2000;

const matchesQuery = (song: Song, query: string) => {
  if (!query) return true;
  return [
    song.metadata?.title,
    song.metadata?.artist,
    song.metadata?.album,
    song.genre,
    song.energy_level,
    ...(song.mood ?? []),
  ].some((value) => value?.toLowerCase().includes(query));
};

export default function Songs() {
  const { t, i18n } = useTranslation();
  const { hp } = useResponsive();
  const { toast } = useToast();
  const { isPlaying, activeSong } = useAudioPlayerContext();
  const { loadSongs, loadCoversInBackground } = useSongsService();
  const { sortOption, setSortOption, setSortedPlaylist, sortedPlaylist } = usePlaylistContext();

  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filtersState, setFiltersState] = useState<Record<FilterKey, boolean>>(INITIAL_FILTERS);

  // Backend'e gönderilmiş şarkı / kapak id'leri
  const insertedSongIdsRef = useRef<Set<string>>(new Set());
  const syncedCoverIdsRef = useRef<Set<string>>(new Set());

  // handleSongAction'ın kimliği her kuyruk değişiminde değişip tüm satırları
  // yeniden render etmesin diye güncel kuyruğu ref'te tutuyoruz.
  const sortedPlaylistRef = useRef(sortedPlaylist);
  sortedPlaylistRef.current = sortedPlaylist;

  const { mutate: insertSongsBatchMutation } = useMutation({
    mutationFn: (batch: Song[]) => insertSongsBatch(batch),
    onError: (error) => {
      console.error("Toplu şarkı kaydetme sırasında hata oluştu", error);
    },
  });

  const {
    isVisible: isFilterSheetVisible,
    open: openFilterSheet,
    close: closeFilterSheet,
  } = useBottomSheet();

  const {
    isVisible: isSortSheetVisible,
    open: openSortSheet,
    close: closeSortSheet,
  } = useBottomSheet();

  const { data, isLoading, isRefetching, refetch } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: () => loadSongs(),
  });
  const songsData = useMemo(() => data ?? [], [data]);

  const { data: favoritesData } = useQuery<string[]>({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
  });
  const favoriteIds = useMemo(() => new Set(favoritesData ?? []), [favoritesData]);

  // Yeni şarkıları Supabase'e toplu gönder
  useEffect(() => {
    const pending = songsData.filter((song) => !insertedSongIdsRef.current.has(song.id));
    if (!pending.length) return;

    pending.forEach((song) => insertedSongIdsRef.current.add(song.id));
    insertSongsBatchMutation(pending, {
      // Hata olursa bir sonraki veri güncellemesinde tekrar denensin
      onError: () => pending.forEach((song) => insertedSongIdsRef.current.delete(song.id)),
    });
  }, [songsData, insertSongsBatchMutation]);

  // Cihaz şarkılarını state'e al, kapakları arka planda yükle
  useEffect(() => {
    setSongs(songsData);
    if (songsData.length) {
      loadCoversInBackground(songsData, setSongs);
    }
  }, [loadCoversInBackground, songsData]);

  // Kapağı yeni yüklenen şarkıları (debounce ile) toplu senkronize et.
  // Sadece henüz gönderilmemiş kapaklar gider; her güncellemede tüm liste tekrar gönderilmez.
  useEffect(() => {
    const pending = songs.filter(
      (song) =>
        song?.metadata?.coverUri &&
        insertedSongIdsRef.current.has(song.id) &&
        !syncedCoverIdsRef.current.has(song.id)
    );
    if (!pending.length) return;

    const timer = setTimeout(() => {
      pending.forEach((song) => syncedCoverIdsRef.current.add(song.id));
      insertSongsBatchMutation(pending, {
        onError: () => pending.forEach((song) => syncedCoverIdsRef.current.delete(song.id)),
      });
    }, COVER_SYNC_DELAY_MS);

    return () => clearTimeout(timer);
  }, [songs, insertSongsBatchMutation]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setFiltersState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...INITIAL_FILTERS });
  }, []);

  const applySort = useCallback(
    (key: "alphabetical" | "recent" | "duration") => {
      setSortOption(key);
      closeSortSheet();
    },
    [closeSortSheet, setSortOption]
  );

  const displayedSongs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    const activeFilterKeys = (Object.keys(filtersState) as FilterKey[]).filter(
      (key) => filtersState[key]
    );
    const thirtyDaysAgo = Date.now() - THIRTY_DAYS_MS;

    const result = songs.filter((song) => {
      if (!song?.metadata?.title) return false;
      if (!matchesQuery(song, query)) return false;

      return activeFilterKeys.every((key) => {
        switch (key) {
          case "favorites":
            return favoriteIds.has(song.id);
          case "recent":
            return (song.creationTime || 0) * 1000 >= thirtyDaysAgo;
          case "hasArtwork":
            return !!song.metadata?.coverUri;
          default:
            // "downloaded": tüm şarkılar cihazda olduğu için hepsi geçer
            return true;
        }
      });
    });

    // result zaten yeni bir dizi, yerinde sıralamak güvenli
    if (sortOption === "alphabetical") {
      result.sort((a, b) =>
        (a.metadata?.title || "").localeCompare(b.metadata?.title || "", i18n.language)
      );
    } else if (sortOption === "recent") {
      result.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
    } else if (sortOption === "duration") {
      result.sort((a, b) => (b.metadata?.duration || 0) - (a.metadata?.duration || 0));
    }

    return result;
  }, [songs, searchQuery, sortOption, filtersState, favoriteIds, i18n.language]);

  // Sıralanmış listeyi context'e kaydet
  useEffect(() => {
    if (displayedSongs.length > 0) {
      setSortedPlaylist(displayedSongs);
    }
  }, [displayedSongs, setSortedPlaylist]);

  const handleSongUpdate = useCallback((updatedSong: Song) => {
    setSongs((prev) => prev.map((s) => (s.id === updatedSong.id ? updatedSong : s)));
  }, []);

  // Diğer aksiyonlar (addToPlaylist, addToFavorites, info, remove) SongItem içinde yönetiliyor
  const handleSongAction = useCallback(
    (action: SongActionKey, song: Song) => {
      if (action !== "addToQueue") return;

      const queue = sortedPlaylistRef.current;
      if (queue.some((s) => s.id === song.id)) {
        toast({
          title: t("common.warning"),
          description: t("songs.alreadyInQueue"),
          variant: "warning",
        });
        return;
      }

      setSortedPlaylist([...queue, song]);
      toast({
        title: t("common.success"),
        description: t("songs.addedToQueue"),
        variant: "success",
      });
    },
    [setSortedPlaylist, toast, t]
  );

  const renderSong = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        item={item}
        onSongUpdate={handleSongUpdate}
        onSongAction={handleSongAction}
        isActive={activeSong?.id === item.id}
      />
    ),
    [handleSongUpdate, handleSongAction, activeSong?.id]
  );

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <SearchAndFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onFilterPress={openFilterSheet}
        onSortPress={openSortSheet}
      />

      <FilterSheet
        isVisible={isFilterSheetVisible}
        onClose={closeFilterSheet}
        filtersState={filtersState}
        onToggleFilter={toggleFilter}
        onResetFilters={resetFilters}
        onApplyFilters={closeFilterSheet}
      />

      <SortSheet
        isVisible={isSortSheetVisible}
        onClose={closeSortSheet}
        currentSortOption={sortOption}
        onSelectSort={applySort}
      />

      {isLoading && songs.length === 0 ? (
        <LoadingState message={t("songs.loading")} fullScreen />
      ) : songs.length > 0 ? (
        <FlatList
          data={displayedSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={{
            paddingTop: hp(4),
            paddingBottom: isPlaying ? hp(20) : hp(8),
          }}
          showsVerticalScrollIndicator={false}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListEmptyComponent={
            <EmptyState
              title={t("songs.noSongs")}
              message={
                searchQuery
                  ? t("songs.noResultsFor", { query: searchQuery })
                  : t("songs.noSongsDesc")
              }
              icon="music"
            />
          }
        />
      ) : (
        <EmptyState
          title={t("songs.noSongsDevice")}
          message={t("songs.noSongsDeviceDesc")}
          icon="music"
          fullScreen
        />
      )}
    </SafeAreaView>
  );
}