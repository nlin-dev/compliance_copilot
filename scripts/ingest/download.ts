import fs from 'fs'
import path from 'path'

const CMS_PDF_URL =
  'https://www.cms.gov/Regulations-and-Guidance/Guidance/Manuals/Downloads/bp102c07.pdf'
const CACHE_DIR = path.join(process.cwd(), 'data')
const CACHE_PATH = path.join(CACHE_DIR, 'cms-manual.pdf')

/**
 * Downloads the CMS Medicare manual PDF and caches it locally.
 * Uses cached version if already downloaded.
 * @returns Path to the cached PDF file
 */
export async function downloadPdf(): Promise<string> {
  // Check if PDF is already cached
  if (fs.existsSync(CACHE_PATH)) {
    console.log(`[download] Using cached PDF: ${CACHE_PATH}`)
    return CACHE_PATH
  }

  // Create data directory if it doesn't exist
  if (!fs.existsSync(CACHE_DIR)) {
    console.log(`[download] Creating cache directory: ${CACHE_DIR}`)
    fs.mkdirSync(CACHE_DIR, { recursive: true })
  }

  console.log(`[download] Downloading PDF from CMS...`)
  console.log(`[download] URL: ${CMS_PDF_URL}`)

  try {
    const response = await fetch(CMS_PDF_URL)

    if (!response.ok) {
      throw new Error(
        `Failed to download PDF: ${response.status} ${response.statusText}`
      )
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    console.log(`[download] Downloaded ${buffer.length} bytes`)
    console.log(`[download] Saving to: ${CACHE_PATH}`)

    fs.writeFileSync(CACHE_PATH, buffer)

    console.log(`[download] PDF saved successfully`)
    return CACHE_PATH
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to download CMS manual: ${message}`)
  }
}

// Run if executed directly
if (require.main === module) {
  downloadPdf()
    .then((filePath) => {
      console.log(`\n[download] Complete. PDF at: ${filePath}`)
    })
    .catch((error) => {
      console.error(`[download] Error: ${error.message}`)
      process.exit(1)
    })
}
