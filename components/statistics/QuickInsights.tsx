import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";

interface Insight {
  id: string;
  label: string;
  value: string;
  hint: string;
}

interface QuickInsightsProps {
  insights: readonly Insight[];
}

export function QuickInsights({ insights }: QuickInsightsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  return (
    <ChartContainer
      title="Küçük İpuçları"
      description="Son haftalarda öne çıkan hareketlerin"
      style={{ gap: hp(1.2) }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          gap: wp(2),
        }}
      >
        {insights.map((insight) => (
          <Card
            key={insight.id}
            style={{
              flex: 1,
              padding: wp(3),
              borderRadius: radius(14),
              backgroundColor: colors.overlay.white12,
              gap: hp(0.5),
            }}
          >
            <CardContent>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize(12),
                  fontWeight: "600",
                }}
              >
                {insight.label}
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: fontSize(20),
                  fontWeight: "800",
                }}
              >
                {insight.value}
              </Text>
              <Text
                style={{
                  color: colors.textSecondary,
                  fontSize: fontSize(12),
                }}
              >
                {insight.hint}
              </Text>
            </CardContent>
          </Card>
        ))}
      </View>
    </ChartContainer>
  );
}

