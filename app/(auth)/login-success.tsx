import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AnimatedLogoSplash } from '@/components/AnimatedLogoSplash';

export default function LoginSuccess() {
  useEffect(() => {
    // 2 saniyelik animasyon süresi sonrası yönlendirme
    const timer = setTimeout(() => {
      router.replace('/(drawer)/(tabs)');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AnimatedLogoSplash message="Giriş Başarılı! Hoş Geldiniz." />
    </View>
  );
}
