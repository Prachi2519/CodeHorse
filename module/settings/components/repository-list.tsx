"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  disconnectAllRepositories,
  disconnectRepository,
  getConnectedRepositories,
} from "@/module/settings/actions";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

export function RepositoryList() {
  const queryClient = useQueryClient();
  const [disconnectAllOpen, setDisconnectAllOpen] = useState(false);
  const [deletingRepoId, setDeletingRepoId] = useState<string | null>(null);

  const { data: repositories, isLoading } = useQuery({
    queryKey: ["connected-repositories"],
    queryFn: async () => await getConnectedRepositories(),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  const disconnectMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return await disconnectRepository(repositoryId);
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success("Repository disconnected successfully");
      } else {
        toast.error(result?.error || "Failed to disconnect repository");
      }
    },
  });

  const disconnectAllMutation = useMutation({
    mutationFn: async () => {
      return await disconnectAllRepositories();
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["connected-repositories"] });
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        toast.success(`Disconnected ${result.count} repositories`);
        setDisconnectAllOpen(false);
      } else {
        toast.error(result?.error || "Failed to disconnect repositories");
      }
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Repositories</CardTitle>
          <CardDescription>
            Manage your connected GitHub repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 rounded bg-muted"></div>
            <div className="h-20 rounded bg-muted"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Connected Repositories</CardTitle>
            <CardDescription>
              Manage your connected GitHub repositories
            </CardDescription>
          </div>
          {repositories && repositories.length > 0 ? (
            <AlertDialog
              onOpenChange={setDisconnectAllOpen}
              open={disconnectAllOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  disabled={disconnectAllMutation.isPending}
                  variant="destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  {disconnectAllMutation.isPending
                    ? "Disconnecting All..."
                    : "Disconnect All"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-5 text-destructive" />
                    Disconnect all repositories?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This will disconnect all connected repositories from your
                    account. You can reconnect them later from the Repository
                    page.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={disconnectAllMutation.isPending}
                    onClick={() => disconnectAllMutation.mutate()}
                  >
                    {disconnectAllMutation.isPending
                      ? "Disconnecting All..."
                      : "Disconnect All"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : null}
        </div>
      </CardHeader>

      <CardContent>
        {!repositories || repositories.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>No repositories connected yet.</p>
            <p className="mt-2 text-sm">
              Connect repositories from the Repository page.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {repositories.map((repo) => (
              <div
                className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                key={repo.id}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-medium">{repo.name}</h3>
                    <Badge variant="secondary">Connected</Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {repo.fullName}
                  </p>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Connected {new Date(repo.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="ml-4 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={repo.url} rel="noreferrer" target="_blank">
                      <ExternalLink className="size-4" />
                    </a>
                  </Button>
                  <Button
                    disabled={deletingRepoId === repo.id}
                    onClick={() => {
                      setDeletingRepoId(repo.id);
                      disconnectMutation.mutate(repo.id, {
                        onSettled: () => setDeletingRepoId(null),
                      });
                    }}
                    size="sm"
                    variant="destructive"
                  >
                    <Trash2 className="size-4" />
                    <span className="ml-2">
                      {deletingRepoId === repo.id ? "Deleting..." : "Delete"}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
