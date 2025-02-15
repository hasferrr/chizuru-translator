import fs from 'fs'
import path from 'path'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { Subtitle, TranslateContentOptions } from '../types/types'
import { getFullResponse, translateSubtitles } from '../lib/translation/translator'
import { mergeTranslated, removeTimestamp } from '../utils/subtitle-utils'
import { getJson } from '../utils/parse-response'
import { generateSRT } from '../utils/srt/generate'
import { parseSRT } from '../utils/srt/parse'

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function translateSrtContent(options: TranslateContentOptions): Promise<string> {
  const { contentRaw, sourceLanguage, targetLanguage, contextDocument, split, apiKey, baseURL, model, temperature, maxTokens } = options

  // Make sure that the `log` directory exists
  if (!fs.existsSync('log')) {
    fs.mkdirSync('log')
  }
  fs.appendFileSync(path.join('log', 'response.log'), '\n' + '='.repeat(100))
  fs.appendFileSync(path.join('log', 'response.log'), '\n')

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
        contextDocument,
        apiKey,
        baseURL,
        model,
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

    if (i === 0) {
      // Log separator
      fs.appendFileSync(path.join('log', 'json.log'), '\n' + '='.repeat(100))
      fs.appendFileSync(path.join('log', 'context.log'), '\n' + '='.repeat(100))
      fs.appendFileSync(path.join('log', 'context.log'), '\n' + '[')
    }

    // Log json response and context messages
    fs.appendFileSync(path.join('log', 'json.log'), '\n' + JSON.stringify(json, null, 2))
    fs.appendFileSync(path.join('log', 'context.log'), '\n' + JSON.stringify(context.at(-2), null, 2) + ',')
    fs.appendFileSync(path.join('log', 'context.log'), '\n' + JSON.stringify(context.at(-1), null, 2) + ',')
  }

  // Close the log
  fs.appendFileSync(path.join('log', 'response.log'), '\n'.repeat(5))
  fs.appendFileSync(path.join('log', 'context.log'), '\n' + ']')

  // Parse the API response containing translated subtitle data
  const translated = translatedChunks.flat()
  fs.writeFileSync(path.join('log', 'translated.json'), JSON.stringify(translated, null, 2))

  // Generate new SRT content from the translated subtitles list
  const srt = generateSRT(mergeTranslated(subtitles, translated))
  return srt
}
