"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { reviewPullRequest } from "@/module/ai/actions";

export type ReviewStatus =
  | "all"
  | "completed"
  | "failed"
  | "pending"
  | "queued"
  | "running"
  | "skipped";

export type ReviewMode = "active" | "merge_recap" | "unknown";

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
  mode: ReviewMode;
  action: string;
  commentUrl: string | null;
  errorReason: string | null;
  createdAt: string;
  updatedAt: string;
};

const STALE_ACTIVE_REVIEW_MS = 15 * 60 * 1000;

const parseRunMeta = (reviewBody: string) => {
  const lines = reviewBody.split("\n");
  const values = new Map<string, string>();

  for (const line of lines) {
    if (!line.includes("=")) {
      continue;
    }
    const [rawKey, ...rawValue] = line.split("=");
    const key = rawKey.trim();
    const value = rawValue.join("=").trim();

    if (!key || !value) {
      continue;
    }
    values.set(key, value);
  }

  const modeRaw = values.get("mode");
  const mode: ReviewMode =
    modeRaw === "active" || modeRaw === "merge_recap" ? modeRaw : "unknown";

  return {
    mode,
    action: values.get("action") ?? "unknown",
    commentUrl: values.get("commentUrl") ?? null,
    errorReason: values.get("error") ?? null,
  };
};

const markStaleActiveReviewsAsFailed = async (userId: string) => {
  const staleBefore = new Date(Date.now() - STALE_ACTIVE_REVIEW_MS);
  const staleReviews = await prisma.review.findMany({
    where: {
      status: {
        in: ["queued", "running"],
      },
      updatedAt: {
        lt: staleBefore,
      },
      repository: {
        userId,
      },
    },
    select: {
      id: true,
      prNumber: true,
      review: true,
      repository: {
        select: {
          owner: true,
          name: true,
        },
      },
    },
  });

  if (staleReviews.length === 0) {
    return;
  }

  await prisma.$transaction(
    staleReviews.map((review) => {
      const meta = parseRunMeta(review.review);

      return prisma.review.update({
        where: {
          id: review.id,
        },
        data: {
          prTitle: `[Stale] PR #${review.prNumber}`,
          review: [
            "<!-- CODEHORSE_RUN -->",
            "status=failed",
            `mode=${meta.mode}`,
            `action=${meta.action}`,
            `owner=${review.repository.owner}`,
            `repo=${review.repository.name}`,
            `prNumber=${review.prNumber}`,
            `error=Review run became stale before completion. Queue the review again if you still need fresh analysis.`,
            `staleAt=${new Date().toISOString()}`,
          ].join("\n"),
          status: "failed",
        },
      });
    }),
  );
};

export async function getReviews(params: GetReviewsParams = {}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await markStaleActiveReviewsAsFailed(session.user.id);

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

  return reviews.map<ReviewListItem>((review) => {
    const meta = parseRunMeta(review.review);

    return {
      id: review.id,
      repositoryId: review.repositoryId,
      repositoryName: review.repository.name,
      repositoryFullName: review.repository.fullName,
      prNumber: review.prNumber,
      prTitle: review.prTitle,
      prUrl: review.prUrl,
      review: review.review,
      status: review.status,
      mode: meta.mode,
      action: meta.action,
      commentUrl: meta.commentUrl,
      errorReason: meta.errorReason,
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  });
}

export async function getReviewStats() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await markStaleActiveReviewsAsFailed(session.user.id);

  const [total, completed, failed, running, repositories] = await Promise.all([
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
    prisma.review.count({
      where: {
        status: { in: ["queued", "running"] },
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
    running,
    repositories,
  };
}

const parsePrIdentifier = (value: string) => {
  const url = value.trim();

  const urlMatch = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i);
  if (urlMatch) {
    return {
      owner: urlMatch[1],
      repo: urlMatch[2],
      prNumber: Number(urlMatch[3]),
      prUrl: `https://github.com/${urlMatch[1]}/${urlMatch[2]}/pull/${urlMatch[3]}`,
    };
  }

  const shortMatch = url.match(/^([^/\s]+)\/([^#\s]+)#(\d+)$/);
  if (shortMatch) {
    return {
      owner: shortMatch[1],
      repo: shortMatch[2],
      prNumber: Number(shortMatch[3]),
      prUrl: `https://github.com/${shortMatch[1]}/${shortMatch[2]}/pull/${shortMatch[3]}`,
    };
  }

  return null;
};

export async function requestManualReview(prIdentifier: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const parsed = parsePrIdentifier(prIdentifier);
  if (!parsed || !Number.isInteger(parsed.prNumber)) {
    return {
      success: false,
      message: "Use a GitHub PR URL or owner/repo#number format.",
    };
  }

  return await reviewPullRequest(parsed.owner, parsed.repo, parsed.prNumber, {
    action: "manual",
    merged: false,
    prUrl: parsed.prUrl,
  });
}
