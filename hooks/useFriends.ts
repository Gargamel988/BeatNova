import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addFriend,
  acceptFriendRequest,
  getSuggestedUsers,
  rejectFriendRequest,
  getFriendRequests,
  getFriends,
  removeFriend,
} from "@/services/FriendsService";
import { useToast } from "@/components/ui/toast";

export const useFriends = (searchQuery?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data, isLoading, error } = useQuery({
    queryKey: ["suggested-users", searchQuery],
    queryFn: () => getSuggestedUsers(searchQuery),
    enabled: !!searchQuery && searchQuery.trim().length > 0, 
	
  });

  const {
    data: friends,
    isLoading: isLoadingFriends,
    error: errorFriends,
  } = useQuery({
    queryKey: ["friends"],
    queryFn: () => getFriends(),
  });

  const mutateAddFriend = useMutation({
    mutationFn: (userId: string) => addFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggested-users"] });
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast({
        title: "Arkadaşlık isteği gönderildi",
        description: "Arkadaşlık isteği başarıyla gönderildi",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Hata",
        description: error.message,
        variant: "error",
      });
    },
  });
  const mutateAcceptFriendRequest = useMutation({
    mutationFn: (userId: string) => acceptFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast({
        title: "Arkadaşlık isteği kabul edildi",
        description: "Arkadaşlık isteği başarıyla kabul edildi",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Arkadaş kabul edilirken bir hata oluştu",
        description: "Arkadaş kabul edilirken bir hata oluştu",
        variant: "error",
      });
    },
  });

  const mutateRejectFriendRequest = useMutation({
    mutationFn: (userId: string) => rejectFriendRequest(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friend-requests"] });
      toast({
        title: "Arkadaşlık isteği reddedildi",
        description: "Arkadaşlık isteği başarıyla reddedildi",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Arkadaş reddedilirken bir hata oluştu",
        description: "Arkadaş reddedilirken bir hata oluştu",
        variant: "error",
      });
    },
  });

  const {
    data: friendRequests,
    isLoading: isLoadingFriendRequests,
    error: errorFriendRequests,
  } = useQuery({
    queryKey: ["friend-requests"],
    queryFn: () => getFriendRequests(),
  });



  const mutateRemoveFriend = useMutation({
    mutationFn: (userId: string) => removeFriend(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast({
        title: "Arkadaşlık silindi",
        description: "Arkadaşlık başarıyla silindi",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Arkadaş silinirken bir hata oluştu",
        description: "Arkadaş silinirken bir hata oluştu",
        variant: "error",
      });
    },
  });
  return {
    suggestedUsers: data,
    isLoading,
    error,
    mutateAddFriend,
    mutateAcceptFriendRequest,
    mutateRejectFriendRequest,
    friendRequests,
    isLoadingFriendRequests,
    errorFriendRequests,
    friends,
    isLoadingFriends,
    errorFriends,
    mutateRemoveFriend,
  };
};
