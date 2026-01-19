# Compliance Copilot

An LLM-powered CMS Medicare home health compliance assistant that answers questions about CMS guidelines with source citations and checks visit notes for compliance issues.

## Features

- **Q&A Chat** - Ask questions about CMS Medicare home health guidelines and get answers with source citations
- **Compliance Checker** - Paste visit notes and get automated compliance checking against CMS requirements
- **Source Citations** - Every answer includes specific CMS section references
- **Dark Mode** - Full light/dark theme support

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **LLM**: OpenAI gpt-4o-mini
- **Embeddings**: OpenAI text-embedding-3-small
- **Vector Database**: Pinecone
- **Cache/Rate Limiting**: Upstash Redis
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: shadcn/ui + Tailwind CSS

## Prerequisites

- Node.js 18+
- npm or yarn
- API accounts for:
  - [OpenAI](https://platform.openai.com/api-keys) - For LLM and embeddings
  - [Pinecone](https://app.pinecone.io/) - Create a Starter (free) index with 1536 dimensions and cosine metric
  - [Upstash](https://console.upstash.com/) - Create a free Redis database
  - PostgreSQL database - [Vercel Postgres](https://vercel.com/storage/postgres), local install, or Docker

## Getting Started

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd compliance-copilot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and fill in your API keys and database URL.

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the ingestion script** (downloads and processes the CMS manual)
   ```bash
   npm run ingest
   ```
   This will download the CMS Medicare Benefit Policy Manual Chapter 7, chunk it, generate embeddings, and store them in Pinecone. Takes 2-5 minutes.

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | OpenAI API key for LLM and embeddings | Yes |
| `PINECONE_API_KEY` | Pinecone API key | Yes |
| `PINECONE_INDEX` | Pinecone index name (e.g., `compliance-copilot`) | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXT_PUBLIC_APP_URL` | Application URL (e.g., `http://localhost:3000`) | Yes |

See `.env.example` for the full list of optional configuration variables.

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run tests in watch mode |
| `npm run test:run` | Run tests once |
| `npm run ingest` | Download CMS manual and populate vector database |
| `npm run lint` | Run ESLint |

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        OFFLINE INGESTION                        │
│  CMS PDF → Text Extraction → Chunking → Embeddings → Pinecone   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         RUNTIME QUERY                           │
│  User Question → Embed → Retrieve from Pinecone → LLM → Answer  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      COMPLIANCE CHECK                           │
│  Visit Note → Extract Claims → Retrieve Requirements → Judge    │
└─────────────────────────────────────────────────────────────────┘
```

**Key Design Decision**: Ingestion runs offline via `npm run ingest` to avoid Vercel's 10-second function timeout. Runtime queries complete in 2-4 seconds.

## API Endpoints

### POST /api/query

Ask a question about CMS guidelines.

**Request:**
```json
{
  "question": "What are the homebound status requirements?"
}
```

**Response:** Server-Sent Events stream with answer chunks, followed by source citations.

### POST /api/compliance

Check a visit note for compliance issues.

**Request:**
```json
{
  "visitNote": "Patient visit documentation text..."
}
```

**Response:**
```json
{
  "status": "PASS" | "FAIL" | "NEEDS_REVIEW",
  "findings": [
    {
      "category": "homebound_status",
      "status": "PASS" | "FAIL" | "NEEDS_REVIEW",
      "finding": "Description of finding",
      "recommendation": "Suggested action if applicable",
      "sources": [{ "page": 1, "section": "10.1", "text": "..." }]
    }
  ]
}
```

### GET /api/health

Health check endpoint that reports service connectivity status.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

**Important**: Run `npm run ingest` locally before deploying to populate the vector database.

### Manual Deployment

The application can be deployed to any platform that supports Node.js 18+:

```bash
npm run build
npm run start
```

Ensure all environment variables are set and the database is accessible.

## License

MIT
