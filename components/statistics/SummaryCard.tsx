import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useResponsive } from "@/hooks/useResponsive";
import { useThemeModeContext } from "@/providers/theme-provider";
import { LucideIcon } from "lucide-react-native";

interface SummaryCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  delta?: string;
  icon: LucideIcon;
}

export function SummaryCard({
  label,
  value,
  subLabel,
  delta,
  icon,
}: SummaryCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  return (
    <Card
      style={{
        width: "48.5%",
        minHeight: Math.max(110, hp(13.5)),
        padding: wp(3.5),
        justifyContent: "space-between",
        borderRadius: radius(16),
        borderWidth: 1,
        borderColor: colors.overlay.white12,
      }}
    >
      <View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1.5),
            marginBottom: hp(0.6),
          }}
        >
          <Icon name={icon} size={15} color={colors.accent} />
          <Text
            numberOfLines={1}
            style={{
              color: colors.textSecondary,
              fontSize: fontSize(11.5),
              fontWeight: "600",
              flex: 1,
            }}
          >
            {label}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            color: colors.text,
            fontSize: fontSize(18),
            fontWeight: "800",
            letterSpacing: -0.4,
            marginBottom: hp(0.2),
          }}
        >
          {value}
        </Text>
      </View>

      <View style={{ gap: 2 }}>
        {!!subLabel && (
          <Text
            numberOfLines={1}
            style={{
              color: colors.textSecondary,
              fontSize: fontSize(10.5),
            }}
          >
            {subLabel}
          </Text>
        )}

        {!!delta && (
          <Text
            numberOfLines={1}
            style={{
              color: delta.startsWith("-") ? colors.destructive : colors.green,
              fontSize: fontSize(11),
              fontWeight: "700",
            }}
          >
            {delta}
          </Text>
        )}
      </View>
    </Card>
  );
}
