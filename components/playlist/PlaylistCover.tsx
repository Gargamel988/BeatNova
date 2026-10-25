import React from "react";
import { View, Image } from "react-native";
import { Icon } from "@/components/ui/icon";
import { Music2 } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type PlaylistCoverProps = {
  songCoverUrls?: string[] | null;
  coverUrl?: string | null;
  size?: number;
  borderRadius?: number;
};

export const PlaylistCover: React.FC<PlaylistCoverProps> = React.memo(
  ({ songCoverUrls, coverUrl, size, borderRadius }) => {
    const { wp, radius } = useResponsive();
    const cardBg = useColor("card");
    const borderColor = useColor("border");
    const textSecondary = useColor("authSecondaryText");

    const coverSize = size ?? wp(18);
    const coverRadius = borderRadius ?? radius(14);

    return (
      <View
        style={{
          width: coverSize,
          height: coverSize,
          borderRadius: coverRadius,
          overflow: "hidden",
          backgroundColor: cardBg,
        }}
      >
        {songCoverUrls && songCoverUrls.length > 0 ? (
          <View style={{ flex: 1, flexDirection: "row", flexWrap: "wrap" }}>
            {[0, 1, 2, 3].map((index) => {
              const url = songCoverUrls[index];
              const hasCover = url && url.trim() !== "";
              return (
                <View
                  key={index}
                  style={{
                    width: "50%",
                    height: "50%",
                    borderWidth: 0.5,
                    borderColor: borderColor,
                  }}
                >
                  {hasCover ? (
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: "100%",
                        height: "100%",
                        backgroundColor: cardBg,
                      }}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ) : coverUrl && coverUrl.trim() !== "" ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: "100%",
              height: "100%",
              backgroundColor: cardBg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name={Music2} size={coverSize * 0.44} color={textSecondary} />
          </View>
        )}
      </View>
    );
  }
);
