import type { Asset } from "expo-media-library";

export interface SongMetadata {
  title: string;
  artist: string;
  album: string;
  duration: number;
  coverUri?: string;
  genre?: string;
  mood?: string[];
  energyLevel?: "low" | "medium" | "high";
}

/**
 * BeatNova Şarkı Modeli:
 * MediaLibrary Asset özelliklerini ve uygulamanın genişletilmiş metadata/player alanlarını kapsar.
 */
export interface Song extends Partial<Asset> {
  id: string;
  assetId?: string;
  title?: string;
  artist?: string;
  album?: string;
  duration?: number;
  uri?: string;
  url?: string;
  cover?: string;
  cover_url?: string;
  metadata?: SongMetadata;
  genre?: string;
  mood?: string[];
  energy_level?: string;
}

export type SongInsertPayload = {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover_url: string | null;
  audio_url: string;
  users_id: string;
};

export type AddToFavoritesResponse = {
  success: boolean;
  message: string;
};

export type AddSongToPlaylistPayload = {
  songId: string;
  playlistId: number;
};

export type SongMutationOptions = {
  onSuccess?: () => void;
  selectedSongId?: string | null;
};
