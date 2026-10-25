import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useToast } from "@/components/ui/toast";
import { queryKeys } from "@/constants/queryKeys";
import {
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  clonePlaylist,
  type PlaylistCreatePayload,
} from "@/services/PlaylistServices";
import type { PlaylistType } from "@/type/PlaylistType";

export function useCreatePlaylistMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlaylistCreatePayload) => {
      return createPlaylist(data);
    },
    onSuccess: () => {
      toast({
        title: t("playlist.createSuccess"),
        description: t("playlist.createSuccessDesc"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useUpdatePlaylistMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: PlaylistType) => {
      return updatePlaylist(data);
    },
    onSuccess: () => {
      toast({
        title: t("playlist.updateSuccess"),
        description: t("playlist.updateSuccessDesc"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      onSuccessCallback?.();
    },
    onError: (error: Error) => {
      toast({
        title: t("common.error"),
        description: error.message,
        variant: "error",
      });
    },
  });
}

export function useDeletePlaylistMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => deletePlaylist(id),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("playlist.deleteSuccess"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("playlist.deleteError"),
        variant: "error",
      });
    },
  });
}

export function useClonePlaylistMutation(onSuccessCallback?: () => void) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number | string) => clonePlaylist(id),
    onSuccess: () => {
      toast({
        title: t("common.success"),
        description: t("playlist.cloneSuccess"),
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists.all() });
      onSuccessCallback?.();
    },
    onError: (error: unknown) => {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("playlist.cloneError"),
        variant: "error",
      });
    },
  });
}
