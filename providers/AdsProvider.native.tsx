import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import mobileAds, { InterstitialAd, AdEventType, TestIds, RewardedAd, RewardedAdReward, RewardedAdEventType } from 'react-native-google-mobile-ads';

export type InterstitialPlacement = 'STATS_ENTRY' | 'SKIPS';
export type RewardedPlacement = 'THEME_UNLOCK' | 'ASSISTANT';

type AdsContextType = {
  isInitialized: boolean;
  showInterstitial: (placement: InterstitialPlacement) => void;
  isInterstitialLoaded: (placement: InterstitialPlacement) => boolean;
  showRewarded: (placement: RewardedPlacement, onReward: () => void) => void;
  isRewardedLoaded: (placement: RewardedPlacement) => boolean;
};

const AdsContext = createContext<AdsContextType | undefined>(undefined);

const INTERSTITIAL_IDS: Record<InterstitialPlacement, string> = {
  STATS_ENTRY: process.env.EXPO_PUBLIC_AD_UNIT_ID_INTERSTITIAL_STATS || TestIds.INTERSTITIAL,
  SKIPS: process.env.EXPO_PUBLIC_AD_UNIT_ID_INTERSTITIAL_SKIPS || TestIds.INTERSTITIAL,
};

const REWARDED_IDS: Record<RewardedPlacement, string> = {
  THEME_UNLOCK: process.env.EXPO_PUBLIC_AD_UNIT_ID_REWARDED_THEME || TestIds.REWARDED,
  ASSISTANT: process.env.EXPO_PUBLIC_AD_UNIT_ID_REWARDED_ASSISTANT || TestIds.REWARDED,
};

export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [interstitials, setInterstitials] = useState<Record<InterstitialPlacement, InterstitialAd | null>>({
    STATS_ENTRY: null,
    SKIPS: null,
  });
  const [loadedInterstitials, setLoadedInterstitials] = useState<Record<InterstitialPlacement, boolean>>({
    STATS_ENTRY: false,
    SKIPS: false,
  });

  const [rewardeds, setRewardeds] = useState<Record<RewardedPlacement, RewardedAd | null>>({
    THEME_UNLOCK: null,
    ASSISTANT: null,
  });
  const [loadedRewardeds, setLoadedRewardeds] = useState<Record<RewardedPlacement, boolean>>({
    THEME_UNLOCK: false,
    ASSISTANT: false,
  });

  const onRewardCallbacks = React.useRef<Record<string, (() => void) | null>>({});

  useEffect(() => {
    try {
      mobileAds()
        .initialize()
        .then(() => {
          setIsInitialized(true);
        })
        .catch(err => {
          setIsInitialized(true);
        });
    } catch (error) {
      setIsInitialized(true);
    }
  }, []);

  const loadInterstitial = useCallback((placement: InterstitialPlacement) => {
    const id = INTERSTITIAL_IDS[placement];

    const interstitialAd = InterstitialAd.createForAdRequest(id, {
      requestNonPersonalizedAdsOnly: true,
    });

    interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
      setLoadedInterstitials(prev => ({ ...prev, [placement]: true }));
    });

    interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
      setLoadedInterstitials(prev => ({ ...prev, [placement]: false }));
      loadInterstitial(placement);
    });

    interstitialAd.load();
    setInterstitials(prev => ({ ...prev, [placement]: interstitialAd }));
  }, []);

  const loadRewarded = useCallback((placement: RewardedPlacement) => {
    const id = REWARDED_IDS[placement];

    const rewardedAd = RewardedAd.createForAdRequest(id, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
      setLoadedRewardeds(prev => ({ ...prev, [placement]: true }));
    });

    rewardedAd.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward: RewardedAdReward) => {
      if (onRewardCallbacks.current[placement]) {
        onRewardCallbacks.current[placement]!();
        onRewardCallbacks.current[placement] = null;
      }
    });

    rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
      setLoadedRewardeds(prev => ({ ...prev, [placement]: false }));
      loadRewarded(placement);
    });

    rewardedAd.load();
    setRewardeds(prev => ({ ...prev, [placement]: rewardedAd }));
  }, []);

  useEffect(() => {
    if (isInitialized) {
      (Object.keys(INTERSTITIAL_IDS) as InterstitialPlacement[]).forEach(loadInterstitial);
      (Object.keys(REWARDED_IDS) as RewardedPlacement[]).forEach(loadRewarded);
    }
  }, [isInitialized, loadInterstitial, loadRewarded]);

  const showInterstitial = useCallback((placement: InterstitialPlacement) => {
    const ad = interstitials[placement];
    if (loadedInterstitials[placement] && ad) {
      ad.show();
    }
  }, [loadedInterstitials, interstitials]);

  const isInterstitialLoadedFn = useCallback((placement: InterstitialPlacement) => {
    return loadedInterstitials[placement];
  }, [loadedInterstitials]);

  const showRewarded = useCallback((placement: RewardedPlacement, onReward: () => void) => {
    const ad = rewardeds[placement];
    if (loadedRewardeds[placement] && ad) {
      onRewardCallbacks.current[placement] = onReward;
      ad.show();
    } else {
      alert('Reklam henüz yüklenmedi, lütfen biraz bekleyin.');
    }
  }, [loadedRewardeds, rewardeds]);

  const isRewardedLoadedFn = useCallback((placement: RewardedPlacement) => {
    return loadedRewardeds[placement];
  }, [loadedRewardeds]);

  return (
    <AdsContext.Provider value={{
      isInitialized,
      showInterstitial,
      isInterstitialLoaded: isInterstitialLoadedFn,
      showRewarded,
      isRewardedLoaded: isRewardedLoadedFn
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
