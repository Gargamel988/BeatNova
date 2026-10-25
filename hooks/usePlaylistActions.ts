import { useCallback } from "react";
import { Alert, Share } from "react-native";
import { useToast } from "@/components/ui/toast";
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

  const deleteMutation = useDeletePlaylistMutation();
  const cloneMutation = useClonePlaylistMutation();

  const handleDelete = useCallback(() => {
    Alert.alert(
      t("playlist.deleteTitle"),
      t("playlist.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("playlist.delete"),
          style: "destructive",
          onPress: () => deleteMutation.mutate(playlist.id as number),
        },
      ]
    );
  }, [playlist.id, deleteMutation, t]);

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
    Alert.alert(
      playlist.name,
      t("playlist.longPressTitle"),
      [
        {
          text: t("playlist.clone"),
          onPress: handleClone,
        },
        {
          text: t("playlist.share"),
          onPress: handleShare,
        },
        {
          text: t("playlist.delete"),
          style: "destructive",
          onPress: handleDelete,
        },
        {
          text: t("common.cancel"),
          style: "cancel",
        },
      ]
    );
  }, [playlist.name, handleClone, handleShare, handleDelete, t]);

  return {
    handleDelete,
    handleClone,
    handleShare,
    showActionsMenu,
    isDeleting: deleteMutation.isPending,
    isCloning: cloneMutation.isPending,
  };
}
