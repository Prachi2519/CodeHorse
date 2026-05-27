"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import {
  createWebhook,
  getRepositoryAccess,
  getRepositories,
} from "@/module/github/lib/github";
import { inngest } from "@/inngest/client";

type GithubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
  permissions?: {
    admin?: boolean;
  };
};

export const fetchRepositories = async (
  page: number = 1,
  perPage: number = 10,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) {
    throw new Error("Unauthorized");
  }
  const githubRepos = await getRepositories(page, perPage);
  const dbRepos = await prisma.repository.findMany({
    where: {
      userId: session.user.id,
    },
  });

  const connectedRepoIds = new Set(dbRepos.map((repo) => repo.githubId));

  return githubRepos.map((repo: GithubRepository) => ({
    ...repo,
    canManageWebhooks: Boolean(repo.permissions?.admin),
    isConnected: connectedRepoIds.has(BigInt(repo.id)),
  }));
};

export const connectRepository = async (
  owner: string,
  repo: string,
  githubId: number,
) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    throw new Error("Unauthorized");
  }

  //TODO: CHECK IF USERS CAN CONNECT MORE REPO

  try {
    const repositoryAccess = await getRepositoryAccess(owner, repo);

    if (!repositoryAccess || repositoryAccess.githubId !== githubId) {
      return {
        success: false,
        message: "GitHub could not verify access to this repository.",
      };
    }

    if (!repositoryAccess.canManageWebhooks) {
      return {
        success: false,
        message:
          "You need admin access to this GitHub repository before CodeHorse can connect webhooks.",
      };
    }

    const webhook = await createWebhook(owner, repo);

    if (webhook) {
      await prisma.repository.upsert({
        where: {
          githubId: BigInt(githubId),
        },
        update: {
          name: repo,
          owner,
          fullName: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
          userId: session.user.id,
        },
        create: {
          githubId: BigInt(githubId),
          name: repo,
          owner,
          fullName: `${owner}/${repo}`,
          url: `https://github.com/${owner}/${repo}`,
          userId: session.user.id,
        },
      });
    }
    //TODO: INCREMENT REPOSITORY COUNT FOR USAGE TRACKING

    //TODO: TRIGGER REPOSITORY INDEXING FOR RAG (FIRE AND FORGET)

    try {
      await inngest.send({
        name: "repository.connected",
        data: {
          owner,
          repo,
          userId: session.user.id,
        },
      });
    } catch (error) {
      console.error("Failed to trigger repository indexing:", error);
    }

    return {
      success: true,
      message: "Repository connected successfully",
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to connect repository.",
    };
  }
};
