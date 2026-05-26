"use client";

import React, { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ExternalLink, GitFork, Search, Star } from "lucide-react";
import { RepositorySkeleton } from "@/module/repository/components/repository-skeleton";
import { useConnectRepository } from "@/module/repository/hooks/use-connect-repository";
import { useRepositories } from "@/module/repository/hooks/use-repositories";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  isConnected?: boolean;
}

const RepositoryPage = () => {
  const [search, setSearch] = useState("");
  const [connectingRepoId, setConnectingRepoId] = useState<number | null>(null);
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();
  const connectMutation = useConnectRepository();

  const repositories = useMemo(() => {
    const items = data?.pages.flat() ?? [];
    const query = search.trim().toLowerCase();

    if (!query) return items;

    return items.filter((repo: Repository) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        repo.description?.toLowerCase().includes(query) ||
        repo.language?.toLowerCase().includes(query)
      );
    });
  }, [data, search]);

  const handleConnect = (repository: Repository) => {
    const [owner, repo] = repository.full_name.split("/");
    setConnectingRepoId(repository.id);

    connectMutation.mutate({
      owner,
      repo,
      githubId: repository.id,
    }, {
      onSettled: () => setConnectingRepoId(null),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <RepositoryHeader search={search} onSearchChange={setSearch} />
        <RepositorySkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RepositoryHeader search={search} onSearchChange={setSearch} />

      {isError ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Failed to load repositories. Please check your GitHub connection.
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No repositories found.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repositories.map((repository: Repository) => (
            <Card
              key={repository.id}
              className="flex flex-col border-neutral-200 bg-white transition-colors hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="truncate text-lg">
                      {repository.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {repository.full_name}
                    </CardDescription>
                  </div>
                  <Button asChild size="icon" variant="ghost">
                    <a
                      href={repository.html_url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Open ${repository.full_name} on GitHub`}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>

                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {repository.description || "No description provided."}
                </p>
              </CardHeader>

              <CardContent className="mt-auto space-y-4">
                <div className="flex flex-wrap gap-2">
                  {repository.language ? (
                    <Badge variant="secondary">{repository.language}</Badge>
                  ) : null}
                  {repository.topics?.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {repository.stargazers_count}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <GitFork className="h-4 w-4" />
                      Repo
                    </span>
                  </div>

                  <Button
                    disabled={
                      repository.isConnected ||
                      connectingRepoId === repository.id
                    }
                    onClick={() => handleConnect(repository)}
                    size="sm"
                  >
                    {repository.isConnected
                      ? "Connected"
                      : connectingRepoId === repository.id
                        ? "Connecting..."
                        : "Connect"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const RepositoryHeader = ({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) => {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          Browse and connect your GitHub repositories for AI code review.
        </p>
      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search repositories"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
    </div>
  );
};

export default RepositoryPage;
