import React, { useMemo, useState, useCallback } from "react";
import {
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
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
import { ThemePalette } from "@/theme/colors";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../ui/toast";
import {
  useAddToFavoritesMutation,
  useAddSongToPlaylistMutation,
} from "@/hooks/useSongMutations";
import { getPlaylists } from "@/services/PlaylistServices";
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
  actions: SongAction[];
  item: Song;
  onSongAction: (action: SongActionKey, song: Song) => void;
  onAddToPlaylist: () => void;
  onAddToFavorites: (songId: string) => void;
  onAddToQueue?: () => void;
  onShowInfo?: () => void;
  onRemove?: () => void;
  palette: ThemePalette;
  wp: (val: number) => number;
  hp: (val: number) => number;
  fontSize: (val: number) => number;
  radius: (val: number) => number;
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
  isActive?: boolean;
}

function SongItemComponent({
  item,
  onSongUpdate,
  onSongAction,
  isActive = false,
}: SongItemProps) {
  const [visibleAddToPlaylistModal, setVisibleAddToPlaylistModal] =
    useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isVisible: isInfoSheetVisible,
    open: openInfoSheet,
    close: closeInfoSheet,
  } = useBottomSheet();

  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const { play } = useAudioPlayerContext();
  const { sortedPlaylist, setSortedPlaylist } = usePlaylistContext();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { toast } = useToast();

  const songActions: SongAction[] = useMemo(
    () => [
      {
        key: "addToQueue",
        label: t("songs.addToQueue"),
        description: t("songs.addToQueueDesc"),
        icon: PlayCircle,
        badgeClass: "primary",
      },
      {
        key: "addToPlaylist",
        label: t("songs.addToPlaylist"),
        description: t("songs.addToPlaylistDesc"),
        icon: ListPlus,
        badgeClass: "blue",
      },
      {
        key: "addToFavorites",
        label: t("songs.addToFavorites"),
        description: t("songs.addToFavoritesDesc"),
        icon: Heart,
        badgeClass: "red",
      },
      {
        key: "info",
        label: t("songs.showDetails"),
        description: t("songs.showDetailsDesc"),
        icon: Info,
        badgeClass: "white",
      },
      {
        key: "remove",
        label: t("songs.remove"),
        description: t("songs.removeDesc"),
        icon: Trash2,
        badgeClass: "red",
      },
    ],
    [t]
  );

  const { data: playlistsData, isLoading: playlistsLoading } = useQuery<
    PlaylistType[]
  >({
    queryKey: ["playlists"],
    queryFn: () => getPlaylists(),
    enabled: visibleAddToPlaylistModal,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const playlists = useMemo(() => playlistsData ?? [], [playlistsData]);
  const { title, artist, duration, coverUri } = item.metadata;
  const hasArtwork = !!coverUri;

  const { mutate: addToPlaylistMutation } = useAddSongToPlaylistMutation({
    onSuccess: () => setVisibleAddToPlaylistModal(false),
  });

  const { mutate: addToFavoritesMutation } = useAddToFavoritesMutation();

  const handleImageError = useCallback(() => {
    onSongUpdate({
      ...item,
      metadata: { ...item.metadata, coverUri: undefined },
    });
  }, [item, onSongUpdate]);

  const handleAddToQueue = useCallback(() => {
    if (sortedPlaylist.find((s) => s.id === item.id)) {
      toast({
        title: t("common.warning"),
        description: t("songs.alreadyInQueue"),
        variant: "warning",
      });
      return;
    }
    setSortedPlaylist([...sortedPlaylist, item]);
    toast({
      title: t("common.success"),
      description: t("songs.addedToQueue"),
      variant: "success",
    });
  }, [item, sortedPlaylist, setSortedPlaylist, toast, t]);

  const handleRemove = useCallback(() => {
    Alert.alert(
      t("songs.deleteSongTitle"),
      t("songs.deleteSongConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await MediaLibrary.deleteAssetsAsync([item.id]);

              try {
                await deleteSong(item.id);
              } catch {
                toast({
                  title: t("common.warning"),
                  description: t("songs.deleteError"),
                  variant: "warning",
                });
              }

              toast({
                title: t("common.success"),
                description: t("songs.deleteSuccess"),
                variant: "success",
              });
              queryClient.invalidateQueries({ queryKey: ["songs"] });
            } catch (error: unknown) {
              toast({
                title: t("common.error"),
                description: error instanceof Error ? error.message : t("songs.deleteError"),
                variant: "error",
              });
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  }, [item.id, toast, queryClient, t]);

  // isActive is now a prop

  const songDetails = useMemo(
    () => [
      { label: t("songs.fileName"), value: item.filename || t("songs.unknown") },
      { label: t("songs.duration"), value: duration > 0 ? formatTime(duration) : "—" },
      { label: t("songs.album"), value: item.metadata?.album || t("songs.unknownAlbum") },
      { label: t("songs.artist"), value: artist || t("songs.unknownArtist") },
      {
        label: t("songs.createdAt"),
        value: item.creationTime
          ? new Date(item.creationTime * 1000).toLocaleDateString(i18n.language)
          : "—",
      },
    ],
    [item, duration, artist, t, i18n.language]
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
        <View style={{ marginEnd: wp(3) }}>
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
              style={{ marginStart: wp(2) }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color={palette.primary} />
              ) : (
                <Icon
                  name={MoreVerticalIcon}
                  size={fontSize(24)}
                  color={isActive ? palette.primaryForeground : palette.textMuted}
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
        title={t("songs.songDetails")}
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

export default React.memo(SongItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.isActive === nextProps.isActive &&
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.metadata.coverUri === nextProps.item.metadata.coverUri &&
    prevProps.item.metadata.title === nextProps.item.metadata.title &&
    prevProps.item.metadata.artist === nextProps.item.metadata.artist
  );
});
