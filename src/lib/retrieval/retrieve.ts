import { getComplianceIndex } from '../pinecone'

export interface RetrievalResult {
  text: string
  pageNumber: number
  section: string
  subsection: string
  score: number
}

interface PineconeMatch {
  id: string
  score?: number
  values?: number[]
  metadata?: {
    text: string
    pageNumber: number
    section: string
    subsection: string
  }
}

const DEFAULT_TOP_K = 5
const DEFAULT_SCORE_THRESHOLD = 0.7
const RELEVANCE_WEIGHT = 0.7 // λ in MMR formula

/**
 * Computes cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  if (normA === 0 || normB === 0) {
    return 0
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Applies Maximal Marginal Relevance (MMR) reranking to select diverse results.
 * MMR(d) = λ * sim(d, query) - (1-λ) * max(sim(d, selected))
 */
function applyMMR(
  matches: PineconeMatch[],
  topK: number
): PineconeMatch[] {
  if (matches.length === 0) {
    return []
  }

  // Filter matches that have values (embeddings) for MMR calculation
  const matchesWithVectors = matches.filter((m) => m.values && m.values.length > 0)

  // If no vectors available, fall back to score-based selection
  if (matchesWithVectors.length === 0) {
    return matches.slice(0, topK)
  }

  const selected: PineconeMatch[] = []
  const remaining = [...matchesWithVectors]

  // Start with the highest scoring document
  remaining.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
  selected.push(remaining.shift()!)

  // Select remaining documents using MMR
  while (selected.length < topK && remaining.length > 0) {
    let bestScore = -Infinity
    let bestIndex = 0

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i]
      const relevanceScore = candidate.score ?? 0

      // Find max similarity to already selected documents
      let maxSimilarityToSelected = 0
      for (const selectedDoc of selected) {
        if (candidate.values && selectedDoc.values) {
          const similarity = cosineSimilarity(candidate.values, selectedDoc.values)
          maxSimilarityToSelected = Math.max(maxSimilarityToSelected, similarity)
        }
      }

      // MMR score: λ * relevance - (1-λ) * max_similarity_to_selected
      const mmrScore =
        RELEVANCE_WEIGHT * relevanceScore -
        (1 - RELEVANCE_WEIGHT) * maxSimilarityToSelected

      if (mmrScore > bestScore) {
        bestScore = mmrScore
        bestIndex = i
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0])
  }

  return selected
}

/**
 * Retrieves relevant chunks from Pinecone with MMR reranking.
 * @param queryEmbedding The embedding vector of the query
 * @param topK Number of results to return (default 5)
 * @param scoreThreshold Minimum score threshold (default 0.70)
 * @returns Array of RetrievalResult sorted by relevance with diversity
 */
export async function retrieveChunks(
  queryEmbedding: number[],
  topK: number = DEFAULT_TOP_K,
  scoreThreshold: number = DEFAULT_SCORE_THRESHOLD
): Promise<RetrievalResult[]> {
  const index = getComplianceIndex()

  // Fetch more results than needed for MMR selection
  const fetchK = topK * 2

  const queryResponse = await index.query({
    vector: queryEmbedding,
    topK: fetchK,
    includeMetadata: true,
    includeValues: true,
  })

  const matches = (queryResponse.matches ?? []) as PineconeMatch[]

  // Filter by score threshold
  const filteredMatches = matches.filter(
    (match) => (match.score ?? 0) >= scoreThreshold
  )

  // Apply MMR reranking
  const rankedMatches = applyMMR(filteredMatches, topK)

  // Map to RetrievalResult format
  return rankedMatches.map((match) => ({
    text: match.metadata?.text ?? '',
    pageNumber: match.metadata?.pageNumber ?? 0,
    section: match.metadata?.section ?? '',
    subsection: match.metadata?.subsection ?? '',
    score: match.score ?? 0,
  }))
}
