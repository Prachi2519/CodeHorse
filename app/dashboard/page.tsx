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
  GitBranch,
  GitCommit,
  GitPullRequest,
  MessageSquare,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getDashboardStats,
  getMonthlyActivity,
} from "@/module/dashboard/actions";
import ContributionGraph from "@/module/dashboard/actions/components/contribution-graph";

const MainPage = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => await getDashboardStats(),
    refetchOnWindowFocus: false,
  });

  const { data: monthlyActivity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ["monthly-activity"],
    queryFn: async () => await getMonthlyActivity(),
  });

  const statCards = [
    {
      title: "Total Commits",
      value: stats?.totalCommits ?? 0,
      description: "GitHub contributions",
      icon: GitCommit,
    },
    {
      title: "Pull Requests",
      value: stats?.totalPRs ?? 0,
      description: "Opened on GitHub",
      icon: GitPullRequest,
    },
    {
      title: "AI Reviews",
      value: stats?.totalReviews ?? 0,
      description: "Generated reviews",
      icon: MessageSquare,
    },
    {
      title: "Repositories",
      value: stats?.totalRepos ?? 0,
      description: "Connected repos",
      icon: GitBranch,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((item) => (
          <Card key={item.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {item.title}
              </CardTitle>
              <item.icon className="size-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? "..." : item.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {item.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contribution Activity</CardTitle>
          <CardDescription>
            Visualizing your coding frequency over the last year
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContributionGraph />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Activity</CardTitle>
          <CardDescription>
            Commits, pull requests, and reviews from the last 6 months.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[360px]">
          {isLoadingActivity ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Loading activity...
            </div>
          ) : (
            <ResponsiveContainer height="100%" width="100%">
              <BarChart data={monthlyActivity ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="commits" fill="#60a5fa" />
                <Bar dataKey="prs" fill="#34d399" />
                <Bar dataKey="reviews" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MainPage;
