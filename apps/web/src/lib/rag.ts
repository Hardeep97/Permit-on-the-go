import { prisma } from "@permits/database";
import { generateEmbedding } from "./embeddings";

/**
 * Cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Semantic search across knowledge chunks.
 * For MVP: loads embeddings from metadata JSON and computes cosine similarity.
 * For production: use pgvector extension for efficient similarity search.
 */
export async function semanticSearch(
  query: string,
  options: { jurisdiction?: string; limit?: number } = {}
): Promise<{ content: string; score: number; documentTitle: string }[]> {
  const { jurisdiction, limit = 5 } = options;

  try {
    const queryEmbedding = await generateEmbedding(query);

    // Fetch all chunks (for MVP — in production use pgvector)
    const where: Record<string, unknown> = {};
    if (jurisdiction) {
      where.document = { jurisdiction };
    }

    const chunks = await prisma.knowledgeChunk.findMany({
      where,
      include: {
        document: { select: { title: true, sourceType: true } },
      },
    });

    // Score each chunk
    const scored = chunks
      .map((chunk) => {
        const chunkEmbedding = (chunk.metadata as { embedding?: number[] })?.embedding;
        if (!chunkEmbedding) return null;

        const score = cosineSimilarity(queryEmbedding, chunkEmbedding);
        return {
          content: chunk.content,
          score,
          documentTitle: chunk.document.title,
        };
      })
      .filter(Boolean) as { content: string; score: number; documentTitle: string }[];

    // Sort by score and return top results
    return scored.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error("Semantic search error:", error);
    // Fallback: simple text search if embeddings fail
    return fallbackTextSearch(query, jurisdiction, limit);
  }
}

/**
 * Fallback text search when embeddings are unavailable.
 */
async function fallbackTextSearch(
  query: string,
  jurisdiction?: string,
  limit: number = 5
): Promise<{ content: string; score: number; documentTitle: string }[]> {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

  const where: Record<string, unknown> = {};
  if (jurisdiction) {
    where.document = { jurisdiction };
  }

  const chunks = await prisma.knowledgeChunk.findMany({
    where,
    include: {
      document: { select: { title: true } },
    },
  });

  // Simple word-overlap scoring
  const scored = chunks.map((chunk) => {
    const content = chunk.content.toLowerCase();
    const matchCount = words.filter((w) => content.includes(w)).length;
    return {
      content: chunk.content,
      score: matchCount / Math.max(words.length, 1),
      documentTitle: chunk.document.title,
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Build RAG context string from search results.
 */
export async function buildRAGContext(
  query: string,
  jurisdiction?: string
): Promise<string> {
  const results = await semanticSearch(query, { jurisdiction, limit: 3 });

  if (results.length === 0) return "";

  let context = "";
  for (const result of results) {
    context += `### From: ${result.documentTitle}\n${result.content}\n\n`;
  }

  return context;
}
