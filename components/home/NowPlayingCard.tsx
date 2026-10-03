import React from "react";
import { View, Image, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Icon } from "@/components/ui/icon";
import { Play, Music2 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Song } from "@/components/songs/songsService";
import { LinearGradient } from "expo-linear-gradient";
import { formatTime } from "@/utils/format";
import { useAudioPlayerContext, useAudioPositionContext } from "@/providers/player-context";

type NowPlayingCardProps = {
  activeSong: Song | null;
};

export function NowPlayingCardComponent({ activeSong }: NowPlayingCardProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const cardBg = useColor("card");
  const textPrimary = useColor("authPrimaryText");
  const textSecondary = useColor("authSecondaryText");
  const borderColor = useColor("border");
  const accent = useColor("accent");
  const accentForeground = useColor("accentForeground");
  
  const { play } = useAudioPlayerContext();
  const { position } = useAudioPositionContext();
  
  if (!activeSong) {
    return null;
  }

  const hasCover = activeSong.metadata?.coverUri;
  const duration = activeSong.duration || 0;
  const currentPos = position || 0;
  const remaining = Math.max(0, duration - currentPos);
  
  const progressPercent = duration > 0 ? (currentPos / duration) * 100 : 0;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => play(activeSong)}
      style={{
        backgroundColor: cardBg,
        borderRadius: radius(24),
        marginBottom: hp(3),
        borderWidth: 1,
        borderColor,
        overflow: "hidden",
        padding: wp(4),
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        
        {/* Sol Taraf: Kapak ve Badge */}
        <View style={{ position: "relative" }}>
          {hasCover ? (
            <Image
              source={{ uri: activeSong.metadata?.coverUri }}
              style={{ width: wp(20), height: wp(20), borderRadius: wp(10) }}
            />
          ) : (
            <LinearGradient
              colors={["#a855f7", "#ec4899"]}
              style={{
                width: wp(20),
                height: wp(20),
                borderRadius: wp(10),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name={Music2} size={28} color="#fff" />
            </LinearGradient>
          )}
          
          {/* Kaldığın Yerden Badge */}
          <View style={{
            position: "absolute",
            top: -hp(1),
            left: -wp(2),
            backgroundColor: "rgba(0,0,0,0.6)",
            paddingHorizontal: wp(2),
            paddingVertical: hp(0.3),
            borderRadius: radius(8),
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
          }}>
            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#06b6d4", marginRight: 4 }} />
            <Text style={{ color: "#06b6d4", fontSize: fontSize(10), fontWeight: "700" }}>
              Kaldığın Yerden
            </Text>
          </View>
        </View>

        {/* Orta Taraf: Şarkı Bilgileri */}
        <View style={{ flex: 1, marginLeft: wp(4) }}>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(11),
              fontWeight: "700",
              letterSpacing: 0.5,
              marginBottom: 2,
              textTransform: "uppercase",
            }}
          >
            ÇALMAYA HAZIR
          </Text>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(18),
              fontWeight: "800",
              marginBottom: 2,
            }}
            numberOfLines={1}
          >
            {activeSong.metadata?.title || "Bilinmeyen Şarkı"}
          </Text>
          <Text
            style={{
              color: textSecondary,
              fontSize: fontSize(13),
              fontWeight: "500",
            }}
            numberOfLines={1}
          >
            {activeSong.metadata?.artist || "Bilinmeyen Sanatçı"}
          </Text>
        </View>

        {/* Sağ Taraf: Oynatma Butonu */}
        <View
          style={{
            width: wp(12),
            height: wp(12),
            borderRadius: wp(6),
            backgroundColor: accent,
            alignItems: "center",
            justifyContent: "center",
            marginLeft: wp(2),
          }}
        >
          <Icon name={Play} size={20} color={accentForeground} />
        </View>
      </View>

      {/* Alt Taraf: Progress Bar */}
      <View style={{ marginTop: hp(2.5) }}>
        <View style={{ height: 4, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2, width: "100%", overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${progressPercent}%`, backgroundColor: "#06b6d4", borderRadius: 2 }} />
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: hp(1) }}>
          <Text style={{ color: textSecondary, fontSize: fontSize(11), fontWeight: "600" }}>
            {formatTime(currentPos)}
          </Text>
          <Text style={{ color: "#06b6d4", fontSize: fontSize(11), fontWeight: "700" }}>
            Kalan {formatTime(remaining)}
          </Text>
          <Text style={{ color: textSecondary, fontSize: fontSize(11), fontWeight: "600" }}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}

export default React.memo(NowPlayingCardComponent);


