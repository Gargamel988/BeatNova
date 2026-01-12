import React, { useState, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { useBottomSheet } from "@/components/ui/bottom-sheet";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { CurrentlyPlayingCard } from "@/components/profile/CurrentlyPlayingCard";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { ThemeSelector } from "@/components/profile/ThemeSelector";
import { MostPlayedSongs } from "@/components/profile/MostPlayedSongs";
import { EditProfileSheet } from "@/components/profile/EditProfileSheet";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";
import { useProfile } from "@/hooks/useProfil";
import { useModeToggle } from "@/hooks/useModeToggle";
import { ScrollView } from "@/components/ui/scroll-view";
import { useQueries } from "@tanstack/react-query";
import { getlisteninghistory } from "@/services/StatisticServices";
import { getAllSongsWithDetails } from "@/services/SongsService";
import { ThemeMode } from "@/theme/colors";
import Animated, { FadeInDown } from "react-native-reanimated";
import { ArrowLeft } from "lucide-react-native";
import { router } from "expo-router";
import { useToast } from "@/components/ui/toast";

export default function Profile() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { profile, mutateUpdateProfile } = useProfile();
  const { mode, setMode, availableModes } = useModeToggle();
  const toast = useToast();
  const textPrimary = useColor("authPrimaryText");
  const borderColor = useColor("border");
  const cardBg = useColor("card");
  const backgroundStart = useColor("authBackgroundGradientStart");
  const backgroundMid = useColor("authBackgroundGradientMid");
  const backgroundEnd = useColor("authBackgroundGradientEnd");

  // Bottom sheet for profile editing
  const editProfileSheet = useBottomSheet();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // Fetch listening history and songs for most played
  const [listeningHistory, songs] = useQueries({
    queries: [
      {
        queryKey: ["listeninghistory"],
        queryFn: () => getlisteninghistory(),
      },
      {
        queryKey: ["songs"],
        queryFn: () => getAllSongsWithDetails(),
      },
    ],
  });

  // Initialize form when profile loads or edit sheet opens
  React.useEffect(() => {
    if (profile?.data) {
      setDisplayName(profile.data.display_name || "");
      setBio(profile.data.bio || "");
    }
  }, [profile?.data]);

  const handleEditProfile = () => {
    editProfileSheet.open();
  };

  const handleSaveProfile = async () => {
    try {
      await mutateUpdateProfile.mutateAsync({
        display_name: displayName.trim(),
        bio: bio.trim(),
      });
      editProfileSheet.close();
      toast.success("Profil başarıyla güncellendi");
    } catch {
      toast.error("Profil güncellenirken bir hata oluştu");
    }
  };

  const handleThemeChange = async (themeMode: ThemeMode) => {
    try {
      await mutateUpdateProfile.mutateAsync({ theme: themeMode });
      setMode(themeMode);
    } catch {
      toast.error("Tema değiştirilirken bir hata oluştu");
    }
  };

  // Calculate most played songs
  const mostPlayedSongs = useMemo(() => {
    if (!songs?.data || !listeningHistory?.data) return [];

    const historyBySongId = listeningHistory.data.reduce(
      (acc, item) => {
        if (!acc[item.song_id]) {
          acc[item.song_id] = {
            total_seconds: 0,
            play_count: 0,
          };
        }
        acc[item.song_id].total_seconds += item.total_seconds || 0;
        acc[item.song_id].play_count += item.play_count || 0;
        return acc;
      },
      {} as Record<string, { total_seconds: number; play_count: number }>
    );

    return songs.data
      .map((song) => {
        const history = historyBySongId[String(song.id)];
        if (!history || history.total_seconds === 0) return null;

        const playCount =
          song.duration > 0
            ? Math.round(history.total_seconds / song.duration)
            : history.play_count || 0;

        return {
          id: song.id,
          title: song.title || "Bilinmeyen Şarkı",
          artist: song.artist || "Bilinmeyen Sanatçı",
          plays: playCount,
          cover: song.cover_url || null,
        };
      })
      .filter((song): song is NonNullable<typeof song> => song !== null)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);
  }, [songs?.data, listeningHistory?.data]);

  return (
    <LinearGradient
      colors={[backgroundStart, backgroundMid, backgroundEnd]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: wp(5),
            paddingTop: hp(2),
            paddingBottom: hp(12),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Back Button */}
          <Animated.View
            entering={FadeInDown.delay(100).springify()}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: hp(3),
            }}
          >
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                width: wp(12),
                height: wp(12),
                borderRadius: radius(12),
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
                fontSize: fontSize(32),
                fontWeight: "900",
                letterSpacing: -0.5,
                flex: 1,
              }}
            >
              Profil
            </Text>
          </Animated.View>
          {/* Profile Header */}
          <ProfileHeader
            displayName={profile?.data?.display_name}
            bio={profile?.data?.bio}
            avatarUrl={profile?.data?.avatar_url}
            onEditPress={handleEditProfile}
          />

          {/* Currently Playing */}
          {profile?.data?.show_current_song && (
            <CurrentlyPlayingCard currentSongId={profile?.data?.current_song_id} />
          )}

          {/* Profile Settings */}
          <ProfileSettings
            isPrivate={profile?.data?.is_private}
            showCurrentSong={profile?.data?.show_current_song}
            allowFriendRequests={profile?.data?.allow_friend_requests}
          />

          {/* Theme Selection */}
          <ThemeSelector
            currentMode={mode}
            availableModes={availableModes}
            onThemeChange={handleThemeChange}
          />

          {/* Most Played Songs */}
          <MostPlayedSongs songs={mostPlayedSongs} />
        </ScrollView>
      </SafeAreaView>

      {/* Edit Profile Bottom Sheet */}
      <EditProfileSheet
        isVisible={editProfileSheet.isVisible}
        onClose={editProfileSheet.close}
        displayName={displayName}
        bio={bio}
        onDisplayNameChange={setDisplayName}
        onBioChange={setBio}
        onSave={handleSaveProfile}
        isSaving={mutateUpdateProfile.isPending}
      />
    </LinearGradient>
  );
}
