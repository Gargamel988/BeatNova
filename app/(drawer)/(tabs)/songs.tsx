import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQuery } from "@tanstack/react-query";
import useSongsService, { Song } from "@/components/songs/songsService";
import { usePlaylistContext } from "@/providers/playlist-context";
import { useResponsive } from "@/hooks/useResponsive";
import { getFavorites } from "@/services/PlaylistServices";

import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useBottomSheet } from "@/components/ui/bottom-sheet";
import { insertSong } from "@/services/SongsService";
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

export default function Songs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filtersState, setFiltersState] =
    useState<Record<FilterKey, boolean>>(INITIAL_FILTERS);
  const { loadSongs, loadCoversInBackground } = useSongsService();
  const { sortOption, setSortOption, setSortedPlaylist, sortedPlaylist } = usePlaylistContext();
  const { hp } = useResponsive();
  const { toast } = useToast();
  const insertedSongIdsRef = useRef<Set<string>>(new Set());

  const { mutate: insertSongMutation } = useMutation({
    mutationFn: (song: Song) => insertSong(song),
    onError: (error) => {
      console.error("Şarkı kaydedilirken hata oluştu", error);
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

  const { data, isLoading, refetch } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: () => loadSongs(),
  });
  const songsData = useMemo(() => data ?? [], [data]);

  const { data: favoritesData } = useQuery<string[]>({
    queryKey: ["favorites"],
    queryFn: () => getFavorites(),
  });
  const favorites = useMemo(() => favoritesData ?? [], [favoritesData]);

  useEffect(() => {
    if (!songsData.length) return;

    const pendingSongs = songsData.filter(
      (song) => !insertedSongIdsRef.current.has(song.id)
    );

    if (!pendingSongs.length) return;

    pendingSongs.forEach((song) => {
      insertedSongIdsRef.current.add(song.id);
      insertSongMutation(song);
    });
  }, [songsData, insertSongMutation]);

  useEffect(() => {
    if (songsData.length) {
      setSongs(songsData);
      loadCoversInBackground(songsData, setSongs);
    }
  }, [loadCoversInBackground, songsData, setSongs]);

  // coverUri yüklendikten sonra şarkıları güncelle
  useEffect(() => {
    if (!songs.length) return;

    songs.forEach((song) => {
      // coverUri varsa ve şarkı zaten kaydedilmişse, güncelle
      if (song?.metadata?.coverUri && insertedSongIdsRef.current.has(song.id)) {
        // Şarkı zaten kaydedilmişse, coverUri ile güncelle
        insertSongMutation(song);
      }
    });
  }, [songs, insertSongMutation]);

  const toggleFilter = useCallback((key: FilterKey) => {
    setFiltersState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState({ ...INITIAL_FILTERS });
  }, []);

  const applyFilters = useCallback(() => {
    closeFilterSheet();
  }, [closeFilterSheet]);

  const applySort = useCallback(
    (key: "alphabetical" | "recent" | "duration") => {
      setSortOption(key);
      closeSortSheet();
    },
    [closeSortSheet, setSortOption]
  );

  const displayedSongs = useMemo(() => {
    let filtered = songs.filter((song) => {
      // Metadata kontrolü ekle
      if (!song?.metadata?.title) return false;
      return song.metadata.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    // Apply filters
    const activeFilters = Object.entries(filtersState).filter(([_, isActive]) => isActive);
    
    if (activeFilters.length > 0) {
      filtered = filtered.filter((song) => {
        return activeFilters.every(([filterKey]) => {
          switch (filterKey as FilterKey) {
            case "favorites":
              return favorites.includes(song.id);
            case "downloaded":
              // All songs are on device, so this shows all songs when enabled
              return true;
            case "recent":
              // Show songs added in the last 30 days
              const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
              return (song.creationTime || 0) * 1000 >= thirtyDaysAgo;
            case "hasArtwork":
              return !!song?.metadata?.coverUri;
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    const sorted = [...filtered];
    if (sortOption === "alphabetical") {
      sorted.sort((a, b) => {
        const titleA = a?.metadata?.title || "";
        const titleB = b?.metadata?.title || "";
        return titleA.localeCompare(titleB, "tr");
      });
    } else if (sortOption === "recent") {
      sorted.sort((a, b) => (b.creationTime || 0) - (a.creationTime || 0));
    } else if (sortOption === "duration") {
      sorted.sort(
        (a, b) => (b?.metadata?.duration || 0) - (a?.metadata?.duration || 0)
      );
    }
    return sorted;
  }, [songs, searchQuery, sortOption, filtersState, favorites]);

  // Sıralanmış listeyi context'e kaydet
  useEffect(() => {
    if (displayedSongs.length > 0) {
      setSortedPlaylist(displayedSongs);
    }
  }, [displayedSongs, setSortedPlaylist]);

  

  const handleSongUpdate = useCallback((updatedSong: Song) => {
    setSongs((prevSongs) =>
      prevSongs.map((s) => (s.id === updatedSong.id ? updatedSong : s))
    );
  }, []);

  const handleSongAction = useCallback(
    (action: SongActionKey, song: Song) => {
      switch (action) {
        case "addToQueue":
          if (sortedPlaylist.find(s => s.id === song.id)) {
            toast({
              title: "Uyarı",
              description: "Bu şarkı zaten sırada",
              variant: "warning",
            });
            return;
          }
          setSortedPlaylist([...sortedPlaylist, song]);
          toast({
            title: "Başarılı",
            description: "Şarkı sıraya eklendi",
            variant: "success",
          });
          break;
        case "addToPlaylist":
          // Bu işlem SongItem içinde yapılıyor
          break;
        case "addToFavorites":
          // Bu işlem SongItem içinde yapılıyor
          break;
        case "info":
          // Bu işlem SongItem içinde yapılıyor
          break;
        case "remove":
          // Bu işlem SongItem içinde yapılıyor
          break;
        default:
          break;
      }
    },
    [sortedPlaylist, setSortedPlaylist, toast]
  );

  const renderSong = useCallback(
    ({ item }: { item: Song }) => (
      
      <SongItem
        item={item}
        onSongUpdate={handleSongUpdate}
        onSongAction={handleSongAction}
      />
    ),
    [handleSongUpdate, handleSongAction]
  );

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
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
        onApplyFilters={applyFilters}
      />

      <SortSheet
        isVisible={isSortSheetVisible}
        onClose={closeSortSheet}
        currentSortOption={sortOption}
        onSelectSort={applySort}
      />

      {isLoading && songs.length === 0 ? (
        <LoadingState message="Şarkılar yükleniyor..." fullScreen />
      ) : songs.length > 0 ? (
        <FlatList
          data={displayedSongs}
          keyExtractor={(item) => item.id}
          renderItem={renderSong}
          contentContainerStyle={{ paddingTop: hp(4), paddingBottom: hp(8) }}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          ListEmptyComponent={
            displayedSongs.length === 0 ? (
              <EmptyState 
                title="Şarkı Bulunamadı"
                message={searchQuery ? `"${searchQuery}" için sonuç bulunamadı` : "Henüz şarkı bulunamadı"}
                icon="music"
              />
            ) : null
          }
        />
      ) : (
        <EmptyState 
          title="Henüz Şarkı Bulunamadı"
          message="Cihazınızda müzik dosyası bulunmuyor"
          icon="music"
          fullScreen
        />
      )}
    </SafeAreaView>
  );
}
