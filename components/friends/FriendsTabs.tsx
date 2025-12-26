import React from "react";
import { TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { TabType } from "./types";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";

interface FriendsTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  pendingRequests: number;
}

export function FriendsTabs({
  activeTab,
  onTabChange,
  pendingRequests,
}: FriendsTabsProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  const red = useColor("red");

  return (
    <View
      style={{
        flexDirection: "row",
        gap: wp(2),
        marginBottom: hp(2),
        backgroundColor: cardBg,
        borderRadius: radius(16),
        padding: wp(1),
        borderWidth: 1,
        borderColor,
      }}
    >
      <TouchableOpacity
        onPress={() => onTabChange("friends")}
        style={{
          flex: 1,
          paddingVertical: hp(1.2),
          paddingHorizontal: wp(3),
          borderRadius: radius(12),
          backgroundColor: activeTab === "friends" ? accent : "transparent",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: activeTab === "friends" ? accentForeground : textSecondary,
            fontSize: fontSize(13),
            fontWeight: activeTab === "friends" ? "700" : "500",
          }}
        >
          Arkadaşlar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTabChange("requests")}
        style={{
          flex: 1,
          paddingVertical: hp(1.2),
          paddingHorizontal: wp(3),
          borderRadius: radius(12),
          backgroundColor: activeTab === "requests" ? accent : "transparent",
          alignItems: "center",
          position: "relative",
        }}
      >
        {pendingRequests > 0 && (
          <View
            style={{
              position: "absolute",
              top: -4,
              right: wp(2),
              backgroundColor: red,
              borderRadius: 10,
              minWidth: 20,
              height: 20,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: fontSize(10),
                fontWeight: "700",
              }}
            >
              {pendingRequests}
            </Text>
          </View>
        )}
        <Text
          style={{
            color: activeTab === "requests" ? accentForeground : textSecondary,
            fontSize: fontSize(13),
            fontWeight: activeTab === "requests" ? "700" : "500",
          }}
        >
          İstekler
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => onTabChange("add")}
        style={{
          flex: 1,
          paddingVertical: hp(1.2),
          paddingHorizontal: wp(3),
          borderRadius: radius(12),
          backgroundColor: activeTab === "add" ? accent : "transparent",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: activeTab === "add" ? accentForeground : textSecondary,
            fontSize: fontSize(13),
            fontWeight: activeTab === "add" ? "700" : "500",
          }}
        >
          Arkadaş Ekle
        </Text>
      </TouchableOpacity>
    </View>
  );
}

