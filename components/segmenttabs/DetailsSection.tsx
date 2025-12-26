import { useResponsive } from "@/hooks/useResponsive";
import { ScrollView } from "../ui/scroll-view";
import { View } from "../ui/view";
import { Text } from "../ui/text";
import { useColor } from "@/hooks/useColor";

type DetailItem = { label: string; value: string };

type DetailsSectionProps = {
  details: DetailItem[];
};

export default function DetailsSection({ details }: DetailsSectionProps) {
  const { hp, fontSize, radius, wp } = useResponsive();
  const cardColor = useColor("card");
  const borderColor = useColor("border");
  const textMuted = useColor("textMuted");
  const text = useColor("text");
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ marginTop: hp(2), gap: hp(0.5) }}
    >
      {details.map((item) => (
        <View
          key={item.label}
          style={{
            backgroundColor: cardColor,
            paddingHorizontal: wp(2),
            paddingVertical: hp(1),
            borderRadius: radius(12),
            borderWidth: 1,
            borderColor: borderColor,
          }}
        >
          <Text style={{ fontSize: fontSize(12), color: textMuted }}>
            {item.label}
          </Text>
          <Text style={{ fontSize: fontSize(16), color: text }}>
            {item.value}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}
