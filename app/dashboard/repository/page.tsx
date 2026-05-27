"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  Code2,
  ExternalLink,
  Eye,
  FolderGit2,
  GitBranch,
  GitFork,
  Grid3X3,
  LayoutList,
  Loader2,
  RefreshCw,
  Rocket,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
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
  updated_at?: string;
  pushed_at?: string;
  private?: boolean;
  fork?: boolean;
  permissions?: {
    admin?: boolean;
  };
  canManageWebhooks?: boolean;
  isConnected?: boolean;
}

type ViewMode = "grid" | "table";
type StatusFilter = "all" | "connected" | "not-connected" | "admin-required";
type SortMode = "recent" | "name" | "language";

const fallbackPrimaryLanguages = ["TypeScript", "JavaScript", "Python"];

const languageColors: Record<string, string> = {
  TypeScript: "var(--primary)",
  JavaScript: "var(--warning)",
  Python: "var(--success)",
  EJS: "var(--chart-5)",
  HTML: "var(--danger)",
};

const GitHubMark = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.29 9.41 7.86 10.94.58.1.79-.25.79-.56v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.56-.29-5.25-1.28-5.25-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.04 0 0 .98-.31 3.18 1.18A11.1 11.1 0 0 1 12 6.06c.98 0 1.96.13 2.88.4 2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.19 1.83 1.19 3.09 0 4.42-2.7 5.39-5.27 5.68.42.36.79 1.07.79 2.16v3.13c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
  </svg>
);

const RepositoryPage = () => {
  const [search, setSearch] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortMode>("recent");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [connectingRepoId, setConnectingRepoId] = useState<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: session } = useSession();
  const accountName = session?.user?.name || "Prachi2519";
  const accountEmail = session?.user?.email || "prachi639220@gmail.com";
  const accountInitial = accountName.charAt(0).toUpperCase();

  const {
    data,
    isLoading,
    isError,
    isFetching,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRepositories();
  const connectMutation = useConnectRepository();

  const allRepositories = useMemo<Repository[]>(
    () => data?.pages.flat() ?? [],
    [data],
  );

  const languageOptions = useMemo(() => {
    const languages = new Set(
      allRepositories
        .map((repository) => repository.language)
        .filter((language): language is string => Boolean(language)),
    );

    return Array.from(languages).sort((a, b) => a.localeCompare(b));
  }, [allRepositories]);

  const languageCounts = useMemo(() => {
    return allRepositories.reduce<Record<string, number>>((acc, repository) => {
      if (!repository.language) return acc;
      acc[repository.language] = (acc[repository.language] ?? 0) + 1;
      return acc;
    }, {});
  }, [allRepositories]);

  const primaryLanguages = useMemo(() => {
    const available = new Set(languageOptions);
    const priority = fallbackPrimaryLanguages.filter((language) =>
      available.has(language),
    );
    const ranked = Object.entries(languageCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .map(([language]) => language)
      .filter((language) => !priority.includes(language));

    return [...priority, ...ranked].slice(0, 3);
  }, [languageCounts, languageOptions]);

  const repositories = useMemo(() => {
    const query = search.trim().toLowerCase();

    return allRepositories
      .filter((repo) => {
        const matchesSearch =
          !query ||
          repo.name.toLowerCase().includes(query) ||
          repo.full_name.toLowerCase().includes(query) ||
          repo.description?.toLowerCase().includes(query) ||
          repo.language?.toLowerCase().includes(query);

        const matchesLanguage =
          languageFilter === "all" || repo.language === languageFilter;

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "connected" && repo.isConnected) ||
          (statusFilter === "not-connected" && !repo.isConnected) ||
          (statusFilter === "admin-required" && !repo.canManageWebhooks);

        return matchesSearch && matchesLanguage && matchesStatus;
      })
      .sort((repoA, repoB) => {
        if (sortBy === "name") {
          return repoA.name.localeCompare(repoB.name);
        }

        if (sortBy === "language") {
          return (repoA.language || "zzz").localeCompare(
            repoB.language || "zzz",
          );
        }

        return getRepoTimestamp(repoB) - getRepoTimestamp(repoA);
      });
  }, [allRepositories, languageFilter, search, sortBy, statusFilter]);

  const connectedCount = allRepositories.filter(
    (repository) => repository.isConnected,
  ).length;
  const notConnectedCount = allRepositories.length - connectedCount;
  const javascriptCount = languageCounts.JavaScript ?? 0;
  const hasPythonRepo = Boolean(languageCounts.Python);

  const metrics = [
    {
      title: "Total Repositories",
      metric: allRepositories.length || 0,
      label: "Detected on GitHub",
      helper: "Ready for workspace review setup.",
      icon: FolderGit2,
      tone: "text-primary",
    },
    {
      title: "Connected for Review",
      metric: connectedCount,
      label: "AI review enabled",
      helper:
        connectedCount === 0
          ? "Connect a repo to begin."
          : "Review automation is active.",
      icon: Bot,
      tone: "text-success",
    },
    {
      title: "Primary Languages",
      metric: primaryLanguages.length
        ? primaryLanguages.join(", ")
        : fallbackPrimaryLanguages.join(", "),
      label: "Top workspace stack",
      helper: "Language mix informs review setup.",
      icon: Code2,
      tone: "text-chart-3",
    },
    {
      title: "GitHub Sync",
      metric: isFetching ? "Syncing" : "Active",
      label: "Token-backed analytics",
      helper: "Live workspace signals are enabled.",
      icon: ShieldCheck,
      tone: "text-success",
    },
  ];

  const handleConnect = (repository: Repository) => {
    if (repository.isConnected || !repository.canManageWebhooks) {
      return;
    }

    const [owner, repo] = repository.full_name.split("/");
    setConnectingRepoId(repository.id);

    connectMutation.mutate(
      {
        owner,
        repo,
        githubId: repository.id,
      },
      {
        onSettled: () => setConnectingRepoId(null),
      },
    );
  };

  const focusRepositorySearch = () => {
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <RepositoryHeader
          accountEmail={accountEmail}
          accountInitial={accountInitial}
          accountName={accountName}
          isFetching={isFetching}
          onFocusSearch={focusRepositorySearch}
          onSync={() => void refetch()}
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard isLoading={isLoading} item={metric} key={metric.title} />
          ))}
        </section>

        <RepositoryControls
          languageFilter={languageFilter}
          languageOptions={languageOptions}
          search={search}
          searchInputRef={searchInputRef}
          sortBy={sortBy}
          statusFilter={statusFilter}
          viewMode={viewMode}
          onLanguageChange={setLanguageFilter}
          onSearchChange={setSearch}
          onSortChange={(value) => setSortBy(value as SortMode)}
          onStatusChange={(value) => setStatusFilter(value as StatusFilter)}
          onViewModeChange={setViewMode}
        />

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-normal text-foreground">
                  Repository Workspace
                </h2>
                <p className="text-sm text-muted-foreground">
                  {repositories.length} of {allRepositories.length} repositories
                  visible
                </p>
              </div>
              <Badge className="w-fit border-success/20 bg-success/10 text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                GitHub synced
              </Badge>
            </div>

            {isError ? (
              <ErrorState />
            ) : isLoading ? (
              <RepositoryLoadingState viewMode={viewMode} />
            ) : repositories.length === 0 ? (
              <EmptyRepositoryState onFocusSearch={focusRepositorySearch} />
            ) : viewMode === "grid" ? (
              <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {repositories.map((repository) => (
                  <RepositoryCard
                    connectingRepoId={connectingRepoId}
                    key={repository.id}
                    repository={repository}
                    onConnect={handleConnect}
                  />
                ))}
              </div>
            ) : (
              <RepositoryTable
                connectingRepoId={connectingRepoId}
                repositories={repositories}
                onConnect={handleConnect}
              />
            )}

            {hasNextPage ? (
              <div className="flex justify-center pt-2">
                <Button
                  className="border-border bg-card/80 text-foreground hover:bg-muted"
                  disabled={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                  variant="outline"
                >
                  {isFetchingNextPage ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {isFetchingNextPage ? "Loading..." : "Load more repositories"}
                </Button>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            <ReviewOnboardingCard onConnectRepository={focusRepositorySearch} />
            <WorkspaceInsights
              hasPythonRepo={hasPythonRepo}
              javascriptCount={javascriptCount}
              notConnectedCount={notConnectedCount}
              totalRepositories={allRepositories.length}
            />
            <OperationalStatusCard />
          </aside>
        </section>
      </div>
    </div>
  );
};

const RepositoryHeader = ({
  accountEmail,
  accountInitial,
  accountName,
  isFetching,
  onFocusSearch,
  onSync,
}: {
  accountEmail: string;
  accountInitial: string;
  accountName: string;
  isFetching: boolean;
  onFocusSearch: () => void;
  onSync: () => void;
}) => {
  return (
    <header className="codehorse-panel rounded-lg p-4">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-4">
          <div className="codehorse-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
            <FolderGit2 className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-success/20 bg-success/10 text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                All systems operational
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <GitHubMark className="size-3" />
                GitHub synced
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Repositories
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
              Browse and connect your GitHub repositories for AI-powered code
              review.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-10 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
            disabled={isFetching}
            onClick={onSync}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Sync GitHub
          </Button>
          <Button
            className="h-10 rounded-lg bg-primary px-4 text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={onFocusSearch}
            type="button"
          >
            <Sparkles className="size-4" />
            Connect Repository
          </Button>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground">
              {accountInitial || "P"}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-foreground">
                @{accountName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {accountEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const MetricCard = ({
  isLoading,
  item,
}: {
  isLoading: boolean;
  item: {
    title: string;
    metric: number | string;
    label: string;
    helper: string;
    icon: LucideIcon;
    tone: string;
  };
}) => {
  return (
    <article className="codehorse-panel group rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{item.title}</p>
          <div className="mt-2 min-h-9 text-2xl font-semibold tracking-tight text-foreground">
            {isLoading ? <Skeleton className="h-8 w-24" /> : item.metric}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-muted/60 p-2">
          <item.icon className={cn("size-4", item.tone)} />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">{item.label}</span>
        <span className="inline-flex items-center gap-1 text-success">
          <CircleDot className="size-3" />
          Active
        </span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {item.helper}
      </p>
    </article>
  );
};

const RepositoryControls = ({
  languageFilter,
  languageOptions,
  search,
  searchInputRef,
  sortBy,
  statusFilter,
  viewMode,
  onLanguageChange,
  onSearchChange,
  onSortChange,
  onStatusChange,
  onViewModeChange,
}: {
  languageFilter: string;
  languageOptions: string[];
  search: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  sortBy: SortMode;
  statusFilter: StatusFilter;
  viewMode: ViewMode;
  onLanguageChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onViewModeChange: (value: ViewMode) => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-lg border-border bg-background/60 pl-9 text-sm"
            id="repository-search"
            placeholder="Search repositories..."
            ref={searchInputRef}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ControlSelect
            icon={Code2}
            label="Language"
            value={languageFilter}
            onChange={onLanguageChange}
          >
            <NativeSelectOption value="all">All languages</NativeSelectOption>
            {languageOptions.map((language) => (
              <NativeSelectOption key={language} value={language}>
                {language}
              </NativeSelectOption>
            ))}
          </ControlSelect>

          <ControlSelect
            icon={SlidersHorizontal}
            label="Status"
            value={statusFilter}
            onChange={onStatusChange}
          >
            <NativeSelectOption value="all">All repos</NativeSelectOption>
            <NativeSelectOption value="connected">Connected</NativeSelectOption>
            <NativeSelectOption value="not-connected">
              Not connected
            </NativeSelectOption>
            <NativeSelectOption value="admin-required">
              Admin required
            </NativeSelectOption>
          </ControlSelect>

          <ControlSelect
            icon={Clock3}
            label="Sort"
            value={sortBy}
            onChange={onSortChange}
          >
            <NativeSelectOption value="recent">
              Recently updated
            </NativeSelectOption>
            <NativeSelectOption value="name">Name</NativeSelectOption>
            <NativeSelectOption value="language">Language</NativeSelectOption>
          </ControlSelect>

          <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1">
            <ViewButton
              active={viewMode === "grid"}
              icon={Grid3X3}
              label="Grid"
              onClick={() => onViewModeChange("grid")}
            />
            <ViewButton
              active={viewMode === "table"}
              icon={LayoutList}
              label="Table"
              onClick={() => onViewModeChange("table")}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ControlSelect = ({
  children,
  icon: Icon,
  label,
  value,
  onChange,
}: {
  children: React.ReactNode;
  icon: LucideIcon;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  return (
    <div className="flex h-10 min-w-[11rem] items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-sm text-muted-foreground">
      <Icon className="size-4" />
      <NativeSelect
        aria-label={label}
        className="w-full"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {children}
      </NativeSelect>
    </div>
  );
};

const ViewButton = ({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) => {
  return (
    <button
      aria-pressed={active}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground",
        active && "bg-card text-foreground shadow-sm",
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
};

const RepositoryCard = ({
  connectingRepoId,
  repository,
  onConnect,
}: {
  connectingRepoId: number | null;
  repository: Repository;
  onConnect: (repository: Repository) => void;
}) => {
  const isConnecting = connectingRepoId === repository.id;
  const canConnect = Boolean(repository.canManageWebhooks);

  return (
    <article className="codehorse-panel group flex min-h-[280px] flex-col rounded-lg p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="rounded-lg border border-border bg-muted/60 p-2 text-primary">
            <FolderGit2 className="size-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold tracking-normal text-foreground">
              {repository.name}
            </h3>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {repository.full_name}
            </p>
          </div>
        </div>

        <Button asChild size="icon-sm" variant="ghost">
          <a
            aria-label={`Open ${repository.full_name} on GitHub`}
            href={repository.html_url}
            rel="noreferrer"
            target="_blank"
          >
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-6 text-muted-foreground">
        {repository.description || "No description provided."}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <LanguageBadge language={repository.language} />
        <Badge className="border-border bg-muted/60 text-muted-foreground">
          <GitFork className="size-3" />
          Repo
        </Badge>
        <ReviewStatusBadge isConnected={Boolean(repository.isConnected)} />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
        <RepositorySignal
          icon={Star}
          label="Stars"
          value={repository.stargazers_count}
        />
        <RepositorySignal
          icon={ShieldCheck}
          label="Access"
          value={canConnect ? "Admin" : "Limited"}
        />
        <RepositorySignal
          icon={Clock3}
          label="Last sync"
          value={formatSyncedAt(repository)}
        />
      </div>

      <div className="mt-auto space-y-2 pt-5">
        <ConnectButton
          canConnect={canConnect}
          isConnected={Boolean(repository.isConnected)}
          isConnecting={isConnecting}
          repository={repository}
          onConnect={onConnect}
        />
        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            size="sm"
            variant="outline"
          >
            <a href={repository.html_url} rel="noreferrer" target="_blank">
              <Eye className="size-3.5" />
              View
            </a>
          </Button>
          <Button
            asChild={Boolean(repository.isConnected)}
            className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
            disabled={!repository.isConnected}
            size="sm"
            variant="outline"
          >
            {repository.isConnected ? (
              <Link href="/dashboard/reviews">
                <Bot className="size-3.5" />
                Start AI Review
              </Link>
            ) : (
              <>
                <Bot className="size-3.5" />
                Start AI Review
              </>
            )}
          </Button>
        </div>
      </div>
    </article>
  );
};

const RepositoryTable = ({
  connectingRepoId,
  repositories,
  onConnect,
}: {
  connectingRepoId: number | null;
  repositories: Repository[];
  onConnect: (repository: Repository) => void;
}) => {
  return (
    <div className="codehorse-panel overflow-hidden rounded-lg">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Repository</th>
              <th className="px-4 py-3 font-semibold">Language</th>
              <th className="px-4 py-3 font-semibold">Review Status</th>
              <th className="px-4 py-3 font-semibold">Last Synced</th>
              <th className="px-4 py-3 font-semibold">Signals</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {repositories.map((repository) => {
              const isConnecting = connectingRepoId === repository.id;
              const canConnect = Boolean(repository.canManageWebhooks);

              return (
                <tr
                  className="transition-colors hover:bg-muted/30"
                  key={repository.id}
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="rounded-lg border border-border bg-muted/60 p-2 text-primary">
                        <FolderGit2 className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-foreground">
                          {repository.name}
                        </div>
                        <div className="truncate text-xs text-muted-foreground">
                          {repository.full_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <LanguageBadge language={repository.language} />
                  </td>
                  <td className="px-4 py-4">
                    <ReviewStatusBadge
                      isConnected={Boolean(repository.isConnected)}
                    />
                  </td>
                  <td className="px-4 py-4 text-muted-foreground">
                    {formatSyncedAt(repository)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Star className="size-3.5" />
                        {repository.stargazers_count}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ShieldCheck className="size-3.5" />
                        {canConnect ? "Admin" : "Limited"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        asChild={Boolean(repository.isConnected)}
                        className="border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                        disabled={!repository.isConnected}
                        size="sm"
                        variant="outline"
                      >
                        {repository.isConnected ? (
                          <Link href="/dashboard/reviews">
                            <Bot className="size-3.5" />
                            Start
                          </Link>
                        ) : (
                          <>
                            <Bot className="size-3.5" />
                            Start
                          </>
                        )}
                      </Button>
                      <Button asChild size="sm" variant="ghost">
                        <a
                          href={repository.html_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="size-3.5" />
                          View
                        </a>
                      </Button>
                      <ConnectButton
                        canConnect={canConnect}
                        compact
                        isConnected={Boolean(repository.isConnected)}
                        isConnecting={isConnecting}
                        repository={repository}
                        onConnect={onConnect}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ConnectButton = ({
  canConnect,
  compact = false,
  isConnected,
  isConnecting,
  repository,
  onConnect,
}: {
  canConnect: boolean;
  compact?: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  repository: Repository;
  onConnect: (repository: Repository) => void;
}) => {
  return (
    <Button
      className={cn(
        "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90",
        compact ? "min-w-28" : "w-full",
      )}
      disabled={isConnected || !canConnect || isConnecting}
      onClick={() => onConnect(repository)}
      size={compact ? "sm" : "default"}
      type="button"
    >
      {isConnecting ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isConnected ? (
        <CheckCircle2 className="size-4" />
      ) : (
        <Zap className="size-4" />
      )}
      {isConnected
        ? "Connected"
        : !canConnect
          ? "Needs admin"
          : isConnecting
            ? "Connecting..."
            : compact
              ? "Connect"
              : "Connect for AI Review"}
    </Button>
  );
};

const LanguageBadge = ({ language }: { language: string | null }) => {
  const label = language || "Unknown";

  return (
    <Badge className="border-border bg-muted/60 text-foreground">
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: languageColors[label] || "var(--chart-3)" }}
      />
      {label}
    </Badge>
  );
};

const ReviewStatusBadge = ({ isConnected }: { isConnected: boolean }) => {
  return isConnected ? (
    <Badge className="border-success/20 bg-success/10 text-success">
      <CheckCircle2 className="size-3" />
      Connected
    </Badge>
  ) : (
    <Badge className="border-warning/20 bg-warning/10 text-warning">
      <CircleDot className="size-3" />
      Not connected
    </Badge>
  );
};

const RepositorySignal = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-2">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3" />
        {label}
      </div>
      <div className="mt-1 truncate font-medium text-foreground">{value}</div>
    </div>
  );
};

const ReviewOnboardingCard = ({
  onConnectRepository,
}: {
  onConnectRepository: () => void;
}) => {
  return (
    <section className="codehorse-panel-strong overflow-hidden rounded-lg p-5">
      <div className="codehorse-brand-gradient flex size-12 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
        <Rocket className="size-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold tracking-normal text-foreground">
        Start your first AI code review
      </h2>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Connect a repository to generate AI-powered feedback on pull requests,
        code quality, and maintainability.
      </p>
      <div className="mt-5 grid gap-2">
        <Button
          className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
          onClick={onConnectRepository}
          type="button"
        >
          <Sparkles className="size-4" />
          Connect Repository
        </Button>
        <Button
          asChild
          className="border-border bg-card/70 text-foreground hover:bg-muted"
          variant="outline"
        >
          <Link href="/dashboard/reviews">
            Learn how reviews work
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

const WorkspaceInsights = ({
  hasPythonRepo,
  javascriptCount,
  notConnectedCount,
  totalRepositories,
}: {
  hasPythonRepo: boolean;
  javascriptCount: number;
  notConnectedCount: number;
  totalRepositories: number;
}) => {
  const insights = [
    {
      label: "GitHub sync is active",
      value: "Live",
      icon: RefreshCw,
      tone: "text-success",
    },
    {
      label: `${totalRepositories || 0} repositories detected`,
      value: "Indexed",
      icon: FolderGit2,
      tone: "text-primary",
    },
    {
      label:
        notConnectedCount > 0
          ? "No repositories connected for AI review yet"
          : "AI review connections are active",
      value: `${notConnectedCount} pending`,
      icon: Bot,
      tone: "text-warning",
    },
    {
      label:
        javascriptCount > 0
          ? "JavaScript appears most frequently"
          : "Language mix detected",
      value: `${javascriptCount} repos`,
      icon: Code2,
      tone: "text-chart-3",
    },
    {
      label: hasPythonRepo
        ? "Python repository detected for AI review setup"
        : "Python setup available when detected",
      value: hasPythonRepo ? "Ready" : "Waiting",
      icon: GitBranch,
      tone: "text-success",
    },
  ];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Workspace Insights
        </p>
        <h2 className="mt-2 text-lg font-semibold text-foreground">
          Repository signals
        </h2>
      </div>

      <div className="mt-5 space-y-3">
        {insights.map((insight) => (
          <div
            className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3"
            key={insight.label}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-lg border border-border bg-card p-2">
                <insight.icon className={cn("size-4", insight.tone)} />
              </div>
              <p className="min-w-0 text-sm leading-5 text-muted-foreground">
                {insight.label}
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium text-foreground">
              {insight.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

const OperationalStatusCard = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            System status
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Token-backed analytics enabled
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/20">
          <ShieldCheck className="size-5" />
        </span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-muted">
        <div className="h-full w-full rounded-full bg-gradient-to-r from-success via-primary to-chart-3" />
      </div>
      <div className="mt-3 flex items-center gap-2 text-xs text-success">
        <span className="size-1.5 animate-pulse rounded-full bg-success" />
        All systems operational
      </div>
    </section>
  );
};

const RepositoryLoadingState = ({ viewMode }: { viewMode: ViewMode }) => {
  if (viewMode === "table") {
    return (
      <div className="codehorse-panel rounded-lg p-4">
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton className="h-14 w-full" key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="codehorse-panel rounded-lg p-4" key={index}>
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
            </div>
          </div>
          <Skeleton className="mt-6 h-12 w-full" />
          <div className="mt-5 grid grid-cols-3 gap-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="mt-5 h-9 w-full" />
        </div>
      ))}
    </div>
  );
};

const EmptyRepositoryState = ({
  onFocusSearch,
}: {
  onFocusSearch: () => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-muted text-primary">
        <Search className="size-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">
        No repositories found
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Adjust your search or filters to find the repository you want to connect
        for AI-powered review.
      </p>
      <Button className="mt-5" onClick={onFocusSearch} type="button">
        Refine search
      </Button>
    </section>
  );
};

const ErrorState = () => {
  return (
    <section className="codehorse-panel rounded-lg p-10 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-danger/10 text-danger">
        <ShieldCheck className="size-5" />
      </div>
      <h2 className="mt-5 text-xl font-semibold text-foreground">
        Could not load repositories
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Please check your GitHub connection and sync again.
      </p>
    </section>
  );
};

const getRepoTimestamp = (repository: Repository) => {
  const rawDate = repository.pushed_at || repository.updated_at;
  const timestamp = rawDate ? new Date(rawDate).getTime() : 0;
  return Number.isNaN(timestamp) ? 0 : timestamp;
};

const formatSyncedAt = (repository: Repository) => {
  const timestamp = getRepoTimestamp(repository);

  if (!timestamp) {
    return "Just now";
  }

  const diffMs = Date.now() - timestamp;
  const diffDays = Math.max(0, Math.floor(diffMs / 86_400_000));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1d ago";
  if (diffDays < 30) return `${diffDays}d ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "1mo ago";
  if (diffMonths < 12) return `${diffMonths}mo ago`;

  const diffYears = Math.floor(diffMonths / 12);
  return diffYears === 1 ? "1y ago" : `${diffYears}y ago`;
};

export default RepositoryPage;
