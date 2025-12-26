import { generateAPIUrl } from "@/lib/utils";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { fetch as expoFetch } from "expo/fetch";
import { TouchableOpacity, ColorValue } from "react-native";
import { useState } from "react";
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


export default function MusicAssistant() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette } = useThemeModeContext();
  const { isPlaying } = useAudioPlayerContext();
  const apiUrl = generateAPIUrl("/api/object");
  const [input, setInput] = useState<string>("");
  const { object, submit, isLoading, error} = useObject({
    fetch: expoFetch as unknown as typeof globalThis.fetch,
    api: apiUrl,
    schema: ObjectScheme,
  });

  const handleSuggestion = (suggestion: string) => {
      submit({ input: suggestion || input });
      setInput("");
  };


  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatTotalDuration = (seconds?: number) => {
    if (!seconds) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours} saat ${mins} dakika`;
    }
    return `${mins} dakika`;
  };

  const getEnergyLevelColor = (level?: string) => {
    switch (level) {
      case "high":
        return {color: "#FF9F0A" as ColorValue, title: "Yüksek Enerji"} ;
      case "medium":
        return {color: "#30D158" as ColorValue, title: "Orta Enerji"};
      case "low":
        return {color: "#0A84FF" as ColorValue, title: "Düşük Enerji"};
      default:
        return {color: palette.textMuted as ColorValue, title: ""};
    }
  };

 const fastAccessButtons = [
  {
    title: "Enerjik bir playlist oluştur",
    icon: Music,
    onPress: () => handleSuggestion("Enerjik bir playlist oluştur"),
    color: palette.purple,
  },
  {
    title: "Odaklanmak için müzik öner",
    icon: Lightbulb,
    onPress: () => handleSuggestion("Odaklanmak için müzik öner"),
    color: palette.green,
  },
  {
    title: "Popüler trendleri göster",
    icon: TrendingUp,
    onPress: () => handleSuggestion("Popüler trendleri göster"),
    color: palette.blue,
  },
  {
    title: "Gece için rahatlatıcı şarkılar",
    icon: Clock,
    onPress: () => handleSuggestion("Gece için rahatlatıcı şarkılar"),
    color: palette.yellow,
  },
 ];
  return (
  
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: wp(4),
            paddingTop: hp(2.5),
            paddingBottom: isPlaying ? hp(10) : hp(0),
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
                marginRight: wp(3),
              }}
              className="justify-center items-center mr-3"
            >
              <Sparkles size={32} color="#FFFFFF" />
            </LinearGradient>
            <View className="flex-1">
              <Text
                style={{
                  fontSize: fontSize(20),
                  color: palette.text,
                }}
                className="font-bold mb-1"
              >
                AI Müzik Asistanı
              </Text>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: palette.textMuted,
                }}
              >
                Senin için özel müzik önerileri oluşturuyor
              </Text>
            </View>
          </View>

        
          {/* Input Section - Butonların üstünde */}
          <View className="mb-6">
            <Input
              value={input}
              placeholder="Şarkı adı veya türü girin..."
              onChangeText={setInput}
              onSubmitEditing={() => handleSuggestion(input.trim())}
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

          {/* Hızlı Erişimler Section */}
          <Text
            style={{
              fontSize: fontSize(16),
              color: palette.text,
            }}
            className="font-semibold mb-4"
          >
            Hızlı Erişimler
          </Text>
            <View className="flex-row mb-8" style={{ gap: wp(2) }}>
              {fastAccessButtons.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    flex: 1,
                    backgroundColor: item.color,
                    borderRadius: radius(16),
                    padding: wp(2.5),
                    paddingVertical: hp(1.5),
                  }}
                  className="justify-center items-center"
                  onPress={item.onPress}
                  activeOpacity={0.8}
                >
                  <item.icon size={18} color="#FFFFFF" />
                  <Text
                    style={{
                      fontSize: fontSize(11),
                      marginTop: hp(0.5),
                    }}
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
                <LoadingState message="Öneri oluşturuluyor..." />
              </View>
            )}
            {error && <ErrorState title="Bir Hata Oluştu" message={error.message} onRetry={() => submit({ input: input.trim() })} />}
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
              {object.playlistInfo.playlistName && (
                <Text
                  style={{
                    fontSize: fontSize(20),
                    color: palette.text,
                  }}
                  className="font-bold mb-2"
                >
                  {object.playlistInfo.playlistName}
                </Text>
              )}
              {object.playlistInfo.description && (
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
                {object.playlistInfo.totalDuration && (
                  <View
                    className="flex-row items-center"
                    style={{ marginRight: wp(3) }}
                  >
                    <Clock size={14} color={palette.textMuted} />
                    <Text
                      style={{
                        fontSize: fontSize(12),
                        color: palette.textMuted,
                        marginLeft: wp(1),
                      }}
                    >
                      {formatTotalDuration(object.playlistInfo.totalDuration)}
                    </Text>
                  </View>
                )}
                {object.playlistInfo.energyLevel && (
                  <View className="flex-row items-center">
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: getEnergyLevelColor(
                          object.playlistInfo.energyLevel
                        ).color,
                        marginRight: wp(1.5),
                      }}
                    />
                    <Text
                      style={{
                        fontSize: fontSize(12),
                        color: palette.textMuted,
                      }}
                    >
                      {getEnergyLevelColor(object.playlistInfo.energyLevel).title}
                    </Text>
                  </View>
                )}
              </View>
              {object.playlistInfo.tags &&
                object.playlistInfo.tags.length > 0 && (
                  <View className="flex-row flex-wrap gap-2 mt-2">
                    {object.playlistInfo.tags
                      .filter((tag): tag is string => Boolean(tag))
                      .map((tag: string, idx: number) => (
                        <View
                          key={idx}
                          style={{
                            backgroundColor: "rgba(147, 51, 234, 0.3)",
                            borderRadius: radius(12),
                            paddingHorizontal: wp(3),
                            paddingVertical: hp(0.5),
                          }}
                        >
                          <Text
                            style={{
                              fontSize: fontSize(11),
                              color: palette.text,
                            }}
                          >
                            #{tag}
                          </Text>
                        </View>
                      ))}
                  </View>
                )}
            </View>
          )}

          {/* Recommendation Reason */}
          {object?.recommendationReason && (
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                borderRadius: radius(12),
                padding: wp(4),
                borderLeftWidth: 3,
                borderLeftColor: palette.purple,
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

          {/* Results Section */}
          {object?.songs && object.songs.length > 0 && (
            <View className="mt-4">
              <Text
                style={{
                  fontSize: fontSize(18),
                  color: palette.text,
                }}
                className="font-bold mb-4"
              >
                Önerilen Şarkılar ({object.songs.length})
              </Text>
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
                  <View className="flex-row">
                    {/* Song Info */}
                    <View className="flex-1">
                      <Text
                        style={{
                          fontSize: fontSize(16),
                          color: palette.text,
                        }}
                        className="font-semibold mb-1"
                      >
                        {song.name}
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize(14),
                          color: palette.textMuted,
                        }}
                        className="mb-1"
                      >
                        {song.artist}
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize(12),
                          color: palette.textMuted,
                        }}
                        className="mb-2"
                      >
                        {song.album} {song.year && `• ${song.year}`}
                      </Text>

                      {/* Song Metadata */}
                      <View className="flex-row flex-wrap items-center gap-2 mb-2">
                        {song.duration && (
                          <View className="flex-row items-center">
                            <Clock size={12} color={palette.textMuted} />
                            <Text
                              style={{
                                fontSize: fontSize(11),
                                color: palette.textMuted,
                                marginLeft: wp(1),
                              }}
                            >
                              {formatDuration(song.duration)}
                            </Text>
                          </View>
                        )}
                        {song.genre && (
                          <View
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.1)",
                              borderRadius: radius(8),
                              paddingHorizontal: wp(2),
                              paddingVertical: hp(0.3),
                            }}
                          >
                            <Text
                              style={{
                                fontSize: fontSize(10),
                                color: palette.textMuted,
                              }}
                            >
                              {song.genre}
                            </Text>
                          </View>
                        )}
                        {song.energyLevel && (
                          <View className="flex-row items-center">
                            <View
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: 3,
                                backgroundColor: getEnergyLevelColor(
                                  song.energyLevel
                                ).color,
                                marginRight: wp(1),
                              }}
                            />
                            <Text
                              style={{
                                fontSize: fontSize(10),
                                color: palette.textMuted,
                              }}
                            >
                              {getEnergyLevelColor(song.energyLevel).title}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Mood Tags */}
                      {song.mood && song.mood.length > 0 && (
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
                              <Text
                                style={{
                                  fontSize: fontSize(10),
                                  color: palette.purpleLight,
                                }}
                              >
                                {moodTag}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}          
        </ScrollView>
      </SafeAreaView>
  );
}
