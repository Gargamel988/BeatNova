import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

interface WeeklyData {
  day: string;
  value: number;
}

interface ListeningTrendProps {
  data: WeeklyData[];
}

export function ListeningTrend({ data }: ListeningTrendProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const values = data.map((d) => d.value || 0).filter((v) => v !== null && v !== undefined);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  return (
    <ChartContainer
      title="Dinleme Trendi"
      description="Günlere göre dinleme süren arttı mı azaldı mı?"
      style={{ gap: hp(1.5) }}
    >
      <View
        style={{
          height: hp(20),
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingBottom: hp(2),
          gap: wp(1),
        }}
      >
        {data.map((item, index) => {
          const heightPercent =
            maxValue > minValue
              ? ((item.value - minValue) / (maxValue - minValue)) * 100
              : 0;
          const isIncreasing =
            index > 0 && item.value > data[index - 1]?.value;
          const uniqueKey = `${item.day}-${index}`;
          return (
            <View
              key={uniqueKey}
              style={{
                flex: 1,
                alignItems: "center",
                gap: 4,
              }}
            >
              <View
                style={{
                  width: "100%",
                  height: `${Math.max(heightPercent, 10)}%`,
                  borderRadius: radius(6),
                  backgroundColor: isIncreasing
                    ? colors.green
                    : colors.purpleLight,
                  minHeight: 20,
                }}
              />
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize(10),
                  fontWeight: "600",
                }}
              >
                {item.day}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(11),
                  fontWeight: "700",
                }}
              >
                {item.value || 0}
              </Text>
            </View>
          );
        })}
      </View>
    </ChartContainer>
  );
}

