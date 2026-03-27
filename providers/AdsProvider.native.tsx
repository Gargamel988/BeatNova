import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mobileAds, { InterstitialAd, AdEventType, TestIds, RewardedAd, RewardedAdReward, RewardedAdEventType } from 'react-native-google-mobile-ads';

type AdsContextType = {
  isInitialized: boolean;
  showInterstitial: () => void;
  isInterstitialLoaded: boolean;
  showRewarded: (onReward: () => void) => void;
  isRewardedLoaded: boolean;
};

const AdsContext = createContext<AdsContextType | undefined>(undefined);

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
    try {
      mobileAds()
        .initialize()
        .then(() => {
          setIsInitialized(true);
          console.log('Ads initialized successfully');
        })
        .catch(err => {
          console.error('Ads initialization failed:', err);
          // Still set initialized to true to let the app continue without ads
          setIsInitialized(true);
        });
    } catch (error) {
      console.error('Fatal Ads initialization error:', error);
      setIsInitialized(true);
    }
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
      alert('Reklam henüz yüklenmedi, lütfen biraz bekleyin.');
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
