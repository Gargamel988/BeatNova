import { View, ViewStyle } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useResponsive } from '@/hooks/useResponsive';

const AD_UNIT_ID = process.env.EXPO_PUBLIC_AD_UNIT_ID_BANNER || TestIds.BANNER;

export const AppBannerAd: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { hp } = useResponsive();

  return (
    <View style={[{ 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: 'transparent',
      width: '100%',
      paddingVertical: 4
    }, style]}>
      <BannerAd
        unitId={AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
};
