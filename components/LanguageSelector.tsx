import React, { useState } from "react";
import {
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
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
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.65)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: wp(5),
          }}
          onPress={closeModal}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxHeight: hp(75),
              backgroundColor: cardBg,
              borderRadius: radius(20),
              borderWidth: 1,
              borderColor: borderColor,
              padding: wp(4.5),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: hp(2),
                paddingBottom: hp(1.5),
                borderBottomWidth: 1,
                borderBottomColor: borderColor,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: wp(2) }}>
                <Globe size={fontSize(20)} color={primaryColor} />
                <Text
                  style={{
                    fontSize: fontSize(17),
                    fontWeight: "bold",
                    color: primaryText,
                  }}
                >
                  {t("language.title", "Dil Seçin / Select Language")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => closeModal()}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={fontSize(20)} color={secondaryText} />
              </TouchableOpacity>
            </View>

            {/* Language List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: hp(1) }}
            >
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = lang.code === currentLangCode;
                return (
                  <TouchableOpacity
                    key={lang.code}
                    activeOpacity={0.7}
                    onPress={() => handleSelectLanguage(lang.code)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingVertical: hp(1.4),
                      paddingHorizontal: wp(3.5),
                      borderRadius: radius(12),
                      backgroundColor: isSelected
                        ? "rgba(124, 58, 237, 0.12)"
                        : "transparent",
                      borderWidth: 1,
                      borderColor: isSelected ? primaryColor : "transparent",
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: wp(3),
                      }}
                    >
                      <Text style={{ fontSize: fontSize(20) }}>{lang.flag}</Text>
                      <View>
                        <Text
                          style={{
                            fontSize: fontSize(15),
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
                          }}
                        >
                          {lang.name}
                        </Text>
                      </View>
                    </View>

                    {isSelected && (
                      <View
                        style={{
                          width: wp(6),
                          height: wp(6),
                          borderRadius: radius(99),
                          backgroundColor: primaryColor,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Check size={fontSize(13)} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

export default LanguageSelector;
