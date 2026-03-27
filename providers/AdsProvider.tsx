import React, { createContext, useContext } from 'react';

type AdsContextType = {
  isInitialized: boolean;
  showInterstitial: () => void;
  isInterstitialLoaded: boolean;
  showRewarded: (onReward: () => void) => void;
  isRewardedLoaded: boolean;
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
      isInterstitialLoaded: false,
      showRewarded: () => {},
      isRewardedLoaded: false
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
