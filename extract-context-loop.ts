import { promises as fs } from 'fs'
import path from 'path'
import { extractContext, getFullResponse } from './src/lib/context-extraction/extraction'
import { parseSRT } from './src/utils/srt/parse'
import type { ContextExtractionInput } from './src/types/types'
import { getContent } from './src/utils/parse-response'

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.fireworks.ai/inference/v1"
const MODEL = "accounts/fireworks/models/deepseek-v3"
const MAX_TOKENS = 40_000
const SUBTITLES_DIR = './subtitles'
const CONTEXT_DIR = './context-extracted'

// Function to read and parse an SRT file
async function readAndParseSRT(filePath: string): Promise<string> {
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    const parsedSubtitles = parseSRT(data)

    let subtitleText = ""
    for (const sub of parsedSubtitles) {
      subtitleText += `${sub.content}\n`
    }

    return subtitleText

  } catch (error) {
    console.error(`Error reading or parsing SRT file ${filePath}:`, error)
    throw error // Re-throw the error to be caught by the main loop
  }
}

// Function to write the context document to a file
async function writeContextToFile(context: string, episodeNumber: number): Promise<void> {
  const fileName = `context_episode_${episodeNumber}.txt`
  const filePath = path.join(CONTEXT_DIR, fileName)
  try {
    await fs.writeFile(filePath, context, 'utf-8')
    console.log(`Context for episode ${episodeNumber} written to ${filePath}`)
  } catch (error) {
    console.error(`Error writing context to file ${filePath}:`, error)
    throw error // Re-throw the error
  }
}

// --- Main Loop ---

async function processSubtitles() {
  try {
    await fs.mkdir(CONTEXT_DIR, { recursive: true })

    const files = await fs.readdir(SUBTITLES_DIR)
    const srtFiles = files
      .filter(file => file.toLowerCase().endsWith('.srt'))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));

    if (srtFiles.length === 0) {
      console.log('No SRT files found in the subtitles directory.')
      return
    }

    for (const fileName of srtFiles) {
      console.log(fileName)
    }
    console.log()

    let previousContext = "" // Start with an empty context

    for (let i = 0; i < srtFiles.length; i++) {
      const file = srtFiles[i]
      const episodeNumber = i + 1 // Episode numbers start at 1

      console.log(`Processing episode ${episodeNumber}: ${file}`)

      const filePath = path.join(SUBTITLES_DIR, file)
      const subtitleText = await readAndParseSRT(filePath)

      const input: ContextExtractionInput = {
        episode: episodeNumber,
        subtitle: subtitleText,
        previous_context: previousContext,
      }

      const updatedContext = getContent(
        await getFullResponse(
          await extractContext({
            input,
            apiKey: API_KEY,
            baseURL: BASE_URL,
            model: MODEL,
            maxTokens: MAX_TOKENS,
          })
        )
      )

      await writeContextToFile(updatedContext, episodeNumber)
      previousContext = updatedContext // Update for the next iteration
    }

    console.log('Subtitle processing complete.')
  } catch (error) {
    console.error('An error occurred during processing:', error)
  }
}

processSubtitles()
