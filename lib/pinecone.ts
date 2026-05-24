import { Pinecone } from "@pinecone-database/pinecone";

export const hasPineconeConfig = () => {
  return Boolean(process.env.PINECONE_DB_API_KEY || process.env.PINECONE_API_KEY);
};

export const getPineconeIndex = () => {
  const apiKey = process.env.PINECONE_DB_API_KEY || process.env.PINECONE_API_KEY;

  if (!apiKey) {
    throw new Error(
      "PINECONE_DB_API_KEY is not configured. Add it to .env or use PINECONE_API_KEY.",
    );
  }

  const pinecone = new Pinecone({ apiKey });
  return pinecone.index(process.env.PINECONE_INDEX_NAME || "coderabbit");
};
