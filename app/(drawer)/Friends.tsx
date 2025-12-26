import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { StatsCards } from "@/components/friends/StatsCards";
import { FriendsTabs } from "@/components/friends/FriendsTabs";
import { FriendCard } from "@/components/friends/FriendCard";
import { FriendRequestCard } from "@/components/friends/FriendRequestCard";
import { SuggestedUserCard } from "@/components/friends/SuggestedUserCard";
import { TabType ,SuggestedUser} from "@/components/friends/types";
import { Search, ArrowLeft } from "lucide-react-native";
import { useFriends } from "@/hooks/useFriends";
import { router } from "expo-router";
import { TouchableOpacity } from "react-native";
import { Icon } from "@/components/ui/icon";
import { ScrollView } from "@/components/ui/scroll-view";
export default function FriendsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("friends");
  const [searchQuery, setSearchQuery] = useState("");
  const {
    suggestedUsers,
    mutateAddFriend,
    mutateAcceptFriendRequest,
    mutateRejectFriendRequest,
    friendRequests,
    friends,
  } = useFriends(searchQuery);
  const { wp, hp, fontSize, radius } = useResponsive();
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");

  const totalFriends = friends?.length || 0;
  const pendingRequests = friendRequests?.length || 0;

  const filteredFriends = friends?.filter(
    (f) =>
      f.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.bio && f.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRequests = friendRequests?.filter((r) =>
    r.request_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Service'te zaten arama yapılıyor, direkt kullan
  const filteredSuggestedUsers =
    searchQuery && searchQuery.trim() ? suggestedUsers : [];
  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
            paddingBottom: hp(12),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: hp(2),
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: wp(11),
                height: wp(11),
                borderRadius: radius(10),
                backgroundColor: cardBg,
                alignItems: "center",
                justifyContent: "center",
                marginRight: wp(3),
                borderWidth: 1,
                borderColor,
              }}
              activeOpacity={0.7}
            >
              <Icon name={ArrowLeft} size={22} color={textPrimary} />
            </TouchableOpacity>
            <Text
              style={{
                color: textPrimary,
                fontSize: fontSize(28),
                fontWeight: "900",
                letterSpacing: -0.5,
                flex: 1,
              }}
            >
              Arkadaşlar
            </Text>
          </View>
          <StatsCards
            totalFriends={totalFriends}
            activeFriends={0}
            pendingRequests={pendingRequests}
          />
          <FriendsTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            pendingRequests={pendingRequests}
          />

          <Input
            containerStyle={{
              marginBottom: hp(2),
              borderRadius: radius(99),
              borderWidth: 1,
              borderColor,
            }}
            placeholder={
              activeTab === "friends"
                ? "Arkadaş ara..."
                : activeTab === "requests"
                ? "İstek ara..."
                : "Kullanıcı ara..."
            }
            placeholderTextColor={textSecondary}
            value={searchQuery}
            icon={Search}
            onChangeText={setSearchQuery}
            variant="filled"
          />

          {activeTab === "friends" && (
            <View style={{ gap: hp(1.5) }}>
              {filteredFriends?.map((friend) => (
                <FriendCard
                  key={friend.id}
                  friend={friend}
                />
              ))}
            </View>
          )}

          {activeTab === "requests" && (
            <View style={{ gap: hp(1.5) }}>
              {filteredRequests?.map((request) => (
                <FriendRequestCard
                  key={request.id}
                  request={{
                    id: request.id,
                    name: request.display_name,
                    username: request.display_name,
                    initials: request.display_name.charAt(0),
                    mutualFriends: 0,
                    genre: "",
                  }}
                  onAccept={(id) => mutateAcceptFriendRequest.mutate(id)}
                  onReject={(id) => mutateRejectFriendRequest.mutate(id)}
                />
              ))}
            </View>
          )}

          {activeTab === "add" && (
            <View style={{ gap: hp(1.5) }}>
              
              {!searchQuery || searchQuery.trim().length === 0 ? (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(16),
                    fontWeight: "500",
                  }}
                >
                  Kullanıcı aramak için yukarıdaki alana yazın
                </Text>
              ) : filteredSuggestedUsers &&
                filteredSuggestedUsers.length > 0 ? (
                filteredSuggestedUsers.map((user) => (
                  <SuggestedUserCard
                    key={user.id}
                    user={user as SuggestedUser}
                    onAddFriend={() => mutateAddFriend.mutate(user.id)}
                  />
                ))
              ) : (
                <Text
                  style={{
                    color: textSecondary,
                    fontSize: fontSize(16),
                    fontWeight: "500",
                  }}
                >
                  Kullanıcı bulunamadı
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}
