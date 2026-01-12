import { upsertlisteningtime } from "@/services/StatisticServices";
import { useQueryClient, useMutation } from "@tanstack/react-query";

type ListeningHistoryPayload = {
  listeningTime: number;
  songId: string;
  skipCount?: number;
  playCount?: number;
};

export default function UpsertListeningTimeMutation() {
  const queryClient = useQueryClient();

  const { mutate: upsertListeningTime } = useMutation({
    mutationFn: async ({
      listeningTime,
      songId,
      skipCount = 0,
      playCount = 0,
    }: ListeningHistoryPayload) => {
      const result = await upsertlisteningtime(
        listeningTime,
        songId,
        skipCount,
        playCount,
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allStatistics"] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });
  return upsertListeningTime;
}

export { UpsertListeningTimeMutation };