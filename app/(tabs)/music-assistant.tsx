import { generateAPIUrl } from "@/lib/utils";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { fetch as expoFetch } from "expo/fetch";
import { TouchableOpacity, ColorValue } from "react-native";
import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAds } from "@/providers/AdsProvider";
import { Input } from "@/components/ui/input";
import { ScrollView } from "@/components/ui/scroll-view";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { ObjectScheme } from "@/schemes/ObjectScheme";
import { useThemeModeContext } from "@/providers/theme-provider";
import {
  Sparkles,
  Music,
  Lightbulb,
  TrendingUp,
  Clock,
  Search,
} from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { LoadingState } from "@/components/ui/loading-state";
import { ErrorState } from "@/components/ui/error-state";
import { useAudioPlayerContext } from "@/providers/player-context";
import { EmptyState } from "@/components/ui/empty-state";
import { AppBannerAd } from "@/components/AppBannerAd";
import { useToast } from "@/components/ui/toast";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { createPlaylist, addMultipleSongsToPlaylist } from "@/services/PlaylistServices";
import { useTranslation } from "react-i18next";

const formatDuration = (seconds?: number) => {
  if (!seconds) return "";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export default function MusicAssistant() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { isPlaying } = useAudioPlayerContext();
  const { showRewarded, isRewardedLoaded } = useAds();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [input, setInput] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);

  const { object, submit, isLoading, error } = useObject({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: generateAPIUrl("api/object"),
    schema: ObjectScheme,
  });

  const handleSuggestion = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (!isRewardedLoaded("ASSISTANT")) {
      toast({ title: t("common.error"), description: t("assistant.adNotReady"), variant: "error" });
      return;
    }

    setLastQuery(trimmed);
    // AI isteğini arka planda başlat, reklamı paralel göster
    submit({ input: trimmed });
    setInput("");
    showRewarded("ASSISTANT", () => { });
  };

  const handleCreatePlaylist = async () => {
    if (!object?.songs || object.songs.length === 0) return;

    try {
      setIsCreatingPlaylist(true);

      const localSongs = await getAllSongsWithDetails();
      if (!localSongs || localSongs.length === 0) {
        toast({ title: t("common.error"), description: t("assistant.noSongsInLibrary"), variant: "error" });
        return;
      }

      const library = localSongs
        .filter((ls) => ls.title)
        .map((ls) => ({ id: ls.id, title: ls.title.toLowerCase() }));

      // Set: aynı şarkı birden fazla AI önerisiyle eşleşirse tekrar eklenmesin
      const matchedSongIds = new Set<string>();
      for (const aiSong of object.songs) {
        if (!aiSong?.name) continue;
        const aiName = aiSong.name.toLowerCase();
        const match = library.find((ls) => ls.title.includes(aiName) || aiName.includes(ls.title));
        if (match) matchedSongIds.add(match.id);
      }

      if (matchedSongIds.size === 0) {
        toast({ title: t("common.error"), description: t("assistant.songsNotMatched"), variant: "error" });
        return;
      }

      const playlistName = object.playlistInfo?.playlistName || t("assistant.aiRecommendation");
      const newPlaylist = await createPlaylist({
        name: playlistName,
        description: object.playlistInfo?.description || t("assistant.aiPlaylistDesc"),
        is_public: false,
        tags: (object.playlistInfo?.tags || []).filter(
          (tag): tag is string => typeof tag === "string" && tag.length > 0
        ),
      });

      if (!newPlaylist || typeof newPlaylist.id !== "number") {
        toast({ title: t("common.error"), description: t("assistant.playlistCreateFailed"), variant: "error" });
        return;
      }

      const result = await addMultipleSongsToPlaylist(Array.from(matchedSongIds), newPlaylist.id);

      // Çalma listeleri sayfası yeni listeyi hemen görsün
      queryClient.invalidateQueries({ queryKey: ["playlists"] });

      toast({
        title: t("common.success"),
        description: t("assistant.songsAddedToPlaylist", { count: result.added, playlistName }),
        variant: "success",
      });
    } catch {
      toast({ title: t("common.error"), description: t("assistant.errorOccurred"), variant: "error" });
    } finally {
      setIsCreatingPlaylist(false);
    }
  };

  const formatTotalDuration = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? t("assistant.hoursMins", { hours, mins }) : t("assistant.mins", { mins });
  };

  const energyMap = useMemo<Record<string, { color: ColorValue; title: string }>>(
    () => ({
      high: { color: "#FF9F0A", title: t("assistant.highEnergy") },
      medium: { color: "#30D158", title: t("assistant.mediumEnergy") },
      low: { color: "#0A84FF", title: t("assistant.lowEnergy") },
    }),
    [t]
  );
  const getEnergyLevelColor = (level?: string) =>
    energyMap[level ?? ""] ?? { color: palette.textMuted as ColorValue, title: "" };

  const fastAccessButtons = useMemo(
    () => [
      { title: t("assistant.suggestionEnergetic"), icon: Music, color: palette.purple },
      { title: t("assistant.suggestionFocus"), icon: Lightbulb, color: palette.green },
      { title: t("assistant.suggestionTrending"), icon: TrendingUp, color: palette.blue },
      { title: t("assistant.suggestionChill"), icon: Clock, color: palette.yellow },
    ],
    [palette, t]
  );

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: wp(4),
          paddingTop: hp(2.5),
          paddingBottom: isPlaying ? hp(20) : hp(8),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="flex-row items-center">
          <LinearGradient
            colors={palette.gradient.purplePink as [string, string]}
            style={{
              width: wp(17),
              height: wp(17),
              borderRadius: radius(16),
              marginEnd: wp(3),
            }}
            className="justify-center items-center"
          >
            <Sparkles size={32} color="#FFFFFF" />
          </LinearGradient>
          <View className="flex-1">
            <Text style={{ fontSize: fontSize(20), color: palette.text }} className="font-bold mb-1">
              {t("assistant.title")}
            </Text>
            <Text style={{ fontSize: fontSize(14), color: palette.textMuted }}>
              {t("assistant.subtitle")}
            </Text>
          </View>
        </View>

        {/* Input Section */}
        <View className="mb-6">
          <Input
            value={input}
            placeholder={t("assistant.inputPlaceholder")}
            onChangeText={setInput}
            onSubmitEditing={() => handleSuggestion(input)}
            icon={Search}
            containerStyle={{
              marginTop: hp(1.5),
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              borderRadius: radius(99),
              borderWidth: 1,
              borderColor: "rgba(147, 51, 234, 0.3)",
            }}
            inputStyle={{
              color: palette.text,
              fontSize: fontSize(15),
              fontWeight: "500",
            }}
            variant="outline"
          />
        </View>

        {/* Hızlı Erişimler */}
        <Text style={{ fontSize: fontSize(16), color: palette.text }} className="font-semibold mb-4">
          {t("assistant.quickAccess")}
        </Text>
        <View className="flex-row mb-8" style={{ gap: wp(2) }}>
          {fastAccessButtons.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={{
                flex: 1,
                backgroundColor: item.color,
                borderRadius: radius(16),
                padding: wp(2.5),
                paddingVertical: hp(1.5),
              }}
              className="justify-center items-center"
              onPress={() => handleSuggestion(item.title)}
              activeOpacity={0.8}
            >
              <item.icon size={18} color="#FFFFFF" />
              <Text
                style={{ fontSize: fontSize(11), marginTop: hp(0.5) }}
                className="font-semibold text-white text-center"
                numberOfLines={2}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading && (
          <View style={{ marginBottom: hp(2) }}>
            <LoadingState message={t("assistant.generatingRecommendations")} />
          </View>
        )}

        {error && (
          <View style={{ marginBottom: hp(2) }}>
            <ErrorState
              title={t("common.error")}
              message={error.message || t("assistant.errorMessage")}
              onRetry={() => {
                // Input handleSuggestion'da temizlendiği için son sorguyu tekrar gönder
                const query = lastQuery || t("assistant.suggestionEnergetic");
                submit({ input: query });
              }}
            />
          </View>
        )}

        {!isLoading && !error && !object?.songs && !object?.playlistInfo && (
          <EmptyState
            title={t("assistant.noRecommendations")}
            message={t("assistant.noRecommendationsDesc")}
            icon={Music}
          />
        )}

        {/* Playlist Info Section */}
        {object?.playlistInfo && (
          <View
            style={{
              backgroundColor: "rgba(147, 51, 234, 0.2)",
              borderRadius: radius(16),
              padding: wp(4),
            }}
            className="mb-6"
          >
            {!!object.playlistInfo.playlistName && (
              <Text style={{ fontSize: fontSize(20), color: palette.text }} className="font-bold mb-2">
                {object.playlistInfo.playlistName}
              </Text>
            )}
            {!!object.playlistInfo.description && (
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: palette.textMuted,
                  lineHeight: fontSize(20),
                }}
                className="mb-3"
              >
                {object.playlistInfo.description}
              </Text>
            )}
            <View className="flex-row flex-wrap gap-2 mb-2">
              {!!object.playlistInfo.totalDuration && (
                <View className="flex-row items-center" style={{ marginEnd: wp(3) }}>
                  <Clock size={14} color={palette.textMuted} />
                  <Text
                    style={{
                      fontSize: fontSize(12),
                      color: palette.textMuted,
                      marginStart: wp(1),
                    }}
                  >
                    {formatTotalDuration(object.playlistInfo.totalDuration)}
                  </Text>
                </View>
              )}
              {!!object.playlistInfo.energyLevel && (
                <View className="flex-row items-center">
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: getEnergyLevelColor(object.playlistInfo.energyLevel).color,
                      marginEnd: wp(1.5),
                    }}
                  />
                  <Text style={{ fontSize: fontSize(12), color: palette.textMuted }}>
                    {getEnergyLevelColor(object.playlistInfo.energyLevel).title}
                  </Text>
                </View>
              )}
            </View>
            {!!object.playlistInfo.tags?.length && (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {object.playlistInfo.tags
                  .filter((tag): tag is string => Boolean(tag))
                  .map((tag, idx) => (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: "rgba(147, 51, 234, 0.3)",
                        borderRadius: radius(12),
                        paddingHorizontal: wp(3),
                        paddingVertical: hp(0.5),
                      }}
                    >
                      <Text style={{ fontSize: fontSize(11), color: palette.text }}>#{tag}</Text>
                    </View>
                  ))}
              </View>
            )}
          </View>
        )}

        {/* Recommendation Reason */}
        {!!object?.recommendationReason && (
          <View
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              borderRadius: radius(12),
              padding: wp(4),
              borderStartWidth: 3,
              borderStartColor: palette.purple,
            }}
            className="mb-6"
          >
            <Text
              style={{
                fontSize: fontSize(14),
                color: palette.text,
                lineHeight: fontSize(20),
              }}
            >
              {object.recommendationReason}
            </Text>
          </View>
        )}

        <AppBannerAd placement="assistant" style={{ marginVertical: hp(1) }} />

        {/* Results Section */}
        {!!object?.songs?.length && (
          <View className="mt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text style={{ fontSize: fontSize(18), color: palette.text }} className="font-bold">
                {t("assistant.recommendedSongs", { count: object.songs.length })}
              </Text>
              <TouchableOpacity
                onPress={handleCreatePlaylist}
                disabled={isCreatingPlaylist}
                style={{
                  backgroundColor: palette.purple,
                  paddingHorizontal: wp(3),
                  paddingVertical: hp(1),
                  borderRadius: radius(8),
                  opacity: isCreatingPlaylist ? 0.7 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontSize: fontSize(13), fontWeight: "600" }}>
                  {isCreatingPlaylist ? t("assistant.creating") : t("assistant.makePlaylist")}
                </Text>
              </TouchableOpacity>
            </View>

            {object.songs.map((song: any, index: number) => (
              <View
                key={index}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  borderRadius: radius(12),
                  padding: wp(4),
                }}
                className="mb-3"
              >
                <Text style={{ fontSize: fontSize(16), color: palette.text }} className="font-semibold mb-1">
                  {song.name}
                </Text>
                <Text style={{ fontSize: fontSize(14), color: palette.textMuted }} className="mb-1">
                  {song.artist}
                </Text>
                <Text style={{ fontSize: fontSize(12), color: palette.textMuted }} className="mb-2">
                  {[song.album, song.year].filter(Boolean).join(" • ")}
                </Text>

                {/* Song Metadata */}
                <View className="flex-row flex-wrap items-center gap-2 mb-2">
                  {!!song.duration && (
                    <View className="flex-row items-center">
                      <Clock size={12} color={palette.textMuted} />
                      <Text
                        style={{
                          fontSize: fontSize(11),
                          color: palette.textMuted,
                          marginStart: wp(1),
                        }}
                      >
                        {formatDuration(song.duration)}
                      </Text>
                    </View>
                  )}
                  {!!song.genre && (
                    <View
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: radius(8),
                        paddingHorizontal: wp(2),
                        paddingVertical: hp(0.3),
                      }}
                    >
                      <Text style={{ fontSize: fontSize(10), color: palette.textMuted }}>
                        {song.genre}
                      </Text>
                    </View>
                  )}
                  {!!song.energyLevel && (
                    <View className="flex-row items-center">
                      <View
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: getEnergyLevelColor(song.energyLevel).color,
                          marginEnd: wp(1),
                        }}
                      />
                      <Text style={{ fontSize: fontSize(10), color: palette.textMuted }}>
                        {getEnergyLevelColor(song.energyLevel).title}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Mood Tags */}
                {!!song.mood?.length && (
                  <View className="flex-row flex-wrap gap-1 mb-2">
                    {song.mood.map((moodTag: string, moodIdx: number) => (
                      <View
                        key={moodIdx}
                        style={{
                          backgroundColor: "rgba(147, 51, 234, 0.2)",
                          borderRadius: radius(8),
                          paddingHorizontal: wp(2),
                          paddingVertical: hp(0.2),
                        }}
                      >
                        <Text style={{ fontSize: fontSize(10), color: palette.purpleLight }}>
                          {moodTag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}