import { getPineconeIndex } from "@/lib/pinecone";
import { embed } from "ai";
import { google } from "@ai-sdk/google";

export async function generateEmbedding(
  text: string,
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT",
) {
  const { embedding } = await embed({
    model: google.embedding("gemini-embedding-001"),
    value: text,
    providerOptions: {
      google: {
        outputDimensionality: 768,
        taskType,
      },
    },
  });
  return embedding;
}

export async function indexCodebase(
  repoId: string,
  files: { path: string; content: string }[],
) {
  const pineconeIndex = getPineconeIndex();
  const vectors = [];
  const failedFiles: string[] = [];

  for (const file of files) {
    const content = `File: ${file.path}\n\n${file.content}`;
    const truncatedContent = content.slice(0, 8000);

    try {
      const embedding = await generateEmbedding(truncatedContent);

      vectors.push({
        id: `${repoId}-${file.path.replace(/\//g, "_")}`,
        values: embedding,
        metadata: {
          repoId,
          path: file.path,
          content: truncatedContent,
        },
      });
    } catch (e) {
      failedFiles.push(file.path);
      console.error(`Failed to embed ${file.path}:`, e);
    }
  }

  if (files.length > 0 && vectors.length === 0) {
    throw new Error("Embedding failed for every file. No vectors were upserted.");
  }

  if (vectors.length > 0) {
    const batchSize = 100;
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);

      await pineconeIndex.upsert({ records: batch });
    }
  }

  console.log("indexing complete");

  return {
    embeddedFiles: vectors.length,
    failedFiles: failedFiles.length,
    upsertedRecords: vectors.length,
  };
}

export async function retrieveContext(
  query: string,
  repoId: string,
  topK: number = 5,
) {
  const pineconeIndex = getPineconeIndex();
  const embedding = await generateEmbedding(query, "RETRIEVAL_QUERY");
  const results = await pineconeIndex.query({
    vector: embedding,
    filter: { repoId },
    topK,
    includeMetadata: true,
  });

  return results.matches
    .map((match) => match.metadata?.content as string)
    .filter(Boolean);
}
