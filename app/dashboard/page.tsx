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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="codehorse-panel rounded-lg p-5">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-5">
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
                <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground sm:text-base">
                  Live GitHub analytics, contribution velocity, pull requests,
                  and AI review insights.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="h-11 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
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
                <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-base font-semibold text-primary-foreground">
                  {accountInitial}
                </div>
                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-base font-medium text-foreground">
                    {accountName}
                  </p>
                  <p className="truncate text-base text-muted-foreground">
                    {accountEmail}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {metricCards.map((item) => (
            <KpiCard
              isLoading={isStatsLoading}
              item={item}
              key={item.title}
            />
          ))}
        </section>

        <section>
          <DashboardPanel className="min-w-0" eyebrow="Contribution Activity">
            <PanelHeader
              action={
                <div className="text-base font-medium text-muted-foreground">
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
        </section>

        <section className="grid gap-5">
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
                  className={`rounded-lg border px-3 py-1.5 text-base font-medium transition-all ${
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

          <EmptyReviewsPanel />
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
      <div className="relative flex items-start justify-between gap-5">
        <div className="space-y-1">
          <p className="text-base font-medium text-muted-foreground">
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

      <div className="relative mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-base">
        <span className="text-muted-foreground">{item.label}</span>
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-success/10 px-2 py-1 font-medium text-success">
          <span className="size-1.5 animate-pulse rounded-full bg-success" />
          {item.status}
        </span>
      </div>
      <div className="relative mt-3 flex items-center gap-1 text-base text-muted-foreground">
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
        <p className="mt-1 text-base leading-7 text-muted-foreground">
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
      <div className="mt-6 rounded-lg border border-border bg-muted/40 p-8 text-center text-base text-muted-foreground">
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
      <div className="mb-3 flex min-w-max justify-between px-1 text-base text-muted-foreground">
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
              <div className="pointer-events-none absolute bottom-5 left-1/2 z-20 hidden w-max -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-base text-popover-foreground shadow-2xl group-hover:block">
                {day.count} contribution{day.count === 1 ? "" : "s"} on{" "}
                {day.date}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base text-muted-foreground">
          <span className="font-semibold text-foreground">
            {numberFormatter.format(total)}
          </span>{" "}
          contributions in the last year
        </div>
        <div className="flex items-center gap-2 text-base text-muted-foreground">
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

const EmptyReviewsPanel = () => {
  return (
    <DashboardPanel eyebrow="AI Reviews">
      <div className="flex flex-col items-start gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:gap-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
            <Bot className="size-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              No AI reviews yet
            </h2>
            <p className="mt-2 max-w-xl text-base leading-7 text-muted-foreground">
              Connect a repository or trigger your first review to generate
              AI-powered feedback.
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-11 rounded-lg bg-primary text-primary-foreground shadow-xl hover:bg-primary/90"
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
      <div className="grid flex-1 grid-cols-6 items-end gap-5">
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
