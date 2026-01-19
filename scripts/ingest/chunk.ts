export interface Chunk {
  id: string
  text: string
  pageNumber: number
  section: string
  subsection: string
}

export interface PageContent {
  pageNumber: number
  text: string
}

/**
 * Chunks pages into overlapping segments with section metadata.
 * Target chunk size: 800 characters with 200 character overlap.
 */
export function chunkPages(pages: PageContent[]): Chunk[] {
  // TODO: Implement
  throw new Error('Not implemented')
}
