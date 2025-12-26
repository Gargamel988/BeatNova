import { Input } from "../ui/input";
import { View } from "../ui/view";
import { Text } from "../ui/text";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

type NotesSectionProps = {
  note: string;
  onChange: (text: string) => void;
};

export default function NotesSection({ note, onChange }: NotesSectionProps) {
  const { hp, fontSize, radius } = useResponsive();
  const placeholderTextColor = useColor("textMuted");
  const textMuted = useColor("textMuted");
  const cardColor = useColor("card");
  const borderColor = useColor("border");
  return (
    <View
      className="flex-1"
      style={{
        marginTop: hp(2),
        gap: hp(3),
      }}
    >
      <Text style={{ fontSize: fontSize(16) }}>
        Şarkı hakkında kendine not bırak.
      </Text>
      <Input
        value={note}
        onChangeText={onChange}
        placeholder="Örn. Bu kayıt canlı konserden..."
        placeholderTextColor={placeholderTextColor}
        multiline
        numberOfLines={6}
        inputStyle={{ fontSize: fontSize(16) }}
        rows={6}
        containerStyle={{
          backgroundColor: cardColor,
          borderRadius: radius(26),
		  borderWidth: 1,
		  borderColor: borderColor,
        }}
        type="textarea"
      />
      <View className="flex-row justify-end">
        <Text style={{ fontSize: fontSize(12), color: textMuted }}>
          {note.length}/500
        </Text>
      </View>
    </View>
  );
}
