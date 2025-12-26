import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Eye, EyeOff, Mail, Lock, Music, User } from "lucide-react-native";
import { Link } from "expo-router";
import { useResponsive } from "@/hooks/useResponsive";
import { ScrollView, TouchableOpacity } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { RegisterScheme, RegisterSchemeType } from "@/schemes/RegisterScheme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

// Components
import { useToast } from "@/components/ui/toast";
import { ButtonSpinner } from "@/components/ui/spinner";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import { LinearGradient } from "expo-linear-gradient";
import GoogleSignIn from "@/components/GoogleAuth";
import { useColor } from "@/hooks/useColor";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { wp, hp, fontSize, radius } = useResponsive();
  const { register } = useAuth();
  const {
    control,
    handleSubmit,
    formState: { errors, isLoading },
    reset,
  } = useForm<RegisterSchemeType>({
    resolver: zodResolver(RegisterScheme),
  });
  const { mutate: registerMutation } = useMutation({
    mutationFn: async (data: RegisterSchemeType) => {
      const response = await register(data.email, data.password, data.username);
      return response;
    },

    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Hesabınız başarıyla oluşturuldu",
        variant: "success",
        duration: 3000,
      });
      reset();
    },
    onError: (error) => {
    },
  });


  const iconBackground = useColor("authIconBackground");
  const primaryText = useColor("authPrimaryText");
  const secondaryText = useColor("authSecondaryText");
  const buttonGradientStart = useColor("authButtonGradientStart");
  const buttonGradientEnd = useColor("authButtonGradientEnd");
  const buttonTextColor = useColor("authButtonText");
  const linkColor = useColor("authLink");
  const rightIconColor = useColor("authRightIcon");
  const borderColor = useColor("border");

  return (

      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: wp(6),
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo ve Başlık */}
          <View className="items-center" style={{ marginBottom: hp(4) }}>
            <View
              className="justify-center items-center"
              style={{
                width: wp(20),
                height: wp(20),
                borderRadius: radius(16),
                backgroundColor: iconBackground,
                marginBottom: hp(2),
              }}
            >
              <Music size={wp(12)} color={primaryText} />
            </View>
            <Text
              style={{
                fontSize: fontSize(28),
                fontWeight: "bold",
                marginBottom: hp(1),
                color: primaryText,
              }}
            >
              Hesabını Oluştur
            </Text>
            <Text
              style={{
                fontSize: fontSize(14),
                color: secondaryText,
              }}
            >
              BeatNova&apos;ya Hoş Geldin!
            </Text>
          </View>

          {/* Input Fields */}
          <View style={{ gap: hp(2.5), marginBottom: hp(2) }}>
            <Text
              style={{
                fontSize: fontSize(14),
                color: primaryText,
                fontWeight: "500",
              }}
            >
              Kullanıcı Adı
            </Text>
            <Controller
              control={control}
              name="username"
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Kullanıcı Adınızı giriniz"
                  icon={User}
                  variant="filled"
                  keyboardType="default"
                  containerStyle={{
                    borderColor: borderColor,
                    borderWidth: 1,
                    borderRadius: radius(99),
                  }}
                  autoCapitalize="none"
                  error={errors.username?.message}
                />
              )}
            />

            {/* E-posta */}
            <Text
              style={{
                fontSize: fontSize(14),
                color: primaryText,
                fontWeight: "500",
              }}
            >
              E-posta
            </Text>
            <Controller
              control={control}
              name="email"
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="ornek@email.com"
                  icon={Mail}
                  variant="filled"
                  containerStyle={{
                    borderColor: borderColor,
                    borderWidth: 1,
                    borderRadius: radius(99),
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  error={errors.email?.message}
                />
              )}
            />

            {/* Şifre */}
            <View className="flex-row justify-between items-center">
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: primaryText,
                  fontWeight: "500",
                }}
              >
                Şifre
              </Text>
            </View>
            <Controller
              control={control}
              name="password"
              rules={{ required: true }}
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Şifrenizi giriniz"
                  icon={Lock}
                  variant="filled"
                  containerStyle={{
                    borderColor: borderColor,
                    borderWidth: 1,
                    borderRadius: radius(99),
                    marginBottom: hp(3),
                  }}
                  rightComponent={() => (
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Icon
                        name={showPassword ? EyeOff : Eye}
                        size={24}
                        color={rightIconColor}
                      />
                    </TouchableOpacity>
                  )}
                  secureTextEntry={!showPassword}
                  error={errors.password?.message}
                />
              )}
            />
          </View>

          {/* Kayıt Ol Butonu */}
          <TouchableOpacity
            onPress={handleSubmit((data) => registerMutation(data))}
            activeOpacity={0.8}
            style={{
              borderRadius: radius(12),
              overflow: "hidden",
              marginBottom: hp(2),
            }}
          >
            <LinearGradient
              colors={[buttonGradientStart, buttonGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: hp(2),
                paddingHorizontal: wp(6),
                alignItems: "center",
                justifyContent: "center",
                minHeight: hp(6),
              }}
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center gap-2">
                  <ButtonSpinner size="lg" variant="circle" />
                  <Text
                    style={{
                      fontSize: fontSize(16),
                      fontWeight: "600",
                      color: buttonTextColor,
                    }}
                  >
                    Kayıt Oluyor...
                  </Text>
                </View>
              ) : (
                <Text
                  style={{
                    fontSize: fontSize(16),
                    fontWeight: "600",
                    color: buttonTextColor,
                  }}
                >
                  Kayıt Ol
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Ayırıcı */}
          <View className="items-center my-4 flex-row ">
            <Separator orientation="horizontal" />
          </View>

          {/* Google Butonu */}
          <GoogleSignIn text="Google ile devam et" />

          {/* Kayıt Ol Linki */}
          <View className="items-center">
            <View className="flex-row" style={{ gap: wp(2) }}>
              <Text
                style={{
                  fontSize: fontSize(14),
                  color: secondaryText,
                }}
              >
                Hesabın var mı?
              </Text>
              <Link href="/login">
                <Text
                  style={{
                    fontSize: fontSize(14),
                    textDecorationLine: "underline",
                    color: linkColor,
                    fontWeight: "600",
                  }}
                >
                  Giriş Yap
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}
