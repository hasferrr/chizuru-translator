import fs from 'fs'
import path from 'path'
import { extractContext } from './src/lib/context-extraction/extraction'
import { parseSRT } from './src/utils/srt/parse'
import { parseASS } from './src/utils/ass/parse'
import type { ContextExtractionInput } from './src/types/types'
import { getContent } from './src/utils/parse-response'
import { getFullResponse } from './src/utils/stream-response'

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.fireworks.ai/inference/v1"
const MODEL = "accounts/fireworks/models/deepseek-v3"
const MAX_TOKENS = 40_000
const INPUT_FILE = 'episode_10.ass'
const CONTEXT_DIR = './context-extracted'
const OUTPUT_FILE = path.join(CONTEXT_DIR, 'context_episode_10.txt')

async function processSubtitles() {
  const content = fs.readFileSync(INPUT_FILE, 'utf-8')

  let subtitle = ''
  const parsedSubtitles = parseSRT(parseASS(content).output.join('\n'))
  for (const sub of parsedSubtitles) {
    subtitle += `${sub.content}\n`
  }

  const previous_context = `` // context episode 1-9

  const input: ContextExtractionInput = {
    episode: 10,
    subtitle,
    previous_context,
  }

  const newContext = getContent(
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

  if (!fs.existsSync(CONTEXT_DIR)) {
    fs.mkdirSync(CONTEXT_DIR)
  }
  fs.writeFileSync(OUTPUT_FILE, newContext)
}

processSubtitles()
