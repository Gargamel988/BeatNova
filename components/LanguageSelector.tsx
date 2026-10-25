import React, { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { SafeAreaView } from "react-native-safe-area-context";
import { Globe, Check, ChevronDown, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
  changeAppLanguage,
} from "@/i18n";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";

interface LanguageSelectorProps {
  compact?: boolean;
  /** Dışarıdan modal açma/kapama kontrolü. Verilmezse kendi butonu ile açılır. */
  visible?: boolean;
  onClose?: () => void;
}

export function LanguageSelector({
  compact = false,
  visible: externalVisible,
  onClose: externalOnClose,
}: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const [internalVisible, setInternalVisible] = useState(false);
  const { wp, hp, fontSize, radius } = useResponsive();

  // Dışarıdan prop verilmişse onu kullan, yoksa internal state
  const isControlled = externalVisible !== undefined;
  const modalVisible = isControlled ? externalVisible : internalVisible;
  const closeModal = () => {
    if (isControlled) {
      externalOnClose?.();
    } else {
      setInternalVisible(false);
    }
  };

  const primaryText = useColor("authPrimaryText");
  const secondaryText = useColor("authSecondaryText");
  const cardBg = useColor("card");
  const borderColor = useColor("border");
  const primaryColor = useColor("primary");
  const background = useColor("background");

  const currentLangCode = (i18n.language || "tr") as SupportedLanguage;
  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) ||
    SUPPORTED_LANGUAGES[0];

  const handleSelectLanguage = async (code: SupportedLanguage) => {
    try {
      await changeAppLanguage(code);
    } catch (e) {
      console.error("Language change error:", e);
    } finally {
      closeModal();
    }
  };

  return (
    <>
      {/* Controlled modda trigger butonunu gösterme */}
      {!isControlled && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setInternalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: wp(1.5),
            paddingVertical: hp(0.8),
            paddingHorizontal: wp(3),
            borderRadius: radius(20),
            borderWidth: 1,
            borderColor: borderColor,
            backgroundColor: cardBg,
          }}
        >
          <Globe size={fontSize(15)} color={primaryColor} />
          <Text
            style={{
              fontSize: fontSize(13),
              color: primaryText,
              fontWeight: "600",
            }}
          >
            {currentLang.flag} {compact ? currentLang.code.toUpperCase() : currentLang.nativeName}
          </Text>
          <ChevronDown size={fontSize(14)} color={secondaryText} />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeModal}
      >
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: background,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: wp(5),
              paddingVertical: hp(2),
              borderBottomWidth: 1,
              borderBottomColor: borderColor,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: wp(3) }}>
              <View
                style={{
                  width: wp(10),
                  height: wp(10),
                  borderRadius: radius(10),
                  backgroundColor: primaryColor + "20",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Globe size={fontSize(20)} color={primaryColor} />
              </View>
              <View>
                <Text
                  style={{
                    fontSize: fontSize(18),
                    fontWeight: "800",
                    color: primaryText,
                  }}
                >
                  {t("language.title", "Dil Seçin / Select Language")}
                </Text>
                <Text
                  style={{
                    fontSize: fontSize(12),
                    color: secondaryText,
                    marginTop: 2,
                  }}
                >
                  {SUPPORTED_LANGUAGES.length} {t("language.available", "dil seçeneği")}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => closeModal()}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={t("common.close", "Kapat")}
              style={{
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={fontSize(20)} color={secondaryText} />
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: wp(5),
              paddingVertical: hp(2),
              gap: hp(1.2),
            }}
          >
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === currentLangCode;
              return (
                <TouchableOpacity
                  key={lang.code}
                  activeOpacity={0.7}
                  onPress={() => handleSelectLanguage(lang.code)}
                  accessibilityRole="button"
                  accessibilityLabel={`${lang.nativeName} (${lang.name})`}
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: hp(1.6),
                    paddingHorizontal: wp(4),
                    borderRadius: radius(14),
                    backgroundColor: isSelected
                      ? "rgba(124, 58, 237, 0.14)"
                      : "rgba(255, 255, 255, 0.04)",
                    borderWidth: 1,
                    borderColor: isSelected ? primaryColor : borderColor,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: wp(3.5),
                    }}
                  >
                    <Text style={{ fontSize: fontSize(22) }}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={{
                          fontSize: fontSize(16),
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? primaryColor : primaryText,
                        }}
                      >
                        {lang.nativeName}
                      </Text>
                      <Text
                        style={{
                          fontSize: fontSize(12),
                          color: secondaryText,
                          marginTop: 1,
                        }}
                      >
                        {lang.name}
                      </Text>
                    </View>
                  </View>

                  {isSelected && (
                    <View
                      style={{
                        width: wp(6.5),
                        height: wp(6.5),
                        borderRadius: radius(99),
                        backgroundColor: primaryColor,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={fontSize(14)} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default LanguageSelector;
