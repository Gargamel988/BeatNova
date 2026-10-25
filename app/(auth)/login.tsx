import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View } from "@/components/ui/view";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { router } from "expo-router";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { useResponsive } from "@/hooks/useResponsive";
import { useColor } from "@/hooks/useColor";
import { getLoginScheme, LoginSchemeType } from "@/schemes/LoginScheme";
import { useLoginMutation } from "@/hooks/useAuthMutations";

import GoogleSignIn from "@/components/GoogleAuth";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthBottomPrompt } from "@/components/auth/AuthBottomPrompt";

export default function Login() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const { wp, hp, fontSize, radius } = useResponsive();

  const loginScheme = useMemo(() => getLoginScheme(t), [t]);
  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<LoginSchemeType>({
    resolver: zodResolver(loginScheme),
  });

  const { mutate: loginMutation, isPending: isLoggingIn } = useLoginMutation(() => reset());

  const primaryText = useColor("authPrimaryText");
  const linkColor = useColor("authLink");
  const rightIconColor = useColor("authRightIcon");
  const borderColor = useColor("border");

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: wp(6),
            paddingTop: hp(2),
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <AuthHeader
            title={t("auth.welcomeBack", "BeatNova'ya Hoş Geldin")}
            subtitle={t("auth.subtitle", "Müziğin tadını çıkarmaya devam et")}
          />

          {/* Form Alanları */}
          <View style={{ gap: hp(2.5), marginBottom: hp(2) }}>
            {/* E-posta */}
            <View>
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

            {/* Şifre */}
            <View>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: primaryText,
                  marginBottom: hp(1),
                  fontWeight: "500",
                }}
              >
                {t("auth.password", "Şifre")}
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t("auth.passwordPlaceholder", "Şifrenizi giriniz")}
                    icon={Lock}
                    containerStyle={{
                      borderColor: errors.password ? "transparent" : borderColor,
                      borderWidth: 1,
                      borderRadius: radius(99),
                    }}
                    error={errors.password?.message}
                    rightComponent={() => (
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={showPassword ? EyeOff : Eye}
                          size={24}
                          color={rightIconColor}
                        />
                      </TouchableOpacity>
                    )}
                    secureTextEntry={!showPassword}
                  />
                )}
              />
            </View>

            {/* Şifremi Unuttum */}
            <Button
              variant="link"
              className="items-end"
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: linkColor,
                  fontWeight: "600",
                  textDecorationLine: "underline",
                }}
              >
                {t("auth.forgotPassword", "Şifremi unuttum")}
              </Text>
            </Button>
          </View>

          {/* Giriş Butonu */}
          <AuthSubmitButton
            title={t("auth.login", "Giriş Yap")}
            loadingTitle={t("common.loading", "Giriş Yapılıyor...")}
            isLoading={isLoggingIn}
            onPress={handleSubmit((data) => loginMutation(data))}
          />

          {/* Ayırıcı */}
          <Separator
            orientation="horizontal"
            style={{ marginVertical: hp(2) }}
          />

          {/* Google Butonu */}
          <GoogleSignIn text={t("auth.googleContinue", "Google ile devam et")} />

          {/* Kayıt Ol Linki */}
          <AuthBottomPrompt
            promptText={t("auth.noAccount", "Hesabın yok mu?")}
            actionText={t("auth.register", "Kayıt Ol")}
            onActionPress={() => router.push("/(auth)/register")}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
