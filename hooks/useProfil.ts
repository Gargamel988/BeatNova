import {
  getProfile,
  insertProfile,
  updateCurrentSong,
  updateProfile,
  updateUserActiveStatus,
} from "@/services/ProfilServices";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/toast";

export const useProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => getProfile(),
  });


  
  const mutateInsertProfile = useMutation({
    mutationFn: (user: User) => insertProfile(user),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });



  const mutateUpdateCurrentSong = useMutation({
    mutationFn: (songId: string | null) => updateCurrentSong(songId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },

  });

  const mutateUpdateProfile = useMutation({
    mutationFn: (updates: {
      display_name?: string;
      bio?: string;
      avatar_url?: string;
      theme?: string;
      is_private?: boolean;
      show_current_song?: boolean;
      allow_friend_requests?: boolean;
      show_listening_activity?: boolean;
      is_active?: boolean;
    }) => updateProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({
        title: "Profil başarıyla güncellendi",
        description: "Profil başarıyla güncellendi",
        variant: "success",
      });
    },
  });

  const mutateUpdateActiveStatus = useMutation({
    mutationFn: (isActive: boolean) => updateUserActiveStatus(isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  return {
    mutateInsertProfile,
    mutateUpdateCurrentSong,
    mutateUpdateProfile,
    mutateUpdateActiveStatus,
    profile,
  };
};
