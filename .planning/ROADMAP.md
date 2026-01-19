# Roadmap: Compliance Copilot

## Overview

Build an LLM-powered CMS Medicare home health compliance assistant from the ground up. Start with project foundation and infrastructure, then create the offline PDF ingestion pipeline to populate the vector database. Build the RAG-based query API for Q&A, then the compliance checking API for visit notes. Implement the frontend chat and compliance interfaces, and finish with polish and deployment.

## Domain Expertise

None

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Foundation** - Next.js 14 setup with security, rate limiting, and service clients
- [x] **Phase 2: Ingestion** - PDF processing and vector embedding pipeline
- [x] **Phase 3: Query API** - RAG-based Q&A with streaming and caching
- [x] **Phase 4: Compliance API** - Visit note compliance checking with structured output
- [ ] **Phase 5: Frontend** - Chat interface and compliance UI
- [ ] **Phase 6: Polish** - Loading states, SEO, and deployment

## Phase Details

### Phase 1: Foundation
**Goal**: Establish project infrastructure with Next.js 14, security middleware, rate limiting, and all service client singletons
**Depends on**: Nothing (first phase)
**Research**: Likely (Next.js 14 App Router, shadcn/ui, Upstash Redis, Prisma)
**Research topics**: Next.js 14 App Router patterns, shadcn/ui setup, Upstash rate limiting, Prisma schema patterns, Edge middleware configuration
**Plans**: TBD

### Phase 2: Ingestion
**Goal**: Build offline PDF ingestion pipeline that downloads CMS manual, extracts text, chunks with metadata, embeds, and upserts to Pinecone
**Depends on**: Phase 1 (needs OpenAI and Pinecone clients)
**Research**: Likely (OpenAI embeddings API, Pinecone upsert patterns)
**Research topics**: text-embedding-3-small batch embedding, Pinecone metadata schema, pdf-parse usage
**Plans**: TBD

### Phase 3: Query API
**Goal**: POST /api/query endpoint with embedding, retrieval, MMR reranking, streaming LLM response, caching, and audit logging
**Depends on**: Phase 2 (needs populated vector database)
**Research**: Likely (OpenAI streaming, Pinecone retrieval)
**Research topics**: gpt-4o-mini streaming with OpenAI SDK, Pinecone query with metadata filtering, response caching patterns
**Plans**: TBD

### Phase 4: Compliance API
**Goal**: POST /api/compliance endpoint that extracts claims from visit notes, retrieves requirements, and returns structured compliance findings
**Depends on**: Phase 3 (shares retrieval patterns)
**Research**: Likely (OpenAI structured output)
**Research topics**: OpenAI function calling or JSON mode for structured compliance output
**Plans**: TBD

### Phase 5: Frontend
**Goal**: Chat interface with streaming messages, source citations, and compliance page with note input and findings display
**Depends on**: Phase 3 & 4 (needs working APIs)
**Research**: Likely (Vercel AI SDK, TanStack Query)
**Research topics**: Vercel AI SDK useChat hook, TanStack Query patterns, shadcn/ui component usage
**Plans**: TBD

### Phase 6: Polish
**Goal**: Loading skeletons, SEO metadata, README documentation, Vercel deployment, and final testing
**Depends on**: Phase 5 (needs complete UI)
**Research**: Unlikely (internal polish, established patterns)
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 6/6 | Complete | 2026-01-19 |
| 2. Ingestion | 3/3 | Complete | 2026-01-19 |
| 3. Query API | 2/2 | Complete | 2026-01-19 |
| 4. Compliance API | 2/2 | Complete | 2026-01-19 |
| 5. Frontend | 0/TBD | Not started | - |
| 6. Polish | 0/TBD | Not started | - |
