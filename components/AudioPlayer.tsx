import { Modal, TouchableOpacity } from "react-native";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useAudioPlayerContext } from "@/providers/player-context";
import {
  ChevronDown,
  MoreHorizontal,
  Music,
  SkipBack,
  SkipForward,
  Moon,
  Clock,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { formatTime } from "@/utils/format";

//expo
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useAudioPlayerStatus } from "expo-audio";
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

export default function AudioPlayer({
  visible,
  onClose,
  selectedSong,
}: {
  visible: boolean;
  onClose: () => void;
  selectedSong: Song;
}) {
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
    position,
    shuffle,
    playlist: hookPlaylist,
    loopMode,
    isShuffled,
    isSleepTimerActive,
    sleepTimerRemaining,
    setSleepTimer,
    loop,
  } = useAudioPlayerContext();
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
  const [notesBySong, setNotesBySong] = useState<Record<string, string>>({});
  const status = useAudioPlayerStatus(audioPlayer);

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

  // Şarkı bittiğinde sonraki şarkıya geç
  useEffect(() => {
    if (!status?.didJustFinish || !activeSong) return;

    if (loopMode === "one") {
      // Tek şarkı modu - aynı şarkıyı tekrar çal
      audioPlayer.seekTo(0);
      audioPlayer.play();
      return;
    }

    if (loopMode === "all" && activeSong) {
      const currentIndex = playlist.findIndex(
        (song) => song.id === activeSong.id
      );
      if (currentIndex === playlist.length - 1) {
        // Playlist'in başına dön
        const firstSong = playlist[0];
        if (firstSong) {
          play(firstSong, playlist);
        }
        return;
      }
    }

    // Normal durumda sonraki şarkıya geç
    next(playlist, isShuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.didJustFinish, activeSong, loopMode]);

  const currentSong = (hydratedActiveSong ?? selectedSong ?? activeSong) as
    | Song
    | undefined;

  const durationSeconds =
    (audioPlayer?.isLoaded && audioPlayer?.duration) ||
    currentSong?.metadata?.duration ||
    activeSong?.duration ||
    0;
  const progress = durationSeconds > 0 ? (position / durationSeconds) * 100 : 0;

  const CoverArt = useMemo(() => {
    const cover =
      hydratedActiveSong?.metadata?.coverUri ||
      selectedSong?.metadata?.coverUri ||
      activeSong?.metadata?.coverUri;

    if (cover) {
      return (
        <Image
          source={{ uri: cover }}
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
  const songId = activeSong?.id ?? "unknown";
  const currentNote = notesBySong[songId] ?? "";

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

  const handleSeekForward = useCallback(() => {
    const newPosition = Math.min(position + 10, durationSeconds);
    handleSeek(durationSeconds)(newPosition);
  }, [position, durationSeconds, handleSeek]);

  const handleSeekBackward = useCallback(() => {
    const newPosition = Math.max(position - 10, 0);
    handleSeek(durationSeconds)(newPosition);
  }, [position, durationSeconds, handleSeek]);

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
      { label: "Dosya Adı", value: activeSong?.filename ?? "Bilinmiyor" },
      {
        label: "Süre",
        value: durationSeconds ? formatTime(durationSeconds) : "—",
      },
      {
        label: "Albüm",
        value: currentSong?.metadata?.album ?? "Bilinmeyen Albüm",
      },
      {
        label: "Sanatçı",
        value: currentSong?.metadata?.artist ?? "Bilinmeyen Sanatçı",
      },
      {
        label: "Oluşturulma",
        value: activeSong?.creationTime
          ? new Date(activeSong.creationTime * 1000).toLocaleDateString()
          : "—",
      },
    ],
    [
      activeSong?.filename,
      activeSong?.creationTime,
      durationSeconds,
      currentSong?.metadata?.album,
      currentSong?.metadata?.artist,
    ]
  );

  const handleNoteChange = useCallback(
    (text: string) => {
      setNotesBySong((prev) => ({ ...prev, [songId]: text }));
    },
    [songId]
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
          {currentSong?.metadata?.coverUri ? (
            <>
              <Image
                source={{ uri: currentSong.metadata.coverUri }}
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
                Şimdi Çalıyor
              </Text>
              <Text
                style={{
                  fontSize: fontSize(12),
                  color: colors.player.textMuted,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {currentSong?.metadata?.artist ?? "Bilinmeyen Sanatçı"}
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
                  {currentSong?.metadata?.title ??
                    activeSong?.filename ??
                    "Şarkı"}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(12),
                    color: colors.player.textMuted,
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {currentSong?.metadata?.artist ?? "Bilinmeyen Sanatçı"}
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

        <Modal
          visible={sleepTimerModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSleepTimerModalVisible(false)}
        >
          <TouchableOpacity
            className="flex-1 justify-end"
            activeOpacity={1}
            onPress={() => setSleepTimerModalVisible(false)}
          >
            <BlurView intensity={40} tint="dark" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

            <View
              style={{
                backgroundColor: colors.popoverCard || colors.card || '#1A1A1A',
                borderTopLeftRadius: radius(32),
                borderTopRightRadius: radius(32),
                padding: wp(6),
                paddingBottom: hp(4),
                gap: hp(2)
              }}
            >
              <View className="items-center mb-2">
                <View
                  style={{
                    width: wp(12),
                    height: 4,
                    backgroundColor: colors.player.textMuted,
                    borderRadius: 2,
                    opacity: 0.3
                  }}
                />
                <Text style={{ fontSize: fontSize(18), color: colors.player.textPrimary, fontWeight: 'bold', marginTop: hp(2) }}>
                  Uyku Zamanlayıcısı
                </Text>
              </View>

              {[15, 30, 45, 60].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => {
                    setSleepTimer(minutes);
                    setSleepTimerModalVisible(false);
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: hp(2),
                    borderBottomWidth: 1,
                    borderBottomColor: colors.player.textVeryDimmed
                  }}
                >
                  <Text style={{ fontSize: fontSize(16), color: colors.player.textPrimary }}>
                    {minutes} Dakika Sonra
                  </Text>
                  {isSleepTimerActive && Math.ceil((sleepTimerRemaining || 0) / 60) === minutes && (
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.player.iconActive }} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                onPress={() => {
                  setSleepTimer(null);
                  setSleepTimerModalVisible(false);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: hp(2),
                }}
              >
                <Text style={{ fontSize: fontSize(16), color: '#FF4D4D' }}>
                  Zamanlayıcıyı Kapat
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
}
