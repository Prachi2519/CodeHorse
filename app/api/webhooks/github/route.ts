import { NextResponse, NextRequest } from "next/server";
import { reviewPullRequest } from "@/module/ai/actions";
import crypto from "crypto";
import prisma from "@/lib/db";

const REVIEWABLE_ACTIONS = new Set([
  "opened",
  "synchronize",
  "reopened",
  "ready_for_review",
]);

const verifySignature = (payload: string, signature: string | null) => {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error("GITHUB_WEBHOOK_SECRET is not configured");
  }

  if (!signature?.startsWith("sha256=")) {
    return false;
  }

  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;

  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signature, "utf8");

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
};

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-hub-signature-256");
    const event = req.headers.get("x-github-event");
    const deliveryId = req.headers.get("x-github-delivery");
    const payload = await req.text();

    if (!verifySignature(payload, signature)) {
      return NextResponse.json(
        { error: "Invalid GitHub webhook signature" },
        { status: 401 },
      );
    }

    const body = JSON.parse(payload);
    console.log(`Received GitHub event: ${event}`);

    if (event === "ping") {
      return NextResponse.json({ message: "Pong" }, { status: 200 });
    }

    if (event === "pull_request") {
      const action = body.action;
      const fullName = body.repository?.full_name;
      const prNumber = Number(body.pull_request?.number ?? body.number);
      const headSha = body.pull_request?.head?.sha;
      const baseSha = body.pull_request?.base?.sha;
      const isMergedPullRequest =
        action === "closed" && body.pull_request?.merged === true;

      if (!fullName || !Number.isInteger(prNumber) || !headSha || !baseSha) {
        return NextResponse.json(
          { error: "Invalid pull_request payload" },
          { status: 400 },
        );
      }

      const [owner, repoName] = fullName.split("/");

      if (!owner || !repoName) {
        return NextResponse.json(
          { error: "Invalid repository full_name" },
          { status: 400 },
        );
      }

      const shouldReview = REVIEWABLE_ACTIONS.has(action) || isMergedPullRequest;

      if (shouldReview) {
        const idempotencyKey = [
          deliveryId ?? "no-delivery-id",
          fullName,
          prNumber,
          action,
          headSha,
        ].join(":");

        const existingRun = await prisma.review.findFirst({
          where: {
            repository: {
              owner,
              name: repoName,
            },
            prNumber,
            review: {
              contains: `idempotency=${idempotencyKey}`,
              mode: "insensitive",
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        if (existingRun) {
          return NextResponse.json(
            {
              success: true,
              skipped: true,
              reason: "Duplicate delivery ignored",
              idempotencyKey,
            },
            { status: 200 },
          );
        }

        const result = await reviewPullRequest(owner, repoName, prNumber, {
          action,
          merged: isMergedPullRequest,
          prUrl: body.pull_request?.html_url,
          headSha,
          baseSha,
          deliveryId: deliveryId ?? undefined,
          idempotencyKey,
        });
        console.log(
          `Review queued for ${fullName} #${prNumber}:`,
          JSON.stringify(result),
        );

        if (!result.success) {
          return NextResponse.json(result, { status: 500 });
        }

        return NextResponse.json(result, { status: 200 });
      }

      return NextResponse.json(
        {
          action,
          merged: body.pull_request?.merged === true,
          message: `Ignored pull_request action: ${action}`,
        },
        { status: 200 },
      );
    }
    //TODO: HANDLE LATER

    return NextResponse.json({ message: "Event processed" }, { status: 200 });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
