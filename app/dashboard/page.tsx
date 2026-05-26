"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { useMemo } from "react";
import type React from "react";
import { useQuery } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getDashboardStats,
  getMonthlyActivity,
} from "@/module/dashboard/actions";
import ContributionGraph from "@/module/dashboard/actions/components/contribution-graph";

const numberFormatter = new Intl.NumberFormat("en-US");

const MainPage = () => {
  const {
    data: stats,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => await getDashboardStats(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const { data: monthlyActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

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

  const statCards = [
    {
      title: "Total Commits",
      value: stats?.totalCommits ?? 0,
      description: "GitHub contributions",
      icon: GitCommit,
      tone: "text-emerald-500",
      surface: "bg-emerald-500/10 ring-emerald-500/20",
    },
    {
      title: "Pull Requests",
      value: stats?.totalPRs ?? 0,
      description: "Opened on GitHub",
      icon: GitPullRequest,
      tone: "text-sky-500",
      surface: "bg-sky-500/10 ring-sky-500/20",
    },
    {
      title: "AI Reviews",
      value: stats?.totalReviews ?? 0,
      description: "Generated reviews",
      icon: MessageSquare,
      tone: "text-amber-500",
      surface: "bg-amber-500/10 ring-amber-500/20",
    },
    {
      title: "Repositories",
      value: stats?.totalRepos ?? 0,
      description: "Connected repos",
      icon: GitBranch,
      tone: "text-rose-500",
      surface: "bg-rose-500/10 ring-rose-500/20",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border bg-card px-5 py-5 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300"
                variant="outline"
              >
                <Activity className="size-3" />
                Live GitHub analytics
              </Badge>
              <Badge variant="outline">Dashboard</Badge>
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Engineering command center
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Track contribution velocity, pull requests, connected
                repositories, and review throughput in one focused workspace.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              disabled={isFetching}
              onClick={() => refetch()}
              variant="outline"
            >
              <RefreshCw
                className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild>
              <a href="/dashboard/repository">
                View repositories
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card
            className="relative border-border/80 bg-card/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            key={item.title}
          >
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div className="space-y-1">
                <CardDescription>{item.title}</CardDescription>
                <CardTitle className="text-3xl font-semibold tracking-tight">
                  {isLoading ? (
                    <Skeleton className="h-9 w-20" />
                  ) : (
                    numberFormatter.format(item.value)
                  )}
                </CardTitle>
              </div>
              <div className={`rounded-lg p-2 ring-1 ${item.surface}`}>
                <item.icon className={`size-4 ${item.tone}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.description}</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                  <TrendingUp className="size-3" />
                  Active
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle>Contribution Activity</CardTitle>
                <CardDescription>
                  Daily GitHub activity over the last year.
                </CardDescription>
              </div>
              <Badge variant="outline">Hover any square</Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <ContributionGraph />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle>System Health</CardTitle>
            <CardDescription>
              Current workspace signals for this account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 ring-1 ring-emerald-500/20">
                  <ShieldCheck className="size-4 text-emerald-500" />
                </div>
                <div>
                  <p className="font-medium">GitHub account synced</p>
                  <p className="text-sm text-muted-foreground">
                    Live token-backed analytics are enabled.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              <SignalRow
                icon={GitCommit}
                label="6 month commits"
                value={totals.commits}
              />
              <SignalRow
                icon={GitPullRequest}
                label="6 month PRs"
                value={totals.prs}
              />
              <SignalRow
                icon={MessageSquare}
                label="Review samples"
                value={totals.reviews}
              />
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Monthly Activity</CardTitle>
              <CardDescription>
                Commits, pull requests, and reviews from the last 6 months.
              </CardDescription>
            </div>
            <Badge variant="outline">
              <CheckCircle2 className="size-3" />
              Refetches on focus
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[380px] pt-6">
          {isLoadingActivity ? (
            <div className="flex h-full items-center justify-center">
              <div className="w-full max-w-3xl space-y-3">
                <Skeleton className="h-8 w-44" />
                <Skeleton className="h-[280px] w-full" />
              </div>
            </div>
          ) : (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart
                data={monthlyActivity ?? []}
                margin={{ bottom: 0, left: -18, right: 12, top: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="name"
                  tickLine={false}
                  tickMargin={12}
                />
                <YAxis axisLine={false} tickLine={false} width={42} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                  }}
                  cursor={{ fill: "var(--muted)", opacity: 0.28 }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="commits" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="prs" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                <Bar dataKey="reviews" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const SignalRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) => {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-semibold">{numberFormatter.format(value)}</span>
    </div>
  );
};

export default MainPage;
