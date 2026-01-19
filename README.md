# Compliance Copilot

An LLM-powered RAG system for CMS Medicare home health compliance. Answers questions about CMS guidelines with citations and checks visit notes against regulatory requirements.

## Important Limitations

**Not production-ready. Educational and demonstration purposes only.**

- **Not HIPAA compliant** - Do not use with real patient data
- **No PHI/PII protection** - All data flows through third-party LLM APIs
- **Requires your own infrastructure** - OpenAI API key, Pinecone index (1536 dimensions, cosine metric), and PostgreSQL database
- **Uses synthetic data** - Sample visit notes are fabricated for demonstration

To ingest real CMS documents, see [Document Ingestion](#document-ingestion) below.

## Architecture

RAG pipeline with offline ingestion and runtime retrieval:

```
OFFLINE: CMS PDF → Text Extraction → Chunking → Embeddings → Pinecone
RUNTIME: Query → Embed → Vector Search → Context → LLM → Streaming Response
COMPLIANCE: Visit Note → Claim Extraction → Requirement Retrieval → Judgment
```

**Critical Design Decision**: Ingestion runs offline (`npm run ingest`) to avoid serverless function timeouts. Runtime queries complete in 2-4 seconds via streaming SSE.

**Data Flow**:

1. PDF documents chunked with 200-token overlap to preserve context across boundaries
2. Each chunk embedded with `text-embedding-3-small` (1536 dimensions)
3. User queries embedded identically, top-k similarity search retrieves relevant chunks
4. Retrieved chunks injected into LLM context with source metadata for attribution

## Tech Stack

- **Runtime**: Next.js 14 App Router, TypeScript strict mode, Node.js 18+
- **LLM**: OpenAI `gpt-4o-mini` for generation
- **Embeddings**: OpenAI `text-embedding-3-small` (1536d)
- **Vector Store**: Pinecone (cosine similarity)
- **Cache/Rate Limiting**: Upstash Redis
- **Database**: PostgreSQL + Prisma ORM
- **UI**: shadcn/ui, Tailwind CSS

## Prerequisites

Required infrastructure:

- **OpenAI API key** - LLM and embeddings
- **Pinecone index** - 1536 dimensions, cosine metric (free Starter plan sufficient)
- **Upstash Redis** - Rate limiting and caching (free tier sufficient)
- **PostgreSQL** - Vercel Postgres, local, or Docker

## Quick Start

```bash
# Configure environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Setup database
npx prisma generate && npx prisma db push

# Ingest CMS documents (takes 2-5 minutes)
npm run ingest

# Run development server
npm run dev
```

**First-time setup requires running ingestion before the app is functional.** The vector database starts empty.

## Environment Variables

Core configuration (all required):

| Variable                   | Description                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| `OPENAI_API_KEY`           | OpenAI API key for LLM and embeddings                            |
| `PINECONE_API_KEY`         | Pinecone API key                                                 |
| `PINECONE_INDEX`           | Pinecone index name (create with 1536 dimensions, cosine metric) |
| `UPSTASH_REDIS_REST_URL`   | Upstash Redis REST URL                                           |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token                                         |
| `DATABASE_URL`             | PostgreSQL connection string                                     |
| `NEXT_PUBLIC_APP_URL`      | Application URL for client-side routing                          |

See [.env.example](.env.example) for optional configuration (rate limits, embedding batch size, etc.).

## Document Ingestion

The ingestion pipeline processes regulatory documents and populates the vector database. By default, it downloads CMS Medicare Benefit Policy Manual Chapter 7.

**How ingestion works**:

1. Downloads PDF from configured source URL
2. Extracts text and splits into chunks (1000 tokens, 200 token overlap)
3. Generates embeddings for each chunk via OpenAI
4. Uploads vectors to Pinecone with metadata (page numbers, section references)
5. Stores document metadata in PostgreSQL

**Run ingestion**:

```bash
npm run ingest
```

**Ingest your own documents**:

Edit [scripts/ingest/index.ts](scripts/ingest/index.ts) to point to your PDF URL:

```typescript
const DOCUMENT_SOURCE = {
  url: "https://your-cms-document.pdf",
  name: "Your Document Name",
  type: "cms_manual",
};
```

Or add new documents programmatically via `scripts/ingest/embed.ts` functions:

- `downloadAndProcessPdf(url, metadata)` - Download, chunk, and embed a PDF
- `chunkText(text, options)` - Split text into overlapping chunks
- `generateEmbeddings(chunks)` - Batch embed chunks
- `upsertToVectorStore(vectors, metadata)` - Upload to Pinecone

**Chunking strategy**: 1000 tokens with 200 token overlap prevents information loss at boundaries. Tune `CHUNK_SIZE` and `CHUNK_OVERLAP` in [scripts/ingest/embed.ts](scripts/ingest/embed.ts) based on your document structure.

## API Endpoints

### POST /api/query

RAG-based Q&A over CMS guidelines. Returns streaming SSE response.

```bash
curl -X POST http://localhost:3000/api/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are homebound status requirements?"}'
```

**Response**: SSE stream with answer chunks + source citations with page/section metadata.

### POST /api/compliance

Compliance check for visit notes. Extracts claims, retrieves requirements, judges against regulations.

```bash
curl -X POST http://localhost:3000/api/compliance \
  -H "Content-Type: application/json" \
  -d '{"visitNote": "Patient exhibits limited mobility..."}'
```

**Response**:

```typescript
{
  status: "PASS" | "FAIL" | "NEEDS_REVIEW",
  findings: Array<{
    category: string,
    status: "PASS" | "FAIL" | "NEEDS_REVIEW",
    finding: string,
    recommendation?: string,
    sources: Array<{ page: number, section: string, text: string }>
  }>
}
```

### GET /api/health

Service health check. Reports connectivity to OpenAI, Pinecone, Redis, PostgreSQL.

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── query/route.ts        # RAG Q&A endpoint (SSE streaming)
│   │   ├── compliance/route.ts   # Visit note compliance checker
│   │   └── health/route.ts       # Health check
│   ├── ask/page.tsx              # Q&A chat interface
│   └── compliance/page.tsx       # Compliance checker UI
├── lib/
│   ├── retrieval/
│   │   ├── embed.ts              # Embedding generation
│   │   └── query.ts              # Vector search + LLM orchestration
│   └── compliance/
│       └── judge.ts              # Compliance judgment logic
├── components/
│   ├── chat/                     # Chat UI components
│   └── compliance/               # Compliance UI components
scripts/
└── ingest/
    ├── index.ts                  # Ingestion entry point
    └── embed.ts                  # PDF processing, chunking, embedding
```

**Key modules**:

- [src/lib/retrieval/query.ts](src/lib/retrieval/query.ts) - Core RAG logic, vector search + LLM prompt construction
- [scripts/ingest/embed.ts](scripts/ingest/embed.ts) - Document processing pipeline
- [src/app/api/compliance/route.ts](src/app/api/compliance/route.ts) - Multi-stage compliance checking (claim extraction → requirement retrieval → judgment)

## Development

**Testing**:

```bash
npm run test        # Watch mode
npm run test:run    # Single run
```

Tests follow TDD principles. See [CLAUDE.md](CLAUDE.md) for development guidelines.

**Linting**:

```bash
npm run lint
```

## Deployment

**Vercel** (recommended for Next.js):

1. Connect GitHub repository to Vercel
2. Configure environment variables
3. Deploy

**Critical**: Run `npm run ingest` locally before first deploy to populate vector database. Ingestion cannot run in serverless functions due to execution time limits.

**Alternative platforms**: Any Node.js 18+ host with build command `npm run build` and start command `npm run start`.

## License

MIT
