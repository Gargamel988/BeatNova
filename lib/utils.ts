import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Production modunda
  if (!__DEV__) {
    if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
      throw new Error('EXPO_PUBLIC_API_BASE_URL environment variable is not defined');
    }
    return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
  }

  // Development modunda - EXPO_PUBLIC_API_BASE_URL'i kontrol et
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
  }

  // Metro bundler'ın host'unu kullan
  if (Constants.expoConfig?.hostUri) {
    return `http://${Constants.expoConfig.hostUri}${path}`;
  }

  // experienceUrl'den origin'i çıkar
  if (Constants.experienceUrl) {
    try {
      // beatnova://expo-development-client/?url=http%3A%2F%2F192.168.1.102%3A8081 formatı
      if (Constants.experienceUrl.includes('?url=') || Constants.experienceUrl.includes('&url=')) {
        const urlMatch = Constants.experienceUrl.match(/[?&]url=([^&]+)/);
        if (urlMatch?.[1]) {
          const decodedUrl = decodeURIComponent(urlMatch[1]);
          const urlObj = new URL(decodedUrl);
          return `${urlObj.protocol}//${urlObj.host}${path}`;
        }
      }
      // exp:// formatı
      else if (Constants.experienceUrl.startsWith('exp://')) {
        const origin = Constants.experienceUrl.replace(/^exp:\/\//, 'http://');
        return `${origin}${path}`;
      }
    } catch (error) {
      console.warn('Failed to parse URL from experienceUrl:', error);
    }
  }

  // Fallback: localhost (sadece emülatör/simülatör için)
  console.warn('Using localhost as fallback');
  return `http://localhost:8081${path}`;
};