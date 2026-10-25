import React, { useState } from "react";
import { useResponsive } from "@/hooks/useResponsive";
import { TouchableOpacity } from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Music2, Clock, MoreVertical } from "lucide-react-native";
import { useColor } from "@/hooks/useColor";
import { formatTime } from "@/utils/format";
import { useTranslation } from "react-i18next";

import PlayListPlayModal from "./PlayListPlayModal";
import { PlaylistCover } from "./PlaylistCover";
import { usePlaylistActions } from "@/hooks/usePlaylistActions";
import { PlaylistType } from "@/type/PlaylistType";

export default React.memo(function PlaylistListItem({ playlist }: { playlist: PlaylistType }) {
  const { t } = useTranslation();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { wp, fontSize, radius } = useResponsive();

  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");

  const songCount = playlist?.song_count ?? 0;
  const duration = playlist?.duration ?? 0;
  const durationString = formatTime(Number(duration));
  const mood = playlist?.mood?.slice(0, 3);

  const { showActionsMenu } = usePlaylistActions(playlist);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: cardBg,
        borderRadius: radius(16),
        padding: wp(3),
        borderWidth: 1,
        borderColor,
        gap: wp(3),
      }}
      onPress={() => setIsModalVisible(true)}
      onLongPress={showActionsMenu}
      delayLongPress={500}
    >
      {/* Playlist Kapağı */}
      <PlaylistCover
        songCoverUrls={playlist?.song_cover_urls}
        coverUrl={playlist?.cover_url}
        size={wp(18)}
      />

      {/* Playlist Bilgisi */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(16),
              fontWeight: "700",
              flex: 1,
            }}
            numberOfLines={1}
          >
            {playlist?.name}
          </Text>
          {mood?.map((moodItem: string, index: number) => (
            <View
              key={`${moodItem}-${index}`}
              style={{
                backgroundColor: "rgba(255,255,255,0.05)",
                paddingHorizontal: wp(2),
                paddingVertical: wp(1),
                borderRadius: radius(10),
                marginStart: wp(1),
              }}
            >
              <Text
                style={{
                  color: textSecondary,
                  fontSize: fontSize(11),
                  fontWeight: "600",
                }}
              >
                {moodItem}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(2),
            marginTop: wp(1),
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name={Music2} size={12} color={textSecondary} />
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(12),
              }}
            >
              {t("playlist.songCount", { count: songCount })}
            </Text>
          </View>
          <Text style={{ color: textSecondary }}>•</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Icon name={Clock} size={12} color={textSecondary} />
            <Text
              style={{
                color: textSecondary,
                fontSize: fontSize(12),
              }}
            >
              {durationString}
            </Text>
          </View>
        </View>
      </View>

      {/* More butonu */}
      <TouchableOpacity
        onPress={showActionsMenu}
        style={{
          padding: wp(2),
          borderRadius: radius(8),
        }}
      >
        <Icon name={MoreVertical} size={wp(5)} color={textSecondary} />
      </TouchableOpacity>

      {/* Playlist Play Modal */}
      <PlayListPlayModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        playlistId={playlist.id as number}
        playlistData={playlist}
      />
    </TouchableOpacity>
  );
});