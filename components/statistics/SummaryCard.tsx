import React from "react";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
  const { wp, hp, fontSize } = useResponsive();
  const { palette: colors } = useThemeModeContext();

  return (
    <Card
      style={{
        width: "48%",
      }}
    >
      <CardContent>
        <CardHeader>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: wp(1.2),
            }}
          >
            <Icon name={icon} size={16} color={colors.accent} />
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: fontSize(12),
                fontWeight: "600",
              }}
            >
              {label}
            </Text>
          </View>
        </CardHeader>

        <Text
          style={{
            color: colors.text,
            fontSize: fontSize(22),
            fontWeight: "800",
            marginBottom: hp(0.2),
          }}
        >
          {value}
        </Text>

        {!!subLabel && (
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize(11),
              marginBottom: hp(0.2),
            }}
          >
            {subLabel}
          </Text>
        )}

        {!!delta && (
          <Text
            style={{
              color: colors.green,
              fontSize: fontSize(11),
              fontWeight: "600",
            }}
          >
            {delta}
          </Text>
        )}
      </CardContent>
    </Card>
  );
}

