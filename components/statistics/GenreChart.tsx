import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

interface GenreData {
  genre: string;
  value: number;
  color: string;
}

interface GenreChartProps {
  data: GenreData[];
}

export function GenreChart({ data }: GenreChartProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const totalGenre = data.reduce((sum, g) => sum + g.value, 0);

  return (
    <ChartContainer
      title="En Çok Dinlediğin Müzik Türleri"
      description="Tür bazlı dinleme dağılımı"
      style={{ gap: hp(1.5) }}
    >
      <View style={{ gap: hp(1) }}>
        {data.map((item) => {
          const percentage = Math.round((item.value / totalGenre) * 100);
          return (
            <View key={item.genre} style={{ gap: 6 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: wp(2),
                  }}
                >
                  <View
                    style={{
                      width: wp(3),
                      height: wp(3),
                      borderRadius: radius(4),
                      backgroundColor: item.color,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: fontSize(14),
                      fontWeight: "600",
                    }}
                  >
                    {item.genre}
                  </Text>
                </View>
                <Text
                  style={{
                    color: colors.textSecondary,
                    fontSize: fontSize(12),
                    fontWeight: "600",
                  }}
                >
                  {percentage}%
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  borderRadius: radius(8),
                  backgroundColor: colors.overlay.white12,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: `${percentage}%`,
                    height: "100%",
                    backgroundColor: item.color,
                    borderRadius: radius(8),
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>
    </ChartContainer>
  );
}

