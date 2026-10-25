import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react-native";
import { router } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { ScrollView, TouchableOpacity, View, Platform, KeyboardAvoidingView } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { getRegisterScheme, RegisterSchemeType } from "@/schemes/RegisterScheme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { useColor } from "@/hooks/useColor";
import { useRegisterMutation } from "@/hooks/useAuthMutations";

import GoogleSignIn from "@/components/GoogleAuth";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthSubmitButton } from "@/components/auth/AuthSubmitButton";
import { AuthBottomPrompt } from "@/components/auth/AuthBottomPrompt";

export default function Register() {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { wp, hp, fontSize, radius } = useResponsive();

  const registerScheme = useMemo(() => getRegisterScheme(t), [t]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterSchemeType>({
    resolver: zodResolver(registerScheme),
  });

  const { mutate: registerMutation, isPending: isRegistering } = useRegisterMutation(() => reset());

  const primaryText = useColor("authPrimaryText");
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
            title={t("auth.createAccount", "Hesap Oluştur")}
            subtitle={t("auth.registerSubtitle", "Müzik dünyasına katıl ve keşfetmeye başla")}
          />

          {/* Form Alanları */}
          <View style={{ gap: hp(2), marginBottom: hp(2.5) }}>
            {/* Kullanıcı Adı */}
            <View>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: primaryText,
                  marginBottom: hp(0.8),
                  fontWeight: "500",
                }}
              >
                {t("auth.username", "Kullanıcı Adı")}
              </Text>
              <Controller
                control={control}
                name="username"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t("auth.usernamePlaceholder", "kullaniciadi")}
                    icon={User}
                    autoCapitalize="none"
                    containerStyle={{
                      borderColor: errors.username ? "transparent" : borderColor,
                      borderWidth: 1,
                      borderRadius: radius(99),
                    }}
                    error={errors.username?.message}
                  />
                )}
              />
            </View>

            {/* E-posta */}
            <View>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: primaryText,
                  marginBottom: hp(0.8),
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
                  marginBottom: hp(0.8),
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

            {/* Şifre Tekrar */}
            <View>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: primaryText,
                  marginBottom: hp(0.8),
                  fontWeight: "500",
                }}
              >
                {t("auth.confirmPassword", "Şifre Tekrar")}
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field }) => (
                  <Input
                    value={field.value}
                    onChangeText={field.onChange}
                    placeholder={t("auth.confirmPasswordPlaceholder", "Şifrenizi tekrar giriniz")}
                    icon={Lock}
                    containerStyle={{
                      borderColor: errors.confirmPassword ? "transparent" : borderColor,
                      borderWidth: 1,
                      borderRadius: radius(99),
                    }}
                    error={errors.confirmPassword?.message}
                    rightComponent={() => (
                      <TouchableOpacity
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Icon
                          name={showConfirmPassword ? EyeOff : Eye}
                          size={24}
                          color={rightIconColor}
                        />
                      </TouchableOpacity>
                    )}
                    secureTextEntry={!showConfirmPassword}
                  />
                )}
              />
            </View>
          </View>

          {/* Kayıt Ol Butonu */}
          <AuthSubmitButton
            title={t("auth.register", "Kayıt Ol")}
            loadingTitle={t("common.loading", "Kayıt Yapılıyor...")}
            isLoading={isRegistering}
            onPress={handleSubmit((data) => registerMutation(data))}
          />

          {/* Ayırıcı */}
          <Separator
            orientation="horizontal"
            style={{ marginVertical: hp(2) }}
          />

          {/* Google Butonu */}
          <GoogleSignIn text={t("auth.googleContinue", "Google ile devam et")} />

          {/* Giriş Yap Linki */}
          <AuthBottomPrompt
            promptText={t("auth.alreadyHaveAccount", "Zaten bir hesabın var mı?")}
            actionText={t("auth.login", "Giriş Yap")}
            onActionPress={() => router.push("/(auth)/login")}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
