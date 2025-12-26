import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { TouchableOpacity, FlatList } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Icon } from "@/components/ui/icon";
import {  Music } from "lucide-react-native";
import { Song } from "@/components/songs/songsService";
import { useResponsive } from "@/hooks/useResponsive";
import { formatTime } from "@/utils/format";
import { useThemeModeContext } from "@/providers/theme-provider";
import { EmptyState } from "@/components/ui/empty-state";
type QueueSectionProps = {
  queue: Song[];
};

export default function QueueSection({ queue }: QueueSectionProps) {
  const { wp, hp, radius, fontSize } = useResponsive();
  const { palette } = useThemeModeContext();

  if (queue.length === 0) {
    return (
      <EmptyState 
        title="Kuyruk Boş"
        message="Çalma kuyruğunda şarkı yok"
        icon="music"
        fullScreen
      />
    );
  }

  return (
    <View className="flex-1" style={{ marginTop: hp(1) }}>
      <FlatList
        data={queue}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={{ height: hp(2) }} />}
        renderItem={({ item, index }) => {
          const isCurrent = index === 0;
          return (
            <TouchableOpacity
              activeOpacity={0.9}
              className={`flex-row items-center rounded-2xl ${
                isCurrent
                  ? "bg-white/15 border border-white/30"
                  : "bg-white/5 border border-white/10"
              }`}
              style={{
                gap: wp(3),
                paddingHorizontal: wp(4),
                paddingVertical: hp(3),
              }}
            >
              <View
                className="overflow-hidden"
                style={{
                  width: wp(12),
                  height: wp(12),
                  borderRadius: radius(12),
                  backgroundColor: palette.player.queueItemBg,
                }}
              >
                {item.metadata?.coverUri ? (
                  <Image
                    source={{ uri: item.metadata?.coverUri }}
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: radius(12),
                    }}
                  />
                ) : (
                  <LinearGradient
                    colors={palette.gradient.coverArt as [string, string]}
                    style={{
                      width: wp(12),
                      height: wp(12),
                      borderRadius: radius(12),
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Icon
                      name={Music}
                      color={palette.player.iconWhite}
                      size={18}
                    />
                  </LinearGradient>
                )}
              </View>

              <View className="flex-1">
                <Text
                  style={{
                    fontSize: fontSize(15),
                    color: isCurrent
                      ? palette.player.iconWhite
                      : palette.player.textMuted,
                  }}
                  numberOfLines={1}
                >
                  {item.metadata?.title || "Bilinmeyen Şarkı"}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(11),
                    color: isCurrent
                      ? palette.player.textMuted
                      : palette.player.textMuted,
                  }}
                  numberOfLines={1}
                >
                  {item.metadata?.artist ?? "Bilinmeyen Sanatçı"}
                </Text>
              </View>

              <View className="items-end gap-1">
                <Text
                  style={{
                    fontSize: fontSize(11),
                    color: palette.player.textMuted,
                  }}
                >
                  {formatTime(item.metadata?.duration ?? item.duration ?? 0)}
                </Text>
                {isCurrent ? (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(1),
                      backgroundColor: palette.overlay.white20,
                      borderRadius: radius(99),
                      paddingHorizontal: wp(2),
                      paddingVertical: hp(1),
                    }}
                  >
                    <View
					className="animate-pulse"
                      style={{
                        width: wp(2),
                        height: wp(2),
                        backgroundColor: palette.green,
                        borderRadius: radius(99),
                      }}
                    />
                    <Text
                      style={{
                        fontSize: fontSize(11),
                        color: palette.player.iconWhite,
                      }}
                    >
                      Çalıyor
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(1),
                      backgroundColor: palette.overlay.white30,
                      borderRadius: radius(99),
					  paddingHorizontal: wp(2),
					  paddingVertical: hp(1),
                    }}
                  >
                    <View
                      style={{
                        width: wp(1.5),
                        height: wp(1.5),
                        backgroundColor: palette.overlay.white30,
                        borderRadius: radius(99),
                      }}
                    />
                    <Text
                      style={{
                        fontSize: fontSize(11),
                        color: palette.player.textMuted,
                      }}
                    >
                      Sırada
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}
