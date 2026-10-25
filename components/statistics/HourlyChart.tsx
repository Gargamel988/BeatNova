import React, { useMemo, useState } from "react";
import {
  View,
  ScrollView,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Text } from "@/components/ui/text";
import { ChartContainer } from "@/components/charts/chart-container";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { useTranslation } from "react-i18next";

interface HourlyData {
  hour: number;
  value: number;
}

interface HourlyChartProps {
  data: HourlyData[];
}

export function HourlyChart({ data }: HourlyChartProps) {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  const [layoutW, setLayoutW] = useState(0);
  const [contentW, setContentW] = useState(0);
  const [scrollX, setScrollX] = useState(0);

  const maxHourly = Math.max(...data.map((d) => d.value || 0), 1);

  // En aktif saati bul
  const peakHour = useMemo(() => {
    let best = data[0];
    for (const d of data) {
      if ((d.value || 0) > (best?.value || 0)) {
        best = d;
      }
    }
    return best && best.value > 0 ? best.hour : null;
  }, [data]);

  // Özel scrollbar hesapları
  const isScrollable = contentW > layoutW + 1;
  const trackW = layoutW;
  const thumbW = isScrollable ? Math.max(24, (layoutW / contentW) * trackW) : trackW;
  const maxScroll = Math.max(contentW - layoutW, 1);
  const thumbLeft = isScrollable ? (scrollX / maxScroll) * (trackW - thumbW) : 0;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setScrollX(e.nativeEvent.contentOffset.x);
  };

  return (
    <ChartContainer
      title={t("stats.hourlyTitle")}
      description={t("stats.hourlyDesc")}
      style={{
        gap: hp(1.5),
        borderRadius: radius(18),
        padding: wp(3.5),
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.overlay.white12,
      }}
    >
      {peakHour !== null && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: wp(2.5),
            paddingVertical: hp(0.6),
            backgroundColor: colors.overlay.white10,
            borderRadius: radius(10),
            marginBottom: hp(0.5),
          }}
        >
          <Text style={{ fontSize: fontSize(11.5), color: colors.textSecondary }}>
            {t("stats.mostActiveHour", { defaultValue: "En Aktif Saat Aralığı" })}
          </Text>
          <Text style={{ fontSize: fontSize(12), fontWeight: "700", color: colors.primary }}>
            {String(peakHour).padStart(2, "0")}:00 - {String((peakHour + 1) % 24).padStart(2, "0")}:00
          </Text>
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={(e) => setLayoutW(e.nativeEvent.layout.width)}
        onContentSizeChange={(w) => setContentW(w)}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingHorizontal: wp(1),
          alignItems: "flex-end",
          gap: wp(2),
          paddingTop: hp(1),
        }}
      >
        {data.map((item) => {
          const val = item.value || 0;
          const mins = Math.round(val / 60);
          const heightPct = Math.min(
            100,
            Math.max(val > 0 ? 8 : 0, Math.round((val / maxHourly) * 100))
          );
          const isPeak = peakHour === item.hour;

          return (
            <View
              key={item.hour}
              style={{
                width: wp(7.5),
                minWidth: 26,
                alignItems: "center",
              }}
            >
              <Text
                numberOfLines={1}
                style={{
                  color: isPeak ? colors.primary : colors.textSecondary,
                  fontSize: fontSize(9),
                  fontWeight: isPeak ? "700" : "500",
                  marginBottom: 4,
                  height: 12,
                }}
              >
                {mins > 0 ? `${mins}m` : ""}
              </Text>

              {/* Bar track */}
              <View
                style={{
                  width: "100%",
                  height: hp(10),
                  borderRadius: radius(6),
                  backgroundColor: isPeak ? colors.primary + "20" : colors.overlay.white10,
                  justifyContent: "flex-end",
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    width: "100%",
                    height: `${heightPct}%`,
                    backgroundColor: isPeak ? colors.primary : colors.purpleLight,
                    borderRadius: radius(6),
                  }}
                />
              </View>

              <Text
                style={{
                  marginTop: 6,
                  color: isPeak ? colors.primary : colors.textSecondary,
                  fontSize: fontSize(10),
                  fontWeight: isPeak ? "700" : "500",
                }}
              >
                {item.hour.toString().padStart(2, "0")}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Her zaman görünen yatay scroll çubuğu */}
      {isScrollable && (
        <View
          style={{
            height: 4,
            width: trackW,
            borderRadius: 2,
            backgroundColor: colors.overlay.white10,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              position: "absolute",
              left: thumbLeft,
              width: thumbW,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.purpleLight,
            }}
          />
        </View>
      )}
    </ChartContainer>
  );
}