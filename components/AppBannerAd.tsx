import React from 'react';
import { View, ViewStyle } from 'react-native';

/**
 * Web/Fallback for BannerAd
 * Prevents native-only library imports during static bundling or web builds
 */
export const AppBannerAd: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={style} />
  );
};
