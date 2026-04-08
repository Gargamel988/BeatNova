import React, { createContext, useContext } from 'react';

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

/**
 * Web/Fallback Provider for Ads
 * Prevents native-only library imports during static bundling or web builds
 */
export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AdsContext.Provider value={{ 
      isInitialized: false, 
      showInterstitial: () => {}, 
      isInterstitialLoaded: () => false,
      showRewarded: () => {},
      isRewardedLoaded: () => false
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
