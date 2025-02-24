import fs from 'fs'
import path from 'path'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { Subtitle, TranslateSubtitleOption } from '../types/types'
import { translateSubtitles } from '../lib/translation/translator'
import { parseTranslationJson } from '../lib/translation/parser'
import { mergeTranslated, removeTimestamp } from '../utils/subtitle-utils'
import { getFullResponse } from '../utils/stream-response'

export async function directTranslate(options: TranslateSubtitleOption): Promise<Subtitle[]> {
  const { subtitles, sourceLanguage, targetLanguage, contextDocument, split, apiKey, baseURL, model, temperature, structuredOutput, maxCompletionTokens } = options

  // Make sure that the `log` directory exists
  if (!fs.existsSync('log')) {
    fs.mkdirSync('log')
  }
  fs.appendFileSync(path.join('log', 'response.log'), '\n' + '='.repeat(100))
  fs.appendFileSync(path.join('log', 'response.log'), '\n')

  // Split the subtitles into chunks of size variable
  const subtitleChunks: Subtitle[][] = []
  const size = split
  for (let i = 0; i < subtitles.length; i += size) {
    subtitleChunks.push(subtitles.slice(i, i + size))
  }

  // Translate each chunk of subtitles from Japanese to Indonesian
  const translatedChunks: ReturnType<typeof parseTranslationJson>[] = []
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
        maxCompletionTokens,
        structuredOutput,
        contextMessage: context,
      })
    )
    const json = parseTranslationJson(chunkResponse)
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

  // Merge the translated subtitles with the original subtitles to preserve timing information
  return mergeTranslated(subtitles, translated)
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
