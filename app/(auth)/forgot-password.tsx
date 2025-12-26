import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';
import { useColor } from '@/hooks/useColor';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const ForgotPasswordSchema = z.object({
  email: z.string().email('Geçerli bir e-posta adresi giriniz'),
});

type ForgotPasswordFormData = z.infer<typeof ForgotPasswordSchema>;

export default function ForgotPassword() {
  const { wp, hp, fontSize, radius } = useResponsive();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(ForgotPasswordSchema),
  });

  const iconBackground = useColor('authIconBackground');
  const primaryText = useColor('authPrimaryText');
  const secondaryText = useColor('authSecondaryText');
  const buttonGradientStart = useColor('authButtonGradientStart');
  const buttonGradientEnd = useColor('authButtonGradientEnd');
  const buttonTextColor = useColor('authButtonText');
  const linkColor = useColor('authLink');
  const borderColor = useColor('border');
  const cardBg = useColor('card');

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'beatnova://reset-password'}`,
      });

      if (error) {
        throw error;
      }

      setEmailSent(true);
      toast({
        title: 'Başarılı',
        description: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi',
        variant: 'success',
      });
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error?.message || 'Şifre sıfırlama e-postası gönderilemedi',
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingHorizontal: wp(5),
            }}
          >
            <View style={{ alignItems: 'center', gap: hp(2) }}>
              <View
                style={{
                  width: wp(20),
                  height: wp(20),
                  borderRadius: radius(20),
                  backgroundColor: iconBackground,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: hp(1),
                }}
              >
                <Icon name={CheckCircle} size={wp(10)} color={buttonGradientStart} />
              </View>

              <Text
                style={{
                  fontSize: fontSize(24),
                  fontWeight: '700',
                  color: primaryText,
                  textAlign: 'center',
                  marginBottom: hp(0.5),
                }}
              >
                E-posta Gönderildi
              </Text>

              <Text
                style={{
                  fontSize: fontSize(14),
                  color: secondaryText,
                  textAlign: 'center',
                  lineHeight: fontSize(20),
                  marginBottom: hp(3),
                }}
              >
                Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.{'\n'}
                Lütfen e-postanızı kontrol edin ve bağlantıya tıklayın.
              </Text>

              <Button
                onPress={() => router.back()}
                variant="default"
                style={{ width: '100%', maxWidth: wp(80) }}
              >
                Giriş Sayfasına Dön
              </Button>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: wp(5),
            paddingTop: hp(4),
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              marginBottom: hp(3),
              flexDirection: 'row',
              alignItems: 'center',
              gap: wp(2),
            }}
          >
            <Icon name={ArrowLeft} size={wp(6)} color={primaryText} />
            <Text
              style={{
                fontSize: fontSize(16),
                color: primaryText,
                fontWeight: '600',
              }}
            >
              Geri
            </Text>
          </TouchableOpacity>

          {/* Icon */}
          <View
            style={{
              width: wp(20),
              height: wp(20),
              borderRadius: radius(20),
              backgroundColor: iconBackground,
              alignItems: 'center',
              justifyContent: 'center',
              alignSelf: 'center',
              marginBottom: hp(3),
            }}
          >
            <Icon name={Mail} size={wp(10)} color={buttonGradientStart} />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: fontSize(28),
              fontWeight: '700',
              color: primaryText,
              textAlign: 'center',
              marginBottom: hp(1),
            }}
          >
            Şifremi Unuttum
          </Text>

          {/* Subtitle */}
          <Text
            style={{
              fontSize: fontSize(14),
              color: secondaryText,
              textAlign: 'center',
              lineHeight: fontSize(20),
              marginBottom: hp(4),
            }}
          >
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim
          </Text>

          {/* Form */}
          <View style={{ gap: hp(2), marginBottom: hp(3) }}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-posta"
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  icon={Mail}
                />
              )}
            />
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            disabled={isLoading}
            variant="default"
            style={{ marginBottom: hp(2) }}
          >
            Şifre Sıfırlama Bağlantısı Gönder
          </Button>

          {/* Back to Login */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              paddingVertical: hp(1.5),
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontSize: fontSize(14),
                color: linkColor,
                fontWeight: '600',
              }}
            >
              Giriş sayfasına dön
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

