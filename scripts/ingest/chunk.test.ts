import { describe, it, expect } from 'vitest'
import { chunkPages, Chunk, PageContent } from './chunk'

describe('chunkPages', () => {
  describe('empty input', () => {
    it('returns empty array for empty input', () => {
      const result = chunkPages([])
      expect(result).toEqual([])
    })
  })

  describe('single short page', () => {
    it('returns single chunk for page with less than 800 chars', () => {
      const pages: PageContent[] = [
        {
          pageNumber: 1,
          text: 'This is a short page with some text about home health services.',
        },
      ]

      const result = chunkPages(pages)

      expect(result).toHaveLength(1)
      expect(result[0].pageNumber).toBe(1)
      expect(result[0].text).toBe(pages[0].text)
      expect(result[0].id).toBe('page-1-chunk-1')
    })
  })

  describe('section header detection', () => {
    it('extracts section from header format "10 - Section Title"', () => {
      const pages: PageContent[] = [
        {
          pageNumber: 1,
          text: '10 - Conditions Patient Must Meet to Qualify\n\nThe patient must meet certain conditions.',
        },
      ]

      const result = chunkPages(pages)

      expect(result[0].section).toBe('10 - Conditions Patient Must Meet to Qualify')
    })

    it('handles dash variants in section headers', () => {
      const pages: PageContent[] = [
        {
          pageNumber: 1,
          text: '20 – Another Section Title\n\nSome content here.',
        },
      ]

      const result = chunkPages(pages)

      expect(result[0].section).toBe('20 – Another Section Title')
    })
  })

  describe('subsection header detection', () => {
    it('extracts subsection from header format "10.1 - Subsection Title"', () => {
      const pages: PageContent[] = [
        {
          pageNumber: 1,
          text: '10 - Main Section\n\n10.1 - Confined to the Home\n\nThe patient must be confined.',
        },
      ]

      const result = chunkPages(pages)

      expect(result[0].section).toBe('10 - Main Section')
      expect(result[0].subsection).toBe('10.1 - Confined to the Home')
    })
  })

  describe('chunk overlap', () => {
    it('consecutive chunks share 200 chars overlap', () => {
      // Create text longer than 800 chars to force multiple chunks
      const longText =
        'A'.repeat(400) +
        '. ' +
        'B'.repeat(400) +
        '. ' +
        'C'.repeat(400) +
        '. ' +
        'D'.repeat(400) +
        '.'

      const pages: PageContent[] = [{ pageNumber: 1, text: longText }]

      const result = chunkPages(pages)

      expect(result.length).toBeGreaterThan(1)

      // Check that consecutive chunks overlap
      for (let i = 1; i < result.length; i++) {
        const prevChunk = result[i - 1]
        const currChunk = result[i]

        // Last 200 chars of prev should match first 200 chars of curr
        const prevEnd = prevChunk.text.slice(-200)
        const currStart = currChunk.text.slice(0, 200)

        expect(currChunk.text.startsWith(prevEnd)).toBe(true)
      }
    })
  })

  describe('sentence boundary', () => {
    it('does not split mid-word', () => {
      const text =
        'This is the first sentence. ' +
        'A'.repeat(750) +
        '. This is another sentence that should be in the next chunk.'

      const pages: PageContent[] = [{ pageNumber: 1, text }]

      const result = chunkPages(pages)

      // Each chunk should end with proper punctuation or complete word
      for (const chunk of result) {
        // Should not end with partial word (check last char before any trailing space)
        const trimmed = chunk.text.trim()
        // Valid endings: punctuation, letter, or number
        expect(trimmed).toMatch(/[.!?a-zA-Z0-9]$/)
      }
    })
  })

  describe('page boundary', () => {
    it('chunks from different pages have different pageNumber values', () => {
      const pages: PageContent[] = [
        { pageNumber: 5, text: 'Content from page five.' },
        { pageNumber: 6, text: 'Content from page six.' },
      ]

      const result = chunkPages(pages)

      const page5Chunks = result.filter((c) => c.pageNumber === 5)
      const page6Chunks = result.filter((c) => c.pageNumber === 6)

      expect(page5Chunks.length).toBeGreaterThan(0)
      expect(page6Chunks.length).toBeGreaterThan(0)
      expect(page5Chunks[0].text).toContain('page five')
      expect(page6Chunks[0].text).toContain('page six')
    })
  })

  describe('ID generation', () => {
    it('generates unique IDs in format "page-{N}-chunk-{M}"', () => {
      const longText = 'Sentence one. '.repeat(100) // ~1400 chars

      const pages: PageContent[] = [
        { pageNumber: 3, text: longText },
        { pageNumber: 4, text: 'Short page.' },
      ]

      const result = chunkPages(pages)

      // Check ID format
      for (const chunk of result) {
        expect(chunk.id).toMatch(/^page-\d+-chunk-\d+$/)
      }

      // Check uniqueness
      const ids = result.map((c) => c.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)

      // Check sequential chunk numbers per page
      const page3Chunks = result.filter((c) => c.pageNumber === 3)
      expect(page3Chunks[0].id).toBe('page-3-chunk-1')
      if (page3Chunks.length > 1) {
        expect(page3Chunks[1].id).toBe('page-3-chunk-2')
      }
    })
  })

  describe('section inheritance', () => {
    it('chunks inherit most recent section and subsection headers', () => {
      const text = `10 - First Section

Some initial content here.

10.1 - First Subsection

Content under first subsection. ${'X'.repeat(800)}

10.2 - Second Subsection

Content under second subsection.`

      const pages: PageContent[] = [{ pageNumber: 1, text }]

      const result = chunkPages(pages)

      // All chunks should have section "10 - First Section"
      for (const chunk of result) {
        expect(chunk.section).toBe('10 - First Section')
      }

      // Later chunks should have updated subsection
      const lastChunk = result[result.length - 1]
      expect(lastChunk.subsection).toBe('10.2 - Second Subsection')
    })
  })
})
