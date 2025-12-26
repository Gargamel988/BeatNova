import {
  getProfile,
  insertProfile,
  updateCurrentSong,
} from "@/services/ProfilServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";
import { User } from "@supabase/supabase-js";

export const useProfile = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });
  const mutateInsertProfile = useMutation({
    mutationFn: (user: User) => insertProfile(user),
    onSuccess: () => {
      toast({
        title: "Profil başarıyla oluşturuldu",
        description: "Profil başarıyla oluşturuldu",
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => {
      toast({
        title: "Profil oluşturulurken bir hata oluştu",
        description: "Profil oluşturulurken bir hata oluştu",
        variant: "error",
      });
    },
  });
  const mutateUpdateCurrentSong = useMutation({
    mutationFn: (songId: string | null) => updateCurrentSong(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },

  });
  return {
    mutateInsertProfile,
    mutateUpdateCurrentSong,
    profile,
  };
};
