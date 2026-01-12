import React, { useMemo, useState, useCallback } from "react";
import {
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
import * as MediaLibrary from "expo-media-library";
import {
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  usePopover,
} from "@/components/ui/popover";
import { Song } from "./songsService";
import { useResponsive } from "@/hooks/useResponsive";
import { useAudioPlayerContext } from "@/providers/player-context";
import { usePlaylistContext } from "@/providers/playlist-context";
import { useThemeModeContext } from "@/providers/theme-provider";
import { formatTime } from "@/utils/format";
import {
  MoreVerticalIcon,
  PlayCircle,
  ListPlus,
  Info,
  Trash2,
  Heart,
} from "lucide-react-native";
import AddToPlaylistModal from "./AddToPlaylistModal";
import { PlaylistType } from "@/type/PlaylistType";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/toast";
import {
  addSongToPlaylist,
  getPlaylists,
  addSongToFavorites,
} from "@/services/PlaylistServices";
import { deleteSong } from "@/services/SongsService";
import DetailsSection from "@/components/segmenttabs/DetailsSection";
import { BottomSheet, useBottomSheet } from "@/components/ui/bottom-sheet";

type SongActionKey =
  | "addToQueue"
  | "addToPlaylist"
  | "addToFavorites"
  | "info"
  | "remove";

type SongAction = {
  key: SongActionKey;
  label: string;
  description: string;
  icon: any;
  badgeClass: string;
};

const songActions: SongAction[] = [
  {
    key: "addToQueue",
    label: "Sıraya ekle",
    description: "Bu şarkıyı çalma sırasına ekle",
    icon: PlayCircle,
    badgeClass: "primary",
  },
  {
    key: "addToPlaylist",
    label: "Listeye ekle",
    description: "Özel çalma listene kaydet",
    icon: ListPlus,
    badgeClass: "blue",
  },
  {
    key: "addToFavorites",
    label: "Favorilere ekle",
    description: "Bu şarkıyı favorilerinize ekle",
    icon: Heart,
    badgeClass: "red",
  },
  {
    key: "info",
    label: "Detayları göster",
    description: "Albüm ve sanatçı bilgilerini aç",
    icon: Info,
    badgeClass: "secondary",
  },
  {
    key: "remove",
    label: "Kaldır",
    description: "Cihazından sil",
    icon: Trash2,
    badgeClass: "red",
  },
];

// Helper component for popover actions
function PopoverActionList({
  actions,
  item,
  onSongAction,
  onAddToPlaylist,
  onAddToFavorites,
  onAddToQueue,
  onShowInfo,
  onRemove,
  palette,
  wp,
  hp,
  fontSize,
  radius,
}: {
  actions: typeof songActions;
  item: Song;
  onSongAction: (action: SongActionKey, song: Song) => void;
  onAddToPlaylist: () => void;
  onAddToFavorites: (songId: string) => void;
  onAddToQueue?: () => void;
  onShowInfo?: () => void;
  onRemove?: () => void;
  palette: any;
  wp: any;
  hp: any;
  fontSize: any;
  radius: any;
}) {
  const { setIsOpen } = usePopover();

  const getBadgeColor = (badgeKey: string) => {
    const colorMap: Record<string, string> = {
      primary: palette.primary,
      blue: palette.blue,
      red: palette.red,
      secondary: palette.secondary,
      green: palette.green,
    };
    return colorMap[badgeKey] || palette.primary;
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ gap: wp(2) }}
    >
      {actions.map((action) => {
        const handlePress = () => {
          setIsOpen(false);
          setTimeout(() => {
            switch (action.key) {
              case "addToPlaylist":
                onAddToPlaylist();
                break;
              case "addToFavorites":
                onAddToFavorites(item.id);
                break;
              case "addToQueue":
                onAddToQueue?.();
                break;
              case "info":
                onShowInfo?.();
                break;
              case "remove":
                onRemove?.();
                break;
              default:
                onSongAction(action.key, item);
            }
          }, 200);
        };

        return (
          <TouchableOpacity
            key={action.key}
            className="flex-row items-start"
            style={{
              backgroundColor: palette.popoverCard,
              paddingHorizontal: wp(2.5),
              paddingVertical: hp(1.5),
              gap: wp(2.5),
              borderRadius: radius(12),
            }}
            activeOpacity={0.9}
            onPress={handlePress}
          >
            <View
              style={{
                backgroundColor: getBadgeColor(action.badgeClass) + "40",
                borderRadius: radius(10),
                paddingHorizontal: wp(2.5),
                paddingVertical: hp(1.5),
              }}
            >
              <Icon
                name={action.icon}
                size={fontSize(16)}
                color={getBadgeColor(action.badgeClass)}
              />
            </View>
            <View className="flex-1">
              <Text
                className="font-semibold"
                style={{
                  fontSize: fontSize(14),
                  color: palette.text,
                }}
              >
                {action.label}
              </Text>
              <Text
                style={{
                  fontSize: fontSize(12),
                  color: palette.textMuted,
                }}
              >
                {action.description}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

interface SongItemProps {
  item: Song;
  onSongUpdate: (updatedSong: Song) => void;
  onSongAction: (action: SongActionKey, song: Song) => void;
}

export default function SongItem({
  item,
  onSongUpdate,
  onSongAction,
}: SongItemProps) {
  const [visibleAddToPlaylistModal, setVisibleAddToPlaylistModal] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isVisible: isInfoSheetVisible,
    open: openInfoSheet,
    close: closeInfoSheet,
  } = useBottomSheet();

  const queryClient = useQueryClient();
  const { play, activeSong } = useAudioPlayerContext();
  const { sortedPlaylist, setSortedPlaylist } = usePlaylistContext();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { toast } = useToast();

  const { data: playlistsData, isLoading: playlistsLoading } = useQuery<
    PlaylistType[]
  >({
    queryKey: ["playlists"],
    queryFn: () => getPlaylists(),
    enabled: visibleAddToPlaylistModal,
  });

  const playlists = useMemo(() => playlistsData ?? [], [playlistsData]);
  const { title, artist, duration, coverUri } = item.metadata;
  const hasArtwork = !!coverUri;

  const { mutate: addToPlaylistMutation } = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: number;
    }) => {
      return addSongToPlaylist(songId, playlistId);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla playliste eklendi",
        variant: "success",
      });
      setVisibleAddToPlaylistModal(false);
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });

  const { mutate: addToFavoritesMutation } = useMutation({
    mutationFn: async (songId: string) => {
      return addSongToFavorites(songId);
    },
    onSuccess: (data: any) => {
      toast({
        title: data.success ? "Başarılı" : "Uyarı",
        description: data.message,
        variant: data.success ? "success" : "warning",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });

  const handleImageError = useCallback(() => {
    onSongUpdate({
      ...item,
      metadata: { ...item.metadata, coverUri: undefined },
    });
  }, [item, onSongUpdate]);

  const handleAddToQueue = useCallback(() => {
    if (sortedPlaylist.find((s) => s.id === item.id)) {
      toast({
        title: "Uyarı",
        description: "Bu şarkı zaten sırada",
        variant: "warning",
      });
      return;
    }
    setSortedPlaylist([...sortedPlaylist, item]);
    toast({
      title: "Başarılı",
      description: "Şarkı sıraya eklendi",
      variant: "success",
    });
  }, [item, sortedPlaylist, setSortedPlaylist, toast]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      "Şarkıyı Sil",
      "Bu şarkıyı cihazınızdan silmek istediğinizden emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await MediaLibrary.deleteAssetsAsync([item.id]);

              try {
                await deleteSong(item.id);
              } catch (dbError: any) {
                console.warn("Veritabanından silme hatası:", dbError);
                toast({
                  title: "Uyarı",
                  description:
                    "Şarkı cihazdan silindi ancak veritabanında hata oluştu",
                  variant: "warning",
                });
              }

              toast({
                title: "Başarılı",
                description: "Şarkı silindi",
                variant: "success",
              });
              queryClient.invalidateQueries({ queryKey: ["songs"] });
            } catch (error: any) {
              toast({
                title: "Hata",
                description: error.message || "Şarkı silinirken hata oluştu",
                variant: "error",
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [item.id, toast, queryClient]);

  const isActive = activeSong?.id === item.id;

  const songDetails = useMemo(
    () => [
      { label: "Dosya Adı", value: item.filename || "Bilinmiyor" },
      { label: "Süre", value: duration > 0 ? formatTime(duration) : "—" },
      { label: "Albüm", value: item.metadata?.album || "Bilinmeyen Albüm" },
      { label: "Sanatçı", value: artist || "Bilinmeyen Sanatçı" },
      {
        label: "Oluşturulma",
        value: item.creationTime
          ? new Date(item.creationTime * 1000).toLocaleDateString("tr-TR")
          : "—",
      },
    ],
    [item, duration, artist]
  );

  const handlePlayPress = useCallback(() => {
    play(item, sortedPlaylist.length > 0 ? sortedPlaylist : undefined);
  }, [item, play, sortedPlaylist]);

  return (
    <TouchableOpacity
      style={{
        marginHorizontal: wp(2),
        marginBottom: hp(1),
        borderWidth: wp(0.5),
        borderColor: palette.border,
        borderRadius: radius(12),
        overflow: "hidden",
      }}
      activeOpacity={0.8}
      onPress={handlePlayPress}
      disabled={isDeleting}
    >
      <View
        className="flex-row"
        style={{
          padding: wp(2.5),
          backgroundColor: isActive ? palette.primary : "transparent",
          borderWidth: isActive ? 1 : 0,
          borderColor: isActive ? palette.primary : "transparent",
          borderRadius: radius(12),
          opacity: isDeleting ? 0.5 : 1,
        }}
      >
        {/* Album Artwork */}
        <View style={{ marginRight: wp(3) }}>
          {hasArtwork ? (
            <View className="relative flex-shrink">
              <Image
                source={{ uri: coverUri }}
                style={{
                  width: wp(15),
                  height: wp(15),
                  borderRadius: radius(10),
                }}
                resizeMode="cover"
                onError={handleImageError}
              />
              {isActive && (
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{
                    borderRadius: radius(10),
                    backgroundColor: palette.overlay.purple30,
                  }}
                >
                  <Feather
                    name="play"
                    size={fontSize(28)}
                    color={palette.primary}
                  />
                </View>
              )}
            </View>
          ) : (
            <LinearGradient
              colors={palette.gradient.purplePink as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center justify-center"
              style={{
                width: wp(15),
                height: wp(15),
                borderRadius: radius(10),
              }}
            >
              <Text
                className="text-white font-bold"
                style={{ fontSize: fontSize(24) }}
              >
                {title.charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Song Info */}
        <View className="flex-row items-center justify-between flex-1">
          <View className="flex-col max-w-[85%]">
            <Text
              style={{
                fontSize: fontSize(16),
                fontWeight: "bold",
                color: isActive ? palette.primaryForeground : palette.text,
                marginBottom: hp(1),
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: fontSize(12),
              }}
              numberOfLines={1}
            >
              {artist}
            </Text>
          </View>

          {duration > 0 && (
            <Text
              style={{
                color: palette.textSecondary,
                fontSize: fontSize(12),
              }}
            >
              {formatTime(duration)}
            </Text>
          )}
        </View>

        {/* More Options */}
        <Popover>
          <PopoverTrigger asChild>
            <TouchableOpacity
              className="justify-center"
              style={{ marginLeft: wp(2) }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <Icon
                  name={MoreVerticalIcon}
                  size={fontSize(24)}
                  color={isActive ? palette.primary : palette.textMuted}
                />
              )}
            </TouchableOpacity>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end">
            <PopoverHeader
              style={{ paddingHorizontal: wp(2.5), paddingVertical: hp(1.5) }}
            >
              <Text
                style={{
                  fontSize: fontSize(16),
                  fontWeight: "bold",
                  color: palette.text,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {title}
              </Text>
              <Text
                style={{ fontSize: fontSize(12), color: palette.textMuted }}
              >
                {artist}
              </Text>
            </PopoverHeader>
            <PopoverBody
              style={{ paddingHorizontal: wp(2.5), maxHeight: hp(45) }}
            >
              <PopoverActionList
                actions={songActions}
                item={item}
                onSongAction={onSongAction}
                onAddToPlaylist={() => setVisibleAddToPlaylistModal(true)}
                onAddToFavorites={() => addToFavoritesMutation(item.id)}
                onAddToQueue={handleAddToQueue}
                onShowInfo={openInfoSheet}
                onRemove={handleRemove}
                palette={palette}
                wp={wp}
                hp={hp}
                fontSize={fontSize}
                radius={radius}
              />
            </PopoverBody>
            <PopoverFooter style={{ borderTopWidth: 0 }}>
              <View style={{ marginTop: hp(4) }} />
            </PopoverFooter>
          </PopoverContent>
        </Popover>
      </View>

      <AddToPlaylistModal
        isVisible={visibleAddToPlaylistModal}
        isLoadingData={playlistsLoading}
        onClose={() => setVisibleAddToPlaylistModal(false)}
        playlists={playlists}
        onSelectPlaylist={(playlist) => {
          if (playlist.id) {
            addToPlaylistMutation({
              songId: item.id as string,
              playlistId: playlist.id,
            });
          }
        }}
        selectedSongId={item.id}
      />

      <BottomSheet
        isVisible={isInfoSheetVisible}
        onClose={closeInfoSheet}
        title="Şarkı Detayları"
        snapPoints={[0.5, 0.7]}
      >
        <View style={{ gap: hp(1) }}>
          {coverUri && (
            <View style={{ alignItems: "center", marginBottom: hp(2) }}>
              <Image
                source={{ uri: coverUri }}
                style={{
                  width: wp(40),
                  height: wp(40),
                  borderRadius: radius(16),
                }}
                resizeMode="cover"
              />
            </View>
          )}
          <DetailsSection details={songDetails} />
        </View>
      </BottomSheet>
    </TouchableOpacity>
  );
}
