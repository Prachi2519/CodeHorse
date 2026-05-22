"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";

import { RepositorySkeleton } from "@/module/repository/components/repository-skeleton";
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
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();

  const repositories = useMemo(() => {
    const repos = data?.pages.flat() ?? [];
    if (!search.trim()) return repos;

    const query = search.toLowerCase();
    return repos.filter((repo: Repository) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false) ||
        (repo.language?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [data, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Repositories</h1>
        <p className="text-muted-foreground">
          Manage and view all your GitHub repositories
        </p>
      </div>

      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search repositories..."
          value={search}
        />
      </div>

      {isLoading ? (
        <RepositorySkeleton />
      ) : isError ? (
        <div className="py-10 text-center text-destructive">
          Failed to load repositories.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repositories.map((repo: Repository) => (
            <Card key={repo.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-lg">
                      {repo.name}
                    </CardTitle>
                    <CardDescription className="truncate">
                      {repo.full_name}
                    </CardDescription>
                  </div>
                  {repo.isConnected ? (
                    <Badge variant="secondary">Connected</Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">
                  {repo.description || "No description available."}
                </p>

                <div className="flex flex-wrap gap-2">
                  {repo.language ? <Badge>{repo.language}</Badge> : null}
                  {repo.topics?.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="size-4" />
                    {repo.stargazers_count}
                  </div>
                  <Button asChild size="sm" variant="outline">
                    <a href={repo.html_url} rel="noreferrer" target="_blank">
                      View
                      <ExternalLink className="size-4" />
                    </a>
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
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            variant="outline"
          >
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default RepositoryPage;
