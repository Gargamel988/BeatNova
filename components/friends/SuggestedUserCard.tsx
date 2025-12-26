import React from "react";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { View } from "@/components/ui/view";
import { Image } from "@/components/ui/image";
import { Users, Music2, TrendingUp, UserPlus } from "lucide-react-native";
import { SuggestedUser } from "./types";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";


const getInitialsColor = (initials: string): string => {
  const colors = ["#ec4899", "#9333ea", "#a855f7", "#c084fc", "#f472b6"];
  return colors[initials.charCodeAt(0) % colors.length];
};

interface SuggestedUserCardProps {
  user: SuggestedUser;
  onAddFriend: (id: string) => void;
}

export function SuggestedUserCard({
  user,
  onAddFriend,
}: SuggestedUserCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  const primary = useColor("primary");
  const cardBackground = useColor("card");
  const border = useColor("border");

  return (
    <Card
      style={{
        padding: wp(4),
        gap: hp(1.5),
        backgroundColor: cardBackground,
        borderRadius: radius(16),
        borderWidth: 1,
        borderColor: border,
        marginBottom: hp(1.5),
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: wp(3),
        }}
      >
        {/* Avatar with border and online status */}
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
              backgroundColor: getInitialsColor(user.display_name.charAt(0)),
            }}
          >
            {user.avatar_url ? (
              <Image
                source={{ uri: user.avatar_url }}
                variant="default"
                width={wp(16)}
                height={wp(16)}
                showErrorFallback={true}
                errorFallbackText={user.display_name.charAt(0).toUpperCase()}
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
                  {user.display_name.charAt(0).toUpperCase()}
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
              marginBottom: hp(0.3),
            }}
          >
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(17),
                fontWeight: "700",
              }}
            >
              {user.display_name}
            </Text>
          </View>
          {user.bio ? (
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(13),
                lineHeight: fontSize(18),
              }}
              numberOfLines={2}
            >
              {user.bio}
            </Text>
          ) : null}
        </View>

        {/* Genre badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1),
            backgroundColor: primary,
            paddingHorizontal: wp(2.5),
            paddingVertical: hp(0.7),
            borderRadius: radius(20),
          }}
        >
          <Icon name={TrendingUp} size={fontSize(11)} color="#FFFFFF" />
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: fontSize(11),
              fontWeight: "700",
            }}
          >
            {user.genre}
          </Text>
        </View>
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: wp(5),
          marginTop: hp(0.5),
          paddingTop: hp(1),
          borderTopWidth: 1,
          borderTopColor: border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1.5),
          }}
        >
          <View
            style={{
              width: wp(7),
              height: wp(7),
              borderRadius: radius(8),
              backgroundColor: `${accent}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Users} size={fontSize(14)} color={accent} />
          </View>
          <View>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(14),
                fontWeight: "700",
              }}
            >
              {user.mutualFriends}
            </Text>
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(10),
              }}
            >
              Ortak
            </Text>
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1.5),
          }}
        >
          <View
            style={{
              width: wp(7),
              height: wp(7),
              borderRadius: radius(8),
              backgroundColor: `${primary}20`,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Music2} size={fontSize(14)} color={primary} />
          </View>
          <View>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(14),
                fontWeight: "700",
              }}
            >
              {user.genre}
            </Text>
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(10),
              }}
            >
              Müzik
            </Text>
          </View>
        </View>
      </View>

      {/* Action button */}
      <Button
        variant="default"
        style={{
          width: "100%",
          backgroundColor: accent,
          borderRadius: radius(12),
          paddingVertical: hp(1.2),
          marginTop: hp(0.5),
          shadowColor: accent,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 2,
        }}
        textStyle={{
          color: accentForeground,
          fontSize: fontSize(14),
          fontWeight: "700",
        }}
        icon={UserPlus}
        onPress={() => onAddFriend(user.id)}
      >
        Arkadaş Ekle
      </Button>
    </Card>
  );
}

