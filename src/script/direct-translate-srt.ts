import fs from 'fs'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { Subtitle } from '../types/types'
import { getFullResponse, translateSubtitles } from '../translation/translator'
import { mergeTranslated, removeTimestamp } from '../utils/subtitle-utils'
import { getJson } from '../translation/parse-response'
import { generateSRT } from '../utils/srt/generate'
import { parseSRT } from '../utils/srt/parse'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

interface TranslateSrtContentOptions {
  contentRaw: string
  sourceLanguage: string
  targetLanguage: string
  split: number
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
}

export async function translateSrtContent(options: TranslateSrtContentOptions): Promise<string> {
  const { contentRaw, sourceLanguage, targetLanguage, split, baseURL, model, temperature, maxTokens } = options

  // Log the raw SRT content
  fs.appendFileSync('response.log', '\n'.repeat(5))
  fs.appendFileSync('response.log', '='.repeat(100))
  fs.appendFileSync('response.log', '\n')
  fs.appendFileSync('response.log', '='.repeat(100))
  fs.appendFileSync('response.log', '\n'.repeat(5))
  fs.appendFileSync('json.log', '\n' + '='.repeat(100))
  fs.appendFileSync('context.log', '\n' + '='.repeat(100))
  fs.appendFileSync('context.log', '\n' + '[')

  // Parse SRT content into subtitle objects
  const subtitles = parseSRT(contentRaw)

  // Split the subtitles into chunks of size variable
  const subtitleChunks: Subtitle[][] = []
  const size = split
  for (let i = 0; i < subtitles.length; i += size) {
    subtitleChunks.push(subtitles.slice(i, i + size))
  }

  // Translate each chunk of subtitles from Japanese to Indonesian
  const translatedChunks: ReturnType<typeof getJson>[] = []
  const context: ChatCompletionMessageParam[] = []
  for (let i = 0; i < subtitleChunks.length; i++) {
    const chunk = removeTimestamp(subtitleChunks[i])
    const chunkResponse = await getFullResponse(
      await translateSubtitles({
        subtitles: chunk,
        sourceLanguage,
        targetLanguage,
        baseURL,
        model,
        strict: true,
        temperature,
        maxTokens,
        contextMessage: context,
      })
    )
    const json = getJson(chunkResponse)
    translatedChunks.push(json)
    context.push({
      role: 'user',
      content: JSON.stringify(chunk)
    })
    context.push({
      role: 'assistant',
      content: JSON.stringify(json)
    })
    await sleep(300)
    fs.appendFileSync('json.log', '\n' + JSON.stringify(json, null, 2))
    fs.appendFileSync('context.log', '\n' + JSON.stringify(context.at(-2), null, 2) + ',')
    fs.appendFileSync('context.log', '\n' + JSON.stringify(context.at(-1), null, 2) + ',')
  }

  // Close the array in the log
  fs.appendFileSync('context.log', '\n' + ']')

  // Parse the API response containing translated subtitle data
  const translated = translatedChunks.flat()
  fs.writeFileSync('translated.json', JSON.stringify(translated, null, 2))

  // Generate new SRT content from the translated subtitles list
  const srt = generateSRT(mergeTranslated(subtitles, translated))
  return srt
}
