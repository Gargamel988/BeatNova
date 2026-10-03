type PlaylistType = {
	id?: number;
	name: string;
	description: string;
	is_public: boolean;
	tags: string[];
	created_at?: Date;
	updated_at?: Date;
	// getPlaylists tarafından eklenen genişletilmiş alanlar
	song_count?: number;
	songCount?: number;
	duration?: number | string;
	cover_url?: string;
	cover?: string;
	song_cover_urls?: string[];
	isPinned?: boolean;
	mood?: string[];
	gradient?: [string, string];
};

type PlaylistCreatePayload = Pick<
	PlaylistType,
	"name" | "description" | "is_public" | "tags"
>;

export type { PlaylistType, PlaylistCreatePayload };