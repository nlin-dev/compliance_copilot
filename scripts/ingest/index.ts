import 'dotenv/config'
import { downloadPdf } from './download'
import { extractPages } from './extract'
import { chunkPages } from './chunk'
import { embedChunks } from './embed'
import { upsertChunks } from './upsert'

/**
 * Main ingestion pipeline.
 * Downloads CMS Medicare manual PDF, extracts text, chunks with metadata,
 * generates embeddings, and upserts to Pinecone.
 */
async function main() {
  const startTime = new Date()
  console.log('========================================')
  console.log('CMS Medicare Manual Ingestion Pipeline')
  console.log(`Started: ${startTime.toISOString()}`)
  console.log('========================================\n')

  try {
    // Step 1: Download PDF
    console.log('Step 1/5: Downloading PDF...')
    const pdfPath = await downloadPdf()
    console.log(`  PDF ready at: ${pdfPath}\n`)

    // Step 2: Extract text
    console.log('Step 2/5: Extracting text from PDF...')
    const pages = await extractPages(pdfPath)
    console.log(`  Extracted ${pages.length} pages\n`)

    // Step 3: Chunk text
    console.log('Step 3/5: Chunking text with metadata...')
    const chunks = chunkPages(pages)
    console.log(`  Created ${chunks.length} chunks\n`)

    // Step 4: Generate embeddings
    console.log('Step 4/5: Generating embeddings...')
    const chunksWithEmbeddings = await embedChunks(chunks)
    console.log(`  Generated ${chunksWithEmbeddings.length} embeddings\n`)

    // Step 5: Upsert to Pinecone
    console.log('Step 5/5: Upserting to Pinecone...')
    const upsertedCount = await upsertChunks(chunksWithEmbeddings)
    console.log(`  Upserted ${upsertedCount} vectors\n`)

    // Summary
    const endTime = new Date()
    const durationMs = endTime.getTime() - startTime.getTime()
    const durationSec = Math.round(durationMs / 1000)

    console.log('========================================')
    console.log('Ingestion Complete!')
    console.log('========================================')
    console.log(`  Pages extracted:   ${pages.length}`)
    console.log(`  Chunks created:    ${chunks.length}`)
    console.log(`  Vectors upserted:  ${upsertedCount}`)
    console.log(`  Duration:          ${durationSec} seconds`)
    console.log(`  Completed:         ${endTime.toISOString()}`)
    console.log('========================================')

    process.exit(0)
  } catch (error) {
    console.error('\n========================================')
    console.error('Ingestion Failed!')
    console.error('========================================')
    console.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`
    )
    console.error('========================================')
    process.exit(1)
  }
}

main()
