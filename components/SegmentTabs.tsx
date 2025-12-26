import { View } from "./ui/view";
import { TouchableOpacity } from "react-native";
import { Icon } from "./ui/icon";
import { Text } from "./ui/text";
import { ThemePalette } from "@/theme/colors";
import { useResponsive } from "@/hooks/useResponsive";
import { ComponentType } from "react";
import {
  Play,
  List,
  Info,
  NotebookPen,
  LucideProps,
} from "lucide-react-native";
export const SEGMENTS: {
  key: "controls" | "queue" | "details" | "notes";
  label: string;
  icon?: ComponentType<LucideProps>;
}[] = [
  { key: "controls", label: "Kontroller", icon: Play },
  { key: "queue", label: "Sıra", icon: List },
  { key: "details", label: "Detaylar", icon: Info },
  { key: "notes", label: "Notlar", icon: NotebookPen },
];

type SegmentKey = (typeof SEGMENTS)[number]["key"];

type SegmentTabsProps = {
  segments: typeof SEGMENTS;
  activeSegment: SegmentKey;
  onSelect: (segment: SegmentKey) => void;
  colors: ThemePalette;
};

export default function SegmentTabs({
  segments,
  activeSegment,
  onSelect,
  colors,
}: SegmentTabsProps) {
  const { wp, fontSize, hp, radius } = useResponsive();
  return (
    <View
      className="flex-row  items-center"
      style={{
        paddingHorizontal: wp(1),
        backgroundColor: colors.overlay.white10,
        borderRadius: radius(99),
      }}
    >
      {segments.map((segment) => {
        const isActive = activeSegment === segment.key;
        return (
          <TouchableOpacity
            key={segment.key}
            onPress={() => onSelect(segment.key)}
            className={"flex-1 flex-row items-center justify-center "}
            style={{
              backgroundColor: isActive
                ? colors.player.iconWhite
                : "transparent",
              paddingVertical: hp(1),
              borderRadius: radius(99),
              gap: wp(1),
            }}
          >
            {segment.icon ? (
              <Icon
                name={segment.icon}
                size={fontSize(13)}
                color={
                  isActive ? colors.player.iconDark : colors.player.iconInactive
                }
              />
            ) : null}
            <Text
              className=" font-semibold"
              style={{
                color: isActive
                  ? colors.player.iconDark
                  : colors.player.textMuted,
                fontSize: fontSize(13),
              }}
            >
              {segment.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
