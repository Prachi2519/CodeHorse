"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { disconnectAllRepositories, disconnectRepository } from "../actions";

type RepositoryQueryItem = {
  id: number;
  isConnected?: boolean;
};

type RepositoryQueryData = {
  pages: RepositoryQueryItem[][];
  pageParams: unknown[];
};

export const useDisconnectRepository = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ githubId }: { githubId: number }) => {
      const result = await disconnectRepository(githubId);

      if (!result.success) {
        throw new Error(result.message);
      }

      return { ...result, githubId };
    },
    onSuccess: (result) => {
      queryClient.setQueryData<RepositoryQueryData>(
        ["repositories"],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) =>
              page.map((repository) =>
                repository.id === result.githubId
                  ? { ...repository, isConnected: false }
                  : repository,
              ),
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-stats"] });
      queryClient.invalidateQueries({ queryKey: ["review-diagnostics"] });
      toast.success("Repository disconnected successfully");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect repository.",
      );
    },
  });
};

export const useDisconnectAllRepositories = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await disconnectAllRepositories();

      if (!result.success) {
        throw new Error(result.message);
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.setQueryData<RepositoryQueryData>(
        ["repositories"],
        (current) => {
          if (!current) {
            return current;
          }

          return {
            ...current,
            pages: current.pages.map((page) =>
              page.map((repository) => ({
                ...repository,
                isConnected: false,
              })),
            ),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ["repositories"] });
      queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["review-stats"] });
      queryClient.invalidateQueries({ queryKey: ["review-diagnostics"] });
      toast.success(
        (result.count ?? 0) > 0
          ? "All repositories disconnected successfully"
          : "No connected repositories to disconnect",
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to disconnect repositories.",
      );
    },
  });
};
