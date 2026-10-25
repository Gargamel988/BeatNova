import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { Icon } from "@/components/ui/icon";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { SkipForward } from "lucide-react-native";
import { useTranslation } from "react-i18next";

interface SkippedSong {
  title: string;
  artist: string;
  skipCount: number;
}

interface PlaybackHabitsProps {
  averageCompletionRate: number;
  mostSkippedSongs: SkippedSong[];
}

export function PlaybackHabits({
  averageCompletionRate,
  mostSkippedSongs,
}: PlaybackHabitsProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  return (
    <ChartContainer
      title={t("stats.habitsTitle")}
      description={t("stats.habitsDesc")}
      style={{
        gap: hp(1.5),
        borderRadius: radius(18),
        padding: wp(3.5),
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.overlay.white12,
      }}
    >
      <Card
        style={{
          padding: wp(3),
          borderRadius: radius(14),
          backgroundColor: colors.overlay.white12,
          gap: hp(1),
        }}
      >
        <CardContent>
          <View
            style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}
          >
            <Icon name={SkipForward} size={18} color={colors.accent} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(12),
                fontWeight: "600",
              }}
            >
              {t("stats.avgCompletionRate")}
            </Text>
          </View>
          <Text
            style={{
              color: colors.text,
              fontSize: fontSize(32),
              fontWeight: "800",
            }}
          >
            {averageCompletionRate}%
          </Text>
          <View
            style={{
              height: 10,
              borderRadius: radius(10),
              backgroundColor: colors.overlay.white12,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                width: `${averageCompletionRate}%`,
                height: "100%",
                backgroundColor: colors.green,
                borderRadius: radius(10),
              }}
            />
          </View>
        </CardContent>
      </Card>

      <View style={{ gap: hp(1) }}>
        <Text
          style={{
            color: colors.text,
            fontSize: fontSize(14),
            fontWeight: "700",
            marginTop: hp(0.5),
          }}
        >
          {t("stats.mostSkippedTitle")}
        </Text>
        {mostSkippedSongs.map((song, index) => (
          <Card
            key={index}
            style={{
              paddingVertical: hp(0.8),
              paddingHorizontal: wp(2),
              borderRadius: radius(10),
              backgroundColor: colors.overlay.white08,
            }}
          >
            <CardContent>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: fontSize(13),
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: fontSize(11),
                    }}
                    numberOfLines={1}
                  >
                    {song.artist}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={{
                      color: colors.red,
                      fontSize: fontSize(14),
                      fontWeight: "700",
                    }}
                  >
                    {song.skipCount}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: fontSize(10),
                    }}
                  >
                    {t("stats.timesSkipped", { count: song.skipCount }).replace(String(song.skipCount), "").trim() || "skip"}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}
      </View>
    </ChartContainer>
  );
}

