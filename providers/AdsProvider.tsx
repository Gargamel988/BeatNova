import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mobileAds, { InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize, RewardedAd, RewardedAdReward, RewardedAdEventType } from 'react-native-google-mobile-ads';

type AdsContextType = {
  isInitialized: boolean;
  showInterstitial: () => void;
  isInterstitialLoaded: boolean;
  showRewarded: (onReward: () => void) => void;
  isRewardedLoaded: boolean;
};

const AdsContext = createContext<AdsContextType | undefined>(undefined);

// Ad Unit IDs from environment variables
const INTERSTITIAL_ID = process.env.EXPO_PUBLIC_AD_UNIT_ID_INTERSTITIAL || TestIds.INTERSTITIAL;
const REWARDED_ID = process.env.EXPO_PUBLIC_AD_UNIT_ID_REWARDED || TestIds.REWARDED;

export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const [interstitial, setInterstitial] = useState<InterstitialAd | null>(null);
  const [isInterstitialLoaded, setIsInterstitialLoaded] = useState(false);
  
  const [rewarded, setRewarded] = useState<RewardedAd | null>(null);
  const [isRewardedLoaded, setIsRewardedLoaded] = useState(false);
  const onRewardCallback = React.useRef<(() => void) | null>(null);

  useEffect(() => {
    mobileAds()
      .initialize()
      .then((adapterStatuses) => {
        setIsInitialized(true);
      });
  }, []);

  const loadInterstitial = useCallback(() => {
    const interstitialAd = InterstitialAd.createForAdRequest(INTERSTITIAL_ID, {
      requestNonPersonalizedAdsOnly: true,
    });
    interstitialAd.addAdEventListener(AdEventType.LOADED, () => setIsInterstitialLoaded(true));
    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      setIsInterstitialLoaded(false);
      loadInterstitial();
    });
    interstitialAd.load();
    setInterstitial(interstitialAd);
  }, []);

  const loadRewarded = useCallback(() => {
    const rewardedAd = RewardedAd.createForAdRequest(REWARDED_ID, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.addAdEventListener(AdEventType.LOADED, () => setIsRewardedLoaded(true));
    
    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: RewardedAdReward) => {
      console.log('User earned reward:', reward);
      if (onRewardCallback.current) {
        onRewardCallback.current();
        onRewardCallback.current = null;
      }
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setIsRewardedLoaded(false);
      loadRewarded();
    });

    rewardedAd.load();
    setRewarded(rewardedAd);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      loadInterstitial();
      loadRewarded();
    }
  }, [isInitialized, loadInterstitial, loadRewarded]);

  const showInterstitial = useCallback(() => {
    if (isInterstitialLoaded && interstitial) {
      interstitial.show();
    }
  }, [isInterstitialLoaded, interstitial]);

  const showRewarded = useCallback((onReward: () => void) => {
    if (isRewardedLoaded && rewarded) {
      onRewardCallback.current = onReward;
      rewarded.show();
    } else {
      console.log('Rewarded ad not loaded yet');
      // In development or if failed, we might want to still allow it or show a message
      alert('Reklam henüz yüklenmedi, lütfen biraz bekleyip tekrar deneyin.');
    }
  }, [isRewardedLoaded, rewarded]);

  return (
    <AdsContext.Provider value={{ 
      isInitialized, 
      showInterstitial, 
      isInterstitialLoaded,
      showRewarded,
      isRewardedLoaded
    }}>
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
};
