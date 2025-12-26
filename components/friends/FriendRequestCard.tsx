import React from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { View } from "@/components/ui/view";
import { Users, Music2, Check, X } from "lucide-react-native";
import { FriendRequest } from "./types";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

const getInitialsColor = (initials: string): string => {
  const colors = ["#ec4899", "#9333ea", "#a855f7", "#c084fc", "#f472b6"];
  return colors[initials.charCodeAt(0) % colors.length];
};

interface FriendRequestCardProps {
  request: FriendRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export function FriendRequestCard({
  request,
  onAccept,
  onReject,
}: FriendRequestCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  const muted = useColor("textMuted");

  return (
    <Card
      style={{
        padding: wp(4),
        gap: hp(1.5),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: wp(3),
        }}
      >
        <View
          style={{
            width: wp(14),
            height: wp(14),
            borderRadius: radius(12),
            backgroundColor: getInitialsColor(request.initials),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: fontSize(16),
              fontWeight: "700",
            }}
          >
            {request.initials}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(16),
              fontWeight: "700",
              marginBottom: 2,
            }}
          >
            {request.name}
          </Text>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(13),
            }}
          >
            {request.username}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: wp(4),
          marginTop: hp(0.5),
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name={Users} size={14} color={muted} />
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
            }}
          >
            {request.mutualFriends} ortak arkadaş
          </Text>
        </View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name={Music2} size={14} color={muted} />
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(12),
            }}
          >
            {request.genre}
          </Text>
        </View>
      </View>

      <View
        style={{
          flexDirection: "row",
          gap: wp(2),
          marginTop: hp(1),
        }}
      >
        <Button
          variant="default"
          style={{
            flex: 1,
            backgroundColor: accent,
          }}
          textStyle={{
            color: accentForeground,
            fontSize: fontSize(14),
            fontWeight: "700",
          }}
          icon={Check}
          onPress={() => onAccept(request.id)}
        >
          Kabul Et
        </Button>
        <Button
          variant="outline"
          style={{
            flex: 1,
            borderColor: borderColor,
          }}
          textStyle={{
            color: textSecondary,
            fontSize: fontSize(14),
            fontWeight: "700",
          }}
          icon={X}
          onPress={() => onReject(request.id)}
        >
          Reddet
        </Button>
      </View>
    </Card>
  );
}

