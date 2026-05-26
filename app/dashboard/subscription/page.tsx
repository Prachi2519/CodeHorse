"use client";

import { useState } from "react";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SubscriptionPage = () => {
  const [currentPlan, setCurrentPlan] = useState<"free" | "pro">("free");
  const [pendingPlan, setPendingPlan] = useState<"free" | "pro" | null>(null);

  const handlePlanChange = async (targetPlan: "free" | "pro") => {
    if (targetPlan === currentPlan || pendingPlan) return;

    setPendingPlan(targetPlan);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1200));
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

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Subscription</h1>
        <p className="text-muted-foreground">
          Choose the plan that fits your code review workflow.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className={currentPlan === "free" ? "border-primary" : ""}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle>Free</CardTitle>
              {currentPlan === "free" ? <Badge>Current Plan</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Perfect to explore CodeHorse and run basic AI reviews.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              $0
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Basic repository indexing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Standard review summaries
              </li>
            </ul>
            <Button
              className="w-full"
              disabled={currentPlan === "free" || pendingPlan !== null}
              onClick={() => handlePlanChange("free")}
              variant="outline"
            >
              {pendingPlan === "free" ? "Switching..." : "Switch to Free"}
            </Button>
          </CardContent>
        </Card>

        <Card className={currentPlan === "pro" ? "border-primary" : ""}>
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                Pro
                <Sparkles className="size-4 text-amber-500" />
              </CardTitle>
              {currentPlan === "pro" ? <Badge>Current Plan</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Deep AI review pipeline with richer insights and priority support.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              $19
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Inline AI code suggestions
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                Faster indexing and run diagnostics
              </li>
            </ul>
            <Button
              className="w-full"
              disabled={currentPlan === "pro" || pendingPlan !== null}
              onClick={() => handlePlanChange("pro")}
            >
              {pendingPlan === "pro" ? "Upgrading..." : "Upgrade to Pro"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubscriptionPage;
