import { promises as fs } from 'fs'
import * as path from 'path'
import { parseSRT } from './src/utils/srt/parse'
import { extractContextPartialJson, parseContextExtractionJSON } from './src/lib/context-extraction-partial/extraction-partial'
import { ContextManager } from './src/lib/context-extraction-partial/context-manager'
import { getFullResponse } from './src/utils/stream-response'

// --- Configuration ---
const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.fireworks.ai/inference/v1"
const MODEL = "accounts/fireworks/models/deepseek-v3"
const MAX_TOKENS = 40_000
const SUBTITLES_DIR = './subtitles'
const CONTEXT_FILE = './context-extracted/context-batch.txt'

// --- Helper Functions ---

// Function to read and parse an SRT file
async function readAndParseSRT(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const parsedSubtitles = parseSRT(data)

    // Format the subtitles into a single string
    let subtitleText = ""
    for (const sub of parsedSubtitles) {
      subtitleText += `${sub.content}\n`
    }

    return subtitleText

  } catch (error) {
    console.error(`Error reading or parsing SRT file ${filePath}:`, error)
    throw error // Re-throw the error
  }
}

// --- Main Loop ---

async function processSubtitles() {
  try {
    // Ensure output directory exists
    await fs.mkdir(path.dirname(CONTEXT_FILE), { recursive: true })

    const files = await fs.readdir(SUBTITLES_DIR)
    const srtFiles = files
      .filter(file => file.toLowerCase().endsWith('.srt'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

    if (srtFiles.length === 0) {
      console.log('No SRT files found in the subtitles directory.')
      return
    }

    for (const fileName of srtFiles) {
      console.log(fileName)
    }
    console.log()

    const contextManager = new ContextManager()

    for (let i = 0; i < srtFiles.length; i++) {
      const file = srtFiles[i]
      const episodeNumber = i + 1
      const filePath = path.join(SUBTITLES_DIR, file)

      console.log(`Processing episode ${episodeNumber}: ${file}`)

      const subtitleText = await readAndParseSRT(filePath)

      const input = {
        episode: episodeNumber,
        subtitle: subtitleText,
      }

      const response = await getFullResponse(
        await extractContextPartialJson({
          input,
          apiKey: API_KEY,
          baseURL: BASE_URL,
          model: MODEL,
          maxTokens: MAX_TOKENS,
        })
      )

      const extractedData = parseContextExtractionJSON(response)
      contextManager.updateContext(extractedData) // Update context
    }
    // write the final context
    await fs.writeFile(CONTEXT_FILE, contextManager.getContextString(), 'utf-8')
    console.log(`Final context written to ${CONTEXT_FILE}`)
    console.log('Subtitle processing complete.')

  } catch (error) {
    console.error('An error occurred during processing:', error)
  }
}

processSubtitles()
