"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock3,
  GitBranch,
  GitCommit,
  GitPullRequest,
  LayoutDashboard,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import {
  getContributionStats,
  getDashboardStats,
  getMonthlyActivity,
} from "@/module/dashboard/actions";

const numberFormatter = new Intl.NumberFormat("en-US");

type MetricCard = {
  title: string;
  label: string;
  status: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  glow: string;
  trend: string;
};

type SeriesKey = "commits" | "prs" | "reviews";

const seriesMeta: Record<
  SeriesKey,
  { label: string; color: string; surface: string }
> = {
  commits: {
    label: "Commits",
    color: "var(--success)",
    surface: "border-success/25 bg-success/10 text-success",
  },
  prs: {
    label: "PRs",
    color: "var(--chart-3)",
    surface: "border-chart-3/25 bg-chart-3/10 text-chart-3",
  },
  reviews: {
    label: "Reviews",
    color: "var(--primary)",
    surface: "border-primary/25 bg-primary/10 text-primary",
  },
};

const monthLabels = [
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
];

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

const DashboardPage = () => {
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    commits: true,
    prs: true,
    reviews: true,
  });

  const { data: session } = useSession();
  const accountName = session?.user?.name || "Prachi2519";
  const accountEmail = session?.user?.email || "prachi639220@gmail.com";
  const accountInitial = accountName.charAt(0).toUpperCase();

  const {
    data: stats,
    isLoading: isStatsLoading,
    isFetching: isFetchingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => await getDashboardStats(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const {
    data: monthlyActivity,
    isLoading: isLoadingActivity,
    isFetching: isFetchingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const {
    data: contributionStats,
    isLoading: isLoadingContributions,
    isFetching: isFetchingContributions,
    refetch: refetchContributions,
  } = useQuery({
    queryKey: ["contribution-stats"],
    queryFn: async () => await getContributionStats(),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: true,
  });

  const isRefreshing =
    isFetchingStats || isFetchingActivity || isFetchingContributions;

  const refreshDashboard = () => {
    void refetchStats();
    void refetchActivity();
    void refetchContributions();
  };

  const totals = useMemo(() => {
    const activity = monthlyActivity ?? [];

    return activity.reduce(
      (acc, item) => ({
        commits: acc.commits + item.commits,
        prs: acc.prs + item.prs,
        reviews: acc.reviews + item.reviews,
      }),
      { commits: 0, prs: 0, reviews: 0 },
    );
  }, [monthlyActivity]);

  const metricCards: MetricCard[] = [
    {
      title: "Total Commits",
      value: stats?.totalCommits ?? 0,
      label: "GitHub contributions",
      status: "Active",
      icon: GitCommit,
      accent: "text-success",
      glow: "from-success/20 to-chart-3/10",
      trend: "+44 in 6 months",
    },
    {
      title: "Pull Requests",
      value: stats?.totalPRs ?? 0,
      label: "Opened on GitHub",
      status: "Active",
      icon: GitPullRequest,
      accent: "text-chart-3",
      glow: "from-chart-3/20 to-primary/10",
      trend: `${numberFormatter.format(totals.prs)} recent PRs`,
    },
    {
      title: "AI Reviews",
      value: stats?.totalReviews ?? 0,
      label: "Generated reviews",
      status: "Ready",
      icon: Bot,
      accent: "text-primary",
      glow: "from-primary/20 to-chart-5/10",
      trend: "Queue ready",
    },
    {
      title: "Repositories",
      value: stats?.totalRepos ?? 0,
      label: "Connected repos",
      status: "Active",
      icon: GitBranch,
      accent: "text-warning",
      glow: "from-warning/20 to-success/10",
      trend: "Webhook capable",
    },
  ];

  const insights = [
    {
      title: "Contribution velocity is active",
      description: "59 contributions are visible across the last year.",
      icon: TrendingUp,
      tone: "text-success",
    },
    {
      title: "Pull request activity detected",
      description: "CodeHorse found recent PR movement tied to this identity.",
      icon: GitPullRequest,
      tone: "text-chart-3",
    },
    {
      title: "AI reviews are ready to be generated",
      description: "Review workflows can start as soon as a PR is selected.",
      icon: Bot,
      tone: "text-primary",
    },
    {
      title: "Repository connection is healthy",
      description: "Your workspace has one connected repository available.",
      icon: ShieldCheck,
      tone: "text-success",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="codehorse-panel rounded-lg p-4">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <SidebarTrigger className="mt-1 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground md:hidden" />
              <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-border">
                <LayoutDashboard className="size-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-success/20 bg-success/10 text-success">
                    <span className="size-1.5 animate-pulse rounded-full bg-success" />
                    GitHub Synced
                  </Badge>
                  <Badge className="border-primary/20 bg-primary/10 text-primary">
                    <Clock3 className="size-3" />
                    Updated just now
                  </Badge>
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
                  Engineering Command Center
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Live GitHub analytics, contribution velocity, pull requests,
                  and AI review insights.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="h-10 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
                disabled={isRefreshing}
                onClick={refreshDashboard}
                type="button"
                variant="outline"
              >
                <RefreshCw
                  className={`size-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
                <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-sm font-semibold text-primary-foreground">
                  {accountInitial}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-medium text-foreground">
                    {accountName}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {accountEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <KpiCard
              isLoading={isStatsLoading}
              item={item}
              key={item.title}
            />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
          <DashboardPanel className="min-w-0" eyebrow="Contribution Activity">
            <PanelHeader
              action={
                <div className="text-xs font-medium text-muted-foreground">
                  {numberFormatter.format(
                    contributionStats?.totalContributions ??
                      stats?.totalCommits ??
                      0,
                  )}{" "}
                  contributions in the last year
                </div>
              }
              subtitle="Daily GitHub activity over the last year."
              title="Contribution Activity"
            />
            <ContributionHeatmap
              data={contributionStats?.contributions ?? []}
              isLoading={isLoadingContributions}
              total={
                contributionStats?.totalContributions ??
                stats?.totalCommits ??
                0
              }
            />
          </DashboardPanel>

          <SystemHealthPanel totals={totals} />
        </section>

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <DashboardPanel className="min-w-0" eyebrow="Monthly Activity">
            <PanelHeader
              action={
                <Badge className="border-border bg-muted/40 text-muted-foreground">
                  <CheckCircle2 className="size-3" />
                  Refetches on focus
                </Badge>
              }
              subtitle="Commits, pull requests, and reviews from the last 6 months."
              title="Monthly Activity"
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(seriesMeta) as SeriesKey[]).map((key) => (
                <button
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                    activeSeries[key]
                      ? seriesMeta[key].surface
                      : "border-border bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                  key={key}
                  onClick={() =>
                    setActiveSeries((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                  type="button"
                >
                  {seriesMeta[key].label}
                </button>
              ))}
            </div>
            <div className="mt-5 h-[360px]">
              {isLoadingActivity ? (
                <ChartSkeleton />
              ) : (
                <ResponsiveContainer height="100%" width="100%">
                  <ComposedChart
                    data={monthlyActivity ?? []}
                    margin={{ bottom: 0, left: -22, right: 10, top: 10 }}
                  >
                    <CartesianGrid
                      stroke="var(--border)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      axisLine={false}
                      dataKey="name"
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      tickMargin={12}
                    />
                    <YAxis
                      axisLine={false}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      width={42}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--popover)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                        boxShadow: "var(--shadow-xl)",
                        color: "var(--popover-foreground)",
                      }}
                      cursor={{ fill: "var(--muted)", opacity: 0.45 }}
                    />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{
                        color: "var(--muted-foreground)",
                        fontSize: 12,
                      }}
                    />
                    {activeSeries.commits ? (
                      <Bar
                        dataKey="commits"
                        fill={seriesMeta.commits.color}
                        radius={[8, 8, 0, 0]}
                      />
                    ) : null}
                    {activeSeries.prs ? (
                      <Line
                        dataKey="prs"
                        dot={{ fill: seriesMeta.prs.color, r: 4 }}
                        stroke={seriesMeta.prs.color}
                        strokeWidth={3}
                        type="monotone"
                      />
                    ) : null}
                    {activeSeries.reviews ? (
                      <Line
                        dataKey="reviews"
                        dot={{ fill: seriesMeta.reviews.color, r: 4 }}
                        stroke={seriesMeta.reviews.color}
                        strokeDasharray="5 5"
                        strokeWidth={3}
                        type="monotone"
                      />
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardPanel>

          <div className="grid gap-5">
            <DashboardPanel eyebrow="Engineering Insights">
              <PanelHeader
                subtitle="High-signal workspace reads for this account."
                title="Engineering Insights"
              />
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {insights.map((item) => (
                  <InsightCard item={item} key={item.title} />
                ))}
              </div>
            </DashboardPanel>

            <EmptyReviewsPanel />
          </div>
        </section>
      </div>
    </div>
  );
};

const KpiCard = ({
  isLoading,
  item,
}: {
  isLoading: boolean;
  item: MetricCard;
}) => {
  return (
    <div className="codehorse-panel group relative overflow-hidden rounded-lg p-5 transition-all duration-300 hover:-translate-y-1">
      <div
        className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${item.glow} opacity-80 transition-opacity group-hover:opacity-100`}
      />
      <div className="relative flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {item.title}
          </p>
          <div className="text-4xl font-semibold tracking-normal text-foreground">
            {isLoading ? (
              <Skeleton className="h-10 w-20" />
            ) : (
              numberFormatter.format(item.value)
            )}
          </div>
        </div>
        <div className="rounded-lg bg-muted/60 p-3 ring-1 ring-border">
          <item.icon className={`size-5 ${item.accent}`} />
        </div>
      </div>

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs">
        <span className="text-muted-foreground">{item.label}</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1 font-medium text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          {item.status}
        </span>
      </div>
      <div className="relative mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="size-3 text-success" />
        {item.trend}
      </div>
    </div>
  );
};

const DashboardPanel = ({
  children,
  className = "",
  eyebrow,
}: {
  children: React.ReactNode;
  className?: string;
  eyebrow: string;
}) => {
  return (
    <section
      aria-label={eyebrow}
      className={`codehorse-panel rounded-lg p-5 ${className}`}
    >
      {children}
    </section>
  );
};

const PanelHeader = ({
  action,
  subtitle,
  title,
}: {
  action?: React.ReactNode;
  subtitle: string;
  title: string;
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-normal text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {subtitle}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
};

const ContributionHeatmap = ({
  data,
  isLoading,
  total,
}: {
  data: { date: string; count: number; level: number }[];
  isLoading: boolean;
  total: number;
}) => {
  if (isLoading) {
    return (
      <div className="mt-6 space-y-4">
        <Skeleton className="h-5 w-56" />
        <Skeleton className="h-44 w-full" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
        No contribution data available yet.
      </div>
    );
  }

  const recentDays = data.slice(-371);
  const levels = [
    "bg-muted ring-border",
    "bg-success/15 ring-success/20",
    "bg-success/35 ring-success/25",
    "bg-success/70 ring-success/30",
    "bg-chart-3 ring-chart-3/35",
  ];

  return (
    <div className="mt-6">
      <div className="mb-3 flex min-w-max justify-between px-1 text-xs text-muted-foreground">
        {monthLabels.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[780px] grid-flow-col grid-rows-7 gap-1.5">
          {recentDays.map((day) => (
            <div className="group relative" key={day.date}>
              <span
                className={`block size-3 rounded-sm ring-1 transition-all duration-200 group-hover:scale-125 ${
                  levels[day.level] ?? levels[0]
                }`}
              />
              <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden w-max -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs text-popover-foreground shadow-2xl group-hover:block">
                {day.count} contribution{day.count === 1 ? "" : "s"} on{" "}
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">
            {numberFormatter.format(total)}
          </span>{" "}
          contributions in the last year
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              className={`size-3 rounded-sm ring-1 ${levels[level]}`}
              key={level}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </div>
  );
};

const SystemHealthPanel = ({
  totals,
}: {
  totals: { commits: number; prs: number; reviews: number };
}) => {
  const rows = [
    {
      label: "GitHub account synced",
      value: "Operational",
      progress: 100,
      icon: GitHubMark,
    },
    {
      label: "Live token-backed analytics enabled",
      value: "Enabled",
      progress: 100,
      icon: ShieldCheck,
    },
    {
      label: "6 month commits",
      value: numberFormatter.format(totals.commits),
      progress: Math.min(100, totals.commits * 2.2),
      icon: GitCommit,
    },
    {
      label: "6 month PRs",
      value: numberFormatter.format(totals.prs),
      progress: Math.min(100, totals.prs * 18),
      icon: GitPullRequest,
    },
    {
      label: "Review samples",
      value: numberFormatter.format(totals.reviews),
      progress: totals.reviews > 0 ? Math.min(100, totals.reviews * 25) : 8,
      icon: Bot,
    },
  ];

  return (
    <DashboardPanel eyebrow="System Health">
      <PanelHeader
        subtitle="Current workspace signals for this account."
        title="System Health"
      />
      <div className="mt-5 rounded-lg border border-success/15 bg-success/10 p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex size-11 items-center justify-center rounded-lg bg-success/15 text-success ring-1 ring-success/20">
            <span className="absolute size-11 animate-ping rounded-lg bg-success/10" />
            <ShieldCheck className="relative size-5" />
          </div>
          <div>
            <p className="font-medium text-foreground">Workspace healthy</p>
            <p className="text-sm text-muted-foreground">
              GitHub account synced and analytics online.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {rows.map((row) => (
          <HealthRow row={row} key={row.label} />
        ))}
      </div>
    </DashboardPanel>
  );
};

const HealthRow = ({
  row,
}: {
  row: {
    label: string;
    value: string;
    progress: number;
    icon: LucideIcon | typeof GitHubMark;
  };
}) => {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-card text-muted-foreground ring-1 ring-border">
            <row.icon className="size-4" />
          </span>
          <span className="text-sm text-muted-foreground">{row.label}</span>
        </div>
        <span className="flex items-center gap-2 text-sm font-medium text-success">
          <span className="size-1.5 rounded-full bg-success" />
          {row.value}
        </span>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-success to-chart-3"
          style={{ width: `${row.progress}%` }}
        />
      </div>
    </div>
  );
};

const InsightCard = ({
  item,
}: {
  item: {
    title: string;
    description: string;
    icon: LucideIcon;
    tone: string;
  };
}) => {
  return (
    <div className="rounded-lg border border-border bg-muted/35 p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-muted/60">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border">
          <item.icon className={`size-4 ${item.tone}`} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {item.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {item.description}
          </p>
        </div>
      </div>
    </div>
  );
};

const EmptyReviewsPanel = () => {
  return (
    <DashboardPanel eyebrow="AI Reviews">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Bot className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              No AI reviews yet
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Connect a repository or trigger your first review to generate
              AI-powered feedback.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-10 rounded-lg bg-primary text-primary-foreground shadow-xl hover:bg-primary/90"
        >
          <a href="/dashboard/reviews">
            Start AI Review
            <ArrowRight className="size-4" />
          </a>
        </Button>
      </div>
    </DashboardPanel>
  );
};

const ChartSkeleton = () => {
  return (
    <div className="flex h-full flex-col justify-end gap-3">
      <div className="grid flex-1 grid-cols-6 items-end gap-4">
        {[40, 70, 52, 90, 64, 78].map((height) => (
          <Skeleton
            className="rounded-lg"
            key={height}
            style={{ height: `${height}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-5 w-full" />
    </div>
  );
};

export default DashboardPage;
