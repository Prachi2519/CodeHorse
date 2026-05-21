"use server";
import {
  fetchUserContribution,
  type GitHubContributionCalendar,
  getGithubToken,
} from "@/module/github/lib/github";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";

export async function getContributionStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }

    const token = await getGithubToken();
    //get the actual github username from the github API
    const octokit = new Octokit({ auth: token });

    const { data: user } = await octokit.rest.users.getAuthenticated();
    const username = user.login;
    const calender = await fetchUserContribution(token, username);

    if (!calender) {
      return null;
    }

    const contributions = calender.weeks.flatMap(
      (week: GitHubContributionCalendar["weeks"][number]) =>
        week.contributionDays.map(
          (
            day: GitHubContributionCalendar["weeks"][number]["contributionDays"][number],
          ) => ({
            date: day.date,
            count: day.contributionCount,
            level: Math.min(4, Math.floor(day.contributionCount / 3)),
          }),
        ),
    );

    return {
      totalContributions: calender.totalContributions,
      contributions,
    };
  } catch (error) {
    console.error("Failed to fetch contribution stats:", error);
    return null;
  }
}

type SampleReview = {
  createdAt: Date;
};

const generateSampleReviews = () => {
  const sampleReviews: SampleReview[] = [];
  const now = new Date();

  // Generate random reviews over the past 6 months
  for (let i = 0; i < 45; i++) {
    const randomDaysAgo = Math.floor(Math.random() * 180); // Random day in last 6 months
    const reviewDate = new Date(now);
    reviewDate.setDate(reviewDate.getDate() - randomDaysAgo);

    sampleReviews.push({
      createdAt: reviewDate,
    });
  }

  return sampleReviews;
};

export async function getDashboardStats() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });

    //get users github username

    const { data: user } = await octokit.rest.users.getAuthenticated();

    //TODO: fetch total connected repo from db;
    const totalRepos = 30;

    //
    const calender = await fetchUserContribution(token, user.login);
    const totalCommits = calender?.totalContributions || 0;

    //count prs from database or github
    const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${user.login} type:pr`,
      per_page: 1,
    });
    const totalPRs = prs.total_count;

    // TODO: COUNT AI REVIEWS FROM DATABASE
    const totalReviews = 44;

    return {
      totalCommits,
      totalPRs,
      totalReviews,
      totalRepos,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalCommits: 0,
      totalPRs: 0,
      totalReviews: 0,
      totalRepos: 0,
    };
  }
}

export async function getMonthlyActivity() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      throw new Error("Unauthorized");
    }
    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.rest.users.getAuthenticated();
    const calender = await fetchUserContribution(token, user.login);

    if (!calender) {
      return [];
    }
    const monthlyData: {
      [key: string]: { commits: number; prs: number; reviews: number };
    } = {};
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // initialize last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = monthNames[date.getMonth()];
      monthlyData[monthKey] = { commits: 0, prs: 0, reviews: 0 };
    }

    calender.weeks.forEach(
      (week: GitHubContributionCalendar["weeks"][number]) => {
        week.contributionDays.forEach(
          (
            day: GitHubContributionCalendar["weeks"][number]["contributionDays"][number],
          ) => {
            const date = new Date(day.date);
            const monthKey = monthNames[date.getMonth()];
            if (monthlyData[monthKey]) {
              monthlyData[monthKey].commits += day.contributionCount;
            }
          },
        );
      },
    );

    // TODO: REVIEWS'S REAL DATA
    const reviews = generateSampleReviews();

    reviews.forEach((review) => {
      const monthKey = monthNames[review.createdAt.getMonth()];
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].reviews += 1;
      }
    });

    // TODO: PR'S REAL DATA
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
      q: `author:${user.login} type:pr created:>=${sixMonthsAgo.toISOString().split("T")[0]}`,
      per_page: 100,
    });

    prs.items.forEach((pr) => {
      const date = new Date(pr.created_at);
      const monthKey = monthNames[date.getMonth()];
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].prs += 1;
      }
    });

    return Object.keys(monthlyData).map((name) => ({
      name,
      ...monthlyData[name],
    }));
  } catch (error) {
    console.error("Failed to fetch monthly activity:", error);
    return [];
  }
}
