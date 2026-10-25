import React, { useCallback } from "react";
import { Modal, View, Text, TouchableOpacity, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Shuffle, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/icon";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { useAudioPlayerContext } from "@/providers/player-context";
import { SmartPlaylist } from "@/services/SmartPlaylistService";
import { Song } from "@/components/songs/songsService";
import { formatTime } from "@/utils/format";
import { getLocalizedTitle, getLocalizedArtist } from "@/utils/audioMetadata";

type Props = {
  visible: boolean;
  playlist: SmartPlaylist | null;
  onClose: () => void;
};

export default function SmartPlaylistDetailModal({
  visible,
  playlist,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { play } = useAudioPlayerContext();
  const background = useColor("background");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");

  const songs = playlist?.songs ?? [];

  const playAt = useCallback(
    (song: Song) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      play(song, songs);
    },
    [songs, play]
  );

  const playAll = () => {
    if (songs.length > 0) {
      playAt(songs[0]);
    }
  };

  const shuffleAll = () => {
    if (!songs.length) return;
    const s = [...songs].sort(() => Math.random() - 0.5);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    play(s[0], s);
  };

  if (!playlist) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: background }}>
          <FlatList
            data={songs}
            keyExtractor={(s) => String(s.id)}
            initialNumToRender={12}
            windowSize={7}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <LinearGradient
                colors={playlist.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingTop: hp(7),
                  paddingHorizontal: wp(5),
                  paddingBottom: hp(3),
                }}
              >
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.75}
                  style={{
                    alignSelf: "flex-end",
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(0,0,0,0.3)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={X} size={20} color="#fff" />
                </TouchableOpacity>

                <Text
                  style={{
                    color: "#fff",
                    fontSize: fontSize(26),
                    fontWeight: "900",
                    marginTop: hp(1),
                  }}
                >
                  {t(playlist.titleKey, playlist.defaultTitle)}
                </Text>

                <Text
                  style={{
                    color: "rgba(255,255,255,0.85)",
                    fontSize: fontSize(13),
                    marginTop: 4,
                  }}
                >
                  {t(playlist.subtitleKey, playlist.defaultSubtitle)} •{" "}
                  {songs.length} {t("smartPlaylists.songs", "şarkı")}
                </Text>

                <View style={{ flexDirection: "row", gap: wp(3), marginTop: hp(2.5) }}>
                  <TouchableOpacity
                    onPress={playAll}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      minHeight: 46,
                      borderRadius: radius(14),
                      backgroundColor: "#fff",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Icon
                      name={Play}
                      size={18}
                      color={playlist.badgeColor}
                      fill={playlist.badgeColor}
                    />
                    <Text
                      style={{
                        color: playlist.badgeColor,
                        fontWeight: "800",
                        fontSize: fontSize(14),
                      }}
                    >
                      {t("common.play", "Çal")}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={shuffleAll}
                    activeOpacity={0.8}
                    style={{
                      flex: 1,
                      minHeight: 46,
                      borderRadius: radius(14),
                      backgroundColor: "rgba(0,0,0,0.3)",
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Icon name={Shuffle} size={18} color="#fff" />
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "800",
                        fontSize: fontSize(14),
                      }}
                    >
                      {t("common.shuffle", "Karışık")}
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            }
            renderItem={({ item, index }) => (
              <TouchableOpacity
                onPress={() => playAt(item)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: wp(5),
                  paddingVertical: hp(1.4),
                  borderBottomWidth: 0.5,
                  borderColor,
                  gap: wp(3),
                }}
              >
                <Text
                  style={{
                    width: 24,
                    color: textSecondary,
                    fontSize: fontSize(12),
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {index + 1}
                </Text>

                <View style={{ flex: 1 }}>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: textPrimary,
                      fontSize: fontSize(14),
                      fontWeight: "700",
                    }}
                  >
                    {getLocalizedTitle(item.metadata?.title, t)}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={{
                      color: textSecondary,
                      fontSize: fontSize(12),
                      marginTop: 2,
                    }}
                  >
                    {getLocalizedArtist(item.metadata?.artist, t)}
                  </Text>
                </View>

                <Text style={{ color: textSecondary, fontSize: fontSize(11) }}>
                  {formatTime(item.duration || item.metadata?.duration || 0)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                style={{
                  color: textSecondary,
                  textAlign: "center",
                  marginTop: hp(6),
                  fontSize: fontSize(13),
                  paddingHorizontal: wp(6),
                }}
              >
                {t(
                  "smartPlaylists.empty",
                  "Bu liste için henüz yeterli dinleme verisi yok."
                )}
              </Text>
            }
            contentContainerStyle={{ paddingBottom: hp(12) }}
          />
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
