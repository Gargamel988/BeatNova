export const queryKeys = {
  auth: {
    session: () => ["auth", "session"] as const,
    user: () => ["auth", "user"] as const,
  },
  profile: () => ["profile"] as const,
  playlists: {
    all: () => ["playlists"] as const,
    detail: (id: number | string) => ["playlists", id] as const,
    songs: (id: number | string) => ["playlist-songs", id] as const,
  },
  songs: {
    all: () => ["songs"] as const,
    details: () => ["songs-details"] as const,
    device: () => ["deviceSongs"] as const,
    favorites: () => ["favorites"] as const,
    itunesCover: (title: string, artist: string) => ["itunes-cover", title, artist] as const,
  },
  statistics: {
    listeningHistory: () => ["listeninghistory"] as const,
    listeningDaily: (from: string) => ["listening-daily", from] as const,
  },
  friends: {
    all: () => ["friends"] as const,
    requests: () => ["friendRequests"] as const,
    search: (query: string) => ["friends", "search", query] as const,
  },
} as const;
