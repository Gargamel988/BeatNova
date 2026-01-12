import { Text } from "@/components/ui/text";
import { View } from "@/components/ui/view";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import { Eye, EyeOff, Mail, Lock, Music } from "lucide-react-native";
import { useResponsive } from "@/hooks/useResponsive";
import { LinearGradient } from "expo-linear-gradient";
import { TouchableOpacity, ScrollView } from "react-native";
import { Button } from "@/components/ui/button";
import { Link, router } from "expo-router";
import { useAuth } from "@/hooks/useAuth";
import { useMutation} from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { LoginScheme, LoginSchemeType } from "@/schemes/LoginScheme";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/toast";
import { useColor } from "@/hooks/useColor";
import GoogleSignIn from "@/components/GoogleAuth";
import { Separator } from "@/components/ui/separator";




export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const { wp, hp, fontSize, radius } = useResponsive();
  const { login: loginAuth } = useAuth();
  const { toast } = useToast();
  const {
    handleSubmit,
    reset,
    formState: { errors },
    control,
  } = useForm<LoginSchemeType>({
    resolver: zodResolver(LoginScheme),
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

  const { mutate: loginMutation } = useMutation({
    mutationFn: async (data: LoginSchemeType) => {
      const response = await loginAuth(data.email, data.password);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Giriş Başarılı",
        description: "Giriş başarılı bir şekilde yapıldı",
        variant: "success",
      });
      reset();
      
    },
    onError: (error: any) => {
      let errorMessage = "Giriş yapılırken bir hata oluştu";
      let errorTitle = "Giriş Başarısız";

    if (error?.message) {
        // Supabase hata mesajını kontrol et
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes("invalid login credentials") || 
            errorMsg.includes("invalid credentials")) {
          errorTitle = "Giriş Başarısız";
          errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
        } else if (errorMsg.includes("email not confirmed") || 
                   errorMsg.includes("email not verified")) {
          errorTitle = "E-posta Doğrulanmamış";
          errorMessage = "Lütfen e-posta adresinizi doğrulayın.";
        } else if (errorMsg.includes("too many requests") || 
                   errorMsg.includes("rate limit")) {
          errorTitle = "Çok Fazla İstek";
          errorMessage = "Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.";
        } else if (errorMsg.includes("user not found")) {
          errorTitle = "Kullanıcı Bulunamadı";
          errorMessage = "Bu e-posta adresi ile kayıtlı bir kullanıcı bulunamadı.";
        } else if (errorMsg.includes("network") || 
                   errorMsg.includes("connection")) {
          errorTitle = "Bağlantı Hatası";
          errorMessage = "İnternet bağlantınızı kontrol edin.";
        } else {
          // Diğer hatalar için Supabase'in kendi mesajını kullan
          errorMessage = error.message;
        }
      } else if (error?.status) {
        // HTTP status koduna göre
        if (error.status === 400) {
          errorMessage = "Geçersiz istek. Lütfen bilgilerinizi kontrol edin.";
        } else if (error.status === 401) {
          errorMessage = "E-posta veya şifre hatalı.";
        } else if (error.status === 429) {
          errorMessage = "Çok fazla deneme yaptınız. Lütfen bir süre sonra tekrar deneyin.";
        } else if (error.status >= 500) {
          errorMessage = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
        }
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "error",
      });
    },
  });



  return (
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: wp(6),
            paddingTop: hp(4),
            paddingBottom: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo ve Başlık */}
          <View style={{ marginBottom: hp(12) }} className="items-center">
            <View
              style={{
                width: wp(20),
                height: wp(20),
                borderRadius: radius(16),
                backgroundColor: iconBackground,
                justifyContent: "center",
                alignItems: "center",
                marginBottom: hp(2),
              }}
            >
              <Music size={wp(12)} color={primaryText} />
            </View>
            <Text
              style={{
                fontSize: fontSize(28),
                color: primaryText,
                fontWeight: "bold",
                marginBottom: hp(1),
              }}
            >
              MüzikBox&apos;a Hoş Geldin
            </Text>
            <Text
              style={{
                fontSize: fontSize(14),
                color: secondaryText,
              }}
            >
              Müziğin tadını çıkarmaya devam et
            </Text>
          </View>

          {/* Input Fields */}
          <View style={{ gap: hp(2.5), marginBottom: hp(2) }}>
            {/* E-posta */}
            <Text
              style={{
                fontSize: fontSize(14),
                color: primaryText,
                marginBottom: hp(1),
                fontWeight: "500",
              }}
            >
              E-posta
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="ornek@email.com"
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

            {/* Şifre */}
            <View className="flex-row justify-between items-center mb-1">
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
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Şifrenizi giriniz"
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
            <Button 
              variant="link" 
              className="items-end"
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text
                style={{
                  fontSize: fontSize(14),
                color: linkColor,
                  fontWeight: "600",
                  textDecorationLine: "underline",
                }}
              >
                Şifremi unuttum
              </Text>
            </Button>
          </View>

          {/* Giriş Yap Butonu */}
          <TouchableOpacity
          
            activeOpacity={0.8}
            onPress={handleSubmit((data) => loginMutation(data))}
          >
            <LinearGradient
            colors={[buttonGradientStart, buttonGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: hp(2),
                borderRadius: radius(12),
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontSize: fontSize(16),
                  color: buttonTextColor,
                  fontWeight: "bold",
                }}
              >
                Giriş Yap
              </Text>
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
                Hesabın yok mu?
              </Text>
              <Link href="/register">
                <Text
                  style={{
                    fontSize: fontSize(14),
                    color: linkColor,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                >
                  Kayıt Ol
                </Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}
