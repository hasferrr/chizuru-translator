import fs from 'fs'
import path from 'path'
import { extractContext } from './src/lib/context-extraction/extraction'
import { parseSRT } from './src/utils/srt/parse'
import { parseASS } from './src/utils/ass/parse'
import type { ContextExtractionInput } from './src/types/types'
import { getContent } from './src/utils/response-utils'
import { getFullResponse } from './src/utils/stream-response'
import { removeTimestamp } from './src/utils/subtitle-utils'

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.deepseek.com"
const MODEL = "deepseek-chat"
const MAX_TOKENS = 40_000
const INPUT_FILE = 'sample.ass'
const CONTEXT_DIR = './context-extracted'
const OUTPUT_FILE = path.join(CONTEXT_DIR, 'context_sample.txt')

async function processSubtitles() {
  const content = fs.readFileSync(INPUT_FILE, 'utf-8')

  const subtitles = removeTimestamp(
    content.startsWith('[Script Info]')
      ? parseASS(content).subtitles
      : parseSRT(content))

  const previous_context = ""

  const input: ContextExtractionInput = {
    episode: "10",
    subtitles,
    previous_context,
  }

  const newContext = getContent(
    await getFullResponse(
      await extractContext({
        input,
        apiKey: API_KEY,
        baseURL: BASE_URL,
        model: MODEL,
        maxCompletionTokens: MAX_TOKENS,
      }),
      'response-extraction.log',
    )
  )

  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR)
  }
  fs.writeFileSync(OUTPUT_FILE, newContext)
}

processSubtitles()
