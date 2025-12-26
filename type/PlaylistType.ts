type PlaylistType = {
	id?: number;
	name: string;
	description: string;
	is_public: boolean;
	tags: string[];
	created_at?: Date;
	updated_at?: Date;
};

type PlaylistCreatePayload = Pick<
	PlaylistType,
	"name" | "description"  | "is_public" | "tags"
>;

export type { PlaylistType, PlaylistCreatePayload };