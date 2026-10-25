import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Star, MessageSquareHeart, CheckCircle2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useResponsive } from "@/hooks/useResponsive";
import { useTranslation } from "react-i18next";
import type { RatingStep } from "@/hooks/useRatingPrompt";

type RatingModalProps = {
  visible: boolean;
  step: RatingStep;
  isSubmitting: boolean;
  onAnswerYes: () => void;
  onAnswerNo: () => void;
  onDismissLater: () => void;
  onSubmitFeedback: (feedbackText: string) => void;
  onClose: () => void;
};

export const RatingModal: React.FC<RatingModalProps> = ({
  visible,
  step,
  isSubmitting,
  onAnswerYes,
  onAnswerNo,
  onDismissLater,
  onSubmitFeedback,
  onClose,
}) => {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const [feedbackInput, setFeedbackInput] = useState("");

  const handleYes = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onAnswerYes();
  };

  const handleNo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onAnswerNo();
  };

  const handleLater = () => {
    Haptics.selectionAsync();
    onDismissLater();
  };

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmitFeedback(feedbackInput);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.72)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: wp(6),
          }}
        >
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{
                width: "100%",
                maxWidth: 380,
                backgroundColor: "#0F172A",
                borderRadius: radius(24),
                borderWidth: 1,
                borderColor: "rgba(56, 189, 248, 0.25)",
                padding: wp(6),
                shadowColor: "#38BDF8",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              {/* Kapat Çarpı Butonu */}
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel={t("common.close", { defaultValue: "Kapat" })}
                style={{
                  position: "absolute",
                  top: 16,
                  end: 16,
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "rgba(255, 255, 255, 0.08)",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 10,
                }}
              >
                <X size={16} color="#94A3B8" />
              </TouchableOpacity>

              {/* 1. ADIM: "Beğendin mi?" */}
              {step === "ask" && (
                <View style={{ alignItems: "center" }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      backgroundColor: "rgba(244, 162, 97, 0.16)",
                      borderWidth: 1,
                      borderColor: "rgba(244, 162, 97, 0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: hp(1.8),
                    }}
                  >
                    <Star size={28} color="#F4A261" fill="#F4A261" />
                  </View>

                  <Text
                    style={{
                      color: "#F8FAFC",
                      fontSize: fontSize(18),
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: hp(0.8),
                    }}
                  >
                    {t("rating.title", { defaultValue: "BeatNova'yı sevdin mi?" })}
                  </Text>

                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: fontSize(13),
                      lineHeight: fontSize(19),
                      textAlign: "center",
                      marginBottom: hp(3),
                    }}
                  >
                    {t("rating.desc", {
                      defaultValue:
                        "Müziğin ritmini bizimle yakaladığın için mutluyuz! Deneyimini puanlamak ister misin?",
                    })}
                  </Text>

                  {/* Evet Butonu (En az 44x44 dokunma alanı) */}
                  <TouchableOpacity
                    onPress={handleYes}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t("rating.yes", { defaultValue: "Evet, çok beğendim!" })}
                    style={{
                      width: "100%",
                      backgroundColor: "#38BDF8",
                      borderRadius: radius(14),
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: hp(1.2),
                      minHeight: 46,
                      shadowColor: "#38BDF8",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#0B0F19",
                        fontSize: fontSize(14),
                        fontWeight: "700",
                      }}
                    >
                      {t("rating.yes", { defaultValue: "Evet, çok beğendim!" })}
                    </Text>
                  </TouchableOpacity>

                  {/* Geliştirilmeli (Hayır) Butonu */}
                  <TouchableOpacity
                    onPress={handleNo}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t("rating.no", { defaultValue: "Geliştirilmeli" })}
                    style={{
                      width: "100%",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: radius(14),
                      paddingVertical: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: hp(1),
                      minHeight: 44,
                    }}
                  >
                    <Text
                      style={{
                        color: "#CBD5E1",
                        fontSize: fontSize(13),
                        fontWeight: "600",
                      }}
                    >
                      {t("rating.no", { defaultValue: "Geliştirilmeli" })}
                    </Text>
                  </TouchableOpacity>

                  {/* Daha Sonra Butonu */}
                  <TouchableOpacity
                    onPress={handleLater}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t("rating.later", { defaultValue: "Daha Sonra" })}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: "#64748B",
                        fontSize: fontSize(12),
                        fontWeight: "500",
                      }}
                    >
                      {t("rating.later", { defaultValue: "Daha Sonra" })}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 2. ADIM: Geri Bildirim Formu */}
              {step === "feedback" && (
                <View>
                  <View style={{ alignItems: "center", marginBottom: hp(1.5) }}>
                    <View
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        backgroundColor: "rgba(56, 189, 248, 0.15)",
                        borderWidth: 1,
                        borderColor: "rgba(56, 189, 248, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: hp(1.2),
                      }}
                    >
                      <MessageSquareHeart size={26} color="#38BDF8" />
                    </View>

                    <Text
                      style={{
                        color: "#F8FAFC",
                        fontSize: fontSize(17),
                        fontWeight: "700",
                        textAlign: "center",
                        marginBottom: hp(0.5),
                      }}
                    >
                      {t("rating.feedbackTitle", {
                        defaultValue: "Neyi geliştirmemizi istersin?",
                      })}
                    </Text>

                    <Text
                      style={{
                        color: "#94A3B8",
                        fontSize: fontSize(12),
                        lineHeight: fontSize(17),
                        textAlign: "center",
                      }}
                    >
                      {t("rating.feedbackDesc", {
                        defaultValue:
                          "Görüşlerin BeatNova'yı daha iyi yapmamıza yardımcı olur.",
                      })}
                    </Text>
                  </View>

                  <TextInput
                    value={feedbackInput}
                    onChangeText={setFeedbackInput}
                    placeholder={t("rating.feedbackPlaceholder", {
                      defaultValue: "Fikirlerini ve önerilerini buraya yaz...",
                    })}
                    placeholderTextColor="#64748B"
                    multiline
                    numberOfLines={4}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.06)",
                      borderWidth: 1,
                      borderColor: "rgba(255, 255, 255, 0.12)",
                      borderRadius: radius(14),
                      padding: 12,
                      color: "#F8FAFC",
                      fontSize: fontSize(13),
                      minHeight: 90,
                      textAlignVertical: "top",
                      marginBottom: hp(2),
                    }}
                  />

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isSubmitting || !feedbackInput.trim()}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={t("rating.submit", { defaultValue: "Gönder" })}
                    style={{
                      width: "100%",
                      backgroundColor: feedbackInput.trim()
                        ? "#38BDF8"
                        : "rgba(56, 189, 248, 0.3)",
                      borderRadius: radius(14),
                      paddingVertical: 13,
                      alignItems: "center",
                      justifyContent: "center",
                      minHeight: 46,
                      marginBottom: hp(1),
                    }}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#0B0F19" />
                    ) : (
                      <Text
                        style={{
                          color: feedbackInput.trim() ? "#0B0F19" : "#94A3B8",
                          fontSize: fontSize(14),
                          fontWeight: "700",
                        }}
                      >
                        {t("rating.submit", { defaultValue: "Gönder" })}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={t("common.cancel", { defaultValue: "İptal" })}
                    style={{
                      paddingVertical: 8,
                      alignItems: "center",
                      minHeight: 44,
                      justifyContent: "center",
                    }}
                  >
                    <Text style={{ color: "#64748B", fontSize: fontSize(12) }}>
                      {t("common.cancel", { defaultValue: "İptal" })}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 3. ADIM: Teşekkür Ekranı */}
              {step === "thankYou" && (
                <View style={{ alignItems: "center", paddingVertical: hp(2) }}>
                  <View
                    style={{
                      width: 58,
                      height: 58,
                      borderRadius: 29,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      borderWidth: 1,
                      borderColor: "rgba(16, 185, 129, 0.35)",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: hp(1.8),
                    }}
                  >
                    <CheckCircle2 size={32} color="#10B981" />
                  </View>

                  <Text
                    style={{
                      color: "#F8FAFC",
                      fontSize: fontSize(18),
                      fontWeight: "700",
                      textAlign: "center",
                      marginBottom: hp(0.8),
                    }}
                  >
                    {t("rating.thankYou", { defaultValue: "Geri Bildirimin Alındı!" })}
                  </Text>

                  <Text
                    style={{
                      color: "#94A3B8",
                      fontSize: fontSize(13),
                      lineHeight: fontSize(19),
                      textAlign: "center",
                    }}
                  >
                    {t("rating.thankYouDesc", {
                      defaultValue:
                        "BeatNova'yı geliştirmemize katkıda bulunduğun için teşekkürler.",
                    })}
                  </Text>
                </View>
              )}
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
