import Constants from 'expo-constants';

export const generateAPIUrl = (relativePath: string) => {
  const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;

  // Development modunda
  if (__DEV__) {
    // Önce EXPO_PUBLIC_API_BASE_URL'i kontrol et (eğer manuel olarak ayarlanmışsa)
    if (process.env.EXPO_PUBLIC_API_BASE_URL) {
      return process.env.EXPO_PUBLIC_API_BASE_URL.concat(path);
    }

    // experienceUrl'den origin'i çıkar
    if (Constants.experienceUrl) {
      // exp://192.168.1.100:8081 -> http://192.168.1.100:8081
      const origin = Constants.experienceUrl.replace(/^exp:\/\//, 'http://');
      return origin.concat(path);
    }

    // expoConfig.hostUri'yi dene
    if (Constants.expoConfig?.hostUri) {
      // hostUri formatı: 192.168.1.100:8081
      return `http://${Constants.expoConfig.hostUri}${path}`;
    }

    // Son çare: localhost (sadece emülatör/simülatör için)
    // Fiziksel cihazda bu çalışmaz, bu yüzden yukarıdaki seçenekler önemli
    return `http://localhost:8081${path}`;
  }

  // Production modunda
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  
  if (!baseUrl) {
    throw new Error(
      'EXPO_PUBLIC_API_BASE_URL environment variable is not defined',
    );
  }

  return baseUrl.concat(path);
};