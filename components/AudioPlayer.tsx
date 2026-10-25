import { Modal, TouchableOpacity } from "react-native";
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useAudioPlayerContext, useAudioPositionContext } from "@/providers/player-context";
import {
  ChevronDown,
  Music,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { formatTime } from "@/utils/format";
import { useActiveMediaItem } from "@rntp/player";

//expo
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";

//components
import { Icon } from "@/components/ui/icon";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import DetailsSection from "@/components/segmenttabs/DetailsSection";
import QueueSection from "@/components/segmenttabs/QueueSection";
import PlayerControls from "@/components/segmenttabs/PlayerControls";
import ProgressSection from "@/components/ProgressSection";
import SegmentTabs, { SEGMENTS } from "@/components/SegmentTabs";
import useSongsService, { Song } from "@/components/songs/songsService";
import { SleepTimerModal } from "@/components/settings/SleepTimerModal";
import { useTranslation } from "react-i18next";

export default function AudioPlayer({
  visible,
  onClose,
  selectedSong,
}: {
  visible: boolean;
  onClose: () => void;
  selectedSong: Song;
}) {
  const { t, i18n } = useTranslation();
  const {
    activeSong,
    pause,
    next,
    previous,
    audioPlayer,
    play,
    isPlaying,
    resume,
    handleSeek,
    shuffle,
    playlist: hookPlaylist,
    loopMode,
    isShuffled,
    isSleepTimerActive,
    sleepTimerRemaining,
    setSleepTimer,
    loop,
  } = useAudioPlayerContext();

  const { position } = useAudioPositionContext();
  const activeMediaItem = useActiveMediaItem();
  const [songsWithCovers, setSongsState] = useState<Song[]>([]);
  const [sleepTimerModalVisible, setSleepTimerModalVisible] = useState(false);
  const { loadSongs, loadCoversInBackground } = useSongsService();
  const { data: songsData = [] } = useQuery<Song[]>({
    queryKey: ["songs"],
    queryFn: loadSongs,
    enabled: visible,
  });
  const [activeSegment, setActiveSegment] = useState<
    "controls" | "queue" | "details" | "notes"
  >("controls");



  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();


  useEffect(() => {
    if (songsData.length) {
      setSongsState(songsData);
      loadCoversInBackground(songsData, setSongsState);
    }
  }, [songsData, loadCoversInBackground]);

  const playlist = useMemo(() => {
    return (
      hookPlaylist ?? (songsWithCovers.length ? songsWithCovers : songsData)
    );
  }, [hookPlaylist, songsWithCovers, songsData]);

  const hydratedActiveSong = useMemo(() => {
    if (!activeSong) return undefined;
    return playlist.find((song) => song.id === activeSong.id) ?? activeSong;
  }, [playlist, activeSong]);

  useEffect(() => {
    if (!visible || !selectedSong) return;

    if (!activeSong || activeSong.id !== selectedSong.id) {
      play(selectedSong, playlist);
    }
  }, [visible, selectedSong, activeSong, play, playlist]);



  const currentSong = (hydratedActiveSong ?? selectedSong ?? activeSong) as
    | Song
    | undefined;

  const durationSeconds =
    (audioPlayer?.isLoaded && audioPlayer?.duration ? audioPlayer.duration : 0) ||
    currentSong?.metadata?.duration ||
    activeSong?.duration ||
    0;
  const progress = durationSeconds > 0 ? (position / durationSeconds) * 100 : 0;

  const CoverArt = useMemo(() => {
    const coverUri = activeMediaItem?.artworkUrl || currentSong?.metadata?.coverUri;

    if (coverUri) {
      return (
        <Image
          source={{ uri: coverUri as string }}
          style={{
            width: wp(90),

            height: hp(40),
            borderRadius: radius(28),
            marginVertical: hp(3),
          }}
        />
      );
    }

    const placeholderLetter =
      (
        activeMediaItem?.title ||
        hydratedActiveSong?.metadata?.title ||
        activeSong?.filename ||
        selectedSong?.metadata?.title ||
        "♫"
      )
        .charAt(0)
        .toUpperCase() || "♫";

    return (
      <LinearGradient
        colors={colors.gradient.coverArt as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: wp(90),
          height: hp(40),
          borderRadius: radius(28),
          marginVertical: hp(3),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon
          name={Music}
          size={fontSize(48)}
          color={colors.player.iconWhite}
        />
        <Text
          style={{
            fontSize: fontSize(32),
            color: colors.player.textPrimary,
            marginTop: hp(1),
          }}
        >
          {placeholderLetter}
        </Text>
      </LinearGradient>
    );
  }, [
    activeMediaItem?.artworkUrl,
    activeMediaItem?.title,
    hydratedActiveSong?.metadata?.coverUri,
    hydratedActiveSong?.metadata?.title,
    selectedSong?.metadata?.coverUri,
    selectedSong?.metadata?.title,
    activeSong?.metadata?.coverUri,
    activeSong?.filename,
    colors,
    wp,
    hp,
    radius,
    fontSize,
  ]);

  const queue = useMemo(() => {
    if (!playlist.length) return [];
    if (!activeSong) return playlist;
    const currentIndex = playlist.findIndex(
      (song) => song.id === activeSong.id
    );
    return currentIndex >= 0 ? playlist.slice(currentIndex) : playlist;
  }, [playlist, activeSong]);


  const handlePlayToggle = useCallback(() => {
    if (!activeSong) {
      play(selectedSong);
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  }, [activeSong, isPlaying, play, pause, resume, selectedSong]);


  const handleLoopToggle = useCallback(() => {
    const modes: ("all" | "one" | "none")[] = ["all", "one", "none"];
    const currentIndex = modes.indexOf(loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    loop(modes[nextIndex]);
  }, [loopMode, loop]);

  const handleShuffleToggle = useCallback(() => {
    shuffle(!isShuffled);
  }, [isShuffled, shuffle]);

  const detailsItems = useMemo(
    () => [
      { label: t("songs.fileName"), value: activeSong?.filename ?? t("songs.unknown") },
      {
        label: t("songs.duration"),
        value: durationSeconds ? formatTime(durationSeconds) : "—",
      },
      {
        label: t("songs.album"),
        value: activeMediaItem?.albumTitle ?? currentSong?.metadata?.album ?? t("songs.unknownAlbum"),
      },
      {
        label: t("songs.artist"),
        value: activeMediaItem?.artist ?? currentSong?.metadata?.artist ?? t("songs.unknownArtist"),
      },
      {
        label: t("songs.createdAt"),
        value: activeSong?.creationTime
          ? new Date(activeSong.creationTime * 1000).toLocaleDateString(i18n.language)
          : "—",
      },
    ],
    [
      activeSong?.filename,
      activeSong?.creationTime,
      durationSeconds,
      currentSong?.metadata?.album,
      currentSong?.metadata?.artist,
      activeMediaItem?.albumTitle,
      activeMediaItem?.artist,
      t,
      i18n.language,
    ]
  );


  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
      className="flex-1 justify-center items-center"
    >
      <View className="flex-1">
        {/* Dynamic Blurred Background */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
          {(activeMediaItem?.artworkUrl || currentSong?.metadata?.coverUri) ? (
            <>
              <Image
                source={{ uri: (activeMediaItem?.artworkUrl as string) || currentSong?.metadata?.coverUri }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
              />
              <BlurView
                intensity={80}
                tint="dark"
                style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              />
              {/* Overlay for additional contrast */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.4)"
                }}
              />
            </>
          ) : (
            <LinearGradient
              colors={colors.gradient.playerModal as [string, string, string]}
              style={{ flex: 1 }}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
            />
          )}
        </View>

        <View
          className="flex-1"
          style={{
            paddingHorizontal: wp(6),
            paddingTop: hp(5),
            gap: hp(2),
          }}
        >
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="flex-row items-center"
              style={{
                gap: wp(2),
              }}
            >
              <Icon
                name={ChevronDown}
                size={fontSize(24)}
                color={colors.player.iconWhite}
              />
            </TouchableOpacity>

            <View className="flex-1 items-center">
              <Text
                style={{
                  fontSize: fontSize(16),
                  color: colors.player.textPrimary,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {t("player.nowPlaying")}
              </Text>
              <Text
                style={{
                  fontSize: fontSize(12),
                  color: colors.player.textMuted,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {activeMediaItem?.artist ?? currentSong?.metadata?.artist ?? t("songs.unknownArtist")}
              </Text>
            </View>


          </View>

          <View className="items-center justify-center">{CoverArt}</View>

          <SegmentTabs
            segments={SEGMENTS}
            activeSegment={activeSegment}
            onSelect={setActiveSegment}
            colors={colors}
          />

          {activeSegment === "controls" && (
            <>
              <View
                style={{
                  gap: hp(0.5),
                  marginTop: hp(2),
                }}
              >
                <Text
                  style={{
                    fontSize: fontSize(18),
                    color: colors.player.textPrimary,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {activeMediaItem?.title ?? currentSong?.metadata?.title ??
                    t("songs.unknownTitle")}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(12),
                    color: colors.player.textMuted,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {activeMediaItem?.artist ?? currentSong?.metadata?.artist}
                </Text>
              </View>

              <ProgressSection
                progress={progress}
                duration={durationSeconds}
                position={position}
                formatTime={formatTime}
                handleSeek={handleSeek}
              />

              <PlayerControls
                shuffleActive={isShuffled}
                onShuffleToggle={handleShuffleToggle}
                onPrevious={() => previous(playlist, isShuffled)}
                onPlayToggle={handlePlayToggle}
                isPlaying={isPlaying}
                onNext={() => next(playlist, isShuffled)}
                loopMode={loopMode}
                onLoopToggle={handleLoopToggle}
                colors={colors}
              />
            </>
          )}
          {activeSegment === "queue" && <QueueSection queue={queue} />}
          {activeSegment === "details" && (
            <DetailsSection details={detailsItems} />
          )}

        </View>

        <SleepTimerModal
          visible={sleepTimerModalVisible}
          onClose={() => setSleepTimerModalVisible(false)}
        />
      </View>
    </Modal>
  );
}
