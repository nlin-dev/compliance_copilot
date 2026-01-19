import { getComplianceIndex } from '../../src/lib/pinecone'
import type { ChunkWithEmbedding } from './embed'

export interface ChunkMetadata {
  text: string
  pageNumber: number
  section: string
  subsection: string
  [key: string]: string | number
}

const BATCH_SIZE = 100

/**
 * Upserts chunks with embeddings to Pinecone.
 * @param chunks Array of ChunkWithEmbedding objects to upsert
 * @returns Number of vectors upserted
 */
export async function upsertChunks(
  chunks: ChunkWithEmbedding[]
): Promise<number> {
  if (chunks.length === 0) {
    return 0
  }

  const index = getComplianceIndex()
  const totalBatches = Math.ceil(chunks.length / BATCH_SIZE)
  let totalUpserted = 0

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const batch = chunks.slice(i, i + BATCH_SIZE)

    console.log(`[upsert] Upserting batch ${batchNum} of ${totalBatches}...`)

    // Map chunks to Pinecone record format
    const records = batch.map((chunk) => ({
      id: chunk.id,
      values: chunk.embedding,
      metadata: {
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        section: chunk.section,
        subsection: chunk.subsection,
      } as ChunkMetadata,
    }))

    await index.upsert(records)
    totalUpserted += batch.length
  }

  console.log(`[upsert] Complete. Upserted ${totalUpserted} vectors.`)
  return totalUpserted
}

// Run if executed directly
if (require.main === module) {
  // Test with sample chunks (requires PINECONE_API_KEY and PINECONE_INDEX)
  const testChunks: ChunkWithEmbedding[] = [
    {
      id: 'test-upsert-1',
      text: 'Test chunk for upsert verification.',
      pageNumber: 1,
      section: 'Test Section',
      subsection: 'Test Subsection',
      embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
    },
    {
      id: 'test-upsert-2',
      text: 'Another test chunk for verification.',
      pageNumber: 2,
      section: 'Test Section',
      subsection: '',
      embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
    },
    {
      id: 'test-upsert-3',
      text: 'Third test chunk.',
      pageNumber: 3,
      section: '',
      subsection: '',
      embedding: new Array(1536).fill(0).map(() => Math.random() - 0.5),
    },
  ]

  console.log('[upsert] Testing with 3 sample chunks...')

  upsertChunks(testChunks)
    .then(async (count) => {
      console.log(`\n[upsert] Upserted ${count} vectors`)

      // Verify by querying
      console.log('[upsert] Verifying by fetching...')
      const index = getComplianceIndex()
      const fetchResult = await index.fetch(['test-upsert-1'])

      if (fetchResult.records['test-upsert-1']) {
        const metadata = fetchResult.records['test-upsert-1']
          .metadata as ChunkMetadata
        console.log('[upsert] Verified! Found vector with metadata:')
        console.log(`  text: ${metadata.text.substring(0, 50)}...`)
        console.log(`  pageNumber: ${metadata.pageNumber}`)
        console.log(`  section: ${metadata.section}`)
      } else {
        console.log('[upsert] Warning: Could not verify vector')
      }
    })
    .catch((error) => {
      console.error(`[upsert] Error: ${error.message}`)
      process.exit(1)
    })
}
