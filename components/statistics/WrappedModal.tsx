import React, { useState, useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import {
  X,
  Sparkles,
  Flame,
  Clock,
  Music,
  Headphones,
  SkipForward,
  Heart,
  TrendingUp,
} from "lucide-react-native";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useColor } from "@/hooks/useColor";
import * as Haptics from "expo-haptics";
import { queryKeys } from "@/constants/queryKeys";
import {
  Period,
  loadWrapped,
  WrappedStats,
} from "@/services/WrappedService";
import { WrappedCover } from "./WrappedCover";

type WrappedModalProps = {
  visible: boolean;
  onClose: () => void;
};

const PERIODS: Period[] = ["week", "month", "year"];

export default function WrappedModal({ visible, onClose }: WrappedModalProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();
  const isDark = useColorScheme() !== "light";
  const screenBg = useColor("background");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");

  const [period, setPeriod] = useState<Period>("month");

  // Handler-map for period labels
  const periodLabels: Record<Period, string> = useMemo(
    () => ({
      week: t("wrapped.periods.week", "Bu Hafta"),
      month: t("wrapped.periods.month", "Bu Ay"),
      year: t("wrapped.periods.year", "Bu Yıl"),
    }),
    [t]
  );

  const { data, isLoading, isError, refetch } = useQuery<WrappedStats>({
    queryKey: queryKeys.statistics.wrapped(period),
    queryFn: () => loadWrapped(period),
    enabled: visible,
    staleTime: 60_000,
  });

  const handlePeriodChange = (p: Period) => {
    if (p !== period) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setPeriod(p);
    }
  };

  const hasData =
    data &&
    (data.total_minutes > 0 ||
      data.top_tracks.length > 0 ||
      data.top_artists.length > 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: screenBg,
        }}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: wp(5),
              paddingVertical: hp(1.5),
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
              <LinearGradient
                colors={["#FF416C", "#FF4B2B"]}
                style={{
                  width: wp(9),
                  height: wp(9),
                  borderRadius: radius(8),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name={Sparkles} size={18} color="#FFFFFF" />
              </LinearGradient>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(22),
                  fontWeight: "900",
                  letterSpacing: -0.3,
                }}
              >
                {t("wrapped.title", "BeatNova Wrapped")}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel={t("wrapped.close", "Kapat")}
              style={{
                width: wp(10),
                height: wp(10),
                borderRadius: radius(10),
                backgroundColor: cardBg,
                borderWidth: 1,
                borderColor,
                alignItems: "center",
                justifyContent: "center",
              }}
              activeOpacity={0.7}
            >
              <Icon name={X} size={20} color={textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Period Selector Tabs */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: cardBg,
              marginHorizontal: wp(5),
              marginBottom: hp(2),
              padding: wp(1),
              borderRadius: radius(12),
              borderWidth: 1,
              borderColor,
            }}
          >
            {PERIODS.map((p) => {
              const active = period === p;
              return (
                <TouchableOpacity
                  key={p}
                  onPress={() => handlePeriodChange(p)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={periodLabels[p]}
                  style={{
                    flex: 1,
                    paddingVertical: hp(1),
                    alignItems: "center",
                    borderRadius: radius(8),
                    backgroundColor: active ? colors.primary : "transparent",
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={{
                      fontSize: fontSize(13),
                      fontWeight: active ? "700" : "500",
                      color: active ? "#FFFFFF" : textSecondary,
                    }}
                  >
                    {periodLabels[p]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Content Area */}
          {isLoading ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: hp(2),
              }}
            >
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{ color: textSecondary, fontSize: fontSize(14) }}>
                {t("common.loading", "Yükleniyor...")}
              </Text>
            </View>
          ) : isError ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: wp(8),
                gap: hp(2),
              }}
            >
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(16),
                  fontWeight: "700",
                  textAlign: "center",
                }}
              >
                {t("common.error", "Bir hata oluştu")}
              </Text>
              <TouchableOpacity
                onPress={() => refetch()}
                style={{
                  paddingHorizontal: wp(6),
                  paddingVertical: hp(1.2),
                  backgroundColor: colors.primary,
                  borderRadius: radius(8),
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  {t("common.retry", "Tekrar Dene")}
                </Text>
              </TouchableOpacity>
            </View>
          ) : !hasData ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: wp(8),
                gap: hp(1.5),
              }}
            >
              <LinearGradient
                colors={["#8A2387", "#E94057"]}
                style={{
                  width: wp(18),
                  height: wp(18),
                  borderRadius: radius(20),
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: hp(1),
                }}
              >
                <Icon name={Headphones} size={36} color="#FFFFFF" />
              </LinearGradient>
              <Text
                style={{
                  color: textPrimary,
                  fontSize: fontSize(18),
                  fontWeight: "800",
                  textAlign: "center",
                }}
              >
                {t("wrapped.emptyTitle", "Bu dönem için henüz veri yok")}
              </Text>
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(13),
                  textAlign: "center",
                  lineHeight: fontSize(19),
                }}
              >
                {t(
                  "wrapped.emptySubtitle",
                  "Müzik dinlemeye devam ettikçe Wrapped özetin burada şekillenecek."
                )}
              </Text>
            </View>
          ) : (
            <ScrollView
              contentContainerStyle={{
                paddingHorizontal: wp(5),
                paddingBottom: hp(4),
                gap: hp(2.5),
              }}
              showsVerticalScrollIndicator={false}
            >
              {/* 1. Hero Card: Toplam Dakika & Seri */}
              <LinearGradient
                colors={["#8A2387", "#E94057", "#F27121"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  padding: wp(6),
                  borderRadius: radius(20),
                  gap: hp(1.5),
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.85)",
                      fontSize: fontSize(14),
                      fontWeight: "700",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {t("wrapped.totalMinutes", "Toplam Dinleme")}
                  </Text>
                  <Icon name={Sparkles} size={20} color="#FFFFFF" />
                </View>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "baseline",
                    gap: wp(2),
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: fontSize(44),
                      fontWeight: "900",
                      letterSpacing: -1,
                    }}
                  >
                    {data.total_minutes}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: fontSize(18),
                      fontWeight: "700",
                    }}
                  >
                    {t("wrapped.minutesLabel", "Dakika")}
                  </Text>
                </View>

                {data.longest_streak > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "rgba(0,0,0,0.25)",
                      paddingHorizontal: wp(3),
                      paddingVertical: hp(0.6),
                      borderRadius: radius(20),
                      alignSelf: "flex-start",
                      gap: wp(1.5),
                    }}
                  >
                    <Icon name={Flame} size={16} color="#FFD700" />
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: fontSize(12),
                        fontWeight: "700",
                      }}
                    >
                      {t("wrapped.streakDays", "{{days}} Gün Kesintisiz", {
                        days: data.longest_streak,
                      })}
                    </Text>
                  </View>
                )}
              </LinearGradient>

              {/* 2. Top 5 Şarkı */}
              {data.top_tracks.length > 0 && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(16),
                    padding: wp(4.5),
                    borderWidth: 1,
                    borderColor,
                    gap: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(2),
                    }}
                  >
                    <Icon name={Music} size={18} color={colors.primary} />
                    <Text
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(16),
                        fontWeight: "800",
                      }}
                    >
                      {t("wrapped.topTracks", "En Çok Dinlediğin Şarkılar")}
                    </Text>
                  </View>

                  <View style={{ gap: hp(1.2) }}>
                    {data.top_tracks.map((track, index) => (
                      <View
                        key={track.id || index}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: wp(3),
                        }}
                      >
                        <Text
                          style={{
                            width: wp(6),
                            fontSize: fontSize(14),
                            fontWeight: "900",
                            color:
                              index === 0
                                ? "#FFD700"
                                : index === 1
                                ? "#C0C0C0"
                                : index === 2
                                ? "#CD7F32"
                                : textSecondary,
                            textAlign: "center",
                          }}
                        >
                          {index + 1}
                        </Text>

                        {/* Kapak (Yoksa Gradient + İkon fallback'i) */}
                        <WrappedCover
                          coverUrl={track.cover_url}
                          size={wp(12)}
                          borderRadius={radius(8)}
                          iconSize={18}
                          accessibilityLabel={track.title || t("wrapped.unknownSong", "Bilinmeyen Şarkı")}
                        />

                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: textPrimary,
                              fontSize: fontSize(14),
                              fontWeight: "700",
                            }}
                          >
                            {track.title || t("wrapped.unknownSong", "Bilinmeyen Şarkı")}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: textSecondary,
                              fontSize: fontSize(12),
                              marginTop: 2,
                            }}
                          >
                            {track.artist || t("wrapped.unknownArtist", "Bilinmeyen Sanatçı")}
                          </Text>
                        </View>

                        {track.plays > 0 && (
                          <View
                            style={{
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.05)",
                              paddingHorizontal: wp(2.5),
                              paddingVertical: hp(0.4),
                              borderRadius: radius(6),
                            }}
                          >
                            <Text
                              style={{
                                color: textSecondary,
                                fontSize: fontSize(11),
                                fontWeight: "700",
                              }}
                            >
                              {t("wrapped.plays", "{{count}} Çalma", {
                                count: track.plays,
                              })}
                            </Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 3. Top Sanatçılar */}
              {data.top_artists.length > 0 && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(16),
                    padding: wp(4.5),
                    borderWidth: 1,
                    borderColor,
                    gap: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(2),
                    }}
                  >
                    <Icon name={Heart} size={18} color="#E94057" />
                    <Text
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(16),
                        fontWeight: "800",
                      }}
                    >
                      {t("wrapped.topArtists", "En Çok Dinlenen Sanatçılar")}
                    </Text>
                  </View>

                  <View style={{ gap: hp(1) }}>
                    {data.top_artists.map((artist, index) => {
                      const minutes = Math.round(artist.secs / 60);
                      return (
                        <View
                          key={artist.artist || index}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingVertical: hp(0.6),
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: wp(2.5),
                              flex: 1,
                            }}
                          >
                            <View
                              style={{
                                width: wp(6),
                                height: wp(6),
                                borderRadius: wp(3),
                                backgroundColor: isDark
                                  ? "rgba(255,255,255,0.08)"
                                  : "rgba(0,0,0,0.05)",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: fontSize(11),
                                  fontWeight: "800",
                                  color: textPrimary,
                                }}
                              >
                                {index + 1}
                              </Text>
                            </View>
                            <Text
                              numberOfLines={1}
                              style={{
                                color: textPrimary,
                                fontSize: fontSize(14),
                                fontWeight: "700",
                                flex: 1,
                              }}
                            >
                              {artist.artist || t("wrapped.unknownArtist", "Bilinmeyen Sanatçı")}
                            </Text>
                          </View>

                          {minutes > 0 && (
                            <Text
                              style={{
                                color: textSecondary,
                                fontSize: fontSize(12),
                                fontWeight: "600",
                              }}
                            >
                              {minutes} {t("wrapped.minuteShort", "dk")}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 4. Ruh Hali & Müzik Türü */}
              {(data.top_genre || data.top_moods.length > 0) && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(16),
                    padding: wp(4.5),
                    borderWidth: 1,
                    borderColor,
                    gap: hp(1.5),
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(2),
                    }}
                  >
                    <Icon name={TrendingUp} size={18} color="#00C6FF" />
                    <Text
                      style={{
                        color: textPrimary,
                        fontSize: fontSize(16),
                        fontWeight: "800",
                      }}
                    >
                      {t("wrapped.topMoods", "Müzikal Ruh Halin & Tür")}
                    </Text>
                  </View>

                  {data.top_genre && (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: hp(1),
                        borderBottomWidth: 1,
                        borderBottomColor: borderColor,
                      }}
                    >
                      <Text
                        style={{
                          color: textSecondary,
                          fontSize: fontSize(13),
                        }}
                      >
                        {t("wrapped.topGenre", "Favori Müzik Türün")}
                      </Text>
                      <View
                        style={{
                          backgroundColor: colors.primary,
                          paddingHorizontal: wp(3),
                          paddingVertical: hp(0.4),
                          borderRadius: radius(20),
                        }}
                      >
                        <Text
                          style={{
                            color: "#FFFFFF",
                            fontSize: fontSize(12),
                            fontWeight: "800",
                          }}
                        >
                          {data.top_genre}
                        </Text>
                      </View>
                    </View>
                  )}

                  {data.top_moods.length > 0 && (
                    <View style={{ gap: hp(0.8) }}>
                      <Text
                        style={{
                          color: textSecondary,
                          fontSize: fontSize(12),
                          fontWeight: "600",
                        }}
                      >
                        {t("wrapped.topMoods", "Müzikal Ruh Halin")}:
                      </Text>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: wp(2),
                        }}
                      >
                        {data.top_moods.map((m, idx) => (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: isDark
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.05)",
                              paddingHorizontal: wp(3),
                              paddingVertical: hp(0.5),
                              borderRadius: radius(8),
                              borderWidth: 1,
                              borderColor,
                            }}
                          >
                            <Text
                              style={{
                                color: textPrimary,
                                fontSize: fontSize(12),
                                fontWeight: "700",
                              }}
                            >
                              ✨ {m.mood}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* 5. Zirve Saatler & En Çok Atlanan Parça */}
              {(data.peak_hours.length > 0 || data.most_skipped) && (
                <View
                  style={{
                    backgroundColor: cardBg,
                    borderRadius: radius(16),
                    padding: wp(4.5),
                    borderWidth: 1,
                    borderColor,
                    gap: hp(1.5),
                  }}
                >
                  {/* Zirve Saatler */}
                  {data.peak_hours.length > 0 && (
                    <View style={{ gap: hp(1) }}>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: wp(2),
                        }}
                      >
                        <Icon name={Clock} size={18} color="#F27121" />
                        <Text
                          style={{
                            color: textPrimary,
                            fontSize: fontSize(15),
                            fontWeight: "800",
                          }}
                        >
                          {t("wrapped.peakHours", "Zirve Dinleme Saatlerin")}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          gap: wp(2),
                        }}
                      >
                        {data.peak_hours.map((ph, idx) => (
                          <View
                            key={idx}
                            style={{
                              backgroundColor: isDark
                                ? "rgba(242, 113, 33, 0.15)"
                                : "rgba(242, 113, 33, 0.1)",
                              paddingHorizontal: wp(3),
                              paddingVertical: hp(0.5),
                              borderRadius: radius(8),
                            }}
                          >
                            <Text
                              style={{
                                color: "#F27121",
                                fontSize: fontSize(12),
                                fontWeight: "800",
                              }}
                            >
                              {t("wrapped.hourLabel", "Saat {{hour}}:00", {
                                hour: ph.hour,
                              })}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* En Çok Atlanan Parça */}
                  {data.most_skipped && (
                    <View
                      style={{
                        paddingTop: data.peak_hours.length > 0 ? hp(1.5) : 0,
                        borderTopWidth: data.peak_hours.length > 0 ? 1 : 0,
                        borderTopColor: borderColor,
                        gap: hp(0.8),
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: wp(2),
                        }}
                      >
                        <Icon name={SkipForward} size={18} color="#FF416C" />
                        <Text
                          style={{
                            color: textPrimary,
                            fontSize: fontSize(15),
                            fontWeight: "800",
                          }}
                        >
                          {t("wrapped.mostSkipped", "En Çok Atladığın Şarkı")}
                        </Text>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: wp(2),
                        }}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: textPrimary,
                              fontSize: fontSize(13),
                              fontWeight: "700",
                            }}
                          >
                            {data.most_skipped.title || t("wrapped.unknownSong", "Bilinmeyen Şarkı")}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{
                              color: textSecondary,
                              fontSize: fontSize(11),
                            }}
                          >
                            {data.most_skipped.artist || t("wrapped.unknownArtist", "Bilinmeyen Sanatçı")}
                          </Text>
                        </View>
                        <Text
                          style={{
                            color: "#FF416C",
                            fontSize: fontSize(11),
                            fontWeight: "700",
                          }}
                        >
                          {t("wrapped.skipsCount", "{{count}} Kez Atlandı", {
                            count: data.most_skipped.skips,
                          })}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}
