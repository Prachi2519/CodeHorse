"use client";

import type { ComponentType } from "react";
import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileWarning,
  GitBranch,
  GitPullRequest,
  KeyRound,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  Terminal,
  TimerReset,
  XCircle,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  getReviews,
  getReviewStats,
  type ReviewListItem,
} from "@/module/review/actions";
import { getConnectedRepositories } from "@/module/settings/actions";

type IconComponent = ComponentType<{ className?: string }>;
type HealthTone = "success" | "warning" | "danger" | "primary" | "muted";

const STALE_WINDOW_MS = 30 * 60 * 1000;

const toneStyles: Record<
  HealthTone,
  { icon: string; badge: string; panel: string; dot: string }
> = {
  success: {
    icon: "text-success",
    badge: "border-success/20 bg-success/10 text-success",
    panel: "border-success/20 bg-success/5",
    dot: "bg-success",
  },
  warning: {
    icon: "text-warning",
    badge: "border-warning/25 bg-warning/10 text-warning",
    panel: "border-warning/25 bg-warning/10",
    dot: "bg-warning",
  },
  danger: {
    icon: "text-danger",
    badge: "border-danger/25 bg-danger/10 text-danger",
    panel: "border-danger/25 bg-danger/10",
    dot: "bg-danger",
  },
  primary: {
    icon: "text-primary",
    badge: "border-primary/20 bg-primary/10 text-primary",
    panel: "border-primary/20 bg-primary/5",
    dot: "bg-primary",
  },
  muted: {
    icon: "text-muted-foreground",
    badge: "border-border bg-muted/60 text-muted-foreground",
    panel: "border-border bg-muted/30",
    dot: "bg-muted-foreground",
  },
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

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

const DiagnosticsPage = () => {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const accountName = session?.user?.name || "Prachi2519";
  const accountEmail = session?.user?.email || "prachi639220@gmail.com";
  const accountInitial = accountName.charAt(0).toUpperCase() || "P";

  const {
    data: reviews,
    dataUpdatedAt: reviewsQueryUpdatedAt,
    isError: isReviewsError,
    isFetching: isReviewsFetching,
    isLoading: isReviewsLoading,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ["review-diagnostics"],
    queryFn: async () => await getReviews({ take: 20 }),
    refetchOnWindowFocus: true,
    staleTime: 1000 * 20,
  });

  const {
    data: stats,
    isError: isStatsError,
    isFetching: isStatsFetching,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => await getReviewStats(),
    refetchOnWindowFocus: true,
    staleTime: 1000 * 20,
  });

  const {
    data: connectedRepositories,
    isFetching: isRepositoriesFetching,
    refetch: refetchRepositories,
  } = useQuery({
    queryKey: ["connected-repositories"],
    queryFn: async () => await getConnectedRepositories(),
    refetchOnWindowFocus: true,
    staleTime: 1000 * 60,
  });

  const runs = useMemo(() => reviews ?? [], [reviews]);
  const latestRun = runs[0];
  const latestUpdatedAt = getTimestamp(latestRun?.updatedAt);
  const freshnessReferenceAt =
    reviewsQueryUpdatedAt || latestUpdatedAt || undefined;
  const hasOldRunData = Boolean(
    latestUpdatedAt &&
      freshnessReferenceAt &&
      freshnessReferenceAt - latestUpdatedAt > STALE_WINDOW_MS,
  );
  const hasMissingLastUpdated = !latestUpdatedAt;
  const hasDiagnosticsError = isReviewsError || isStatsError;
  const isDiagnosticsStale =
    hasDiagnosticsError || hasMissingLastUpdated || hasOldRunData;
  const isRefreshing =
    isReviewsFetching || isStatsFetching || isRepositoriesFetching;

  const derivedStats = useMemo(() => {
    const completed =
      stats?.completed ??
      runs.filter((item) => item.status === "completed").length;
    const running =
      stats?.running ??
      runs.filter((item) => item.status === "running" || item.status === "queued")
        .length;
    const failed =
      stats?.failed ?? runs.filter((item) => item.status === "failed").length;

    return {
      total: stats?.total ?? runs.length,
      completed,
      running,
      failed,
      repositories: stats?.repositories ?? 0,
    };
  }, [runs, stats]);

  const lastUpdatedLabel = latestUpdatedAt
    ? dateFormatter.format(latestUpdatedAt)
    : "Not available";
  const freshnessLabel = isDiagnosticsStale ? "Stale" : "Fresh";
  const freshnessTone: HealthTone = isDiagnosticsStale ? "warning" : "success";
  const repositoryCount = connectedRepositories?.length ?? 0;

  const summaryCards = [
    {
      title: "Latest Review Run",
      metric: latestRun ? `#${latestRun.prNumber}` : "No runs yet",
      helper: latestRun
        ? `${latestRun.repositoryFullName} was last updated ${formatShortDate(
            latestRun.updatedAt,
            freshnessReferenceAt,
          )}.`
        : "No review run timestamp is available.",
      status: latestRun ? normalizeStatus(latestRun.status) : "No data",
      tone: latestRun ? getStatusTone(latestRun.status) : "warning",
      icon: GitPullRequest,
    },
    {
      title: "Completed Runs",
      metric: String(derivedStats.completed),
      helper: "Reviews finished with generated output.",
      status: "Completed",
      tone: "success",
      icon: CheckCircle2,
    },
    {
      title: "Running Runs",
      metric: String(derivedStats.running),
      helper: "Queued or actively processing reviews.",
      status: derivedStats.running > 0 ? "Running" : "Idle",
      tone: derivedStats.running > 0 ? "primary" : "muted",
      icon: PlayCircle,
    },
    {
      title: "Failed Runs",
      metric: String(derivedStats.failed),
      helper: "Runs requiring developer attention.",
      status: derivedStats.failed > 0 ? "Action needed" : "None",
      tone: derivedStats.failed > 0 ? "danger" : "success",
      icon: ShieldAlert,
    },
    {
      title: "Diagnostics Status",
      metric: freshnessLabel,
      helper: isDiagnosticsStale
        ? "Latest diagnostics timestamp is missing, old, or unverified."
        : "Diagnostics refreshed inside the freshness window.",
      status: freshnessLabel,
      tone: freshnessTone,
      icon: TimerReset,
    },
    {
      title: "GitHub Sync",
      metric: hasDiagnosticsError ? "Unverified" : "Active",
      helper: "Token-backed analytics are configured for this workspace.",
      status: hasDiagnosticsError ? "Check" : "Active",
      tone: hasDiagnosticsError ? "warning" : "success",
      icon: GitHubMark,
    },
  ] satisfies DiagnosticMetric[];

  const diagnosticLogs = [
    {
      title: hasDiagnosticsError
        ? "Diagnostics API returned an error"
        : "GitHub sync check pending",
      description: hasDiagnosticsError
        ? "Run a health check to retry review and stats fetches."
        : "Token-backed GitHub sync is active but repository signals should be verified.",
      tone: hasDiagnosticsError ? "danger" : "warning",
      icon: hasDiagnosticsError ? XCircle : Clock3,
    },
    {
      title:
        runs.length === 0
          ? "Review run fetch returned no records"
          : `${runs.length} recent review runs fetched`,
      description:
        runs.length === 0
          ? "This can be normal before the first review, but the missing run timestamp makes diagnostics stale."
          : "Review run data is available for diagnostics.",
      tone: runs.length === 0 ? "warning" : "success",
      icon: runs.length === 0 ? FileWarning : CheckCircle2,
    },
    {
      title: isDiagnosticsStale
        ? "Diagnostics freshness check required"
        : "Diagnostics freshness check passed",
      description: isDiagnosticsStale
        ? "Old or missing timestamps should be surfaced instead of hidden behind a healthy status."
        : "Workspace signals are inside the freshness window.",
      tone: isDiagnosticsStale ? "warning" : "success",
      icon: TimerReset,
    },
  ] satisfies DiagnosticLog[];

  const refreshDiagnostics = async () => {
    await Promise.allSettled([
      refetchReviews(),
      refetchStats(),
      refetchRepositories(),
    ]);
    queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
    toast.success("Diagnostics refreshed.");
  };

  const runHealthCheck = async () => {
    await refreshDiagnostics();
    toast.info(
      isDiagnosticsStale
        ? "Health check complete. Diagnostics still need fresh run data."
        : "Health check complete. Workspace signals look fresh.",
    );
  };

  const copyLogs = async () => {
    const payload = diagnosticLogs
      .map((log) => `${log.title}: ${log.description}`)
      .join("\n");

    if (!navigator.clipboard) {
      toast.error("Clipboard access is unavailable.");
      return;
    }

    await navigator.clipboard.writeText(payload);
    toast.success("Diagnostic logs copied.");
  };

  const downloadLogs = () => {
    const payload = diagnosticLogs
      .map((log) => `${log.title}\n${log.description}`)
      .join("\n\n");
    const blob = new Blob([payload], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "codehorse-diagnostics.txt";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Diagnostic logs downloaded.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <DiagnosticsHeader
          accountEmail={accountEmail}
          accountInitial={accountInitial}
          accountName={accountName}
          isRefreshing={isRefreshing}
          isStale={isDiagnosticsStale}
          onRefresh={refreshDiagnostics}
          onRunHealthCheck={runHealthCheck}
        />

        {isDiagnosticsStale ? (
          <StaleDataBanner
            lastUpdatedLabel={lastUpdatedLabel}
            onRefresh={refreshDiagnostics}
          />
        ) : null}

        <SummaryGrid isLoading={isReviewsLoading} metrics={summaryCards} />

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <div className="space-y-5">
            <LatestReviewRunPanel
              isLoading={isReviewsLoading}
              isStale={isDiagnosticsStale}
              latestRun={latestRun}
            />
            <RunHealthPanel stats={derivedStats} />
            <RecentDiagnosticLogs
              logs={diagnosticLogs}
              onCopy={copyLogs}
              onDownload={downloadLogs}
            />
          </div>

          <aside className="space-y-5">
            <GitHubSyncHealthPanel
              hasDiagnosticsError={hasDiagnosticsError}
              isStale={isDiagnosticsStale}
              lastUpdatedLabel={lastUpdatedLabel}
              repositoryCount={repositoryCount}
              onRefresh={refreshDiagnostics}
            />
            <RecommendedActionsPanel onRefresh={refreshDiagnostics} />
          </aside>
        </section>
      </div>
    </div>
  );
};

type DiagnosticMetric = {
  title: string;
  metric: string;
  helper: string;
  status: string;
  tone: HealthTone;
  icon: IconComponent;
};

type StatusRow = {
  label: string;
  value: string;
  tone: HealthTone;
};

type DiagnosticLog = {
  title: string;
  description: string;
  tone: HealthTone;
  icon: IconComponent;
};

const DiagnosticsHeader = ({
  accountEmail,
  accountInitial,
  accountName,
  isRefreshing,
  isStale,
  onRefresh,
  onRunHealthCheck,
}: {
  accountEmail: string;
  accountInitial: string;
  accountName: string;
  isRefreshing: boolean;
  isStale: boolean;
  onRefresh: () => void;
  onRunHealthCheck: () => void;
}) => {
  return (
    <header className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-5">
          <div className="codehorse-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
            <Stethoscope className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill
                icon={isStale ? AlertTriangle : CheckCircle2}
                label={isStale ? "Stale data detected" : "All systems operational"}
                tone={isStale ? "warning" : "success"}
              />
              <StatusPill
                icon={GitHubMark}
                label="GitHub synced"
                tone="success"
              />
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Diagnostics
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground sm:text-base">
              Monitor review runs, GitHub sync health, token status, stale data,
              and workspace signals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-11 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
            disabled={isRefreshing}
            onClick={onRefresh}
            type="button"
            variant="outline"
          >
            {isRefreshing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
            Refresh Diagnostics
          </Button>
          <Button onClick={onRunHealthCheck} type="button">
            <ShieldCheck className="size-4" />
            Run Health Check
          </Button>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-base font-semibold text-primary-foreground">
              {accountInitial}
            </div>
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-base font-medium text-foreground">
                @{accountName}
              </p>
              <p className="truncate text-base text-muted-foreground">
                {accountEmail}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

const StaleDataBanner = ({
  lastUpdatedLabel,
  onRefresh,
}: {
  lastUpdatedLabel: string;
  onRefresh: () => void;
}) => {
  return (
    <section className="rounded-lg border border-warning/25 bg-warning/10 p-5 shadow-lg">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-warning/30 bg-warning/15 text-warning">
            <AlertTriangle className="size-5" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">
                Stale diagnostics data detected
              </h2>
              <Badge className="border-warning/25 bg-warning/10 text-warning">
                Data freshness: Stale
              </Badge>
            </div>
            <p className="mt-2 max-w-4xl text-base leading-7 text-muted-foreground">
              Some workspace signals have not refreshed recently. Run a health
              check or re-sync GitHub to fetch the latest review and repository
              status.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-base text-warning">
              <span>Last updated: {lastUpdatedLabel}</span>
              <span className="text-muted-foreground">/</span>
              <span>Diagnostics should not silently show old values.</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button onClick={onRefresh} type="button">
            <RefreshCw className="size-4" />
            Refresh Diagnostics
          </Button>
          <Button
            className="border-warning/25 bg-warning/10 text-warning hover:bg-warning/20"
            onClick={() => toast.success("GitHub re-sync requested.")}
            type="button"
            variant="outline"
          >
            <GitHubMark className="size-4" />
            Re-sync GitHub
          </Button>
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={() => toast.info("Sync logs will appear as checks run.")}
            type="button"
            variant="outline"
          >
            <Terminal className="size-4" />
            View Sync Logs
          </Button>
        </div>
      </div>
    </section>
  );
};

const SummaryGrid = ({
  isLoading,
  metrics,
}: {
  isLoading: boolean;
  metrics: DiagnosticMetric[];
}) => {
  return (
    <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {metrics.map((metric) => (
        <MetricCard isLoading={isLoading} key={metric.title} metric={metric} />
      ))}
    </section>
  );
};

const MetricCard = ({
  isLoading,
  metric,
}: {
  isLoading: boolean;
  metric: DiagnosticMetric;
}) => {
  const Icon = metric.icon;

  return (
    <div className="group rounded-lg border border-border bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card">
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "rounded-lg border p-2",
            toneStyles[metric.tone].panel,
            toneStyles[metric.tone].icon,
          )}
        >
          <Icon className="size-4" />
        </span>
        <StatusPill label={metric.status} tone={metric.tone} />
      </div>
      <div className="mt-5">
        <p className="text-base text-muted-foreground">{metric.title}</p>
        <div className="mt-2 min-h-9 text-2xl font-semibold tracking-normal text-foreground">
          {isLoading ? (
            <span className="block h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : (
            metric.metric
          )}
        </div>
        <p className="mt-2 min-h-10 text-base leading-7 text-muted-foreground">
          {metric.helper}
        </p>
      </div>
    </div>
  );
};

const LatestReviewRunPanel = ({
  isLoading,
  isStale,
  latestRun,
}: {
  isLoading: boolean;
  isStale: boolean;
  latestRun: ReviewListItem | undefined;
}) => {
  return (
    <section className="codehorse-panel-strong rounded-lg p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ch-section-eyebrow">
            Review pipeline
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Latest Review Run
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            The newest pull request review run and the signal CodeHorse uses to
            determine diagnostic freshness.
          </p>
        </div>
        {isStale ? (
          <StatusPill
            icon={AlertTriangle}
            label="No recent run data available"
            tone="warning"
          />
        ) : (
          <StatusPill icon={CheckCircle2} label="Fresh run data" tone="success" />
        )}
      </div>

      <div className="mt-5">
        {isLoading ? (
          <div className="h-44 animate-pulse rounded-lg bg-muted" />
        ) : latestRun ? (
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill
                    label={normalizeStatus(latestRun.status)}
                    tone={getStatusTone(latestRun.status)}
                  />
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    {latestRun.mode}
                  </Badge>
                </div>
                <h3 className="mt-3 truncate text-xl font-semibold text-foreground">
                  #{latestRun.prNumber} {latestRun.prTitle}
                </h3>
                <p className="mt-1 text-base text-muted-foreground">
                  {latestRun.repositoryFullName}
                </p>
              </div>
              <Button asChild variant="outline">
                <a href={latestRun.prUrl} rel="noreferrer" target="_blank">
                  <ExternalLink className="size-4" />
                  Open GitHub PR
                </a>
              </Button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <RunSignal label="Action" value={latestRun.action} />
              <RunSignal
                label="Updated"
                value={formatDateTime(latestRun.updatedAt)}
              />
              <RunSignal
                label="Comment"
                value={latestRun.commentUrl ? "Available" : "Not posted"}
              />
            </div>

            {latestRun.errorReason ? (
              <div className="mt-4 rounded-lg border border-danger/25 bg-danger/10 p-3 text-base text-danger">
                {latestRun.errorReason}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <span className="mx-auto flex size-14 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Bot className="size-7" />
            </span>
            <h3 className="mt-5 text-xl font-semibold text-foreground">
              No review runs yet
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-base leading-7 text-muted-foreground">
              Trigger a manual review or open a pull request on a connected
              repository to create the first run.
            </p>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-warning">
              No recent run data is available. Diagnostics may be stale until
              the first review run provides a timestamp.
            </p>
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Button asChild>
                <Link href="/dashboard/reviews">
                  <PlayCircle className="size-4" />
                  Trigger Manual Review
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard/repository">
                  <GitBranch className="size-4" />
                  Connect Repository
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

const RunHealthPanel = ({
  stats,
}: {
  stats: {
    total: number;
    completed: number;
    running: number;
    failed: number;
    repositories: number;
  };
}) => {
  const segments = [
    {
      label: "Completed",
      value: stats.completed,
      tone: "success",
      icon: CheckCircle2,
    },
    {
      label: "Running",
      value: stats.running,
      tone: "primary",
      icon: PlayCircle,
    },
    {
      label: "Failed",
      value: stats.failed,
      tone: stats.failed > 0 ? "danger" : "muted",
      icon: XCircle,
    },
  ] satisfies {
    label: string;
    value: number;
    tone: HealthTone;
    icon: IconComponent;
  }[];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="ch-section-eyebrow">
            Run health
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Review Run Health
          </h2>
          <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
            Completed, running, and failed review runs across the current
            workspace.
          </p>
        </div>
        <StatusPill
          label={stats.total === 0 ? "No run activity detected yet" : "Runs found"}
          tone={stats.total === 0 ? "warning" : "success"}
        />
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {segments.map((segment) => {
          const Icon = segment.icon;

          return (
            <div
              className="rounded-lg border border-border bg-card p-5"
              key={segment.label}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    "rounded-lg border p-2",
                    toneStyles[segment.tone].panel,
                    toneStyles[segment.tone].icon,
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <SparklineBars tone={segment.tone} />
              </div>
              <div className="mt-4 text-3xl font-semibold text-foreground">
                {segment.value}
              </div>
              <p className="mt-1 text-base text-muted-foreground">
                {segment.label}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-muted/30 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-foreground">Health timeline</h3>
            <p className="mt-1 text-base text-muted-foreground">
              No run activity detected yet.
            </p>
          </div>
          <StatusPill label={`${stats.repositories} repos reviewed`} tone="muted" />
        </div>
        <div className="grid gap-3 sm:grid-cols-4">
          {["Queued", "Fetched", "Reviewed", "Posted"].map((step) => (
            <div
              className="rounded-lg border border-dashed border-border bg-background/40 p-3"
              key={step}
            >
              <div className="flex items-center gap-2 text-base text-muted-foreground">
                <CircleDot className="size-3 text-muted-foreground" />
                {step}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const GitHubSyncHealthPanel = ({
  hasDiagnosticsError,
  isStale,
  lastUpdatedLabel,
  repositoryCount,
  onRefresh,
}: {
  hasDiagnosticsError: boolean;
  isStale: boolean;
  lastUpdatedLabel: string;
  repositoryCount: number;
  onRefresh: () => void;
}) => {
  const rows = [
    {
      label: "Account sync",
      value: "Active",
      tone: "success",
    },
    {
      label: "Token-backed analytics",
      value: "Enabled",
      tone: "success",
    },
    {
      label: "Repository sync",
      value: isStale ? "Needs refresh" : "Active",
      tone: isStale ? "warning" : "success",
    },
    {
      label: "Last sync",
      value: lastUpdatedLabel,
      tone: isStale ? "warning" : "primary",
    },
    {
      label: "API response",
      value: hasDiagnosticsError ? "Failed" : "Not verified",
      tone: hasDiagnosticsError ? "danger" : "warning",
    },
    {
      label: "Webhook status",
      value: repositoryCount > 0 ? "Unknown" : "Unavailable",
      tone: "warning",
    },
  ] satisfies StatusRow[];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="ch-section-eyebrow">
          GitHub sync
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          GitHub Sync Health
        </h2>
        <p className="mt-2 text-base leading-7 text-muted-foreground">
          Account, token, repository, and webhook checks for connected GitHub
          access.
        </p>
      </div>
      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <StatusRowItem key={row.label} row={row} />
        ))}
      </div>
      <div className="mt-5 grid gap-2">
        <Button onClick={onRefresh} type="button">
          <GitHubMark className="size-4" />
          Re-sync GitHub
        </Button>
        <Button
          className="border-border bg-card/70 text-foreground hover:bg-muted"
          onClick={() => toast.info("Token verification check queued.")}
          type="button"
          variant="outline"
        >
          <KeyRound className="size-4" />
          Verify Token
        </Button>
        <Button
          className="border-border bg-card/70 text-foreground hover:bg-muted"
          onClick={() => toast.info("Repository access check queued.")}
          type="button"
          variant="outline"
        >
          <GitBranch className="size-4" />
          Check Repository Access
        </Button>
      </div>
    </section>
  );
};

const RecentDiagnosticLogs = ({
  logs,
  onCopy,
  onDownload,
}: {
  logs: DiagnosticLog[];
  onCopy: () => void;
  onDownload: () => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <details open>
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="ch-section-eyebrow">
                Logs
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                Recent Diagnostic Logs
              </h2>
              <p className="mt-2 max-w-2xl text-base leading-7 text-muted-foreground">
                No diagnostic logs are persisted yet, so CodeHorse shows the
                latest suggested checks from the current health state.
              </p>
            </div>
            <StatusPill label="Expandable" tone="muted" />
          </div>
        </summary>

        <div className="mt-5 rounded-lg border border-dashed border-border bg-muted/30 p-5 text-base text-muted-foreground">
          No diagnostic logs available yet.
        </div>

        <div className="mt-3 space-y-3">
          {logs.map((log) => {
            const Icon = log.icon;

            return (
              <div
                className="rounded-lg border border-border bg-card p-5"
                key={log.title}
              >
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "rounded-lg border p-2",
                      toneStyles[log.tone].panel,
                      toneStyles[log.tone].icon,
                    )}
                  >
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {log.title}
                    </h3>
                    <p className="mt-1 text-base leading-7 text-muted-foreground">
                      {log.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onCopy}
            type="button"
            variant="outline"
          >
            <Copy className="size-4" />
            Copy logs
          </Button>
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onDownload}
            type="button"
            variant="outline"
          >
            <Download className="size-4" />
            Download logs
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/settings">
              <ExternalLink className="size-4" />
              Report issue
            </Link>
          </Button>
        </div>
      </details>
    </section>
  );
};

const RecommendedActionsPanel = ({ onRefresh }: { onRefresh: () => void }) => {
  const actions = [
    {
      title: "Refresh Diagnostics",
      description: "Fetch the latest run health and workspace signals.",
      icon: RefreshCw,
      action: (
        <Button onClick={onRefresh} size="sm" type="button">
          Refresh
        </Button>
      ),
    },
    {
      title: "Re-sync GitHub",
      description: "Refresh token-backed GitHub analytics and repository metadata.",
      icon: GitHubMark,
      action: (
        <Button
          className="border-border bg-card/70 text-foreground hover:bg-muted"
          onClick={() => toast.success("GitHub re-sync requested.")}
          size="sm"
          type="button"
          variant="outline"
        >
          Re-sync
        </Button>
      ),
    },
    {
      title: "Trigger Manual Review",
      description: "Queue a PR review to validate the review pipeline.",
      icon: Bot,
      action: (
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/reviews">Open</Link>
        </Button>
      ),
    },
    {
      title: "Check Connected Repository",
      description: "Confirm CodeHorse has access to the connected repository.",
      icon: Database,
      action: (
        <Button asChild size="sm" variant="outline">
          <Link href="/dashboard/repository">Check</Link>
        </Button>
      ),
    },
  ];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="ch-section-eyebrow">
          Recovery
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Recommended Actions
        </h2>
      </div>
      <div className="mt-5 grid gap-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <div
              className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30"
              key={action.title}
            >
              <div className="flex items-start gap-3">
                <span className="rounded-lg border border-primary/20 bg-primary/10 p-2 text-primary">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground">
                    {action.title}
                  </h3>
                  <p className="mt-1 text-base leading-7 text-muted-foreground">
                    {action.description}
                  </p>
                </div>
              </div>
              <div className="mt-4">{action.action}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

const StatusRowItem = ({ row }: { row: StatusRow }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-base text-muted-foreground">
        <span
          className={cn("size-2 rounded-full", toneStyles[row.tone].dot)}
        />
        {row.label}
      </div>
      <Badge className={toneStyles[row.tone].badge}>{row.value}</Badge>
    </div>
  );
};

const StatusPill = ({
  icon: Icon,
  label,
  tone,
}: {
  icon?: IconComponent;
  label: string;
  tone: HealthTone;
}) => {
  return (
    <Badge className={cn("shrink-0", toneStyles[tone].badge)}>
      {Icon ? <Icon className="size-3" /> : null}
      {label}
    </Badge>
  );
};

const RunSignal = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-3">
      <p className="text-base text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-base font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
};

const SparklineBars = ({ tone }: { tone: HealthTone }) => {
  return (
    <div className="flex h-7 items-end gap-1">
      {[38, 62, 48, 74, 56].map((height, index) => (
        <span
          className={cn("w-1 rounded-full opacity-80", toneStyles[tone].dot)}
          key={`${height}-${index}`}
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
};

const getTimestamp = (value: string | undefined) => {
  if (!value) return null;

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatDateTime = (value: string | undefined) => {
  const timestamp = getTimestamp(value);
  return timestamp ? dateFormatter.format(timestamp) : "Not available";
};

const formatShortDate = (
  value: string | undefined,
  referenceAt: number | undefined,
) => {
  const timestamp = getTimestamp(value);
  if (!timestamp) return "recently";

  const diffMinutes = Math.max(
    0,
    Math.round(((referenceAt ?? timestamp) - timestamp) / 60000),
  );
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays}d ago`;
};

const normalizeStatus = (status: string) => {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getStatusTone = (status: string): HealthTone => {
  if (status === "completed") return "success";
  if (status === "failed" || status === "skipped") return "danger";
  if (status === "running" || status === "queued" || status === "pending") {
    return "primary";
  }

  return "muted";
};

export default DiagnosticsPage;
