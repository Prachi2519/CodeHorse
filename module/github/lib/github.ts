import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

/**
 * getting the github access token
 *
 *
 */

export const getGithubToken = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    throw new Error("No github access token found");
  }

  return account.accessToken;
};

export type GitHubContributionCalendar = {
  totalContributions: number;
  weeks: {
    contributionDays: {
      contributionCount: number;
      date: string;
      color: string;
    }[];
  }[];
};

type GitHubContributionResponse = {
  user: {
    contributionsCollection: {
      contributionCalendar: GitHubContributionCalendar;
    };
  };
};

const getGitHubErrorStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : null;
};

export async function fetchUserContribution(token: string, username: string) {
  const octokit = new Octokit({ auth: token });

  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                contributionCount
                date
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    const response = await octokit.graphql<GitHubContributionResponse>(query, {
      username,
    });
    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    console.error("Failed to fetch user contributions:", error);
    return null;
  }
}

export const getRepositories = async (
  page: number = 1,
  perPage: number = 10,
) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    direction: "desc",
    visibility: "all",
    per_page: perPage,
    page: page,
  });
  return data;
};

export const getRepositoryAccess = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.rest.repos.get({
      owner,
      repo,
    });

    return {
      githubId: data.id,
      canManageWebhooks: Boolean(data.permissions?.admin),
    };
  } catch (error) {
    const status = getGitHubErrorStatus(error);

    if (status === 404) {
      return null;
    }

    throw error;
  }
};

export const createWebhook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

  if (!appBaseUrl) {
    throw new Error("NEXT_PUBLIC_APP_BASE_URL is not configured");
  }

  const webhookUrl = `${appBaseUrl.replace(/\/$/, "")}/api/webhooks/github`;
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET?.trim();
  const webhookConfig = {
    url: webhookUrl,
    content_type: "json" as const,
    ...(webhookSecret ? { secret: webhookSecret } : {}),
  };

  try {
    const { data: hooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo,
    });
    const existingHook = hooks.find((hook) => hook.config.url === webhookUrl);
    if (existingHook) {
      const { data: updatedHook } = await octokit.rest.repos.updateWebhook({
        owner,
        repo,
        hook_id: existingHook.id,
        config: webhookConfig,
        events: ["pull_request"],
        active: true,
      });
      return updatedHook;
    }
    const { data } = await octokit.rest.repos.createWebhook({
      owner,
      repo,
      config: webhookConfig,
      events: ["pull_request"],
      active: true,
    });

    return data;
  } catch (error) {
    const status = getGitHubErrorStatus(error);

    if (status === 403 || status === 404) {
      throw new Error(
        `GitHub would not allow webhook setup for ${owner}/${repo}. Make sure this GitHub account has repository admin access and has authorized webhook permissions.`,
      );
    }

    throw error;
  }
};

export const deleteWebhook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });
  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL?.trim();

  if (!appBaseUrl) {
    throw new Error("NEXT_PUBLIC_APP_BASE_URL is not configured");
  }

  const webhookUrl = `${appBaseUrl.replace(/\/$/, "")}/api/webhooks/github`;

  try {
    const { data: hooks } = await octokit.rest.repos.listWebhooks({
      owner,
      repo,
    });

    const hookToDelete = hooks.find((hook) => hook.config.url === webhookUrl);

    if (hookToDelete) {
      await octokit.rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: hookToDelete.id,
      });

      return true;
    }
    return false;
  } catch (error) {
    console.error("Error deleting webhook:", error);
    return false;
  }
};

export async function getRepoFileContents(
  token: string,
  owner: string,
  repo: string,
  path: string = "",
): Promise<{ path: string; content: string }[]> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
  });

  if (!Array.isArray(data)) {
    if (data.type === "file" && data.content) {
      return [
        {
          path: data.path,
          content: Buffer.from(data.content, "base64").toString("utf-8"),
        },
      ];
    }
    return [];
  }

  let files: { path: string; content: string }[] = [];

  for (const item of data) {
    if (item.type === "file") {
      const { data: fileData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: item.path,
      });

      if (
        !Array.isArray(fileData) &&
        fileData.type === "file" &&
        fileData.content &&
        !item.path.match(/\.(png|jpg|jpeg|gif|svg|ico|pdf|zip|tar|gz)$/i)
      ) {
        files.push({
          path: item.path,
          content: Buffer.from(fileData.content, "base64").toString("utf-8"),
        });
      }
    } else if (item.type === "dir") {
      const subFiles = await getRepoFileContents(token, owner, repo, item.path);
      files = files.concat(subFiles);
    }
  }

  return files;
}

export async function getPullRequestDiff(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
) {
  const octokit = new Octokit({ auth: token });

  const { data: pr } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });

  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff",
    },
  });

  return {
    diff: diff as unknown as string,
    title: pr.title,
    description: pr.body || "",
  };
}

export async function postReviewComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  review: string,
) {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: `## AI Code Review\n\n${review}\n\n---\n*Powered by CodeHorse*`,
  });

  return {
    id: data.id,
    url: data.html_url,
  };
}

export type PullRequestReviewInlineComment = {
  path: string;
  line: number;
  body: string;
};

export async function getPullRequestFiles(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
) {
  const octokit = new Octokit({ auth: token });
  const files = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return files;
}

export async function postPullRequestReview(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  comments: PullRequestReviewInlineComment[] = [],
) {
  const octokit = new Octokit({ auth: token });

  if (comments.length === 0) {
    return postReviewComment(token, owner, repo, prNumber, body);
  }

  const { data } = await octokit.rest.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event: "COMMENT",
    body,
    comments: comments.map((comment) => ({
      path: comment.path,
      line: comment.line,
      side: "RIGHT",
      body: comment.body,
    })),
  });

  return {
    id: data.id,
    url: data.html_url ?? `https://github.com/${owner}/${repo}/pull/${prNumber}`,
  };
}
