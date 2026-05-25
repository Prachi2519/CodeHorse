"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  GitPullRequest,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getReviews,
  getReviewStats,
  type ReviewListItem,
  type ReviewStatus,
} from "@/module/review/actions";

const statusOptions: ReviewStatus[] = ["all", "completed", "failed"];
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

const ReviewsPage = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("all");

  const {
    data: reviews,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["reviews", search, status],
    queryFn: async () => await getReviews({ search, status }),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => await getReviewStats(),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const reviewList = reviews ?? [];
  const latestReview = reviewList[0];

  const statCards = useMemo(
    () => [
      {
        label: "Total Reviews",
        value: stats?.total ?? 0,
        icon: MessageSquareText,
        tone: "text-violet-500",
        surface: "bg-violet-500/10 ring-violet-500/20",
      },
      {
        label: "Completed",
        value: stats?.completed ?? 0,
        icon: CheckCircle2,
        tone: "text-emerald-500",
        surface: "bg-emerald-500/10 ring-emerald-500/20",
      },
      {
        label: "Failed",
        value: stats?.failed ?? 0,
        icon: ShieldAlert,
        tone: "text-rose-500",
        surface: "bg-rose-500/10 ring-rose-500/20",
      },
      {
        label: "Repos Reviewed",
        value: stats?.repositories ?? 0,
        icon: GitPullRequest,
        tone: "text-sky-500",
        surface: "bg-sky-500/10 ring-sky-500/20",
      },
    ],
    [stats],
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-5 py-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  className="border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300"
                  variant="outline"
                >
                  <Sparkles className="size-3" />
                  AI review cockpit
                </Badge>
                <Badge variant="outline">Pull request intelligence</Badge>
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">
                  Reviews
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                  Inspect every AI review generated from GitHub pull requests,
                  trace failures, and jump back to the original PR.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search reviews"
                  value={search}
                />
              </div>
              <Button disabled={isFetching} onClick={() => refetch()} variant="outline">
                <RefreshCw
                  className={`size-4 ${isFetching ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((item) => (
            <div
              className="rounded-lg border bg-background p-4 shadow-sm"
              key={item.label}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">{item.label}</p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {isStatsLoading ? (
                      <Skeleton className="h-9 w-16" />
                    ) : (
                      item.value
                    )}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ring-1 ${item.surface}`}>
                  <item.icon className={`size-4 ${item.tone}`} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option}
            onClick={() => setStatus(option)}
            size="sm"
            variant={status === option ? "default" : "outline"}
          >
            {option === "all"
              ? "All"
              : option.charAt(0).toUpperCase() + option.slice(1)}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <ReviewSkeleton />
      ) : reviewList.length === 0 ? (
        <EmptyReviews />
      ) : (
        <section className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle>Review Queue</CardTitle>
              <CardDescription>
                {reviewList.length} review{reviewList.length === 1 ? "" : "s"}{" "}
                matching your filters.
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[720px] space-y-3 overflow-auto p-3">
              {reviewList.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>Latest Review</CardTitle>
                  <CardDescription>
                    A focused preview of the newest generated review.
                  </CardDescription>
                </div>
                {latestReview ? <StatusBadge status={latestReview.status} /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {latestReview ? (
                <>
                  <div className="rounded-lg border bg-muted/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">
                          {latestReview.repositoryFullName}
                        </p>
                        <h2 className="mt-1 line-clamp-2 text-xl font-semibold tracking-tight">
                          #{latestReview.prNumber} {latestReview.prTitle}
                        </h2>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <a
                          href={latestReview.prUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open PR
                          <ArrowUpRight className="size-4" />
                        </a>
                      </Button>
                    </div>
                  </div>

                  <article className="max-h-[560px] overflow-auto rounded-lg border bg-background p-5">
                    <pre className="whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                      {latestReview.review}
                    </pre>
                  </article>
                </>
              ) : null}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
};

const ReviewRow = ({ review }: { review: ReviewListItem }) => {
  return (
    <div className="rounded-lg border bg-background p-4 transition-colors hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={review.status} />
            <Badge variant="outline">{review.repositoryFullName}</Badge>
          </div>
          <div>
            <h3 className="line-clamp-2 font-semibold">
              #{review.prNumber} {review.prTitle}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock3 className="size-3" />
              {dateFormatter.format(new Date(review.createdAt))}
            </p>
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
            {review.review}
          </p>
        </div>
        <Button asChild size="icon" variant="ghost">
          <a href={review.prUrl} rel="noreferrer" target="_blank">
            <ArrowUpRight className="size-4" />
            <span className="sr-only">Open pull request</span>
          </a>
        </Button>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-300">
        <ShieldAlert className="size-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge variant="secondary">
      <Clock3 className="size-3" />
      {status}
    </Badge>
  );
};

const ReviewSkeleton = () => {
  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-36" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton className="h-32 w-full rounded-lg" key={index} />
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[520px] w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  );
};

const EmptyReviews = () => {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-3 text-center">
        <div className="rounded-lg bg-muted p-3">
          <MessageSquareText className="size-6 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">No reviews yet</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Open or update a pull request on a connected repository and
            CodeHorse will place the generated review here.
          </p>
        </div>
        <Button asChild>
          <a href="/dashboard/repository">Connect repositories</a>
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReviewsPage;
