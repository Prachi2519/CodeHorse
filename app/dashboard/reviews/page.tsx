"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleDot,
  Clock3,
  GitBranch,
  GitPullRequest,
  LayoutList,
  Loader2,
  MessageSquareText,
  PanelTop,
  PlayCircle,
  RefreshCw,
  Rocket,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  XCircle,
  Zap,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  getReviews,
  getReviewStats,
  requestManualReview,
  type ReviewListItem,
  type ReviewStatus,
} from "@/module/review/actions";

const statusOptions: { value: ReviewStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "running", label: "In Progress" },
];

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

type ReviewViewMode = "list" | "compact";
type ManualReviewFeedback =
  | { tone: "neutral"; title: string; message: string }
  | { tone: "success"; title: string; message: string }
  | { tone: "warning"; title: string; message: string }
  | { tone: "danger"; title: string; message: string };

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

const ReviewsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ReviewStatus>("all");
  const [repositoryFilter, setRepositoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<ReviewViewMode>("list");
  const [manualPrInput, setManualPrInput] = useState("");
  const [manualTouched, setManualTouched] = useState(false);
  const [manualFeedback, setManualFeedback] =
    useState<ManualReviewFeedback | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { data: session } = useSession();
  const accountName = session?.user?.name || "Prachi2519";
  const accountEmail = session?.user?.email || "prachi639220@gmail.com";
  const accountInitial = accountName.charAt(0).toUpperCase();

  const {
    data: reviews,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["reviews", search, status],
    queryFn: async () => await getReviews({ search, status }),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });

  const { data: stats, isLoading: isStatsLoading } = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => await getReviewStats(),
    staleTime: 1000 * 15,
    refetchOnWindowFocus: false,
  });

  const reviewList = useMemo(() => {
    const items = reviews ?? [];

    if (repositoryFilter === "all") {
      return items;
    }

    return items.filter((review) => review.repositoryId === repositoryFilter);
  }, [repositoryFilter, reviews]);

  const latestReview = reviewList[0];
  const latestReviewBody = latestReview
    ? getVisibleReviewBody(latestReview.review)
    : "";

  const repositoryOptions = useMemo(() => {
    const seen = new Map<string, string>();

    for (const review of reviews ?? []) {
      seen.set(review.repositoryId, review.repositoryFullName);
    }

    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }));
  }, [reviews]);

  const manualReviewMutation = useMutation({
    mutationFn: async (input: string) => await requestManualReview(input),
    onSuccess: (result) => {
      if (result.success) {
        const target =
          "owner" in result && "repo" in result && "prNumber" in result
            ? `${result.owner}/${result.repo}#${result.prNumber}`
            : "the selected pull request";

        toast.success("Manual review queued.");
        setManualPrInput("");
        setManualTouched(false);
        setManualFeedback({
          tone: "success",
          title: "Queued successfully",
          message: `CodeHorse queued an AI review for ${target}.`,
        });
        queryClient.invalidateQueries({ queryKey: ["reviews"] });
        queryClient.invalidateQueries({ queryKey: ["review-stats"] });
        return;
      }

      const message = result.message || "Could not queue manual review.";
      const repositoryIssue =
        message.toLowerCase().includes("not found") ||
        message.toLowerCase().includes("reconnect") ||
        message.toLowerCase().includes("repository");

      setManualFeedback({
        tone: repositoryIssue ? "warning" : "danger",
        title: repositoryIssue ? "Repository not connected" : "Review not queued",
        message,
      });
      toast.error(message);
    },
    onError: () => {
      const message = "Could not queue manual review.";
      setManualFeedback({
        tone: "danger",
        title: "Review not queued",
        message,
      });
      toast.error(message);
    },
  });

  const manualValidation = getManualReviewValidation(manualPrInput);
  const activeManualFeedback =
    manualFeedback ?? getManualHelperFeedback(manualValidation, manualTouched);

  const statCards = useMemo(
    () => [
      {
        label: "Total Reviews",
        value: stats?.total ?? 0,
        helper: "All generated review runs",
        icon: MessageSquareText,
        tone: "text-primary",
        surface: "border-primary/20 bg-primary/10",
      },
      {
        label: "Completed",
        value: stats?.completed ?? 0,
        helper: "Reviews with feedback posted",
        icon: CheckCircle2,
        tone: "text-success",
        surface: "border-success/20 bg-success/10",
      },
      {
        label: "Failed",
        value: stats?.failed ?? 0,
        helper: "Runs requiring attention",
        icon: ShieldAlert,
        tone: "text-danger",
        surface: "border-danger/20 bg-danger/10",
      },
      {
        label: "In Progress",
        value: stats?.running ?? 0,
        helper: "Queued or actively running",
        icon: PlayCircle,
        tone: "text-warning",
        surface: "border-warning/20 bg-warning/10",
      },
      {
        label: "Repos Reviewed",
        value: stats?.repositories ?? 0,
        helper: "Repositories with review history",
        icon: GitPullRequest,
        tone: "text-chart-3",
        surface: "border-chart-3/20 bg-chart-3/10",
      },
    ],
    [stats],
  );

  const triggerManualReview = () => {
    setManualTouched(true);
    setManualFeedback(null);

    if (manualValidation === "empty") {
      setManualFeedback({
        tone: "warning",
        title: "Empty input",
        message: "Paste a GitHub PR URL or owner/repo#number before queueing.",
      });
      manualInputRef.current?.focus();
      return;
    }

    if (manualValidation === "invalid") {
      setManualFeedback({
        tone: "danger",
        title: "Invalid PR format",
        message:
          "Use a GitHub PR URL like https://github.com/owner/repo/pull/42 or owner/repo#42.",
      });
      manualInputRef.current?.focus();
      return;
    }

    manualReviewMutation.mutate(manualPrInput.trim());
  };

  const focusManualReview = () => {
    manualInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <ReviewHeader
          accountEmail={accountEmail}
          accountInitial={accountInitial}
          accountName={accountName}
          isFetching={isFetching}
          onSync={() => void refetch()}
          onTriggerReview={focusManualReview}
        />

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          {statCards.map((item) => (
            <ReviewMetricCard
              isLoading={isStatsLoading}
              item={item}
              key={item.label}
            />
          ))}
        </section>

        <section className="space-y-5">
          <div className="min-w-0 space-y-5">
            <ManualReviewPanel
              feedback={activeManualFeedback}
              inputRef={manualInputRef}
              isPending={manualReviewMutation.isPending}
              value={manualPrInput}
              validation={manualValidation}
              onChange={(value) => {
                setManualPrInput(value);
                setManualFeedback(null);
              }}
              onSubmit={triggerManualReview}
              onTouched={() => setManualTouched(true)}
            />

            <ReviewControls
              repositoryFilter={repositoryFilter}
              repositoryOptions={repositoryOptions}
              search={search}
              searchInputRef={searchInputRef}
              status={status}
              viewMode={viewMode}
              onRepositoryChange={setRepositoryFilter}
              onSearchChange={setSearch}
              onStatusChange={(value) => setStatus(value as ReviewStatus)}
              onViewModeChange={setViewMode}
            />

            {isLoading ? (
              <ReviewSkeleton viewMode={viewMode} />
            ) : reviewList.length === 0 ? (
              <EmptyReviews
                onConnectRepositoryHref="/dashboard/repository"
                onTriggerReview={focusManualReview}
              />
            ) : (
              <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <ReviewQueue
                  reviews={reviewList}
                  viewMode={viewMode}
                />
                <LatestReview
                  latestReview={latestReview}
                  latestReviewBody={latestReviewBody}
                />
              </section>
            )}

            <WorkflowSection />
          </div>
        </section>
      </div>
    </div>
  );
};

const ReviewHeader = ({
  accountEmail,
  accountInitial,
  accountName,
  isFetching,
  onSync,
  onTriggerReview,
}: {
  accountEmail: string;
  accountInitial: string;
  accountName: string;
  isFetching: boolean;
  onSync: () => void;
  onTriggerReview: () => void;
}) => {
  return (
    <header className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-5">
          <div className="codehorse-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
            <Bot className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="size-3" />
                Pull request intelligence
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              AI Review Cockpit
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground sm:text-base">
              Inspect AI-generated GitHub pull request reviews, trace failures,
              and jump back to the original PR.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-11 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
            disabled={isFetching}
            onClick={onSync}
            type="button"
            variant="outline"
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            Sync GitHub
          </Button>
          <Button
            className="h-11 rounded-lg bg-primary px-4 text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={onTriggerReview}
            type="button"
          >
            <Zap className="size-4" />
            Trigger Review
          </Button>
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
            <div className="codehorse-brand-gradient flex size-10 items-center justify-center rounded-lg text-base font-semibold text-primary-foreground">
              {accountInitial || "P"}
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

const ReviewMetricCard = ({
  isLoading,
  item,
}: {
  isLoading: boolean;
  item: {
    label: string;
    value: number;
    helper: string;
    icon: LucideIcon;
    tone: string;
    surface: string;
  };
}) => {
  return (
    <article className="codehorse-panel group rounded-lg p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base text-muted-foreground">{item.label}</p>
          <div className="mt-2 min-h-9 text-3xl font-semibold tracking-tight text-foreground">
            {isLoading ? <Skeleton className="h-9 w-16" /> : item.value}
          </div>
        </div>
        <div className={cn("rounded-lg border p-2", item.surface)}>
          <item.icon className={cn("size-4", item.tone)} />
        </div>
      </div>
      <p className="mt-4 text-base leading-7 text-muted-foreground">
        {item.helper}
      </p>
    </article>
  );
};

const ManualReviewPanel = ({
  feedback,
  inputRef,
  isPending,
  value,
  validation,
  onChange,
  onSubmit,
  onTouched,
}: {
  feedback: ManualReviewFeedback;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isPending: boolean;
  value: string;
  validation: "empty" | "invalid" | "valid";
  onChange: (value: string) => void;
  onSubmit: () => void;
  onTouched: () => void;
}) => {
  return (
    <section className="codehorse-panel-strong overflow-hidden rounded-lg p-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-base font-medium text-primary">
            <Sparkles className="size-3.5" />
            Manual review queue
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-normal text-foreground">
            Trigger Manual Review
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            Paste a GitHub pull request URL or use owner/repo#number to queue an
            AI review run.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3 lg:max-w-xl">
          <div className="relative">
            <GitPullRequest className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-invalid={validation === "invalid"}
              className="h-12 rounded-lg border-border bg-background/70 pl-9 text-base"
              onBlur={onTouched}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onSubmit();
                }
              }}
              placeholder="https://github.com/owner/repo/pull/42"
              ref={inputRef}
              value={value}
            />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              className="h-10 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              disabled={isPending}
              onClick={onSubmit}
              type="button"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Rocket className="size-4" />
              )}
              {isPending ? "Queueing..." : "Queue Review"}
            </Button>
            <Button
              asChild
              className="h-10 border-border bg-card/70 text-foreground hover:bg-muted"
              variant="outline"
            >
              <Link href="/dashboard/repository">
                View connected repositories
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
          <p className="text-base text-muted-foreground">
            Example:{" "}
            <button
              className="font-mono text-primary underline-offset-4 hover:underline"
              onClick={() => onChange("Prachi2519/CodeHorse#12")}
              type="button"
            >
              Prachi2519/CodeHorse#12
            </button>
          </p>
          <ManualFeedback feedback={feedback} />
          <p className="text-base text-muted-foreground">
            Manual reviews run against connected repositories only.
          </p>
        </div>
      </div>
    </section>
  );
};

const ManualFeedback = ({
  feedback,
}: {
  feedback: ManualReviewFeedback;
}) => {
  const toneClasses = {
    neutral: "border-border bg-muted/40 text-muted-foreground",
    success: "border-success/20 bg-success/10 text-success",
    warning: "border-warning/20 bg-warning/10 text-warning",
    danger: "border-danger/20 bg-danger/10 text-danger",
  };

  const Icon =
    feedback.tone === "success"
      ? CheckCircle2
      : feedback.tone === "warning"
        ? ShieldAlert
        : feedback.tone === "danger"
          ? XCircle
          : CircleDot;

  return (
    <div className={cn("rounded-lg border px-3 py-2", toneClasses[feedback.tone])}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="text-base font-semibold">{feedback.title}</p>
          <p className="mt-0.5 text-base leading-7 opacity-90">
            {feedback.message}
          </p>
        </div>
      </div>
    </div>
  );
};

const ReviewControls = ({
  repositoryFilter,
  repositoryOptions,
  search,
  searchInputRef,
  status,
  viewMode,
  onRepositoryChange,
  onSearchChange,
  onStatusChange,
  onViewModeChange,
}: {
  repositoryFilter: string;
  repositoryOptions: { id: string; name: string }[];
  search: string;
  searchInputRef: React.RefObject<HTMLInputElement | null>;
  status: ReviewStatus;
  viewMode: ReviewViewMode;
  onRepositoryChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onViewModeChange: (value: ReviewViewMode) => void;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-3">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-lg border-border bg-background/60 pl-9 text-base"
            placeholder="Search reviews..."
            ref={searchInputRef}
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <ControlSelect
            icon={ShieldCheck}
            label="Status"
            value={status}
            onChange={onStatusChange}
          >
            {statusOptions.map((option) => (
              <NativeSelectOption key={option.value} value={option.value}>
                {option.label}
              </NativeSelectOption>
            ))}
          </ControlSelect>

          <ControlSelect
            icon={GitBranch}
            label="Repository"
            value={repositoryFilter}
            onChange={onRepositoryChange}
          >
            <NativeSelectOption value="all">All repositories</NativeSelectOption>
            {repositoryOptions.map((repository) => (
              <NativeSelectOption key={repository.id} value={repository.id}>
                {repository.name}
              </NativeSelectOption>
            ))}
          </ControlSelect>

          <ControlSelect
            icon={Clock3}
            label="Sort"
            value="newest"
            onChange={() => undefined}
          >
            <NativeSelectOption value="newest">Newest first</NativeSelectOption>
          </ControlSelect>

          <div className="grid h-10 grid-cols-2 gap-1 rounded-lg border border-border bg-muted/60 p-1">
            <ViewButton
              active={viewMode === "list"}
              icon={LayoutList}
              label="List"
              onClick={() => onViewModeChange("list")}
            />
            <ViewButton
              active={viewMode === "compact"}
              icon={PanelTop}
              label="Compact"
              onClick={() => onViewModeChange("compact")}
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
    <div className="flex h-10 min-w-[11rem] items-center gap-2 rounded-lg border border-border bg-background/60 px-3 text-base text-muted-foreground">
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
        "inline-flex items-center justify-center gap-1.5 rounded-md px-3 text-base font-medium text-muted-foreground transition-colors hover:text-foreground",
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

const ReviewQueue = ({
  reviews,
  viewMode,
}: {
  reviews: ReviewListItem[];
  viewMode: ReviewViewMode;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Review Queue
          </h2>
          <p className="text-base text-muted-foreground">
            {reviews.length} review{reviews.length === 1 ? "" : "s"} matching
            your filters.
          </p>
        </div>
        <Badge className="w-fit border-primary/20 bg-primary/10 text-primary">
          Newest first
        </Badge>
      </div>

      <div
        className={cn(
          "mt-4 space-y-3 overflow-auto",
          viewMode === "list" ? "max-h-[720px]" : "max-h-[560px]",
        )}
      >
        {reviews.map((review) => (
          <ReviewRow key={review.id} review={review} viewMode={viewMode} />
        ))}
      </div>
    </section>
  );
};

const ReviewRow = ({
  review,
  viewMode,
}: {
  review: ReviewListItem;
  viewMode: ReviewViewMode;
}) => {
  return (
    <article className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted/30">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={review.status} />
            <Badge className="border-border bg-muted/60 text-muted-foreground">
              {review.repositoryFullName}
            </Badge>
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              PR #{review.prNumber}
            </Badge>
          </div>
          <div>
            <h3 className="line-clamp-2 font-semibold text-foreground">
              {review.prTitle}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-base text-muted-foreground">
              <Clock3 className="size-3" />
              {dateFormatter.format(new Date(review.createdAt))}
            </p>
          </div>
          {viewMode === "list" ? (
            <p className="line-clamp-3 text-base leading-7 text-muted-foreground">
              {getVisibleReviewBody(review.review) || "No output recorded yet."}
            </p>
          ) : null}
        </div>
        <Button asChild size="icon" variant="ghost">
          <a href={review.prUrl} rel="noreferrer" target="_blank">
            <ArrowUpRight className="size-4" />
            <span className="sr-only">Open pull request</span>
          </a>
        </Button>
      </div>
    </article>
  );
};

const LatestReview = ({
  latestReview,
  latestReviewBody,
}: {
  latestReview?: ReviewListItem;
  latestReviewBody: string;
}) => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Latest Review
          </h2>
          <p className="text-base text-muted-foreground">
            A focused preview of the newest generated review.
          </p>
        </div>
        {latestReview ? <StatusBadge status={latestReview.status} /> : null}
      </div>

      <div className="mt-4">
        {latestReview ? (
          <>
            <div className="rounded-lg border border-border bg-muted/30 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-base text-muted-foreground">
                    {latestReview.repositoryFullName}
                  </p>
                  <h3 className="mt-1 line-clamp-2 text-xl font-semibold tracking-tight text-foreground">
                    #{latestReview.prNumber} {latestReview.prTitle}
                  </h3>
                </div>
                <Button asChild size="sm" variant="outline">
                  <a href={latestReview.prUrl} rel="noreferrer" target="_blank">
                    Open PR
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
            </div>

            <article className="mt-4 max-h-[560px] overflow-auto rounded-lg border border-border bg-background/70 p-5">
              <Tabs defaultValue="overview">
                <TabsList className="mb-3 grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="inline">Findings</TabsTrigger>
                  <TabsTrigger value="timeline">Timeline</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>
                <TabsContent value="overview">
                  <pre className="whitespace-pre-wrap break-words text-base leading-7 text-foreground">
                    {latestReviewBody}
                  </pre>
                </TabsContent>
                <TabsContent value="inline">
                  {latestReview.commentUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={latestReview.commentUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open GitHub review comments
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                  ) : (
                    <p className="text-base text-muted-foreground">
                      No inline comments were posted for this run.
                    </p>
                  )}
                </TabsContent>
                <TabsContent value="timeline">
                  <div className="space-y-2 text-base">
                    <TimelineRow label="Status" value={latestReview.status} />
                    <TimelineRow label="Mode" value={latestReview.mode} />
                    <TimelineRow label="Action" value={latestReview.action} />
                    <TimelineRow
                      label="Created"
                      value={dateFormatter.format(new Date(latestReview.createdAt))}
                    />
                    <TimelineRow
                      label="Updated"
                      value={dateFormatter.format(new Date(latestReview.updatedAt))}
                    />
                    {latestReview.errorReason ? (
                      <p className="text-danger">
                        <span className="font-medium">Error:</span>{" "}
                        {latestReview.errorReason}
                      </p>
                    ) : null}
                  </div>
                </TabsContent>
                <TabsContent value="raw">
                  <pre className="whitespace-pre-wrap break-words text-base leading-7 text-muted-foreground">
                    {latestReview.review}
                  </pre>
                </TabsContent>
              </Tabs>
            </article>
          </>
        ) : null}
      </div>
    </section>
  );
};

const TimelineRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <p>
      <span className="font-medium">{label}:</span> {value}
    </p>
  );
};

const EmptyReviews = ({
  onConnectRepositoryHref,
  onTriggerReview,
}: {
  onConnectRepositoryHref: string;
  onTriggerReview: () => void;
}) => {
  return (
    <section className="codehorse-panel-strong overflow-hidden rounded-lg p-8 text-center">
      <div className="mx-auto max-w-2xl">
        <ReviewEmptyIllustration />
        <h2 className="mt-8 text-2xl font-semibold tracking-normal text-foreground">
          No AI reviews yet
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          Open or update a pull request on a connected repository, or trigger a
          manual review to generate your first AI-powered code review.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            onClick={onTriggerReview}
            type="button"
          >
            <Sparkles className="size-4" />
            Trigger Manual Review
          </Button>
          <Button
            asChild
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            variant="outline"
          >
            <Link href={onConnectRepositoryHref}>
              Connect Repository
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

const ReviewEmptyIllustration = () => {
  return (
    <div className="relative mx-auto h-64 max-w-lg">
      <div className="absolute inset-x-12 top-6 h-44 rounded-full bg-primary/10 blur-3xl" />
      <div className="codehorse-panel relative mx-auto flex h-56 max-w-md flex-col rounded-lg p-5 text-left">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <GitPullRequest className="size-4 text-primary" />
            <span className="text-base font-semibold text-foreground">
              Pull request #42
            </span>
          </div>
          <Badge className="border-primary/20 bg-primary/10 text-primary">
            Preview
          </Badge>
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-base font-medium text-foreground">
              <GitHubMark className="size-4" />
              Prachi2519/CodeHorse
            </div>
            <p className="mt-2 text-base text-muted-foreground">
              AI review will summarize risks, quality issues, and actionable
              fixes.
            </p>
          </div>
          <div className="ml-10 rounded-lg border border-success/20 bg-success/10 p-3 text-success">
            <div className="flex items-center gap-2 text-base font-semibold">
              <Sparkles className="size-3.5" />
              CodeHorse review comment
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="h-1.5 w-3/4 rounded-full bg-success/40" />
              <div className="h-1.5 w-1/2 rounded-full bg-success/30" />
            </div>
          </div>
        </div>
        <div className="absolute -right-5 -top-5 flex size-12 animate-pulse items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xl">
          <Bot className="size-5" />
        </div>
      </div>
    </div>
  );
};

const WorkflowSection = () => {
  const steps = [
    {
      title: "Connect a repository",
      description: "Install the review webhook on a repository with admin access.",
      icon: GitBranch,
    },
    {
      title: "Open or update a pull request",
      description: "CodeHorse listens for PR activity from connected repos.",
      icon: GitPullRequest,
    },
    {
      title: "Generate actionable feedback",
      description: "The AI review engine posts quality, risk, and maintainability notes.",
      icon: Sparkles,
    },
  ];

  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div>
        <p className="ch-section-eyebrow">
          How reviews work
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          From pull request to feedback in three steps
        </h2>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <div
            className="rounded-lg border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30"
            key={step.title}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-lg border border-border bg-muted/60 p-2 text-primary">
                <step.icon className="size-4" />
              </div>
              <span className="text-base font-semibold text-muted-foreground">
                Step {index + 1}
              </span>
            </div>
            <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  if (status === "queued" || status === "pending") {
    return (
      <Badge className="border-primary/20 bg-primary/10 text-primary">
        <Clock3 className="size-3" />
        Queued
      </Badge>
    );
  }

  if (status === "running") {
    return (
      <Badge className="border-warning/20 bg-warning/10 text-warning">
        <PlayCircle className="size-3" />
        Running
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge className="border-success/20 bg-success/10 text-success">
        <CheckCircle2 className="size-3" />
        Completed
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge className="border-danger/20 bg-danger/10 text-danger">
        <XCircle className="size-3" />
        Failed
      </Badge>
    );
  }

  return (
    <Badge className="border-border bg-muted/60 text-muted-foreground">
      <Clock3 className="size-3" />
      {status}
    </Badge>
  );
};

const getVisibleReviewBody = (reviewBody: string) => {
  if (!reviewBody.includes("<!-- CODEHORSE_RUN -->")) {
    return reviewBody;
  }

  const lines = reviewBody.split("\n");
  const cleaned: string[] = [];
  let metaSection = false;

  for (const line of lines) {
    if (line.includes("<!-- CODEHORSE_RUN -->")) {
      metaSection = true;
      continue;
    }

    if (metaSection && line.trim() === "") {
      metaSection = false;
      continue;
    }

    if (metaSection && line.includes("=") && !line.includes("##")) {
      continue;
    }

    cleaned.push(line);
  }

  return cleaned.join("\n").trim();
};

const getManualReviewValidation = (value: string) => {
  const input = value.trim();

  if (!input) {
    return "empty" as const;
  }

  const urlMatch = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/i.test(
    input,
  );
  const shortMatch = /^[^/\s]+\/[^#\s]+#\d+$/.test(input);

  return urlMatch || shortMatch ? ("valid" as const) : ("invalid" as const);
};

const getManualHelperFeedback = (
  validation: "empty" | "invalid" | "valid",
  touched: boolean,
): ManualReviewFeedback => {
  if (validation === "valid") {
    return {
      tone: "success",
      title: "Valid PR format",
      message: "This pull request can be queued once the repository is connected.",
    };
  }

  if (validation === "invalid") {
    return {
      tone: "danger",
      title: "Invalid PR format",
      message:
        "Use a GitHub PR URL or owner/repo#number, for example Prachi2519/CodeHorse#12.",
    };
  }

  return {
    tone: touched ? "warning" : "neutral",
    title: touched ? "Empty input" : "Waiting for a pull request",
    message: touched
      ? "Paste a GitHub PR URL or owner/repo#number to queue a manual review."
      : "Manual reviews support GitHub PR URLs and owner/repo#number identifiers.",
  };
};

const ReviewSkeleton = ({ viewMode }: { viewMode: ReviewViewMode }) => {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="codehorse-panel rounded-lg p-5">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-2 h-4 w-64" />
        <div className="mt-5 space-y-3">
          {Array.from({ length: viewMode === "list" ? 4 : 6 }).map(
            (_, index) => (
              <Skeleton
                className={cn(
                  "w-full rounded-lg",
                  viewMode === "list" ? "h-32" : "h-20",
                )}
                key={index}
              />
            ),
          )}
        </div>
      </div>
      <div className="codehorse-panel rounded-lg p-5">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-2 h-4 w-72" />
        <Skeleton className="mt-5 h-[520px] w-full rounded-lg" />
      </div>
    </div>
  );
};

export default ReviewsPage;
