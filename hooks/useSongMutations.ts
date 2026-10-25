import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";
import { queryKeys } from "@/constants/queryKeys";
import {
  addSongToFavorites,
  removeSongFromFavorites,
  addSongToPlaylist,
} from "@/services/PlaylistServices";
import { insertSongsBatch } from "@/services/SongsService";
import type {
  Song,
  AddSongToPlaylistPayload,
  AddToFavoritesResponse,
  SongMutationOptions,
} from "@/type/SongType";

export function useAddToFavoritesMutation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: string): Promise<AddToFavoritesResponse> => {
      return addSongToFavorites(songId);
    },
    onSuccess: (data: AddToFavoritesResponse) => {
      toast({
        title: data.success ? t("common.success") : t("common.warning"),
        description: data.message,
        variant: data.success ? "success" : "warning",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.favorites() });
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("songs.deleteError"),
        variant: "error",
      });
    },
  });
}

export function useRemoveFromFavoritesMutation() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songId: string) => {
      return removeSongFromFavorites(songId);
    },
    onSuccess: () => {
      toast({
        title: t("fav.removed"),
        description: t("fav.removedDesc"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.favorites() });
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error", { defaultValue: "Hata" }),
        description: error instanceof Error ? error.message : t("assistant.errorMessage"),
        variant: "error",
      });
    },
  });
}

export function useAddSongToPlaylistMutation(options?: SongMutationOptions) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ songId, playlistId }: AddSongToPlaylistPayload) => {
      return addSongToPlaylist(songId, playlistId);
    },
    onMutate: async ({ playlistId, songId }) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.playlists.songs(playlistId),
      });

      const previousSongs = queryClient.getQueryData(
        queryKeys.playlists.songs(playlistId)
      );

      queryClient.setQueryData(
        queryKeys.playlists.songs(playlistId),
        (old: Song[] = []) => [
          ...old,
          {
            id: songId,
            title: t("songs.addingToPlaylist"),
            artist: "",
            metadata: {
              title: t("songs.addingToPlaylist"),
              artist: "",
              album: "",
              duration: 0,
            },
          } as unknown as Song,
        ]
      );

      return { previousSongs, playlistId };
    },
    onSuccess: (_, variables) => {
      toast({
        title: t("common.success"),
        description: t("songs.addedToPlaylist"),
        variant: "success",
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.playlists.songs(variables.playlistId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      options?.onSuccess?.();
    },
    onError: (error: unknown, variables, context) => {
      if (context?.previousSongs) {
        queryClient.setQueryData(
          queryKeys.playlists.songs(variables.playlistId),
          context.previousSongs
        );
      }
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("songs.deleteError"),
        variant: "error",
      });
    },
  });
}

export function useInsertSongsBatchMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songs: Song[]) => {
      return insertSongsBatch(songs as any);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.all() });
      queryClient.invalidateQueries({ queryKey: queryKeys.songs.details() });
    },
  });
}
