import React, { useEffect } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { AnimatedLogoSplash } from '@/components/AnimatedLogoSplash';
import { useTranslation } from 'react-i18next';

export default function LoginSuccess() {
  const { t } = useTranslation();

  useEffect(() => {
    // 2 saniyelik animasyon süresi sonrası yönlendirme
    const timer = setTimeout(() => {
      router.replace('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <AnimatedLogoSplash message={t("auth.loginSuccess")} />
    </View>
  );
}
