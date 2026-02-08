import { openai } from "@ai-sdk/openai";
import { embedMany, embed } from "ai";
import { prisma } from "@permits/database";

const CHUNK_SIZE = 500; // tokens approx (chars / 4)
const CHUNK_OVERLAP = 50;

/**
 * Generate embedding for a single text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });
  return embedding;
}

/**
 * Generate embeddings for multiple texts.
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const { embeddings } = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: texts,
  });
  return embeddings;
}

/**
 * Split text into overlapping chunks.
 */
export function chunkDocument(text: string, maxChars: number = CHUNK_SIZE * 4): string[] {
  const overlapChars = CHUNK_OVERLAP * 4;
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);

  let currentChunk = "";

  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChars && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap from end of previous chunk
      const overlap = currentChunk.slice(-overlapChars);
      currentChunk = overlap + "\n\n" + para;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + para;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Ingest a document: chunk it, generate embeddings, store in DB.
 */
export async function ingestDocument(
  title: string,
  content: string,
  sourceType: string,
  jurisdiction?: string
): Promise<string> {
  // Create the document
  const doc = await prisma.knowledgeDocument.create({
    data: {
      title,
      source: title.toLowerCase().replace(/\s+/g, "-"),
      sourceType,
      jurisdiction,
      content,
    },
  });

  // Chunk and embed
  const chunks = chunkDocument(content);
  const embeddings = await generateEmbeddings(chunks);

  // Store chunks with embeddings
  await prisma.knowledgeChunk.createMany({
    data: chunks.map((chunk, index) => ({
      content: chunk,
      chunkIndex: index,
      documentId: doc.id,
      metadata: { embedding: embeddings[index] },
    })),
  });

  return doc.id;
}
