import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";

interface WeeklyChartProps {
  data: { day: string; value: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const maxWeekly = Math.max(
    ...data.map((d) => d.value || 0).filter((v) => v !== null && v !== undefined),
    1
  );

  return (
    <ChartContainer
      title={t("stats.weeklyTitle")}
      description={t("stats.weeklyDesc")}
      style={{
        gap: hp(1.5),
        borderRadius: radius(18),
        padding: wp(3.5),
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
          marginTop: hp(1),
          gap: wp(1.5),
        }}
      >
        {data.map((item) => {
          const val = item.value || 0;
          const mins = Math.round(val / 60);
          const heightPct = Math.min(100, Math.max(val > 0 ? 8 : 0, Math.round((val / maxWeekly) * 100)));

          return (
            <View
              key={item.day}
              style={{
                alignItems: "center",
                flex: 1,
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize(10),
                  fontWeight: "600",
                  marginBottom: 6,
                  height: 14,
                }}
              >
                {mins > 0 ? `${mins} ${t("stats.minutesShort")}` : "-"}
              </Text>

              <View
                style={{
                  height: hp(12),
                  width: "70%",
                  maxWidth: 28,
                  borderRadius: radius(6),
                  backgroundColor: colors.overlay.white10,
                  justifyContent: "flex-end",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    backgroundColor: colors.purpleLight,
                    borderRadius: radius(6),
                  }}
                />
              </View>

              <Text
                numberOfLines={1}
                style={{
                  marginTop: 6,
                  color: colors.textSecondary,
                  fontSize: fontSize(11),
                  fontWeight: "600",
                }}
              >
                {item.day}
              </Text>
            </View>
          );
        })}
      </View>
    </ChartContainer>
  );
}
