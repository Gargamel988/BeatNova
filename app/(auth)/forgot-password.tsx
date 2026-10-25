import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { Input } from "@/components/ui/input";
import { Mail, KeyRound } from "lucide-react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useForgotPasswordMutation } from "@/hooks/useAuthMutations";

import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthBottomPrompt } from "@/components/auth/AuthBottomPrompt";
import { ResetPasswordSuccess } from "@/components/auth/ResetPasswordSuccess";

const getForgotPasswordSchema = (t?: (key: string, fallback: string) => string) =>
  z.object({
    email: z
      .string({
        required_error: t
          ? t("validation.emailRequired", "E-posta adresi boş bırakılamaz")
          : "E-posta adresi boş bırakılamaz",
      })
      .email({
        message: t
          ? t("validation.emailInvalid", "Geçerli bir e-posta adresi giriniz")
          : "Geçerli bir e-posta adresi giriniz",
      }),
  });

type ForgotPasswordFormData = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { wp, hp, fontSize, radius } = useResponsive();
  const [emailSent, setEmailSent] = useState(false);

  const schema = useMemo(() => getForgotPasswordSchema(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(schema),
  });

  const { mutate: forgotPasswordMutation, isPending: isLoading } =
    useForgotPasswordMutation(() => setEmailSent(true));

  const primaryText = useColor("authPrimaryText");
  const borderColor = useColor("border");

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation(data.email);
  };

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: emailSent ? "center" : "flex-start",
            paddingHorizontal: wp(6),
            paddingTop: hp(2),
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {emailSent ? (
            <ResetPasswordSuccess onBackToLogin={() => router.back()} />
          ) : (
            <>
              {/* Header */}
              <AuthHeader
                title={t("auth.forgotPassword", "Şifremi Unuttum")}
                subtitle={t(
                  "auth.forgotPasswordDesc",
                  "E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim"
                )}
                icon={KeyRound}
                showBackButton={true}
              />

              {/* Form Alanı */}
              <View style={{ marginBottom: hp(3) }}>
                <Text
                  style={{
                    fontSize: fontSize(14),
                    color: primaryText,
                    marginBottom: hp(1),
                    fontWeight: "500",
                  }}
                >
                  {t("auth.email", "E-posta")}
                </Text>
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChangeText={field.onChange}
                      placeholder={t("auth.emailPlaceholder", "ornek@email.com")}
                      icon={Mail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      containerStyle={{
                        borderColor: errors.email ? "transparent" : borderColor,
                        borderWidth: 1,
                        borderRadius: radius(99),
                      }}
                      error={errors.email?.message}
                    />
                  )}
                />
              </View>

              {/* Gönder Butonu */}
              <AuthSubmitButton
                title={t("auth.sendResetLink", "Sıfırlama Bağlantısı Gönder")}
                loadingTitle={t("common.loading", "Gönderiliyor...")}
                isLoading={isLoading}
                onPress={handleSubmit(onSubmit)}
              />

              {/* Giriş Yap Linki */}
              <AuthBottomPrompt
                promptText={t("auth.rememberPassword", "Şifreni hatırladın mı?")}
                actionText={t("auth.login", "Giriş Yap")}
                onActionPress={() => router.back()}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
