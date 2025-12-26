import { Modal, TouchableOpacity } from "react-native";
import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
} from "react";
import { useAudioPlayerContext } from "@/providers/player-context";
import {
  ChevronDown,
  MoreHorizontal,
  Music,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { formatTime } from "@/utils/format";

//expo
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useAudioPlayerStatus } from "expo-audio";

//components
import { Icon } from "@/components/ui/icon";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import NotesSection from "@/components/segmenttabs/NotesSection";
import DetailsSection from "@/components/segmenttabs/DetailsSection";
import QueueSection from "@/components/segmenttabs/QueueSection";
import PlayerControls from "@/components/segmenttabs/PlayerControls";
import ProgressSection from "@/components/ProgressSection";
import SegmentTabs, { SEGMENTS } from "@/components/SegmentTabs";
import useSongsService, { Song } from "@/components/songs/songsService";
import { LoadingOverlay } from "@/components/ui/spinner";

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
    isSongUuidLoading,
  } = useAudioPlayerContext();
  const [songsWithCovers, setSongsState] = useState<Song[]>([]);
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
  const [loops, setLoops] = useState<"all" | "one" | "none">("all");
  const [shuffled, setShuffled] = useState(false);
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
    return hookPlaylist ?? (songsWithCovers.length ? songsWithCovers : songsData);
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
    if (!status?.didJustFinish || loops === "one") return;
    
    // Loop "all" modunda ve playlist sonuna geldiyse başa dön
    if (loops === "all" && activeSong) {
      const currentIndex = playlist.findIndex((song) => song.id === activeSong.id);
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
    next(playlist, shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.didJustFinish]);

  // Loop modu değiştiğinde sadece audioPlayer.loop ayarını yap
  useEffect(() => {
    if (!activeSong || !audioPlayer) return;
    
    if (loops === "one") {
      audioPlayer.loop = true;
    } else {
      audioPlayer.loop = false;
    }
  }, [loops, activeSong, audioPlayer]);

  // Shuffle durumu değiştiğinde shuffle fonksiyonunu çağır
  useEffect(() => {
    shuffle(shuffled);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffled]);

  const currentSong = (hydratedActiveSong ??
    selectedSong ??
    activeSong) as Song | undefined;

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
        <Icon name={Music} size={fontSize(48)} color={colors.player.iconWhite} />
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
    const currentIndex = playlist.findIndex((song) => song.id === activeSong.id);
    return currentIndex >= 0 ? playlist.slice(currentIndex) : playlist;
  }, [playlist, activeSong]);
  const songId = activeSong?.id ?? "unknown";
  const currentNote = notesBySong[songId] ?? "";

  const handlePlayToggle = () => {
    if (!activeSong) {
      play(selectedSong);
      return;
    }
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

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
        <LinearGradient
          colors={colors.gradient.playerModal as [string, string, string]}
          style={{ flex: 1 }}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
        >
          <LoadingOverlay
            visible={isSongUuidLoading}
            backdrop={true}
            backdropOpacity={0.8}
            size="lg"
            variant="circle"
            label="Şarkı bilgileri yükleniyor..."
            showLabel={true}
          />
          <View
            className="flex-1"
            style={{
              paddingHorizontal: wp(6),
              paddingTop: hp(5),
              gap: hp(2),
              opacity: isSongUuidLoading ? 0.3 : 1,
            }}
          >
            <View className="flex-row justify-between items-center">
              <TouchableOpacity
                onPress={onClose}
                activeOpacity={0.8}
                className="flex-row items-center "
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

              <TouchableOpacity
                activeOpacity={0.8}
                className="items-center justify-center"
              >
                <Icon
                  name={MoreHorizontal}
                  size={fontSize(24)}
                  color={colors.player.iconWhite}
                />
              </TouchableOpacity>
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
                  shuffleActive={shuffled}
                  onShuffleToggle={() => setShuffled(!shuffled)}
                  onPrevious={() => previous(playlist, shuffled)}
                  onPlayToggle={handlePlayToggle}
                  isPlaying={isPlaying}
                  onNext={() => next(playlist, shuffled)}
                  loopMode={loops}
                  onLoopToggle={() =>
                    setLoops((prev) =>
                      prev === "all" ? "one" : prev === "one" ? "none" : "all"
                    )
                  }
                  colors={colors}
                />
              </>
            )}
            {activeSegment === "queue" && (
              <QueueSection queue={queue} />
            )}
            {activeSegment === "details" && (
              <DetailsSection details={detailsItems} />
            )}
            {activeSegment === "notes" && (
              <NotesSection note={currentNote} onChange={handleNoteChange} />
            )}
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

