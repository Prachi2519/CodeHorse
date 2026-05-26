import { generateText } from "ai";
import { google } from "@ai-sdk/google";

import prisma from "@/lib/db";
import { retrieveContext } from "@/module/ai/lib/rag";
import {
  getPullRequestDiff,
  postPullRequestReview,
  postReviewComment,
  type PullRequestReviewInlineComment,
} from "@/module/github/lib/github";
import { inngest } from "../client";

type ReviewMode = "active" | "merge_recap";
type ReviewSeverity = "critical" | "high" | "medium" | "low";
type ReviewRisk = "low" | "medium" | "high";

type InlineFinding = {
  path: string;
  line: number;
  severity: ReviewSeverity;
  title: string;
  body: string;
  confidence?: "low" | "medium" | "high";
};

type StructuredReview = {
  summary: string;
  strengths: string[];
  criticalFindings: Array<{
    title: string;
    body: string;
    severity: ReviewSeverity;
    confidence?: "low" | "medium" | "high";
  }>;
  improvements: string[];
  riskLevel: ReviewRisk;
  mergeRecommendation: string;
  inlineFindings: InlineFinding[];
};

const sanitizeMarkdown = (value: string) => value.replace(/\u0000/g, "");

const stripJsonFence = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
};

const extractChangedLines = (diff: string) => {
  const files = new Map<string, Set<number>>();
  const lines = diff.split("\n");
  let currentPath: string | null = null;
  let newLineNumber = 0;

  for (const line of lines) {
    if (line.startsWith("diff --git ")) {
      const match = line.match(/^diff --git a\/.+ b\/(.+)$/);
      currentPath = match?.[1] ?? null;
      newLineNumber = 0;
      continue;
    }

    if (line.startsWith("+++ b/")) {
      currentPath = line.replace("+++ b/", "").trim();
      newLineNumber = 0;
      continue;
    }

    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      newLineNumber = Number(hunkMatch[1]);
      continue;
    }

    if (!currentPath || newLineNumber === 0) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      if (!files.has(currentPath)) {
        files.set(currentPath, new Set<number>());
      }
      files.get(currentPath)?.add(newLineNumber);
      newLineNumber += 1;
      continue;
    }

    if (line.startsWith("-") && !line.startsWith("---")) {
      continue;
    }

    newLineNumber += 1;
  }

  return files;
};

const toStructuredReview = (raw: string): StructuredReview => {
  const fallback: StructuredReview = {
    summary: "Review generated. Inline parsing failed, showing fallback summary.",
    strengths: ["Automated review generated successfully."],
    criticalFindings: [],
    improvements: [],
    riskLevel: "medium",
    mergeRecommendation: "Needs manual verification",
    inlineFindings: [],
  };

  try {
    const parsed = JSON.parse(stripJsonFence(raw)) as StructuredReview;
    return {
      summary: parsed.summary || fallback.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      criticalFindings: Array.isArray(parsed.criticalFindings)
        ? parsed.criticalFindings
        : [],
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
      riskLevel:
        parsed.riskLevel === "low" ||
        parsed.riskLevel === "medium" ||
        parsed.riskLevel === "high"
          ? parsed.riskLevel
          : "medium",
      mergeRecommendation:
        parsed.mergeRecommendation || fallback.mergeRecommendation,
      inlineFindings: Array.isArray(parsed.inlineFindings)
        ? parsed.inlineFindings.filter(
            (item) =>
              item &&
              typeof item.path === "string" &&
              Number.isInteger(Number(item.line)) &&
              typeof item.title === "string" &&
              typeof item.body === "string",
          )
        : [],
    };
  } catch {
    return fallback;
  }
};

const buildReviewMarkdown = (review: StructuredReview, mode: ReviewMode) => {
  if (mode === "merge_recap") {
    return sanitizeMarkdown(
      [
        "## Merge Recap",
        "",
        review.summary,
        "",
        `**Risk Level:** ${review.riskLevel}`,
        `**Merge Recommendation:** ${review.mergeRecommendation}`,
      ].join("\n"),
    );
  }

  const findings =
    review.criticalFindings.length === 0
      ? "- No critical findings detected."
      : review.criticalFindings
          .map(
            (item, index) =>
              `${index + 1}. **[${item.severity.toUpperCase()}] ${item.title}**\n   - ${item.body}${item.confidence ? `\n   - Confidence: ${item.confidence}` : ""}`,
          )
          .join("\n");

  const strengths =
    review.strengths.length === 0
      ? "- No explicit strengths identified."
      : review.strengths.map((item) => `- ${item}`).join("\n");

  const improvements =
    review.improvements.length === 0
      ? "- No improvements suggested."
      : review.improvements.map((item) => `- ${item}`).join("\n");

  return sanitizeMarkdown(
    [
      "## CodeHorse AI Review",
      "",
      `### Summary`,
      review.summary,
      "",
      `### Strengths`,
      strengths,
      "",
      `### Critical Findings`,
      findings,
      "",
      `### Improvements`,
      improvements,
      "",
      `### Decision`,
      `Risk level: **${review.riskLevel}**`,
      `Recommendation: **${review.mergeRecommendation}**`,
    ].join("\n"),
  );
};

const buildInlineComments = (
  review: StructuredReview,
  changedLines: Map<string, Set<number>>,
): PullRequestReviewInlineComment[] => {
  const comments: PullRequestReviewInlineComment[] = [];

  for (const finding of review.inlineFindings) {
    const path = finding.path.trim();
    const line = Number(finding.line);
    const allowedLines = changedLines.get(path);

    if (!path || !Number.isInteger(line) || line < 1 || !allowedLines) {
      continue;
    }
    if (!allowedLines.has(line)) {
      continue;
    }

    comments.push({
      path,
      line,
      body: `**[${finding.severity.toUpperCase()}] ${finding.title}**\n${finding.body}${finding.confidence ? `\n\nConfidence: ${finding.confidence}` : ""}`,
    });

    if (comments.length >= 12) {
      break;
    }
  }

  return comments;
};

const upsertRunSnapshot = async ({
  queuedReviewId,
  repositoryId,
  prNumber,
  status,
  reviewBody,
  prTitle,
}: {
  queuedReviewId?: string;
  repositoryId: string;
  prNumber: number;
  status: string;
  reviewBody: string;
  prTitle?: string;
}) => {
  if (queuedReviewId) {
    return prisma.review.update({
      where: { id: queuedReviewId },
      data: {
        ...(prTitle ? { prTitle } : {}),
        status,
        review: reviewBody,
      },
    });
  }

  const latest = await prisma.review.findFirst({
    where: {
      repositoryId,
      prNumber,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (latest) {
    return prisma.review.update({
      where: { id: latest.id },
      data: {
        ...(prTitle ? { prTitle } : {}),
        status,
        review: reviewBody,
      },
    });
  }

  return prisma.review.create({
    data: {
      repositoryId,
      prNumber,
      prTitle: prTitle ?? `PR #${prNumber}`,
      prUrl: "",
      review: reviewBody,
      status,
    },
  });
};

export const generateReview = inngest.createFunction(
  {
    id: "generate-review",
    concurrency: 5,
    triggers: [{ event: "pr.review.requested" }],
  },
  async ({ event, step }) => {
    const {
      owner,
      repo,
      prNumber,
      userId,
      action,
      merged,
      prUrl,
      headSha,
      baseSha,
      deliveryId,
      idempotencyKey,
      mode,
      queuedReviewId,
    } = event.data as Record<string, unknown>;

    const prNumberValue = Number(prNumber);
    const actionValue = typeof action === "string" ? action : "unknown";
    const isMergeRecap =
      mode === "merge_recap" ||
      (actionValue === "closed" && Boolean(merged) === true);
    const reviewMode: ReviewMode = isMergeRecap ? "merge_recap" : "active";
    const prUrlValue =
      typeof prUrl === "string" && prUrl.length > 0
        ? prUrl
        : `https://github.com/${owner}/${repo}/pull/${prNumberValue}`;
    const meta = {
      mode: reviewMode,
      action: actionValue,
      headSha: typeof headSha === "string" ? headSha : "unknown",
      baseSha: typeof baseSha === "string" ? baseSha : "unknown",
      deliveryId: typeof deliveryId === "string" ? deliveryId : "unknown",
      idempotencyKey:
        typeof idempotencyKey === "string" ? idempotencyKey : "unknown",
    };

    if (
      typeof owner !== "string" ||
      typeof repo !== "string" ||
      !Number.isInteger(prNumberValue) ||
      typeof userId !== "string"
    ) {
      return {
        success: false,
        skipped: true,
        reason:
          "pr.review.requested requires owner, repo, prNumber, and userId",
      };
    }

    const { accessToken, repositoryId } = await step.run(
      "resolve-account",
      async () => {
        const account = await prisma.account.findFirst({
          where: {
            userId,
            providerId: "github",
          },
        });

        const repository = await prisma.repository.findFirst({
          where: {
            owner,
            name: repo,
            userId,
          },
        });

        if (!account?.accessToken) {
          throw new Error("No GitHub access token found");
        }
        if (!repository) {
          throw new Error(`Repository ${owner}/${repo} is not connected`);
        }

        return {
          accessToken: account.accessToken,
          repositoryId: repository.id,
        };
      },
    );

    await step.run("mark-running", async () => {
      await upsertRunSnapshot({
        queuedReviewId: typeof queuedReviewId === "string" ? queuedReviewId : undefined,
        repositoryId,
        prNumber: prNumberValue,
        prTitle: `[Running] PR #${prNumberValue}`,
        status: "running",
        reviewBody: [
          "<!-- CODEHORSE_RUN -->",
          `status=running`,
          `mode=${meta.mode}`,
          `action=${meta.action}`,
          `headSha=${meta.headSha}`,
          `baseSha=${meta.baseSha}`,
          `deliveryId=${meta.deliveryId}`,
          `idempotency=${meta.idempotencyKey}`,
          `startedAt=${new Date().toISOString()}`,
        ].join("\n"),
      });
      return { status: "running" };
    });

    const { diff, title, description } = await step.run(
      "fetch-pr-data",
      async () => {
        const data = await getPullRequestDiff(
          accessToken,
          owner,
          repo,
          prNumberValue,
        );

        return {
          ...data,
          diffLength: data.diff.length,
        };
      },
    );

    const context = await step.run("retrieve-context", async () => {
      if (reviewMode === "merge_recap") {
        return [];
      }

      const query = `${title}\n${description || ""}`;
      return await retrieveContext(query, `${owner}/${repo}`);
    });

    const structuredReview = await step.run("generate-ai-review", async () => {
      if (reviewMode === "merge_recap") {
        const prompt = `You are a senior engineer writing a concise merge recap.

Repository: ${owner}/${repo}
Pull request: #${prNumberValue}
Title: ${title}
Description: ${description || "No description"}

Respond with ONLY JSON:
{
  "summary": "string",
  "strengths": ["string"],
  "criticalFindings": [],
  "improvements": ["string"],
  "riskLevel": "low|medium|high",
  "mergeRecommendation": "string",
  "inlineFindings": []
}
`;

        const { text } = await generateText({
          model: google("gemini-2.5-flash"),
          prompt,
        });

        return toStructuredReview(text);
      }

      const prompt = `You are a senior staff engineer performing code review.
Review only changed lines unless a cross-file impact is clear.
If uncertain, explicitly use low confidence.

Repository: ${owner}/${repo}
PR #${prNumberValue}
Title: ${title}
Description: ${description || "No description"}

Context:
${context.join("\n\n")}

Diff:
\`\`\`diff
${diff}
\`\`\`

Return ONLY valid JSON with this exact shape:
{
  "summary": "string",
  "strengths": ["string"],
  "criticalFindings": [
    { "title": "string", "body": "string", "severity": "critical|high|medium|low", "confidence": "low|medium|high" }
  ],
  "improvements": ["string"],
  "riskLevel": "low|medium|high",
  "mergeRecommendation": "Approve|Needs changes|Request follow-up",
  "inlineFindings": [
    {
      "path": "string",
      "line": 1,
      "severity": "critical|high|medium|low",
      "title": "string",
      "body": "string",
      "confidence": "low|medium|high"
    }
  ]
}
`;

      const { text } = await generateText({
        model: google("gemini-2.5-flash"),
        prompt,
      });

      return toStructuredReview(text);
    });

    const markdownReview = buildReviewMarkdown(structuredReview, reviewMode);
    const changedLines = extractChangedLines(diff);
    const inlineComments =
      reviewMode === "active"
        ? buildInlineComments(structuredReview, changedLines)
        : [];

    const comment = await step.run("post-comment", async () => {
      if (inlineComments.length > 0) {
        return await postPullRequestReview(
          accessToken,
          owner,
          repo,
          prNumberValue,
          markdownReview,
          inlineComments,
        );
      }

      return await postReviewComment(
        accessToken,
        owner,
        repo,
        prNumberValue,
        markdownReview,
      );
    });

    const savedReview = await step.run("save-review", async () => {
      const reviewBody = [
        "<!-- CODEHORSE_RUN -->",
        `status=completed`,
        `mode=${meta.mode}`,
        `action=${meta.action}`,
        `headSha=${meta.headSha}`,
        `baseSha=${meta.baseSha}`,
        `deliveryId=${meta.deliveryId}`,
        `idempotency=${meta.idempotencyKey}`,
        `commentUrl=${comment.url}`,
        "",
        markdownReview,
      ].join("\n");

      const record = await upsertRunSnapshot({
        queuedReviewId: typeof queuedReviewId === "string" ? queuedReviewId : undefined,
        repositoryId,
        prNumber: prNumberValue,
        prTitle: title,
        status: "completed",
        reviewBody,
      });

      if (!record.prUrl) {
        await prisma.review.update({
          where: { id: record.id },
          data: { prUrl: prUrlValue },
        });
      }

      return {
        reviewId: record.id,
      };
    });

    return {
      success: true,
      owner,
      repo,
      prNumber: prNumberValue,
      action: actionValue,
      merged: Boolean(merged),
      mode: reviewMode,
      reviewed: true,
      commentUrl: comment.url,
      reviewId: savedReview.reviewId,
      inlineComments: inlineComments.length,
    };
  },
);
