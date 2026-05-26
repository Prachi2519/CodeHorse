"use client";

import { ActivityCalendar } from "react-activity-calendar";
import { useQuery } from "@tanstack/react-query";
import { useTheme } from "next-themes";

import { getContributionStats } from "@/module/dashboard/actions";

const contributionTheme = {
  light: ["#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39"],
  dark: ["#161b22", "#0e4429", "#006d32", "#26a641", "#39d353"],
};

const ContributionGraph = () => {
  const { theme } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ["contribution-stats"],
    queryFn: async () => await getContributionStats(),
    staleTime: 1000 * 60,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="flex w-full flex-col items-center justify-center p-8">
        <div className="text-muted-foreground">Loading contributions...</div>
      </div>
    );
  }

  if (!data || !data.contributions.length) {
    return (
      <div className="flex w-full flex-col items-center justify-center p-8">
        <div className="text-muted-foreground">
          No contribution data available
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 p-4">
      <div className="text-sm text-muted-foreground">
        <span className="font-semibold text-foreground">
          {data.totalContributions}
        </span>{" "}
        contributions in the last year
      </div>

      <div className="w-full overflow-x-auto">
        <div className="flex min-w-max justify-center px-4">
          <ActivityCalendar
            data={data.contributions}
            colorScheme={theme === "dark" ? "dark" : "light"}
            theme={contributionTheme}
            tooltips={{
              activity: {
                text: (activity) =>
                  `${activity.count} contribution${activity.count === 1 ? "" : "s"} on ${activity.date}`,
                withArrow: true,
              },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
