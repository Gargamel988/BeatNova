import { z } from "zod";

// Şarkı detayları için şema
const SongSchema = z.object({
  name: z.string().describe("Şarkının adı"),
  artist: z.string().describe("Sanatçının adı"),
  album: z.string().describe("Albüm adı"),
  duration: z.number().optional().describe("Şarkı süresi (saniye cinsinden)"),
  genre: z.string().optional().describe("Müzik türü (örn: Pop, Rock, Jazz)"),
  year: z.number().optional().describe("Yayınlanma yılı"),
  energyLevel: z.enum(["low", "medium", "high"]).optional().describe("Enerji seviyesi"),
  mood: z.array(z.string()).optional().describe("Şarkının ruh hali etiketleri (örn: ['enerjik', 'neşeli', 'motivasyonel'])"),
});

// Playlist bilgileri için şema
const PlaylistInfoSchema = z.object({
  playlistName: z.string().optional().describe("Oluşturulan playlist'in adı"),
  description: z.string().optional().describe("Playlist açıklaması"),
  totalDuration: z.number().optional().describe("Toplam süre (saniye cinsinden)"),
  mood: z.string().optional().describe("Playlist'in genel ruh hali"),
  energyLevel: z.enum(["low", "medium", "high"]).optional().describe("Playlist'in genel enerji seviyesi"),
  tags: z.array(z.string()).optional().describe("Playlist etiketleri"),
});

// Ana şema
export const ObjectScheme = z.object({
  // Şarkı listesi
  songs: z.array(SongSchema).describe("Önerilen şarkıların listesi"),
  
  // Playlist bilgileri
  playlistInfo: PlaylistInfoSchema.optional().describe("Playlist hakkında genel bilgiler"),
  
  // Öneri nedeni
  recommendationReason: z.string().optional().describe("Bu şarkıların neden önerildiğinin açıklaması"),
  
  // Oluşturulma tarihi
  createdAt: z.string().datetime().optional().describe("Playlist'in oluşturulma tarihi (ISO 8601 formatında)"),
});