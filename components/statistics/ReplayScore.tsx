import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { Icon } from "@/components/ui/icon";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { Repeat } from "lucide-react-native";

interface ReplaySong {
  title: string;
  artist: string;
  replayCount: number;
}

interface ReplayScoreProps {
  songs: ReplaySong[];
}

export function ReplayScore({ songs }: ReplayScoreProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  return (
    <ChartContainer
      title="Tekrarlı Dinleme Skoru"
      description="Bir şarkıyı kaç defa arka arkaya dinledin?"
      style={{ gap: hp(1.5) }}
    >
      {songs.map((song, index) => (
        <Card
          key={index}
          style={{
            padding: wp(2.5),
            borderRadius: radius(12),
            backgroundColor: colors.overlay.white12,
          }}
        >
          <CardContent>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: wp(2),
                  flex: 1,
                }}
              >
                <View
                  style={{
                    width: wp(8),
                    height: wp(8),
                    borderRadius: radius(10),
                    backgroundColor: colors.overlay.white15,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name={Repeat} size={16} color={colors.purpleLight} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: fontSize(14),
                      fontWeight: "600",
                    }}
                    numberOfLines={1}
                  >
                    {song.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textSecondary,
                      fontSize: fontSize(12),
                    }}
                    numberOfLines={1}
                  >
                    {song.artist}
                  </Text>
                </View>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: fontSize(18),
                    fontWeight: "800",
                  }}
                >
                  {song.replayCount}x
                </Text>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize(10),
                  }}
                >
                  tekrar
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>
      ))}
    </ChartContainer>
  );
}

