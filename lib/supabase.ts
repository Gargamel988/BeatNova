import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || ''
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  const method = init?.method || 'GET';
  
  let eventName = 'Unknown Supabase Event';
  try {
    const urlObj = new URL(urlStr);
    const pathSegments = urlObj.pathname.split('/').filter(Boolean);
    // Genellikle /rest/v1/table_name veya /auth/v1/endpoint
    if (pathSegments.length >= 2) {
      eventName = `${method} /${pathSegments.slice(-2).join('/')}`;
    } else {
      eventName = `${method} ${urlObj.pathname}`;
    }
  } catch (e) {
    eventName = `${method} ${urlStr}`;
  }

  const startTime = Date.now();
  const response = await fetch(input, init);
  const endTime = Date.now();
  const duration = endTime - startTime;

  let actionDescription = '';
  if (eventName.includes('GET /v1/user')) actionDescription = ' (Oturum Kontrolü)';
  else if (eventName.includes('POST /v1/songs')) actionDescription = ' (Şarkı Senkronizasyonu)';
  else if (eventName.includes('GET /v1/songs')) actionDescription = ' (Şarkıları Çekme)';
  else if (eventName.includes('GET /v1/profiles')) actionDescription = ' (Profil Verisi)';
  else if (eventName.includes('GET /v1/listening_history')) actionDescription = ' (Dinleme Geçmişi)';
  else if (eventName.includes('GET /v1/listening_daily')) actionDescription = ' (Günlük İstatistik)';
  else if (eventName.includes('GET /v1/playlists')) actionDescription = ' (Çalma Listeleri)';
  else if (eventName.includes('GET /v1/playlist_songs')) actionDescription = ' (Liste Şarkıları)';
  else if (eventName.includes('POST /v1/playlist_songs')) actionDescription = ' (Listeye Şarkı Ekleme)';
  else if (eventName.includes('DELETE /v1/playlist_songs')) actionDescription = ' (Listeden Şarkı Silme)';

  const timeString = new Date().toLocaleTimeString('tr-TR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  console.log(`[${timeString}] [Supabase] ${eventName}${actionDescription} - ${duration}ms`);

  return response;
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS !== 'web' ? AsyncStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    fetch: customFetch,
  },
})