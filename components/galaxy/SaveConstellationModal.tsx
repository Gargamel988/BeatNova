import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Disc3, Check, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useThemeModeContext } from "@/providers/theme-provider";
import { createPlaylist, addMultipleSongsToPlaylist } from "@/services/PlaylistServices";
import type { GalaxyStar } from "@/utils/buildGalaxy";

type SaveConstellationModalProps = {
  visible: boolean;
  onClose: () => void;
  stars: GalaxyStar[];
  onSaved: (playlistTitle: string) => void;
};

export const SaveConstellationModal: React.FC<SaveConstellationModalProps> = ({
  visible,
  onClose,
  stars,
  onSaved,
}) => {
  const { t, i18n } = useTranslation();
  const { palette: colors } = useThemeModeContext();

  const dateStr = new Date().toLocaleDateString(i18n.language || "tr", {
    day: "numeric",
    month: "short",
  });
  const defaultTitle = `${t("galaxy.constellationTitle", { defaultValue: "Takımyıldız" })} (${dateStr})`;

  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Toplam süre (dakika)
  const totalSeconds = stars.reduce((sum, s) => sum + (s.duration || 0), 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  const handleSave = async () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // 1. Yeni çalma listesi oluştur
      const defaultDesc = t("galaxy.constellationDefaultDesc", {
        count: stars.length,
        defaultValue: `Galaksin ekranından çizilerek oluşturuldu (${stars.length} şarkı)`,
      });

      const newPlaylist = await createPlaylist({
        name: trimmedTitle,
        description: description.trim() || defaultDesc,
        is_public: false,
        tags: ["galaxy", "constellation"],
      });

      if (!newPlaylist?.id) {
        throw new Error(
          t("galaxy.saveError", { defaultValue: "Çalma listesi oluşturulamadı" })
        );
      }

      // 2. Yakalanan şarkıların ID'lerini sırayla ekle
      const songIds = stars.map((s) => s.id);
      await addMultipleSongsToPlaylist(songIds, Number(newPlaylist.id));

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved(trimmedTitle);
      onClose();
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : t("galaxy.saveError", { defaultValue: "Kayıt sırasında bir hata oluştu" });
      setErrorMessage(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.72)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            maxWidth: 380,
            backgroundColor: "#0D111A",
            borderColor: "rgba(56,189,248,0.25)",
            borderWidth: 1,
            borderRadius: 20,
            padding: 22,
            shadowColor: "#38BDF8",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.25,
            shadowRadius: 18,
            elevation: 10,
          }}
        >
          {/* Başlık ve kapat */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  backgroundColor: "rgba(56,189,248,0.12)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Disc3 size={20} color="#38BDF8" />
              </View>
              <Text
                style={{
                  color: "#F8FAFC",
                  fontSize: 18,
                  fontWeight: "700",
                }}
              >
                {t("galaxy.saveTitle", { defaultValue: "Çizilen Playlist'i Kaydet" })}
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={t("common.close", { defaultValue: "Kapat" })}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* İstatistik rozeti */}
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginBottom: 18,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "500" }}>
              {t("galaxy.constellationCount", {
                count: stars.length,
                defaultValue: `${stars.length} Şarkı`,
              })}
            </Text>
            <Text style={{ color: "#64748B", fontSize: 13 }}>•</Text>
            <Text style={{ color: "#94A3B8", fontSize: 13, fontWeight: "500" }}>
              {t("galaxy.approxMinutes", {
                count: totalMinutes,
                defaultValue: `Yaklaşık ${totalMinutes} dk`,
              })}
            </Text>
            <Text style={{ color: "#64748B", fontSize: 13 }}>•</Text>
            <Text style={{ color: "#38BDF8", fontSize: 13, fontWeight: "600" }}>
              {t("galaxy.customOrder", { defaultValue: "Özel Sıralı" })}
            </Text>
          </View>

          {/* Başlık Girişi */}
          <Text
            style={{
              color: "#CBD5E1",
              fontSize: 13,
              fontWeight: "600",
              marginBottom: 6,
            }}
          >
            {t("playlist.name", { defaultValue: "Çalma Listesi Adı" })}
          </Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t("galaxy.savePlaceholder", {
              defaultValue: "Örn: Gece Yolculuğu",
            })}
            placeholderTextColor="#64748B"
            maxLength={60}
            style={{
              backgroundColor: "#161D2B",
              color: "#F8FAFC",
              fontSize: 15,
              paddingHorizontal: 14,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              marginBottom: 14,
            }}
          />

          {/* Açıklama Girişi */}
          <Text
            style={{
              color: "#CBD5E1",
              fontSize: 13,
              fontWeight: "600",
              marginBottom: 6,
            }}
          >
            {t("playlist.descriptionOptional", { defaultValue: "Açıklama (İsteğe bağlı)" })}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder={t("playlist.shortNotePlaceholder", {
              defaultValue: "Kısa bir not...",
            })}
            placeholderTextColor="#64748B"
            maxLength={120}
            style={{
              backgroundColor: "#161D2B",
              color: "#F8FAFC",
              fontSize: 14,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              marginBottom: 18,
            }}
          />

          {errorMessage ? (
            <Text
              style={{
                color: "#F87171",
                fontSize: 12,
                marginBottom: 12,
              }}
            >
              {errorMessage}
            </Text>
          ) : null}

          {/* Aksiyon butonları */}
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSaving}
              accessibilityRole="button"
              accessibilityLabel={t("common.cancel", { defaultValue: "İptal" })}
              style={{
                flex: 1,
                paddingVertical: 13,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.06)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#94A3B8", fontSize: 14, fontWeight: "600" }}>
                {t("common.cancel", { defaultValue: "İptal" })}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !title.trim()}
              accessibilityRole="button"
              accessibilityLabel={t("galaxy.save", { defaultValue: "Kaydet" })}
              style={{
                flex: 1.6,
                paddingVertical: 13,
                borderRadius: 12,
                backgroundColor: title.trim() ? "#38BDF8" : "rgba(56,189,248,0.3)",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 8,
              }}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#07090E" />
              ) : (
                <>
                  <Check size={18} color="#07090E" strokeWidth={2.5} />
                  <Text
                    style={{
                      color: "#07090E",
                      fontSize: 14,
                      fontWeight: "700",
                    }}
                  >
                    {t("galaxy.save", { defaultValue: "Kaydet" })}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
