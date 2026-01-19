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

const TARGET_CHUNK_SIZE = 800
const OVERLAP_SIZE = 200

// Regex to match section headers: "10 - Title" or "10.1 - Title" with various dash types
const SECTION_HEADER_REGEX = /^(\d+)\s*[-–—]\s*(.+)$/m
const SUBSECTION_HEADER_REGEX = /^(\d+\.\d+)\s*[-–—]\s*(.+)$/m

/**
 * Extracts section headers from text and returns them as full header strings.
 */
function extractHeaders(text: string): { section: string; subsection: string } {
  let section = ''
  let subsection = ''

  const lines = text.split('\n')

  for (const line of lines) {
    const trimmedLine = line.trim()

    // Check for subsection first (more specific)
    const subsectionMatch = trimmedLine.match(SUBSECTION_HEADER_REGEX)
    if (subsectionMatch) {
      subsection = trimmedLine
      continue
    }

    // Check for main section
    const sectionMatch = trimmedLine.match(SECTION_HEADER_REGEX)
    if (sectionMatch) {
      section = trimmedLine
      // Reset subsection when new main section found
      subsection = ''
    }
  }

  return { section, subsection }
}

/**
 * Splits text into sentences.
 */
function splitIntoSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by space or newline
  const sentences: string[] = []
  let current = ''

  for (let i = 0; i < text.length; i++) {
    current += text[i]

    // Check for sentence end
    if ('.!?'.includes(text[i])) {
      const nextChar = text[i + 1]
      // End sentence if followed by space, newline, or end of text
      if (!nextChar || /\s/.test(nextChar)) {
        sentences.push(current.trim())
        current = ''
      }
    }
  }

  // Add remaining text as final sentence
  if (current.trim()) {
    sentences.push(current.trim())
  }

  return sentences.filter((s) => s.length > 0)
}

/**
 * Tracks section state while processing text.
 */
interface SectionState {
  section: string
  subsection: string
}

/**
 * Updates section state based on text content.
 */
function updateSectionState(text: string, state: SectionState): SectionState {
  const headers = extractHeaders(text)

  return {
    section: headers.section || state.section,
    subsection: headers.subsection || state.subsection,
  }
}

/**
 * Chunks pages into overlapping segments with section metadata.
 * Target chunk size: 800 characters with 200 character overlap.
 */
export function chunkPages(pages: PageContent[]): Chunk[] {
  if (pages.length === 0) {
    return []
  }

  const chunks: Chunk[] = []

  // Track section state across pages
  let sectionState: SectionState = { section: '', subsection: '' }

  for (const page of pages) {
    let chunkNumber = 1
    const sentences = splitIntoSentences(page.text)

    if (sentences.length === 0) {
      continue
    }

    // Update section state for this page
    sectionState = updateSectionState(page.text, sectionState)

    // For short pages (< TARGET_CHUNK_SIZE), return single chunk
    if (page.text.length <= TARGET_CHUNK_SIZE) {
      chunks.push({
        id: `page-${page.pageNumber}-chunk-${chunkNumber}`,
        text: page.text,
        pageNumber: page.pageNumber,
        section: sectionState.section,
        subsection: sectionState.subsection,
      })
      continue
    }

    // Build chunks from sentences
    let currentChunk = ''
    let overlapBuffer = ''

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i]

      // Start with overlap from previous chunk
      if (currentChunk === '' && overlapBuffer) {
        currentChunk = overlapBuffer
      }

      // Add sentence
      const wouldBe = currentChunk + (currentChunk ? ' ' : '') + sentence

      // Check if adding this sentence exceeds target
      if (wouldBe.length > TARGET_CHUNK_SIZE && currentChunk.length > 0) {
        // Save current chunk
        // Update section state for text up to this chunk
        const chunkSectionState = updateSectionState(currentChunk, sectionState)

        chunks.push({
          id: `page-${page.pageNumber}-chunk-${chunkNumber}`,
          text: currentChunk,
          pageNumber: page.pageNumber,
          section: chunkSectionState.section || sectionState.section,
          subsection: chunkSectionState.subsection || sectionState.subsection,
        })

        chunkNumber++

        // Calculate overlap buffer (last ~OVERLAP_SIZE chars)
        overlapBuffer = currentChunk.slice(-OVERLAP_SIZE)

        // Start new chunk with overlap
        currentChunk = overlapBuffer + ' ' + sentence
      } else {
        currentChunk = wouldBe
      }

      // Track section headers in current chunk for state updates
      sectionState = updateSectionState(sentence, sectionState)
    }

    // Add final chunk if there's remaining content
    if (currentChunk.trim()) {
      chunks.push({
        id: `page-${page.pageNumber}-chunk-${chunkNumber}`,
        text: currentChunk.trim(),
        pageNumber: page.pageNumber,
        section: sectionState.section,
        subsection: sectionState.subsection,
      })
    }
  }

  return chunks
}
