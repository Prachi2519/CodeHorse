"use server";

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { createWebhook, getRepositories } from "@/module/github/lib/github";

type GithubRepository = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  stargazers_count: number;
  language: string | null;
  topics?: string[];
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

  await createWebhook(owner, repo);

  return await prisma.repository.upsert({
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
};
