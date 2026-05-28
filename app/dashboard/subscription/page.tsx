"use client";

import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bot,
  CheckCircle2,
  CircleDot,
  CreditCard,
  Crown,
  FileClock,
  GitBranch,
  GitPullRequest,
  Loader2,
  Rocket,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type PlanId = "free" | "pro";

type Plan = {
  id: PlanId;
  name: string;
  badge: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  icon: LucideIcon;
};

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    badge: "Current Plan",
    price: "$0",
    cadence: "/month",
    description:
      "Perfect to explore CodeHorse and run basic AI reviews.",
    features: [
      "Basic repository indexing",
      "Standard review summaries",
      "GitHub account sync",
      "Limited manual reviews",
      "Community support",
    ],
    cta: "Current Plan",
    icon: GitBranch,
  },
  {
    id: "pro",
    name: "Pro",
    badge: "Recommended",
    price: "$19",
    cadence: "/month",
    description:
      "Deep AI review pipeline with richer insights, faster indexing, and priority support.",
    features: [
      "Inline AI code suggestions",
      "Faster repository indexing",
      "Advanced pull request diagnostics",
      "Manual review queue",
      "Review history and traceability",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    icon: Crown,
  },
];

const comparisonRows = [
  { feature: "GitHub account sync", free: "Included", pro: "Included" },
  { feature: "Repository indexing", free: "Basic", pro: "Faster" },
  { feature: "AI review summaries", free: "Standard", pro: "Advanced" },
  { feature: "Inline code suggestions", free: "Limited", pro: "Included" },
  { feature: "Pull request diagnostics", free: "Limited", pro: "Advanced" },
  { feature: "Manual review trigger", free: "Limited", pro: "Included" },
  { feature: "Review history", free: "Basic", pro: "Full traceability" },
  { feature: "Priority support", free: "Community", pro: "Priority" },
];

const usageItems = [
  {
    label: "AI Reviews",
    value: "0 used",
    progress: 4,
    icon: Bot,
    tone: "text-primary",
  },
  {
    label: "Connected Repositories",
    value: "1",
    progress: 20,
    icon: GitBranch,
    tone: "text-success",
  },
  {
    label: "Pull Requests Tracked",
    value: "5",
    progress: 38,
    icon: GitPullRequest,
    tone: "text-chart-3",
  },
  {
    label: "GitHub Sync",
    value: "Active",
    progress: 100,
    icon: ShieldCheck,
    tone: "text-success",
  },
];

const SubscriptionPage = () => {
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [pendingPlan, setPendingPlan] = useState<PlanId | null>(null);

  const { data: session } = useSession();
  const accountName = session?.user?.name || "Prachi2519";
  const accountEmail = session?.user?.email || "prachi639220@gmail.com";
  const accountInitial = accountName.charAt(0).toUpperCase();

  const currentPlanDetails = useMemo(
    () => plans.find((plan) => plan.id === currentPlan) ?? plans[0],
    [currentPlan],
  );

  const handlePlanChange = async (targetPlan: PlanId) => {
    if (targetPlan === currentPlan || pendingPlan) return;

    setPendingPlan(targetPlan);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));
      setCurrentPlan(targetPlan);
      toast.success(
        targetPlan === "pro"
          ? "Upgraded to Pro plan successfully"
          : "Switched to Free plan successfully",
      );
    } catch {
      toast.error("Failed to update subscription");
    } finally {
      setPendingPlan(null);
    }
  };

  const handleManageBilling = () => {
    toast.info("Billing portal will be available once payments are connected.");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="codehorse-app-gradient pointer-events-none fixed inset-0" />
      <div className="codehorse-grid-overlay pointer-events-none fixed inset-0" />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <SubscriptionHeader
          accountEmail={accountEmail}
          accountInitial={accountInitial}
          accountName={accountName}
          onManageBilling={handleManageBilling}
        />

        <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <CurrentPlanCard
            currentPlan={currentPlanDetails}
            isPending={pendingPlan === "pro"}
            onUpgrade={() => handlePlanChange("pro")}
          />
          <UsagePanel />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          {plans.map((plan) => (
            <PricingCard
              currentPlan={currentPlan}
              isPending={pendingPlan === plan.id}
              key={plan.id}
              plan={plan}
              onPlanChange={handlePlanChange}
            />
          ))}
        </section>

        <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <div className="space-y-5">
            <PlanComparisonTable />
          </div>
          <aside className="space-y-5">
            <BillingReadinessPanel />
            <SecurityNote />
          </aside>
        </section>
      </div>
    </div>
  );
};

const SubscriptionHeader = ({
  accountEmail,
  accountInitial,
  accountName,
  onManageBilling,
}: {
  accountEmail: string;
  accountInitial: string;
  accountName: string;
  onManageBilling: () => void;
}) => {
  return (
    <header className="codehorse-panel rounded-lg p-5">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-5">
          <div className="codehorse-brand-gradient flex size-12 shrink-0 items-center justify-center rounded-lg text-primary-foreground shadow-lg">
            <CreditCard className="size-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-success/20 bg-success/10 text-success">
                <span className="size-1.5 animate-pulse rounded-full bg-success" />
                All systems operational
              </Badge>
              <Badge className="border-primary/20 bg-primary/10 text-primary">
                <Sparkles className="size-3" />
                Billing workspace
              </Badge>
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              Subscription
            </h1>
            <p className="mt-2 max-w-3xl text-base leading-7 text-muted-foreground sm:text-base">
              Choose the plan that fits your code review workflow.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="h-11 rounded-lg border-border bg-card/70 text-foreground hover:bg-muted"
            onClick={onManageBilling}
            type="button"
            variant="outline"
          >
            <CreditCard className="size-4" />
            Manage Billing
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

const CurrentPlanCard = ({
  currentPlan,
  isPending,
  onUpgrade,
}: {
  currentPlan: Plan;
  isPending: boolean;
  onUpgrade: () => void;
}) => {
  const isFree = currentPlan.id === "free";

  return (
    <section className="codehorse-panel-strong overflow-hidden rounded-lg p-5">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-primary/20 bg-primary/10 text-primary">
              Current plan
            </Badge>
            <Badge className="border-success/20 bg-success/10 text-success">
              Usage healthy
            </Badge>
          </div>
          <h2 className="mt-5 text-2xl font-semibold tracking-normal text-foreground">
            Current Plan
          </h2>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <span className="text-5xl font-semibold tracking-tight text-foreground">
              {currentPlan.name}
            </span>
            <span className="pb-1 text-xl font-medium text-muted-foreground">
              {currentPlan.price}
              <span className="text-base">{currentPlan.cadence}</span>
            </span>
          </div>
          <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
            {isFree
              ? "Explore CodeHorse with basic repository indexing and standard AI review summaries."
              : currentPlan.description}
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-3 lg:w-[440px]">
          <PlanSignal
            icon={GitBranch}
            label="Repositories connected"
            value="1"
          />
          <PlanSignal icon={Bot} label="AI reviews used" value="0" />
          <PlanSignal
            icon={Rocket}
            label="Recommendation"
            value={isFree ? "Upgrade" : "Optimized"}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-base text-muted-foreground">
          {isFree
            ? "Pro unlocks inline suggestions, deeper diagnostics, and faster indexing."
            : "Your workspace is running on the recommended review pipeline."}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            className="bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
            disabled={!isFree || isPending}
            onClick={onUpgrade}
            type="button"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isPending ? "Upgrading..." : "Upgrade to Pro"}
          </Button>
          <Button
            className="border-border bg-card/70 text-foreground hover:bg-muted"
            type="button"
            variant="outline"
          >
            <BarChart3 className="size-4" />
            View usage
          </Button>
        </div>
      </div>
    </section>
  );
};

const PlanSignal = ({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) => {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="flex items-center gap-2 text-base text-muted-foreground">
        <Icon className="size-3.5 text-primary" />
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{value}</div>
    </div>
  );
};

const PricingCard = ({
  currentPlan,
  isPending,
  plan,
  onPlanChange,
}: {
  currentPlan: PlanId;
  isPending: boolean;
  plan: Plan;
  onPlanChange: (plan: PlanId) => void;
}) => {
  const isCurrent = currentPlan === plan.id;
  const isPro = plan.id === "pro";

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-lg p-px transition-all duration-300 hover:-translate-y-1",
        isPro
          ? "bg-gradient-to-br from-primary/70 via-chart-5/45 to-success/40 shadow-2xl shadow-primary/10"
          : "bg-border",
      )}
    >
      <div className="h-full rounded-lg border border-border bg-card/95 p-5 text-card-foreground">
        {isPro ? (
          <div className="pointer-events-none absolute inset-x-8 top-0 h-24 bg-primary/20 blur-3xl" />
        ) : null}
        <div className="relative flex items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  isPro
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-success/20 bg-success/10 text-success",
                )}
              >
                {isCurrent ? "Current Plan" : plan.badge}
              </Badge>
            </div>
            <h2 className="mt-5 flex items-center gap-2 text-2xl font-semibold text-foreground">
              {plan.name}
              {isPro ? <Sparkles className="size-5 text-warning" /> : null}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
              {plan.description}
            </p>
          </div>
          <span className="rounded-lg border border-border bg-muted/50 p-3">
            <plan.icon
              className={cn("size-5", isPro ? "text-primary" : "text-success")}
            />
          </span>
        </div>

        <div className="relative mt-6 flex items-end gap-1">
          <span className="text-5xl font-semibold tracking-tight text-foreground">
            {plan.price}
          </span>
          <span className="pb-1 text-base text-muted-foreground">
            {plan.cadence}
          </span>
        </div>

        <ul className="relative mt-6 space-y-3 text-base text-muted-foreground">
          {plan.features.map((feature) => (
            <li className="flex items-start gap-2" key={feature}>
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          className={cn(
            "relative mt-7 w-full",
            isPro
              ? "bg-primary text-primary-foreground shadow-lg hover:bg-primary/90"
              : "border-border bg-muted/60 text-muted-foreground",
          )}
          disabled={isCurrent || isPending}
          onClick={() => onPlanChange(plan.id)}
          type="button"
          variant={isPro ? "default" : "outline"}
        >
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isCurrent ? (
            <CheckCircle2 className="size-4" />
          ) : isPro ? (
            <Zap className="size-4" />
          ) : (
            <CircleDot className="size-4" />
          )}
          {isPending ? "Updating..." : isCurrent ? "Current Plan" : plan.cta}
        </Button>
      </div>
    </article>
  );
};

const PlanComparisonTable = () => {
  return (
    <section className="codehorse-panel overflow-hidden rounded-lg">
      <div className="border-b border-border p-5">
        <p className="ch-section-eyebrow">
          Plan comparison
        </p>
        <h2 className="mt-2 text-xl font-semibold text-foreground">
          Compare workflow capabilities
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-base">
          <thead className="border-b border-border text-base uppercase tracking-[0.16em] text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-semibold">Feature</th>
              <th className="px-5 py-3 font-semibold">Free</th>
              <th className="px-5 py-3 font-semibold">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparisonRows.map((row) => (
              <tr className="transition-colors hover:bg-muted/30" key={row.feature}>
                <td className="px-5 py-5 font-medium text-foreground">
                  {row.feature}
                </td>
                <td className="px-5 py-5">
                  <ComparisonValue value={row.free} />
                </td>
                <td className="px-5 py-5">
                  <ComparisonValue pro value={row.pro} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const ComparisonValue = ({
  pro = false,
  value,
}: {
  pro?: boolean;
  value: string;
}) => {
  const isIncluded =
    value === "Included" ||
    value === "Advanced" ||
    value === "Faster" ||
    value === "Full traceability" ||
    value === "Priority";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-2.5 py-1 text-base font-medium",
        pro
          ? "bg-primary/10 text-primary"
          : isIncluded
            ? "bg-success/10 text-success"
            : "bg-muted text-muted-foreground",
      )}
    >
      <CheckCircle2 className="size-3.5" />
      {value}
    </span>
  );
};

const UsagePanel = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="ch-section-eyebrow">
            Usage This Month
          </p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">
            Workspace consumption
          </h2>
        </div>
        <Badge className="border-success/20 bg-success/10 text-success">
          Active
        </Badge>
      </div>

      <div className="mt-5 space-y-4">
        {usageItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3 text-base">
              <div className="flex items-center gap-2 text-muted-foreground">
                <item.icon className={cn("size-4", item.tone)} />
                {item.label}
              </div>
              <span className="font-medium text-foreground">{item.value}</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-success"
                style={{ width: `${item.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const BillingReadinessPanel = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-foreground">
            Billing readiness
          </p>
          <p className="mt-1 text-base leading-7 text-muted-foreground">
            Your workspace is eligible for Pro upgrade.
          </p>
        </div>
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
          <CreditCard className="size-5" />
        </span>
      </div>
      <div className="mt-5 space-y-3">
        <ReadinessRow label="GitHub account synced" value="Ready" />
        <ReadinessRow label="Token-backed analytics" value="Enabled" />
        <ReadinessRow label="Billing flow" value="Secure" />
      </div>
    </section>
  );
};

const ReadinessRow = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 p-3 text-base">
      <span className="text-muted-foreground">{label}</span>
      <span className="inline-flex items-center gap-1.5 font-medium text-success">
        <CheckCircle2 className="size-3.5" />
        {value}
      </span>
    </div>
  );
};

const SecurityNote = () => {
  return (
    <section className="codehorse-panel rounded-lg p-5">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success/10 text-success ring-1 ring-success/20">
          <ShieldCheck className="size-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Secure billing and GitHub access
          </h2>
          <p className="mt-2 text-base leading-7 text-muted-foreground">
            CodeHorse uses token-backed GitHub analytics and secure billing
            flows. Your GitHub credentials are never stored.
          </p>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-border bg-muted/40 p-3">
        <div className="flex items-center gap-2 text-base text-success">
          <FileClock className="size-3.5" />
          Audit-friendly workspace signals
        </div>
      </div>
    </section>
  );
};

export default SubscriptionPage;
