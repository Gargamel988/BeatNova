import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { formatTime } from "@/utils/format";

interface WeeklyChartProps {
  data: { day: string; value: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const maxWeekly = Math.max(
    ...data.map((d) => d.value || 0).filter((v) => v !== null && v !== undefined)
  );

  return (
    <ChartContainer
      title="Haftalık Dinleme"
      description="Son 7 güne göre tahmini dinleme süresi (dk)"
      style={{
        gap: hp(1.5),
        borderRadius: radius(18),
        padding: wp(3),
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.overlay.white12,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginTop: hp(0.5),
          gap: wp(2),
        }}
      >
        {data.map((item) => (
          <View
            key={item.day}
            style={{
              alignItems: "center",
              flex: 1,
            }}
          >
            <View
              style={{
                height: hp(14),
                width: wp(10),
                borderRadius: radius(8),
                justifyContent: "flex-end",
                alignItems: "center",
                paddingBottom: 4,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(12),
                  fontWeight: "600",
                  marginBottom: 2,
                }}
              >
                {formatTime(item.value || 0).split(":")[0]} dk
              </Text>
              <View
                style={{
                  width: "100%",
                  height: `${maxWeekly > 0 ? ((item.value || 0) / maxWeekly) * 100 : 0}%`,
                  backgroundColor: colors.purpleLight,
                  borderRadius: radius(8),
                }}
              />
            </View>
            <Text
              style={{
                marginTop: 4,
                color: colors.textSecondary,
                fontSize: fontSize(11),
              }}
            >
              {item.day}
            </Text>
          </View>
        ))}
      </View>
    </ChartContainer>
  );
}

