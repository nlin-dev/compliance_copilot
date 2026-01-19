import fs from 'fs'
import { PDFParse } from 'pdf-parse'

export interface PageContent {
  pageNumber: number
  text: string
}

/**
 * Extracts text content from each page of a PDF file.
 * @param pdfPath Path to the PDF file
 * @returns Array of PageContent objects with page number and text
 */
export async function extractPages(pdfPath: string): Promise<PageContent[]> {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`)
  }

  const dataBuffer = fs.readFileSync(pdfPath)

  // Create PDF parser with buffer data
  const parser = new PDFParse({
    data: new Uint8Array(dataBuffer),
  })

  try {
    // Extract text from all pages
    const textResult = await parser.getText()

    // Map to our PageContent format
    const pages: PageContent[] = textResult.pages.map((page) => ({
      pageNumber: page.num,
      text: page.text.trim(),
    }))

    return pages
  } finally {
    // Clean up parser resources
    await parser.destroy()
  }
}

// Run if executed directly
if (require.main === module) {
  const path = process.argv[2] || './data/cms-manual.pdf'

  console.log(`[extract] Extracting text from: ${path}`)

  extractPages(path)
    .then((pages) => {
      console.log(`\n[extract] Extracted ${pages.length} pages\n`)

      // Show sample from first 3 pages
      for (let i = 0; i < Math.min(3, pages.length); i++) {
        const page = pages[i]
        const preview = page.text.substring(0, 200).replace(/\n/g, ' ')
        console.log(`Page ${page.pageNumber}: ${preview}...`)
        console.log('')
      }

      console.log(`[extract] Complete. Total pages: ${pages.length}`)
    })
    .catch((error) => {
      console.error(`[extract] Error: ${error.message}`)
      process.exit(1)
    })
}
