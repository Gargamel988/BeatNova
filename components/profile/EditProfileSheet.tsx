import React from "react";
import { TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { Input } from "@/components/ui/input";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { useColor } from "@/hooks/useColor";
import { useResponsive } from "@/hooks/useResponsive";

interface EditProfileSheetProps {
  isVisible: boolean;
  onClose: () => void;
  displayName: string;
  bio: string;
  onDisplayNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: () => void;
  isSaving?: boolean;
}

export function EditProfileSheet({
  isVisible,
  onClose,
  displayName,
  bio,
  onDisplayNameChange,
  onBioChange,
  onSave,
  isSaving = false,
}: EditProfileSheetProps) {
  const { wp, hp, fontSize, radius } = useResponsive();
  const textPrimary = useColor("authPrimaryText");
  const accent = useColor("accent");
  const primary = useColor("primary");

  return (
    <BottomSheet
      isVisible={isVisible}
      onClose={onClose}
      title="Profili Düzenle"
      snapPoints={[0.7]}
    >
      <View style={{ gap: hp(2) }}>
        <View>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(14),
              fontWeight: "600",
              marginBottom: hp(1),
              marginLeft: wp(1),
            }}
          >
            İsim
          </Text>
          <Input
            value={displayName}
            onChangeText={onDisplayNameChange}
            placeholder="İsminizi girin"
            variant="filled"
          />
        </View>

        <View>
          <Text
            style={{
              color: textPrimary,
              fontSize: fontSize(14),
              fontWeight: "600",
              marginBottom: hp(1),
              marginLeft: wp(1),
            }}
          >
            Bio
          </Text>
          <Input
            value={bio}
            onChangeText={onBioChange}
            placeholder="Hakkınızda bir şeyler yazın..."
            variant="filled"
            type="textarea"
            rows={4}
          />
        </View>

        <TouchableOpacity
          onPress={onSave}
          disabled={isSaving}
          style={{
            marginTop: hp(2),
            paddingVertical: hp(1.5),
            borderRadius: radius(14),
            overflow: "hidden",
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[primary, accent]}
            style={{
              paddingVertical: hp(1.5),
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: fontSize(16),
                fontWeight: "700",
              }}
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

