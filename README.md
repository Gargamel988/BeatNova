<p align="center">
  <img src="./assets/images/beatnovalogo.jpeg" alt="BeatNova Logo" width="120" height="120" style="border-radius: 24px;" />
</p>

<h1 align="center">🎵 BeatNova</h1>

<p align="center">
  <strong>Akıllı Müzik Çalar & Yapay Zeka Destekli Müzik Asistanı</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Framework-Expo-000020?logo=expo&logoColor=white" alt="Expo" />
  <img src="https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/AI-Gemini-4285F4?logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Version-1.0.1-blueviolet" alt="Version" />
</p>

---

## 📖 Proje Hakkında

**BeatNova**, cihazınızdaki müzik dosyalarını otomatik olarak tarayan, güçlü bir arka plan oynatıcısıyla dinlemenizi sağlayan ve yapay zeka destekli müzik asistanıyla yeni şarkılar keşfetmenize yardımcı olan modern bir Android müzik çalar uygulamasıdır.


---

## ✨ Öne Çıkan Özellikler

### 🎶 Müzik Çalar
- 📂 Cihazınızdaki tüm müzik dosyalarını otomatik tarama (`expo-media-library`)
- ▶️ Arka planda kesintisiz müzik çalma (`react-native-track-player v5`)
- 🔀 Karıştırma, tekrarlama ve sıra yönetimi
- 🎨 Otomatik kapak resmi çekme (YouTube thumbnail & iTunes/Deezer API)
- 📊 İlerleme çubuğu ile şarkı kontrolü

### 🤖 Yapay Zeka Müzik Asistanı
- 💬 Google Gemini AI ile kişiselleştirilmiş müzik önerileri
- 🔍 Web araması entegrasyonu ile güncel müzik trendleri (Tavily API)
- ⚡ Hızlı erişim butonları — "Enerjik playlist", "Odaklanma müziği", "Popüler trendler"
- 📋 Detaylı playlist bilgileri (enerji seviyesi, ruh hali, süre, tür)

### 🎨 Temalar & Kişiselleştirme
- 🌙 Karanlık / Aydınlık mod desteği
- 🎭 Birden fazla renk paleti (Neon, Pastel, Gün Batımı ve daha fazlası)
- 📐 Özelleştirilebilir yazı tipi boyutu

### 📊 İstatistikler & Takip
- ⏱️ Toplam dinleme süresi
- 🏆 En çok dinlenen şarkılar
- 📈 Dinleme alışkanlıkları grafiği

### ❤️ Favoriler & Playlistler
- 💾 Favori şarkılarınızı kaydedin
- 📋 Kendi playlistlerinizi oluşturun
- 📱 Veriler cihazda güvenle saklanır

### 🌐 Çevrimdışı Destek
- 📡 İnternet bağlantısı kontrolü (`NetInfo`)
- ✈️ Çevrimdışıyken müzik dinlemeye devam edin
- ⚠️ Uyarılı mod — Kullanıcıyı bilgilendirerek sorunsuz deneyim

---

## 🏗️ Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| **Framework** | [Expo](https://expo.dev) (SDK 54) + React Native 0.81 |
| **Dil** | TypeScript |
| **Navigasyon** | Expo Router v6 (Drawer + Tabs + Stack) |
| **Stil** | NativeWind v4 (TailwindCSS) |
| **Müzik Çalar** | React Native Track Player v5 (`@rntp/player`) |
| **Yapay Zeka** | Google Gemini 2.5 Flash (AI SDK) |
| **Web Araması** | Tavily API |
| **Medya Erişimi** | Expo Media Library |
| **Durum Yönetimi** | React Context + TanStack Query |
| **Ağ Kontrolü** | @react-native-community/netinfo |
| **Reklamlar** | Google Mobile Ads (AdMob) |
| **Animasyonlar** | React Native Reanimated |
| **Build & Deploy** | EAS Build + EAS Submit |

---

## 📁 Proje Yapısı

```
BeatNova/
├── app/                          # Expo Router sayfaları
│   ├── (auth)/                   # Giriş / Kayıt ekranları
│   ├── (drawer)/                 # Drawer menüsü
│   │   ├── (tabs)/               # Alt sekme navigasyonu
│   │   │   ├── index.tsx         # 🏠 Ana Sayfa
│   │   │   ├── songs.tsx         # 🎵 Şarkı Listesi
│   │   │   ├── MusicAssistant.tsx # 🤖 AI Müzik Asistanı
│   │   │   ├── PlayList.tsx      # 📋 Playlistler
│   │   │   └── settings.tsx      # ⚙️ Ayarlar
│   │   ├── Favorite.tsx          # ❤️ Favoriler
│   │   ├── Statistic.tsx         # 📊 İstatistikler
│   │   └── Theme.tsx             # 🎨 Tema Seçimi
│   └── api/
│       └── object+api.ts         # 🧠 AI Backend (Gemini API)
├── components/
│   ├── AudioPlayer.tsx           # 🎧 Mini Oynatıcı Bileşeni
│   ├── ProgressSection.tsx       # 📊 İlerleme Çubuğu
│   └── songs/
│       └── songsService.tsx      # 🔧 Şarkı Yükleme & Kapak Resmi Servisi
├── hooks/
│   └── useAudioPlayer.ts         # 🎵 Müzik Çalar Hook'u
├── providers/
│   └── player-context.tsx        # 🔄 Global Çalar Durumu
├── services/
│   ├── playbackService.ts        # ▶️ Arka Plan Oynatma Servisi
│   ├── PlaylistServices.ts       # 📋 Playlist Yönetimi
│   └── StatisticServices.ts      # 📈 İstatistik Servisi
├── lib/
│   └── tools/
│       └── webSearch.ts          # 🔍 Tavily Web Araması
├── theme/                        # 🎨 Tema & Renk Paletleri
├── schemes/                      # 📐 Zod Şemaları
└── assets/                       # 🖼️ Görseller & Fontlar
```

---


## 📱 Ekran Görüntüleri

> *Yakında eklenecek*

---



## 📄 Lisans

Bu proje özel (proprietary) bir yazılımdır. Tüm hakları saklıdır.

Kaynak kodun kopyalanması, değiştirilmesi, dağıtılması veya ticari kullanımı
yazarın (Hatayazılım) yazılı izni olmadan yasaktır.

© 2025-2026 Hatayazılım. Tüm hakları saklıdır.

---

## 👨‍💻 Geliştirici

**Hatayazılım** — [@Hatayazilim](https://hatayyazilim.com/)

---

<p align="center">
  BeatNova ile müziğin tadını çıkarın 🎧✨
</p>
