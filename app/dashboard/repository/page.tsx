"use client";

import {
  BookOpen,
  CircleCheck,
  Code2,
  Database,
  ExternalLink,
  GitBranch,
  Loader2,
  Search,
  SearchX,
  Star,
} from "lucide-react";
import { useMemo, useState } from "react";

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

const numberFormatter = new Intl.NumberFormat("en-US");

const languageTone: Record<string, string> = {
  TypeScript: "bg-sky-500",
  JavaScript: "bg-amber-400",
  Python: "bg-emerald-500",
  Java: "bg-orange-500",
  Go: "bg-cyan-500",
  Rust: "bg-rose-500",
};

const RepositoryPage = () => {
  const [search, setSearch] = useState("");
  const [localConnectingId, setLocalConnectingId] = useState<number | null>(
    null,
  );
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();

  const { mutate: connectRepo } = useConnectRepository();

  const allRepositories = useMemo<Repository[]>(
    () => data?.pages.flat() ?? [],
    [data],
  );

  const repositories = useMemo(() => {
    if (!search.trim()) return allRepositories;

    const query = search.toLowerCase();
    return allRepositories.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.full_name.toLowerCase().includes(query) ||
        (repo.description?.toLowerCase().includes(query) ?? false) ||
        (repo.language?.toLowerCase().includes(query) ?? false) ||
        repo.topics?.some((topic) => topic.toLowerCase().includes(query))
      );
    });
  }, [allRepositories, search]);

  const handleConnect = (repo: Repository) => {
    setLocalConnectingId(repo.id);
    connectRepo(
      {
        owner: repo.full_name.split("/")[0],
        repo: repo.name,
        githubId: repo.id,
      },
      {
        onSettled: () => setLocalConnectingId(null),
      },
    );
  };

  const repositoryStats = useMemo(() => {
    const connected = allRepositories.filter((repo) => repo.isConnected).length;
    const stars = allRepositories.reduce(
      (total, repo) => total + repo.stargazers_count,
      0,
    );
    const languages = new Set(
      allRepositories
        .map((repo) => repo.language)
        .filter((language): language is string => Boolean(language)),
    );

    return {
      connected,
      stars,
      languages: languages.size,
      total: allRepositories.length,
    };
  }, [allRepositories]);

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-300"
                variant="outline"
              >
                <GitBranch className="size-3" />
                GitHub repository hub
              </Badge>
              <Badge variant="outline">
                {numberFormatter.format(repositoryStats.total)} loaded
              </Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Repository intelligence
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Search, inspect, and connect repositories with a layout built
                for fast scanning and clean engineering workflows.
              </p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 xl:min-w-[420px]">
            <RepositoryMetric
              icon={CircleCheck}
              label="Connected"
              value={repositoryStats.connected}
            />
            <RepositoryMetric
              icon={Star}
              label="Stars"
              value={repositoryStats.stars}
            />
            <RepositoryMetric
              icon={Code2}
              label="Languages"
              value={repositoryStats.languages}
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 border-0 bg-muted/60 pl-9 shadow-none focus-visible:ring-1"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by repo, owner, language, topic..."
            value={search}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Database className="size-4" />
          Showing {numberFormatter.format(repositories.length)} of{" "}
          {numberFormatter.format(repositoryStats.total)}
        </div>
      </section>

      {isLoading ? (
        <RepositorySkeleton />
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <SearchX className="size-8 text-destructive" />
            <p className="font-medium">Failed to load repositories</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Check your GitHub connection and try refreshing the dashboard.
            </p>
          </CardContent>
        </Card>
      ) : repositories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="font-medium">No repositories match your search</p>
            <p className="max-w-md text-sm text-muted-foreground">
              Try searching by repository name, owner, language, or topic.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {repositories.map((repo) => (
            <RepositoryCard
              isConnecting={localConnectingId === repo.id}
              key={repo.id}
              onConnect={handleConnect}
              repo={repo}
            />
          ))}
        </div>
      )}

      {hasNextPage ? (
        <div className="flex justify-center pb-2">
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            size="lg"
            variant="outline"
          >
            {isFetchingNextPage ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Database className="size-4" />
            )}
            {isFetchingNextPage ? "Loading repositories" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
};

const RepositoryMetric = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) => {
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="flex items-center justify-between gap-3">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-lg font-semibold">
          {numberFormatter.format(value)}
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
};

const RepositoryCard = ({
  isConnecting,
  onConnect,
  repo,
}: {
  isConnecting: boolean;
  onConnect: (repo: Repository) => void;
  repo: Repository;
}) => {
  const languageColor = repo.language
    ? (languageTone[repo.language] ?? "bg-muted-foreground")
    : "bg-muted-foreground";

  return (
    <Card className="border-border/80 bg-card/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2">
              <BookOpen className="size-4 shrink-0 text-muted-foreground" />
              <CardTitle className="truncate text-base font-semibold">
                {repo.name}
              </CardTitle>
            </div>
            <CardDescription className="truncate">
              {repo.full_name}
            </CardDescription>
          </div>
          {repo.isConnected ? (
            <Badge
              className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
              variant="outline"
            >
              <CircleCheck className="size-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="outline">Available</Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {repo.description || "No description has been added for this repo."}
        </p>

        <div className="flex flex-wrap gap-2">
          {repo.language ? (
            <Badge className="gap-1.5" variant="outline">
              <span className={`size-2 rounded-full ${languageColor}`} />
              {repo.language}
            </Badge>
          ) : null}
          {repo.topics?.slice(0, 3).map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Star className="size-4 text-amber-500" />
            {numberFormatter.format(repo.stargazers_count)}
          </div>
          <div className="flex items-center gap-2">
            {!repo.isConnected ? (
              <Button
                disabled={isConnecting}
                onClick={() => onConnect(repo)}
                size="sm"
              >
                {isConnecting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <CircleCheck className="size-4" />
                )}
                Connect
              </Button>
            ) : null}
            <Button asChild size="sm" variant="outline">
              <a href={repo.html_url} rel="noreferrer" target="_blank">
                Open
                <ExternalLink className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RepositoryPage;
