"use server";

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db";
import { getPullRequestDiff } from "@/module/github/lib/github";

type ReviewPullRequestOptions = {
  action?: string;
  merged?: boolean;
  prUrl?: string;
  headSha?: string;
  baseSha?: string;
  deliveryId?: string;
  idempotencyKey?: string;
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unknown Error";

const getReviewErrorMessage = (
  error: unknown,
  stage: "setup" | "github" | "event",
) => {
  const message = getErrorMessage(error);

  if (stage === "event" && message.toLowerCase().includes("fetch failed")) {
    return "Review runner is not reachable. Start the Inngest dev server with `npm run inngest` in another terminal, then queue the review again.";
  }

  if (stage === "github" && message.toLowerCase().includes("fetch failed")) {
    return "CodeHorse could not reach GitHub to verify this pull request. Check your network connection and try again.";
  }

  return message;
};

export async function reviewPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
  options: ReviewPullRequestOptions = {},
) {
  let failureStage: "setup" | "github" | "event" = "setup";
  let repositoryId: string | null = null;
  let queuedReviewId: string | null = null;

  try {
    if (!Number.isInteger(prNumber)) {
      throw new Error("Invalid pull request number");
    }

    const repository = await prisma.repository.findFirst({
      where: {
        owner,
        name: repo,
      },
      include: {
        user: {
          include: {
            accounts: {
              where: {
                providerId: "github",
              },
            },
          },
        },
      },
    });

    if (!repository) {
      throw new Error(
        `Repository ${owner}/${repo} not found in database. Please reconnect the repository.`,
      );
    }
    repositoryId = repository.id;
    const githubAccount = repository.user.accounts[0];

    if (!githubAccount?.accessToken) {
      throw new Error("No Github access token found for repository owner");
    }
    const token = githubAccount.accessToken;
    const prUrl =
      options.prUrl ?? `https://github.com/${owner}/${repo}/pull/${prNumber}`;
    const action = options.action ?? "manual";
    const mode =
      action === "closed" && options.merged ? "merge_recap" : "active";
    const headSha = options.headSha ?? "unknown";
    const baseSha = options.baseSha ?? "unknown";
    const deliveryId = options.deliveryId ?? "unknown";
    const idempotencyKey =
      options.idempotencyKey ??
      [deliveryId, owner, repo, prNumber, action, headSha].join(":");

    failureStage = "github";
    await getPullRequestDiff(token, owner, repo, prNumber);
    const queuedReview = await prisma.review.create({
      data: {
        repositoryId: repository.id,
        prNumber,
        prTitle: `${mode === "merge_recap" ? "[Merge Recap]" : "[Queued]"} PR #${prNumber}`,
        prUrl,
        review: [
          "<!-- CODEHORSE_RUN -->",
          `status=queued`,
          `mode=${mode}`,
          `action=${action}`,
          `owner=${owner}`,
          `repo=${repo}`,
          `prNumber=${prNumber}`,
          `headSha=${headSha}`,
          `baseSha=${baseSha}`,
          `deliveryId=${deliveryId}`,
          `idempotency=${idempotencyKey}`,
          `queuedAt=${new Date().toISOString()}`,
        ].join("\n"),
        status: "queued",
      },
    });
    queuedReviewId = queuedReview.id;

    failureStage = "event";
    const eventResponse = await inngest.send({
      name: "pr.review.requested",
      data: {
        owner,
        repo,
        prNumber,
        userId: repository.user.id,
        action,
        merged: options.merged ?? false,
        mode,
        prUrl,
        headSha,
        baseSha,
        deliveryId,
        idempotencyKey,
        queuedReviewId: queuedReview.id,
        triggeredAt: new Date().toISOString(),
      },
    });

    return {
      success: true,
      message: "Review queued",
      owner,
      repo,
      prNumber,
      action,
      merged: options.merged ?? false,
      mode,
      idempotencyKey,
      queuedReviewId: queuedReview.id,
      eventId:
        Array.isArray(eventResponse) && eventResponse.length > 0
          ? eventResponse[0]?.ids?.[0]
          : undefined,
    };
  } catch (error) {
    try {
      const repository =
        repositoryId !== null
          ? { id: repositoryId }
          : await prisma.repository.findFirst({
              where: { owner, name: repo },
              select: { id: true },
            });

      if (repository?.id) {
        const action = options.action ?? "manual";
        const mode =
          action === "closed" && options.merged ? "merge_recap" : "active";
        const headSha = options.headSha ?? "unknown";
        const deliveryId = options.deliveryId ?? "unknown";
        const idempotencyKey =
          options.idempotencyKey ??
          [deliveryId, owner, repo, prNumber, action, headSha].join(":");

        if (queuedReviewId) {
          await prisma.review.update({
            where: {
              id: queuedReviewId,
            },
            data: {
              prTitle: `[Failed] PR #${prNumber}`,
              prUrl:
                options.prUrl ??
                `https://github.com/${owner}/${repo}/pull/${prNumber}`,
              review: [
                "<!-- CODEHORSE_RUN -->",
                `status=failed`,
                `mode=${mode}`,
                `action=${action}`,
                `owner=${owner}`,
                `repo=${repo}`,
                `prNumber=${prNumber}`,
                `headSha=${headSha}`,
                `deliveryId=${deliveryId}`,
                `idempotency=${idempotencyKey}`,
                `error=${getReviewErrorMessage(error, failureStage)}`,
              ].join("\n"),
              status: "failed",
            },
          });
        } else {
          await prisma.review.create({
            data: {
              repositoryId: repository.id,
              prNumber,
              prTitle: `[Failed] PR #${prNumber}`,
              prUrl:
                options.prUrl ??
                `https://github.com/${owner}/${repo}/pull/${prNumber}`,
              review: [
                "<!-- CODEHORSE_RUN -->",
                `status=failed`,
                `mode=${mode}`,
                `action=${action}`,
                `owner=${owner}`,
                `repo=${repo}`,
                `prNumber=${prNumber}`,
                `headSha=${headSha}`,
                `deliveryId=${deliveryId}`,
                `idempotency=${idempotencyKey}`,
                `error=${getReviewErrorMessage(error, failureStage)}`,
              ].join("\n"),
              status: "failed",
            },
          });
        }
      }
    } catch (dbError) {
      console.error("Failed to save error to database:", dbError);
    }

    return {
      success: false,
      message: getReviewErrorMessage(error, failureStage),
    };
  }
}
