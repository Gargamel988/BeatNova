import React, { useMemo, useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
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
import { addSongToPlaylist, getPlaylists, addSongToFavorites } from "@/services/PlaylistServices";


type SongActionKey = "addToQueue" | "addToPlaylist" | "addToFavorites" | "info" | "remove";

type SongAction = {
  key: SongActionKey;
  label: string;
  description: string;
  icon: any;
  badgeClass: string;
  textClass?: string;
};

const songActions: SongAction[] = [
  {
    key: "addToQueue",
    label: "Sıraya ekle",
    description: "Bu şarkıyı çalma sırasına ekle",
    icon: PlayCircle,
    // Daha yumuşak, kuyruk aksiyonu için pastel mor
    badgeClass: "rgba(147, 51, 234, 0.35)",
  },
  {
    key: "addToPlaylist",
    label: "Listeye ekle",
    description: "Özel çalma listene kaydet",
    icon: ListPlus,
    badgeClass: "#38bdf8",
  },
  {
    key: "addToFavorites",
    label: "Favorilere ekle",
    description: "Bu şarkıyı favorilerinize ekle",
    icon: Heart,
    badgeClass: "#ef4444",
  },
  {
    key: "info",
    label: "Detayları göster",
    description: "Albüm ve sanatçı bilgilerini aç",
    icon: Info,
    badgeClass: "#18181b",
  },
  {
    key: "remove",
    label: "Kaldır",
    description: "Cihazından sil",
    icon: Trash2,
    badgeClass: "#ef4444",
    textClass: "text-red-400",
  },
];

// Helper component for popover actions
function PopoverActionList({
  actions,
  item,
  onSongAction,
  onAddToPlaylist,
  onAddToFavorites,
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
  palette: any;
  wp: any;
  hp: any;
  fontSize: any;
  radius: any;
}) {
  const { setIsOpen } = usePopover();

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: wp(2) }}>
      {actions.map((action) => {
        const handlePress = () => {
          if (action.key === "addToPlaylist") {
            setIsOpen(false);
            // Kısa bir gecikme ile modal'ı aç (popover'ın kapanması için)
            setTimeout(() => {
              onAddToPlaylist();
            }, 200);
          }
          else if (action.key === "addToFavorites") {
            setIsOpen(false);
            setTimeout(() => {
              onAddToFavorites(item.id);
            }, 200);
            return;
          }
          else {
            setIsOpen(false);
            onSongAction(action.key, item);
          }
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
                backgroundColor: action.badgeClass,
                borderRadius: radius(10),
                paddingHorizontal: wp(2.5),
                paddingVertical: hp(1.5),
              }}
            >
              <Icon
                name={action.icon}
                size={fontSize(16)}
                color="white"
              />
            </View>
            <View className="flex-1">
              <Text
                className="font-semibold "
                style={{
                  fontSize: fontSize(14),
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
  const [visibleAddToPlaylistModal, setVisibleAddToPlaylistModal] = useState(false);

  const queryClient = useQueryClient();

  const { play, activeSong } = useAudioPlayerContext();
  const { sortedPlaylist } = usePlaylistContext();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { toast } = useToast();
  const {data: playlistsData, isLoading: playlistsLoading} = useQuery<PlaylistType[]>({
    queryKey: ['playlists'],
    queryFn: () => getPlaylists(),
    enabled: visibleAddToPlaylistModal,
  });
  const playlists = useMemo(() => playlistsData ?? [], [playlistsData]);
  const { title, artist, duration, coverUri } = item.metadata;
  const hasArtwork = !!coverUri;

  const { mutate } = useMutation({
    mutationFn: async ({ songId, playlistId }: { songId: string, playlistId: number }) => {
      return addSongToPlaylist(songId, playlistId);
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Şarkı başarıyla playliste eklendi",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
    onError: (error: any) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });
  
  const handleImageError = () => {
    onSongUpdate({
      ...item,
      metadata: { ...item.metadata, coverUri: undefined },
    });
  };
const {mutate: addToFavoritesMutation} = useMutation({
  mutationFn: async (songId: string) => {
    return addSongToFavorites(songId);
  },
  onSuccess: (data: any) => {
    if (data.success) {
      toast({
        title: "Başarılı",
        description: data.message,
        variant: "success",
      });
    } else {
      toast({
        title: "Uyarı",
        description: data.message,
        variant: "warning",
      });
    }
  },
  onError: (error: any) => {
    toast({
      title: "Hata",
      description: error.message,
      variant: "error",
    });
  },
});

  const isActive = activeSong?.id === item.id;

  return (
    <TouchableOpacity
      style={{
        marginHorizontal: wp(2),
        marginBottom: hp(1),
        borderWidth: wp(0.5),
        borderColor: palette.border,
        borderRadius: radius(12),
        overflow: "hidden",
        shadowColor: "transparent",
        shadowOpacity: 0,
        shadowRadius: 0,
        shadowOffset: { width: 0, height: 0 },
        elevation: 0,
      }}
      activeOpacity={1}
      onPress={() => play(item, sortedPlaylist.length > 0 ? sortedPlaylist : undefined)}
    >
      <View
        className="flex-row"
        style={{
          padding: wp(2.5),
          backgroundColor: isActive ? palette.overlay.purple30 : "transparent",
          borderWidth: isActive ? 1 : 0,
          borderColor: isActive ? palette.purpleLight : "transparent",
          overflow: "hidden",
          borderRadius: radius(12),
          shadowColor: isActive ? palette.purpleLight : "transparent",
          shadowOpacity: isActive ? 0.5 : 0,
          shadowRadius: isActive ? 12 : 0,
          shadowOffset: { width: 0, height: isActive ? 6 : 0 },
        }}
      >
        {/* Album Artwork */}
        <View
          style={{
            marginRight: wp(3),
          }}
        >
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
              {item.id === activeSong?.id && (
                <View
                  className="absolute inset-0 items-center justify-center"
                  style={{
                    borderRadius: radius(10),
                    backgroundColor: "rgba(147, 51, 234, 0.3)",
                  }}
                >
                  <Feather name="play" size={fontSize(28)} color="#9333ea" />
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
              className={`font-bold ${
                isActive ? "text-purple-400" : "text-white"
              }`}
              style={{
                fontSize: fontSize(16),
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
              style={{
                marginLeft: wp(2),
              }}
            >
              <Icon
                name={MoreVerticalIcon}
                size={fontSize(24)}
                color={activeSong?.id === item.id ? "#9333ea" : "#b0b0b0"}
              />
            </TouchableOpacity>
          </PopoverTrigger>
          <PopoverContent side="bottom" align="end" style={{ padding: 0 }}>
            <PopoverHeader
              style={{
                paddingHorizontal: wp(2.5),
                paddingVertical: hp(1.5),
              }}
            >
                <Text
                  className="font-semibold max-w-[70%] overflow-hidden"
                  style={{
                    fontSize: fontSize(16),
                    
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(12),
                    color: palette.textMuted,
                  }}
                >
                  {artist}
                </Text>
            </PopoverHeader>
            <PopoverBody style={{ paddingHorizontal: wp(2.5) , maxHeight: hp(45) }}>
              <PopoverActionList 
                actions={songActions}
                item={item}
                onSongAction={onSongAction}
                onAddToPlaylist={() => setVisibleAddToPlaylistModal(true)}
                onAddToFavorites={() => addToFavoritesMutation(item.id)}
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
        onClose={() => {
          setVisibleAddToPlaylistModal(false);
        }}
        playlists={playlists}
        onSelectPlaylist={(playlist) => {
          if (playlist.id) {
            mutate({ songId: item.id as string, playlistId: playlist.id });
            setVisibleAddToPlaylistModal(false);
          }
        }}
        selectedSongId={item.id}
      />
    </TouchableOpacity>
  );
}

