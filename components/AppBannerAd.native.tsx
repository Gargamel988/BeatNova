import React from 'react';
import { View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export type BannerPlacement = 'home' | 'favorites' | 'assistant';

const BANNER_IDS: Record<BannerPlacement, string> = {
  home: process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER_HOME || TestIds.BANNER,
  favorites: process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER_FAVORITES || TestIds.BANNER,
  assistant: process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER_ASSISTANT || TestIds.BANNER,
};

export const AppBannerAd: React.FC<{ placement: BannerPlacement; style?: ViewStyle }> = ({ placement, style }) => {
  const adUnitId = BANNER_IDS[placement];

  return (
    <View style={[{
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      width: '100%',
      paddingVertical: 4
    }, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
        onAdFailedToLoad={() => { }}
        onAdLoaded={() => { }}
      />
    </View>
  );
};
