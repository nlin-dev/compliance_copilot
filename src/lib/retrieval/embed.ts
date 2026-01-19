import { openai } from '../openai'

const EMBEDDING_MODEL = 'text-embedding-3-small'

/**
 * Generates an embedding for a single query string.
 * @param query The query string to embed
 * @returns Array of 1536 numbers representing the embedding
 */
export async function embedQuery(query: string): Promise<number[]> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty')
  }

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: query.trim(),
  })

  const embedding = response.data[0]?.embedding
  if (!embedding) {
    throw new Error('Failed to generate embedding')
  }

  return embedding
}
