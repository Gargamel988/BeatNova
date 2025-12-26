import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Modal, TouchableOpacity, Image, FlatList } from "react-native";
import React, { useEffect, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useQuery } from "@tanstack/react-query";
import { getPlaylistSongs } from "@/services/PlaylistServices";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Icon } from "@/components/ui/icon";
import { X, Play, Music2 } from "lucide-react-native";
import { useAudioPlayerContext } from "@/providers/player-context";
import { formatTime } from "@/utils/format";
import { LinearGradient } from "expo-linear-gradient";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

export default function PlayListPlayModal({
  visible,
  onClose,
  playlistId,
  autoPlayShuffled = false,
}: {
  visible: boolean;
  onClose: () => void;
  playlistId: number | string;
  autoPlayShuffled?: boolean;
}) {
  const { palette: colors } = useThemeModeContext();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { play, activeSong, shuffle } = useAudioPlayerContext();
  const hasAutoPlayed = useRef(false);
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");

  const { data: songs, isLoading} = useQuery({
    queryKey: ["playlistSongs", playlistId],
    queryFn: () => getPlaylistSongs(playlistId),
    enabled: !!playlistId && visible,
  });

  // Otomatik karıştırıp çalma
  useEffect(() => {
    if (autoPlayShuffled && visible && songs && songs.length > 0 && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      
      // Şarkıları Song formatına çevir
      const playlistSongs = songs.map((song: any) => ({
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

      // Şarkıları karıştır
      const shuffled = [...playlistSongs].sort(() => Math.random() - 0.5);
      
      // İlk şarkıyı çal
      if (shuffled.length > 0) {
        play(shuffled[0], shuffled);
        // Shuffle modunu aktif et
        shuffle(true);
      }
    }
    
    // Modal kapandığında reset et
    if (!visible) {
      hasAutoPlayed.current = false;
    }
  }, [autoPlayShuffled, visible, songs, play, shuffle]);
  const handlePlaySong = (song: any) => {

    const playlistSongs = songs?.map((song: any) => {
      return {
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
      };
    });
    if (!playlistSongs) return;
    const clickedIndex = playlistSongs.findIndex((s) => s.id === song.id);
    
    play(playlistSongs[clickedIndex], playlistSongs);
  };

  const renderSongItem = ({ item, index }: { item: any; index: number }) => {
    const isActive = activeSong?.id === item.id;
    const hasCover = item.cover_url && item.cover_url.trim() !== "";

    return (
      <TouchableOpacity
        onPress={() => handlePlaySong(item)}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: wp(5),
          paddingVertical: hp(1.5),
          backgroundColor: isActive ? colors.overlay?.purple30 || "rgba(147, 51, 234, 0.3)" : "transparent",
          marginHorizontal: wp(2),
          marginVertical: hp(0.5),
          borderRadius: radius(12),
        }}
      >
        {/* Song Number */}
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

        {/* Cover Image */}
        <View style={{ marginRight: wp(3) }}>
          {hasCover ? (
            <Image
              source={{ uri: item.cover_url }}
              style={{
                width: wp(15),
                height: wp(15),
                borderRadius: radius(10),
              }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={(colors.gradient?.coverArt as [string, string]) || ["#a855f7", "#ec4899"]}
              style={{
                width: wp(15),
                height: wp(15),
                borderRadius: radius(10),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={Music2} size={wp(7)} color="#FFFFFF" />
            </LinearGradient>
          )}
        </View>

        {/* Song Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: isActive ? accent : textPrimary,
              fontSize: fontSize(15),
              fontWeight: "700",
              marginBottom: hp(0.3),
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

        {/* Duration */}
        <Text
          style={{
            color: textSecondary,
            fontSize: fontSize(12),
            marginLeft: wp(2),
          }}
        >
          {formatTime(item.duration || 0)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="fullScreen"
    >
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
                fontSize: fontSize(20),
                fontWeight: "800",
              }}
            >
              Playlist Şarkıları
            </Text>
            {songs && songs.length > 0 && (
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(13),
                  marginTop: hp(0.3),
                }}
              >
                {songs.length} şarkı
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: cardBg,
              borderRadius: radius(10),
              padding: wp(2.5),
            }}
          >
            <Icon name={X} size={wp(6)} color={textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {isLoading ? (
          <LoadingState 
            message="Şarkılar yükleniyor..." 
            fullScreen 
          />
        ) : songs && songs.length > 0 ? (
          <FlatList
            data={songs}
            renderItem={renderSongItem}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={{
              paddingVertical: hp(2),
            }}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState 
            title="Playlist Boş"
            message="Bu playlist'te henüz şarkı yok"
            icon="playlist"
            fullScreen
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}
