import React from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { View } from "@/components/ui/view";
import { Image } from "@/components/ui/image";
import { Play } from "lucide-react-native";
import { Friend } from "./types";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";

const getInitialsColor = (initials: string): string => {
  const colors = ["#ec4899", "#9333ea", "#a855f7", "#c084fc", "#f472b6"];
  return colors[initials.charCodeAt(0) % colors.length];
};

interface FriendCardProps {
  friend: Friend;
}

export function FriendCard({ friend }: FriendCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");
  const border = useColor("border");

  return (
    <Card
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: wp(4),
        gap: wp(3),
        borderRadius: radius(16),
        borderWidth: 1,
        borderColor: border,
        marginBottom: hp(1),
      }}
    >
      {/* Avatar with online status */}
      <View
        style={{
          width: wp(16),
          height: wp(16),
          position: "relative",
        }}
      >
        <View
          style={{
            width: wp(16),
            height: wp(16),
            borderRadius: radius(16),
            overflow: "hidden",
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: accent,
            backgroundColor: getInitialsColor(friend.display_name.charAt(0)),
          }}
        >
          {friend.avatar_url ? (
            <Image
              source={{ uri: friend.avatar_url }}
              variant="default"
              width={wp(16)}
              height={wp(16)}
              showErrorFallback={true}
              errorFallbackText={friend.display_name.charAt(0).toUpperCase()}
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: fontSize(18),
                  fontWeight: "700",
                }}
              >
                {friend.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* User info */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1.5),
            marginBottom: 2,
          }}
        >
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(16),
              fontWeight: "700",
            }}
          >
            {friend.display_name}
          </Text>
        </View>
        
        {friend.bio ? (
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(13),
              marginBottom: friend.current_song_id ? 4 : 0,
            }}
            numberOfLines={1}
          >
            {friend.bio}
          </Text>
        ) : null}
        
        {/* Current song indicator */}
        {friend.current_song_id && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
            }}
          >
            <Icon name={Play} size={12} color={accent} />
            <Text
              style={{
                color: accent,
                fontSize: fontSize(12),
                fontWeight: "600",
              }}
            >
              Şu anda müzik dinliyor
            </Text>
          </View>
        )}
      </View>
    </Card>
  );
}

