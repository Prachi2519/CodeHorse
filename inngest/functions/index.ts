import { inngest } from "../client";
import prisma from "@/lib/db";
import { hasPineconeConfig } from "@/lib/pinecone";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";

export const indexRepo = inngest.createFunction(
  {
    id: "index-repo",
    triggers: [{ event: "repository.connected" }],
  },
  async ({ event, step }) => {
    const { owner, repo, userId } = event.data;

    if (!owner || !repo || !userId) {
      return {
        success: false,
        skipped: true,
        reason: "repository.connected event requires owner, repo, and userId",
      };
    }

    //files
    const files = await step.run("fetch-files", async () => {
      const account = await prisma.account.findFirst({
        where: {
          userId: userId,
          providerId: "github",
        },
      });

      if (!account?.accessToken) {
        throw new Error("No Github access token found");
      }
      return await getRepoFileContents(account.accessToken, owner, repo);
    });

    const indexResult = await step.run("index-codebase", async () => {
      if (!hasPineconeConfig()) {
        console.warn(
          "Skipping repository indexing because Pinecone is not configured.",
        );
        return {
          skipped: true,
          reason: "PINECONE_DB_API_KEY is not configured",
        };
      }

      await indexCodebase(`${owner}/${repo}`, files);
      return { skipped: false };
    });
    return {
      success: true,
      owner,
      repo,
      indexedFiles: files.length,
      indexResult,
    };
  },
);

export { generateReview } from "./review";
