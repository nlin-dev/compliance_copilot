import { Pinecone } from '@pinecone-database/pinecone'

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined
}

export const pinecone =
  globalForPinecone.pinecone ??
  new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPinecone.pinecone = pinecone
}

// Helper to get the compliance index
export function getComplianceIndex() {
  const indexName = process.env.PINECONE_INDEX
  if (!indexName) {
    throw new Error('PINECONE_INDEX environment variable is not set')
  }
  return pinecone.index(indexName)
}
