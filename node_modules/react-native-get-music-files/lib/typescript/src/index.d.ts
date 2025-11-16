import type { Album, AlbumOptions, Song, SongOptions } from './NativeTurboSongs';
declare enum SortSongOrder {
    ASC = "ASC",
    DESC = "DESC"
}
declare enum SortSongFields {
    TITLE = "TITLE",
    DURATION = "DURATION",
    ARTIST = "ARTIST",
    GENRE = "GENRE",
    ALBUM = "ALBUM"
}
declare const getAll: (options?: SongOptions) => Promise<Song[] | string>;
declare const getAlbums: (options?: AlbumOptions) => Promise<Album[] | string>;
declare const searchSongs: (options?: SongOptions) => Promise<Song[] | string>;
export { getAll, getAlbums, searchSongs, SortSongFields, SortSongOrder };
//# sourceMappingURL=index.d.ts.map