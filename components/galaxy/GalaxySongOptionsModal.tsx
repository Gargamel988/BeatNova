import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
} from "react-native";
import {
  ListPlus,
  Heart,
  PlayCircle,
  Scissors,
  Info,
  X,
  Music,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useToast } from "@/components/ui/toast";
import { usePlaylistContext } from "@/providers/playlist-context";
import {
  useAddToFavoritesMutation,
  useAddSongToPlaylistMutation,
} from "@/hooks/useSongMutations";
import { getPlaylists } from "@/services/PlaylistServices";
import AddToPlaylistModal from "@/components/songs/AddToPlaylistModal";
import AudioTrimmerModal from "@/components/trimmer/AudioTrimmerModal";
import { queryKeys } from "@/constants/queryKeys";
import type { GalaxyStar } from "@/utils/buildGalaxy";
import type { Song } from "@/hooks/useSongsService";

type GalaxySongOptionsModalProps = {
  visible: boolean;
  onClose: () => void;
  star: GalaxyStar | null;
};

export const GalaxySongOptionsModal: React.FC<GalaxySongOptionsModalProps> = ({
  visible,
  onClose,
  star,
}) => {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const { toast } = useToast();
  const { sortedPlaylist, setSortedPlaylist } = usePlaylistContext();

  const [isAddToPlaylistVisible, setIsAddToPlaylistVisible] = useState(false);
  const [isTrimmerVisible, setIsTrimmerVisible] = useState(false);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Playlists query for AddToPlaylistModal
  const { data: playlists = [], isLoading: isPlaylistsLoading } = useQuery({
    queryKey: queryKeys.playlists.all(),
    queryFn: getPlaylists,
    enabled: isAddToPlaylistVisible,
  });

  const { mutate: addToFavorites } = useAddToFavoritesMutation();
  const { mutate: addToPlaylist } = useAddSongToPlaylistMutation();

  if (!star) return null;

  const songObject: Song = {
    id: star.id,
    filename: star.title,
    uri: star.uri || "",
    mediaType: "audio" as any,
    width: 0,
    height: 0,
    creationTime: 0,
    modificationTime: 0,
    duration: star.duration,
    metadata: {
      title: star.title,
      artist: star.artist,
      album: star.album,
      duration: star.duration,
      coverUri: star.coverUri || undefined,
    },
  };

  const handleAddToQueue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSortedPlaylist([...sortedPlaylist, songObject]);
    toast({
      title: t("common.success", { defaultValue: "Başarılı" }),
      description: t("songs.addedToQueue", { defaultValue: "Kuyruğa eklendi" }),
      variant: "success",
    });
    onClose();
  };

  const handleAddToFavorites = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToFavorites(star.id);
    toast({
      title: t("common.success", { defaultValue: "Başarılı" }),
      description: t("songs.addedToFavorites", { defaultValue: "Favorilere eklendi" }),
      variant: "success",
    });
    onClose();
  };

  const handleOpenTrimmer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsTrimmerVisible(true);
  };

  const handleOpenAddToPlaylist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsAddToPlaylistVisible(true);
  };

  return (
    <>
      <Modal
        visible={visible && !isAddToPlaylistVisible && !isTrimmerVisible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.65)",
              justifyContent: "flex-end",
            }}
          >
            <TouchableWithoutFeedback>
              <View
                style={{
                  backgroundColor: "#0D111A",
                  borderTopStartRadius: radius(24),
                  borderTopEndRadius: radius(24),
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                  paddingHorizontal: wp(5),
                  paddingTop: hp(2.5),
                  paddingBottom: hp(5),
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -6 },
                  shadowOpacity: 0.5,
                  shadowRadius: 16,
                  elevation: 20,
                }}
              >
                {/* Header: Cover + Info + Close */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingBottom: hp(2),
                    borderBottomWidth: 1,
                    borderBottomColor: "rgba(255,255,255,0.08)",
                    marginBottom: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: wp(6),
                      backgroundColor: "#1B2234",
                      overflow: "hidden",
                      alignItems: "center",
                      justifyContent: "center",
                      marginEnd: wp(3.5),
                      borderWidth: 2,
                      borderColor: star.color,
                    }}
                  >
                    {star.coverUri ? (
                      <Image
                        source={{ uri: star.coverUri }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    ) : (
                      <Music size={wp(6)} color={star.color} />
                    )}
                  </View>

                  <View style={{ flex: 1, marginEnd: wp(2) }}>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "#FFFFFF",
                        fontSize: fontSize(15.5),
                        fontWeight: "600",
                      }}
                    >
                      {star.title}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        fontSize: fontSize(12.5),
                        marginTop: 2,
                      }}
                    >
                      {star.artist}
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.close", { defaultValue: "Kapat" })}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: "rgba(255,255,255,0.08)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={16} color="#CBD5E1" />
                  </TouchableOpacity>
                </View>

                {/* Action Items */}
                <View style={{ gap: hp(0.8) }}>
                  {/* Çalma Listesine Ekle */}
                  <TouchableOpacity
                    onPress={handleOpenAddToPlaylist}
                    accessibilityRole="button"
                    accessibilityLabel={t("songs.addToPlaylist", { defaultValue: "Çalma Listesine Ekle" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3),
                      borderRadius: radius(12),
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginEnd: wp(3.5),
                      }}
                    >
                      <ListPlus size={19} color="#38BDF8" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: fontSize(14), fontWeight: "500" }}>
                        {t("songs.addToPlaylist", { defaultValue: "Çalma Listesine Ekle" })}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontSize(11.5) }}>
                        {t("songs.addToPlaylistDesc", { defaultValue: "Mevcut veya yeni listeye ekle" })}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Favorilere Ekle */}
                  <TouchableOpacity
                    onPress={handleAddToFavorites}
                    accessibilityRole="button"
                    accessibilityLabel={t("songs.addToFavorites", { defaultValue: "Favorilere Ekle" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3),
                      borderRadius: radius(12),
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginEnd: wp(3.5),
                      }}
                    >
                      <Heart size={19} color="#EF4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: fontSize(14), fontWeight: "500" }}>
                        {t("songs.addToFavorites", { defaultValue: "Favorilere Ekle" })}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontSize(11.5) }}>
                        {t("songs.addToFavoritesDesc", { defaultValue: "Favori şarkılarına dahil et" })}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Sıraya Ekle */}
                  <TouchableOpacity
                    onPress={handleAddToQueue}
                    accessibilityRole="button"
                    accessibilityLabel={t("songs.addToQueue", { defaultValue: "Sıraya Ekle" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3),
                      borderRadius: radius(12),
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(16, 185, 129, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginEnd: wp(3.5),
                      }}
                    >
                      <PlayCircle size={19} color="#10B981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: fontSize(14), fontWeight: "500" }}>
                        {t("songs.addToQueue", { defaultValue: "Sıraya Ekle" })}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontSize(11.5) }}>
                        {t("songs.addToQueueDesc", { defaultValue: "Çalma kuyruğunun sonuna yerleştir" })}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Kırp & Zil Sesi Yap */}
                  <TouchableOpacity
                    onPress={handleOpenTrimmer}
                    accessibilityRole="button"
                    accessibilityLabel={t("songs.trim", { defaultValue: "Kırp & Zil Sesi Yap" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3),
                      borderRadius: radius(12),
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(244, 162, 97, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginEnd: wp(3.5),
                      }}
                    >
                      <Scissors size={19} color="#F4A261" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: fontSize(14), fontWeight: "500" }}>
                        {t("songs.trim", { defaultValue: "Kırp & Zil Sesi Yap" })}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontSize(11.5) }}>
                        {t("songs.trimDesc", { defaultValue: "İstediğin bölümü kes ve zil sesi ata" })}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Şarkı Detayları */}
                  <TouchableOpacity
                    onPress={() => setIsDetailsVisible(!isDetailsVisible)}
                    accessibilityRole="button"
                    accessibilityLabel={t("songs.songDetails", { defaultValue: "Galaksi & Şarkı Bilgisi" })}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3),
                      borderRadius: radius(12),
                      backgroundColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: "rgba(168, 85, 247, 0.15)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginEnd: wp(3.5),
                      }}
                    >
                      <Info size={19} color="#A855F7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#FFFFFF", fontSize: fontSize(14), fontWeight: "500" }}>
                        {t("songs.songDetails", { defaultValue: "Galaksi & Şarkı Bilgisi" })}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: fontSize(11.5) }}>
                        {star.played
                          ? `${star.play_count || 1} kez dinlendi · ${star.total_secs} saniye`
                          : "Henüz dinlenmedi"}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Add To Playlist Modal */}
      <AddToPlaylistModal
        isVisible={isAddToPlaylistVisible}
        isLoadingData={isPlaylistsLoading}
        onClose={() => {
          setIsAddToPlaylistVisible(false);
          onClose();
        }}
        playlists={playlists}
        onSelectPlaylist={(playlist) => {
          if (playlist.id) {
            addToPlaylist({
              songId: star.id,
              playlistId: playlist.id,
            });
            toast({
              title: t("common.success", { defaultValue: "Başarılı" }),
              description: t("playlist.songAdded", { defaultValue: "Şarkı çalma listesine eklendi" }),
              variant: "success",
            });
          }
          setIsAddToPlaylistVisible(false);
          onClose();
        }}
        selectedSongId={star.id}
      />

      {/* Audio Trimmer Modal */}
      <AudioTrimmerModal
        visible={isTrimmerVisible}
        onClose={() => {
          setIsTrimmerVisible(false);
          onClose();
        }}
        song={songObject}
      />
    </>
  );
};
