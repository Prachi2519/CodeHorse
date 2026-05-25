"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export type ReviewStatus = "all" | "completed" | "failed" | "pending";

export type GetReviewsParams = {
  search?: string;
  status?: ReviewStatus;
  repositoryId?: string;
  take?: number;
};

export type ReviewListItem = {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryFullName: string;
  prNumber: number;
  prTitle: string;
  prUrl: string;
  review: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export async function getReviews(params: GetReviewsParams = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const search = params.search?.trim();
  const status = params.status && params.status !== "all" ? params.status : null;

  const reviews = await prisma.review.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(params.repositoryId ? { repositoryId: params.repositoryId } : {}),
      repository: {
        userId: session.user.id,
      },
      ...(search
        ? {
            OR: [
              { prTitle: { contains: search, mode: "insensitive" } },
              { review: { contains: search, mode: "insensitive" } },
              {
                repository: {
                  fullName: { contains: search, mode: "insensitive" },
                },
              },
            ],
          }
        : {}),
    },
    include: {
      repository: {
        select: {
          id: true,
          name: true,
          fullName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: params.take ?? 50,
  });

  return reviews.map<ReviewListItem>((review) => ({
    id: review.id,
    repositoryId: review.repositoryId,
    repositoryName: review.repository.name,
    repositoryFullName: review.repository.fullName,
    prNumber: review.prNumber,
    prTitle: review.prTitle,
    prUrl: review.prUrl,
    review: review.review,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  }));
}

export async function getReviewStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const [total, completed, failed, repositories] = await Promise.all([
    prisma.review.count({
      where: { repository: { userId: session.user.id } },
    }),
    prisma.review.count({
      where: {
        status: "completed",
        repository: { userId: session.user.id },
      },
    }),
    prisma.review.count({
      where: {
        status: "failed",
        repository: { userId: session.user.id },
      },
    }),
    prisma.repository.count({
      where: {
        userId: session.user.id,
        reviews: {
          some: {},
        },
      },
    }),
  ]);

  return {
    total,
    completed,
    failed,
    repositories,
  };
}
