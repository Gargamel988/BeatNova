import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Modal, TouchableOpacity, Image, FlatList, Alert, Share } from "react-native";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPlaylistSongs,
  deletePlaylist,
  removeSongFromPlaylist,
  reorderPlaylistSongs,
  clonePlaylist,
  getPlaylistShareData,
} from "@/services/PlaylistServices";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import {
  X,
  Play,
  Music2,
  Trash2,
  MoreVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Share2,
  Edit3,
  Shuffle,
  Check,
  ArrowUpDown,
} from "lucide-react-native";
import { useAudioPlayerContext } from "@/providers/player-context";
import { formatTime } from "@/utils/format";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import PlaylistModal from "./PlaylistModal";

export default function PlayListPlayModal({
  visible,
  onClose,
  playlistId,
  playlistData,
  autoPlayShuffled = false,
}: {
  visible: boolean;
  onClose: () => void;
  playlistId: number | string;
  playlistData?: any;
  autoPlayShuffled?: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { palette: colors } = useThemeModeContext();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { play, activeSong, shuffle } = useAudioPlayerContext();
  const hasAutoPlayed = useRef(false);
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");

  // State
  const [isMoreMenuVisible, setIsMoreMenuVisible] = useState(false);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderedSongs, setReorderedSongs] = useState<any[]>([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [isPlaylistEditVisible, setIsPlaylistEditVisible] = useState(false);

  // Playlist silme
  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => deletePlaylist(id),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Playlist başarıyla silindi",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Playlist silinirken bir hata oluştu",
        variant: "error",
      });
    },
  });

  // Şarkı silme (playlistten çıkarma)
  const removeSongMutation = useMutation({
    mutationFn: ({ songId, plId }: { songId: string; plId: number | string }) =>
      removeSongFromPlaylist(songId, plId),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şarkı playlistten çıkarıldı",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["playlistSongs", playlistId] });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Şarkı çıkarılırken hata oluştu",
        variant: "error",
      });
    },
  });

  // Sıralama kaydetme (Optimistic Update ile anında tepki)
  const reorderMutation = useMutation({
    mutationFn: ({ plId, songIds }: { plId: number | string; songIds: string[] }) =>
      reorderPlaylistSongs(plId, songIds),
    onMutate: async ({ plId, songIds }) => {
      // 1. Olası çakışmaları önlemek için devam eden sorguları iptal et
      await queryClient.cancelQueries({ queryKey: ["playlistSongs", plId] });

      // 2. Önceki durumu yedekle
      const previousSongs = queryClient.getQueryData(["playlistSongs", plId]);

      // 3. İstemci önbelleğini iyimser olarak (hemen) güncelle
      queryClient.setQueryData(["playlistSongs", plId], (old: any[] | undefined) =>
        old ? songIds.map((id) => old.find((s) => s.id === id)).filter(Boolean) : old
      );

      // 4. Arayüzü anında normal moda çevir (Kullanıcı beklediğini hissetmez)
      setIsReorderMode(false);
      setHasOrderChanged(false);

      // Rollback için yedeği dön
      return { previousSongs };
    },
    onError: (error: any, { plId }, context) => {
      // Hata durumunda yedeğe geri dön
      if (context?.previousSongs) {
        queryClient.setQueryData(["playlistSongs", plId], context.previousSongs);
      }
      toast({
        title: "Hata",
        description: error.message || "Sıralama kaydedilemedi",
        variant: "error",
      });
    },
    onSettled: (_, __, { plId }) => {
      // Başarı veya başarısızlık durumunda sunucuyla tekrar senkronize ol
      queryClient.invalidateQueries({ queryKey: ["playlistSongs", plId] });
    },
    onSuccess: () => {
      toast({ title: "Başarılı", description: "Şarkı sırası güncellendi", variant: "success" });
    },
  });

  // Klonlama
  const cloneMutation = useMutation({
    mutationFn: (id: number | string) => clonePlaylist(id),
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Playlist kopyalandı",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["playlists"] });
      setIsMoreMenuVisible(false);
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message || "Kopyalama başarısız",
        variant: "error",
      });
    },
  });

  // Şarkıları çek
  const { data: songs, isLoading } = useQuery({
    queryKey: ["playlistSongs", playlistId],
    queryFn: () => getPlaylistSongs(playlistId),
    enabled: !!playlistId && visible,
    staleTime: 2 * 60 * 1000,
  });

  // Reorder modunda şarkıları local state'e aktar
  useEffect(() => {
    if (songs && !isReorderMode) setReorderedSongs(songs);
  }, [songs, isReorderMode]);

  // Modal kapandığında resetle
  useEffect(() => {
    if (!visible) {
      setIsReorderMode(false);
      setHasOrderChanged(false);
      setIsMoreMenuVisible(false);
      hasAutoPlayed.current = false;
    }
  }, [visible]);

  // Toplam süre
  const totalDuration = useMemo(() => {
    const list = isReorderMode ? reorderedSongs : songs;
    return list?.reduce((acc: number, s: any) => acc + (Number(s.duration) || 0), 0) ?? 0;
  }, [songs, reorderedSongs, isReorderMode]);

  // Otomatik karıştırıp çalma
  useEffect(() => {
    if (autoPlayShuffled && visible && songs && songs.length > 0 && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      const playlistSongs = mapSongsToPlayer(songs);
      const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
      if (shuffled.length > 0) {
        play(shuffled[0], shuffled);
        shuffle(true);
      }
    }
  }, [autoPlayShuffled, visible, songs, play, shuffle]);

  // Şarkıyı player formatına çevir
  const mapSongsToPlayer = useCallback((songList: any[]) => {
    return songList.map((song: any) => ({
      id: song.id,
      filename: song.title || "",
      uri: song.audio_url || "",
      mediaType: "audio" as const,
      width: 0,
      height: 0,
      duration: song.duration || 0,
      creationTime: 0,
      modificationTime: 0,
      albumId: song.album || "",
      metadata: {
        title: song.title || "",
        artist: song.artist || "",
        album: song.album || "",
        duration: song.duration || 0,
        coverUri: song.cover_url || null,
      },
    }));
  }, []);

  // Şarkı çal
  const handlePlaySong = useCallback(
    (song: any) => {
      const list = isReorderMode ? reorderedSongs : songs;
      if (!list) return;
      const playlistSongs = mapSongsToPlayer(list);
      const clickedIndex = playlistSongs.findIndex((s) => s.id === song.id);
      play(playlistSongs[clickedIndex], playlistSongs);
    },
    [songs, reorderedSongs, isReorderMode, mapSongsToPlayer, play]
  );

  // Tümünü Çal
  const handlePlayAll = useCallback(() => {
    if (!songs || songs.length === 0) return;
    const playlistSongs = mapSongsToPlayer(songs);
    play(playlistSongs[0], playlistSongs);
  }, [songs, mapSongsToPlayer, play]);

  // Karıştır
  const handleShuffle = useCallback(() => {
    if (!songs || songs.length === 0) return;
    const playlistSongs = mapSongsToPlayer(songs);
    const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
    play(shuffled[0], shuffled);
    shuffle(true);
  }, [songs, mapSongsToPlayer, play, shuffle]);

  // Playlist sil
  const handleDelete = useCallback(() => {
    setIsMoreMenuVisible(false);
    setTimeout(() => {
      Alert.alert(
        "Playlist'i Sil",
        "Bu playlist'i ve içindeki tüm şarkı bağlantılarını silmek istediğinizden emin misiniz?",
        [
          { text: "İptal", style: "cancel" },
          {
            text: "Sil",
            style: "destructive",
            onPress: () => deleteMutation.mutate(playlistId),
          },
        ]
      );
    }, 300);
  }, [playlistId, deleteMutation]);

  // Şarkıyı playlistten çıkar
  const handleRemoveSong = useCallback(
    (songId: string) => {
      Alert.alert("Şarkıyı Çıkar", "Bu şarkıyı playlistten çıkarmak istiyor musun?", [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkar",
          style: "destructive",
          onPress: () => {
            removeSongMutation.mutate({ songId, plId: playlistId });
            // Reorder modundayken local listeden de çıkar
            if (isReorderMode) {
              setReorderedSongs((prev) => prev.filter((s) => s.id !== songId));
            }
          },
        },
      ]);
    },
    [playlistId, removeSongMutation, isReorderMode]
  );

  // handleMoveUp ve handleMoveDown artık gerekli değil (DraggableFlatList kullanılıyor)

  // Sıralamayı kaydet
  const handleSaveOrder = useCallback(() => {
    const songIds = reorderedSongs.map((s) => s.id);
    reorderMutation.mutate({ plId: playlistId, songIds });
  }, [reorderedSongs, playlistId, reorderMutation]);

  // Paylaş
  const handleShare = useCallback(async () => {
    try {
      setIsMoreMenuVisible(false);
      const shareData = await getPlaylistShareData(playlistId);
      await Share.share({
        message: shareData.text,
        title: shareData.title,
      });
    } catch (error: any) {
      if (error.message !== "User did not share") {
        toast({
          title: "Hata",
          description: "Paylaşma sırasında hata oluştu",
          variant: "error",
        });
      }
    }
  }, [playlistId, toast]);

  // Kopyala
  const handleClone = useCallback(() => {
    cloneMutation.mutate(playlistId);
  }, [playlistId, cloneMutation]);

  // Düzenle
  const handleEdit = useCallback(() => {
    setIsMoreMenuVisible(false);
    setTimeout(() => setIsPlaylistEditVisible(true), 300);
  }, []);

  // Sıralama modunu aç
  const handleReorderMode = useCallback(() => {
    setIsMoreMenuVisible(false);
    setTimeout(() => {
      if (songs) setReorderedSongs([...songs]);
      setIsReorderMode(true);
      setHasOrderChanged(false);
    }, 300);
  }, [songs]);

  const displaySongs = isReorderMode ? reorderedSongs : songs;
  const playlistName = playlistData?.name || "Playlist Şarkıları";

  // Şarkı item'ı renderla
  const renderSongItem = useCallback(
    ({ item, getIndex, drag, isActive: isDragging }: any) => {
      const index = getIndex ? getIndex() : 0;
      const isActive = activeSong?.id === item.id;
      const hasCover = item.cover_url && item.cover_url.trim() !== "";

      const content = (
        <TouchableOpacity
          onPress={() => !isReorderMode && handlePlaySong(item)}
          onLongPress={isReorderMode ? drag : undefined}
          activeOpacity={isReorderMode ? 1 : 0.7}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: wp(4),
            paddingVertical: hp(1.2),
            backgroundColor: isActive
              ? colors.overlay?.purple30 || "rgba(147, 51, 234, 0.3)"
              : "transparent",
            marginHorizontal: wp(2),
            marginVertical: hp(0.4),
            borderRadius: radius(12),
          }}
        >
          {/* Reorder kontrolü */}
          {isReorderMode && (
            <TouchableOpacity
              onPressIn={drag}
              style={{
                marginRight: wp(3),
                padding: wp(1),
              }}
            >
              <Icon name={ArrowUpDown} size={wp(5)} color={accent} />
            </TouchableOpacity>
          )}

          {/* Numara */}
          {!isReorderMode && (
            <View style={{ width: wp(8), alignItems: "center" }}>
              {isActive ? (
                <Icon name={Play} size={wp(5)} color={accent} />
              ) : (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(14),
                    fontWeight: "600",
                  }}
                >
                  {index + 1}
                </Text>
              )}
            </View>
          )}

          {/* Kapak */}
          <View style={{ marginRight: wp(3) }}>
            {hasCover ? (
              <Image
                source={{ uri: item.cover_url }}
                style={{
                  width: wp(13),
                  height: wp(13),
                  borderRadius: radius(10),
                }}
                resizeMode="cover"
              />
            ) : (
              <LinearGradient
                colors={
                  (colors.gradient?.coverArt as [string, string]) || [
                    "#a855f7",
                    "#ec4899",
                  ]
                }
                style={{
                  width: wp(13),
                  height: wp(13),
                  borderRadius: radius(10),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Music2} size={wp(6)} color="#FFFFFF" />
              </LinearGradient>
            )}
          </View>

          {/* Bilgi */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: isActive ? accent : textPrimary,
                fontSize: fontSize(15),
                fontWeight: "700",
                marginBottom: hp(0.2),
              }}
              numberOfLines={1}
            >
              {item.title || "Bilinmeyen Şarkı"}
            </Text>
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(13),
              }}
              numberOfLines={1}
            >
              {item.artist || "Bilinmeyen Sanatçı"}
            </Text>
          </View>

          {/* Süre */}
          {!isReorderMode && (
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(12),
                marginLeft: wp(2),
                marginRight: wp(1),
              }}
            >
              {formatTime(item.duration || 0)}
            </Text>
          )}

          {/* Sil butonu */}
          <TouchableOpacity
            onPress={() => handleRemoveSong(item.id)}
            disabled={removeSongMutation.isPending}
            style={{
              padding: wp(2),
              borderRadius: radius(8),
              backgroundColor: (colors.red || "#ef4444") + "15",
            }}
          >
            <Icon
              name={Trash2}
              size={wp(4.5)}
              color={colors.red || "#ef4444"}
            />
          </TouchableOpacity>
        </TouchableOpacity>
      );

      return isReorderMode ? <ScaleDecorator>{content}</ScaleDecorator> : content;
    },
    [
      activeSong,
      isReorderMode,
      displaySongs,
      handlePlaySong,
      handleRemoveSong,
      removeSongMutation.isPending,
      colors,
      textPrimary,
      textSecondary,
      accent,
      wp,
      hp,
      fontSize,
      radius,
    ]
  );

  // More menü aksiyonları
  const menuActions = useMemo(
    () => [
      {
        icon: Edit3,
        label: "Bilgileri Düzenle",
        description: "Playlist adı, açıklama ve etiketlerini güncelle",
        color: accent,
        onPress: handleEdit,
      },
      {
        icon: ArrowUpDown,
        label: "Sırayı Değiştir",
        description: "Şarkıların sırasını yeniden düzenle",
        color: colors.blue || "#3b82f6",
        onPress: handleReorderMode,
      },
      {
        icon: Copy,
        label: "Kopyala (Klonla)",
        description: "Bu playlistin bir kopyasını oluştur",
        color: colors.green || "#22c55e",
        onPress: handleClone,
        loading: cloneMutation.isPending,
      },
      {
        icon: Share2,
        label: "Paylaş",
        description: "Playlist şarkı listesini paylaş",
        color: colors.blue || "#3b82f6",
        onPress: handleShare,
      },
      {
        icon: Trash2,
        label: "Playlist'i Sil",
        description: "Playlist'i ve tüm bağlantıları kalıcı olarak sil",
        color: colors.red || "#ef4444",
        onPress: handleDelete,
      },
    ],
    [
      accent,
      colors,
      handleEdit,
      handleReorderMode,
      handleClone,
      handleShare,
      handleDelete,
      cloneMutation.isPending,
    ]
  );

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: wp(5),
            paddingVertical: hp(2),
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(22),
                fontWeight: "800",
              }}
              numberOfLines={1}
            >
              {playlistName}
            </Text>
            {displaySongs && displaySongs.length > 0 && (
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(13),
                  marginTop: hp(0.3),
                }}
              >
                {displaySongs.length} şarkı • {formatTime(totalDuration)}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: wp(2),
            }}
          >
            {/* Reorder modunda kaydet butonu */}
            {isReorderMode && hasOrderChanged && (
              <TouchableOpacity
                onPress={handleSaveOrder}
                disabled={reorderMutation.isPending}
                style={{
                  backgroundColor: accent,
                  borderRadius: radius(10),
                  paddingHorizontal: wp(3),
                  paddingVertical: wp(2),
                  flexDirection: "row",
                  alignItems: "center",
                  gap: wp(1),
                }}
              >
                <Icon name={Check} size={wp(4.5)} color="#fff" />
                <Text
                  style={{
                    color: "#fff",
                    fontSize: fontSize(13),
                    fontWeight: "700",
                  }}
                >
                  Kaydet
                </Text>
              </TouchableOpacity>
            )}

            {/* Reorder modundan çıkış */}
            {isReorderMode && (
              <TouchableOpacity
                onPress={() => {
                  setIsReorderMode(false);
                  setHasOrderChanged(false);
                  if (songs) setReorderedSongs([...songs]);
                }}
                style={{
                  backgroundColor: cardBg,
                  borderRadius: radius(10),
                  padding: wp(2.5),
                }}
              >
                <Icon name={X} size={wp(5)} color={textPrimary} />
              </TouchableOpacity>
            )}

            {/* Normal mod butonları */}
            {!isReorderMode && (
              <>
                <TouchableOpacity
                  onPress={() => setIsMoreMenuVisible(true)}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(10),
                    padding: wp(2.5),
                  }}
                >
                  <Icon name={MoreVertical} size={wp(5.5)} color={textPrimary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onClose}
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(10),
                    padding: wp(2.5),
                  }}
                >
                  <Icon name={X} size={wp(5.5)} color={textPrimary} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Oynat / Karıştır butonları */}
        {!isReorderMode && displaySongs && displaySongs.length > 0 && (
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: wp(5),
              paddingVertical: hp(1.5),
              gap: wp(3),
            }}
          >
            <TouchableOpacity
              onPress={handlePlayAll}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: wp(2),
                backgroundColor: accent,
                borderRadius: radius(12),
                paddingVertical: hp(1.5),
              }}
            >
              <Icon name={Play} size={wp(5)} color="#fff" />
              <Text
                style={{
                  color: "#fff",
                  fontSize: fontSize(14),
                  fontWeight: "700",
                }}
              >
                Tümünü Çal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShuffle}
              activeOpacity={0.8}
              style={{
                flex: 1,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: wp(2),
                backgroundColor: cardBg,
                borderRadius: radius(12),
                paddingVertical: hp(1.5),
                borderWidth: 1,
                borderColor,
              }}
            >
              <Icon name={Shuffle} size={wp(5)} color={textPrimary} />
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(14),
                  fontWeight: "700",
                }}
              >
                Karıştır
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reorder modu bilgi bandı */}
        {isReorderMode && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: wp(5),
              paddingVertical: hp(1.2),
              backgroundColor: accent + "15",
              gap: wp(2),
            }}
          >
            <Icon name={ArrowUpDown} size={wp(4.5)} color={accent} />
            <Text
              style={{
                color: accent,
                fontSize: fontSize(13),
                fontWeight: "600",
                flex: 1,
              }}
            >
              Uzun basarak veya simgeden tutup sürükle
            </Text>
          </View>
        )}

        {/* İçerik */}
        {isLoading ? (
          <LoadingState message="Şarkılar yükleniyor..." fullScreen />
        ) : displaySongs && displaySongs.length > 0 ? (
          isReorderMode ? (
            <DraggableFlatList
              data={reorderedSongs}
              onDragEnd={({ data }) => {
                setReorderedSongs(data);
                setHasOrderChanged(true);
              }}
              keyExtractor={(item) => item.id?.toString()}
              renderItem={renderSongItem}
              contentContainerStyle={{
                paddingVertical: hp(1),
                paddingBottom: hp(12),
              }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <FlatList
              data={displaySongs}
              renderItem={({ item, index }) => renderSongItem({ item, getIndex: () => index })}
              keyExtractor={(item, index) =>
                item.id?.toString() || index.toString()
              }
              contentContainerStyle={{
                paddingVertical: hp(1),
                paddingBottom: hp(12),
              }}
              showsVerticalScrollIndicator={false}
              removeClippedSubviews={true}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
            />
          )
        ) : (
          <EmptyState
            title="Playlist Boş"
            message="Bu playlist'te henüz şarkı yok"
            icon="playlist"
            fullScreen
          />
        )}
      </SafeAreaView>

      {/* More Menü (BottomSheet) */}
      <BottomSheet
        isVisible={isMoreMenuVisible}
        onClose={() => setIsMoreMenuVisible(false)}
        snapPoints={[0.5, 0.65]}
        title="Playlist İşlemleri"
      >
        <View style={{ gap: hp(1) }}>
          {menuActions.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={action.onPress}
              activeOpacity={0.7}
              disabled={action.loading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                padding: wp(3.5),
                borderRadius: radius(14),
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor,
                gap: wp(3),
                opacity: action.loading ? 0.6 : 1,
              }}
            >
              <View
                style={{
                  width: wp(11),
                  height: wp(11),
                  borderRadius: radius(10),
                  backgroundColor: action.color + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={action.icon} size={wp(5.5)} color={action.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: textPrimary,
                    fontSize: fontSize(15),
                    fontWeight: "700",
                  }}
                >
                  {action.label}
                </Text>
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(12),
                    marginTop: hp(0.2),
                  }}
                >
                  {action.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>

      {/* Playlist Düzenleme Modalı */}
      <PlaylistModal
        visible={isPlaylistEditVisible}
        onClose={() => setIsPlaylistEditVisible(false)}
        editPlaylist={playlistData || null}
      />
      </GestureHandlerRootView>
    </Modal>
  );
}
