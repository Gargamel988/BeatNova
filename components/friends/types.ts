export type TabType = "friends" | "requests" | "add";

export interface Friend {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  current_song_id: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  username: string;
  initials: string;
  mutualFriends: number;
  genre: string;
}

export interface SuggestedUser {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  mutualFriends: number;
  genre: string;
}

