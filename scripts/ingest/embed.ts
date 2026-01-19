import { openai } from '../../src/lib/openai'
import type { Chunk } from './chunk'

export interface ChunkWithEmbedding extends Chunk {
  embedding: number[]
}

const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 512 // Match Pinecone index dimension
const BATCH_SIZE = 100
const MAX_RETRIES = 3
const INITIAL_DELAY_MS = 1000

/**
 * Sleeps for the specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Embeds a batch of texts with retry logic.
 */
async function embedBatchWithRetry(texts: string[]): Promise<number[][]> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: texts,
        encoding_format: 'float',
        dimensions: EMBEDDING_DIMENSIONS,
      })

      return response.data.map((item) => item.embedding)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt < MAX_RETRIES) {
        const delay = INITIAL_DELAY_MS * Math.pow(2, attempt - 1)
        console.log(
          `[embed] Attempt ${attempt} failed, retrying in ${delay}ms...`
        )
        await sleep(delay)
      }
    }
  }

  throw lastError || new Error('Failed to embed batch after retries')
}

/**
 * Embeds chunks in batches using OpenAI text-embedding-3-small.
 * @param chunks Array of Chunk objects to embed
 * @returns Chunks with embeddings attached (512 dimensions each)
 */
export async function embedChunks(
  chunks: Chunk[]
): Promise<ChunkWithEmbedding[]> {
  if (chunks.length === 0) {
    return []
  }

  const results: ChunkWithEmbedding[] = []
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const batch = chunks.slice(i, i + BATCH_SIZE)

    console.log(`[embed] Embedding batch ${batchNum} of ${totalBatches}...`)

    const texts = batch.map((chunk) => chunk.text)
    const embeddings = await embedBatchWithRetry(texts)

    // Combine chunks with their embeddings
    for (let j = 0; j < batch.length; j++) {
      results.push({
        ...batch[j],
        embedding: embeddings[j],
      })
    }
  }

  console.log(`[embed] Complete. Embedded ${results.length} chunks.`)
  return results
}

// Run if executed directly
if (require.main === module) {
  // Test with sample chunks
  const testChunks: Chunk[] = [
    {
      id: 'test-1',
      text: 'Home health services are covered when the patient is homebound.',
      pageNumber: 1,
      section: '10 - Coverage',
      subsection: '10.1 - Eligibility',
    },
    {
      id: 'test-2',
      text: 'Skilled nursing services must be reasonable and necessary.',
      pageNumber: 2,
      section: '20 - Services',
      subsection: '20.1 - Skilled Nursing',
    },
    {
      id: 'test-3',
      text: 'The physician must certify that the patient meets criteria.',
      pageNumber: 3,
      section: '30 - Certification',
      subsection: '',
    },
  ]

  console.log('[embed] Testing with 3 sample chunks...')

  embedChunks(testChunks)
    .then((results) => {
      console.log(`\n[embed] Test results:`)
      for (const chunk of results) {
        console.log(`  ${chunk.id}: ${chunk.embedding.length} dimensions`)
      }

      // Verify dimensions
      const allCorrect = results.every((r) => r.embedding.length === 512)
      console.log(
        `\n[embed] All embeddings 512 dimensions: ${allCorrect ? 'YES' : 'NO'}`
      )
    })
    .catch((error) => {
      console.error(`[embed] Error: ${error.message}`)
      process.exit(1)
    })
}
