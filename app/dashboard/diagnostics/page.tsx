"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Clock3 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getReviews } from "@/module/review/actions";

const DiagnosticsPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["review-diagnostics"],
    queryFn: async () => await getReviews({ take: 20 }),
    staleTime: 1000 * 20,
  });

  const runs = data ?? [];
  const latest = runs[0];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Diagnostics</h1>
      <Card>
        <CardHeader>
          <CardTitle>Latest Review Run</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : latest ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Repository:</span>{" "}
                {latest.repositoryFullName}
              </p>
              <p>
                <span className="font-medium">PR:</span> #{latest.prNumber}{" "}
                {latest.prTitle}
              </p>
              <p>
                <span className="font-medium">Status:</span> {latest.status}
              </p>
              <p>
                <span className="font-medium">Mode:</span> {latest.mode}
              </p>
              {latest.errorReason ? (
                <p className="text-rose-500">{latest.errorReason}</p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No runs yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Run Health</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant="outline">
            <CheckCircle2 className="size-3" />
            Completed: {runs.filter((item) => item.status === "completed").length}
          </Badge>
          <Badge variant="outline">
            <Clock3 className="size-3" />
            Running:{" "}
            {runs.filter((item) => item.status === "running" || item.status === "queued").length}
          </Badge>
          <Badge variant="outline">
            <AlertTriangle className="size-3" />
            Failed: {runs.filter((item) => item.status === "failed").length}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiagnosticsPage;
