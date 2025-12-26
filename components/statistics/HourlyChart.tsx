import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

interface HourlyData {
  hour: number;
  value: number;
}

interface HourlyChartProps {
  data: HourlyData[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const maxHourly = Math.max(...data.map((d) => d.value));

  return (
    <ChartContainer
      title="En Aktif Dinleme Saatleri"
      description="Günün hangi saatlerinde en çok müzik dinliyorsun?"
      style={{ gap: hp(1.5) }}
    >
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: wp(1.5),
        }}
      >
        {data.map((item) => (
          <View
            key={item.hour}
            style={{
              width: "12%",
              alignItems: "center",
              gap: 4,
            }}
          >
            <View
              style={{
                width: "100%",
                height: hp(8),
                borderRadius: radius(6),
                backgroundColor: colors.overlay.white12,
                justifyContent: "flex-end",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: `${maxHourly > 0 ? (item.value / maxHourly) * 100 : 0}%`,
                  backgroundColor: colors.purpleLight,
                  borderRadius: radius(6),
                }}
              />
            </View>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(9),
                fontWeight: "600",
              }}
            >
              {item.hour.toString().padStart(2, "0")}
            </Text>
          </View>
        ))}
      </View>
    </ChartContainer>
  );
}

