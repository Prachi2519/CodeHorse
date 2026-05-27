"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { connectRepository } from "../actions";

export const useConnectRepository = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      owner,
      repo,
      githubId,
    }: {
      owner: string;
      repo: string;
      githubId: number;
    }) => {
      const result = await connectRepository(owner, repo, githubId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    },

    onSuccess: (result) => {
      toast.success(result.message);
      queryClient.invalidateQueries({ queryKey: ["repositories"] });
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to connect repository",
      );
    },
  });
};
