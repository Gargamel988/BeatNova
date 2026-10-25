import { useCallback } from "react";
import { Share } from "react-native";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-modal";
import { Copy, Share2, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { getPlaylistShareData } from "@/services/PlaylistServices";
import { PlaylistType } from "@/type/PlaylistType";
import {
  useDeletePlaylistMutation,
  useClonePlaylistMutation,
} from "@/hooks/usePlaylistMutations";

export function usePlaylistActions(playlist: PlaylistType) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { confirm, actionSheet } = useConfirmDialog();

  const deleteMutation = useDeletePlaylistMutation();
  const cloneMutation = useClonePlaylistMutation();

  const handleDelete = useCallback(() => {
    confirm({
      title: t("playlist.deleteTitle"),
      message: t("playlist.deleteConfirm"),
      variant: "destructive",
      confirmText: t("playlist.delete"),
      cancelText: t("common.cancel"),
      onConfirm: () => {
        deleteMutation.mutate(playlist.id as number);
      },
    });
  }, [playlist.id, deleteMutation, confirm, t]);

  const handleClone = useCallback(() => {
    cloneMutation.mutate(playlist.id as number);
  }, [playlist.id, cloneMutation]);

  const handleShare = useCallback(async () => {
    try {
      const shareData = await getPlaylistShareData(playlist.id as number);
      await Share.share({
        message: shareData.text,
        title: shareData.title,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg !== "User did not share") {
        toast({
          title: t("common.error"),
          description: t("playlist.shareError"),
          variant: "error",
        });
      }
    }
  }, [playlist.id, toast, t]);

  const showActionsMenu = useCallback(() => {
    actionSheet({
      title: playlist.name,
      message: t("playlist.longPressTitle"),
      actions: [
        {
          label: t("playlist.clone"),
          icon: Copy,
          onPress: handleClone,
        },
        {
          label: t("playlist.share"),
          icon: Share2,
          onPress: handleShare,
        },
        {
          label: t("playlist.delete"),
          icon: Trash2,
          destructive: true,
          onPress: handleDelete,
        },
      ],
    });
  }, [playlist.name, handleClone, handleShare, handleDelete, actionSheet, t]);

  return {
    handleDelete,
    handleClone,
    handleShare,
    showActionsMenu,
    isDeleting: deleteMutation.isPending,
    isCloning: cloneMutation.isPending,
  };
}
