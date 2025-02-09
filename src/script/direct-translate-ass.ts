import { mergeASSback } from "../utils/ass/merge"
import { parseASS } from "../utils/ass/parse"
import { parseSRT } from "../utils/srt/parse"
import { translateSrtContent } from "./direct-translate-srt"

interface TranslateAssContentOptions {
  assRaw: string
  sourceLanguage: string
  targetLanguage: string
  split: number
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
}

export async function translateAssContent(options: TranslateAssContentOptions): Promise<string> {
  const parsed = parseASS(options.assRaw)

  const translatedSrt = await translateSrtContent({
    ...options,
    srtRaw: parsed.output.join('\n'),
  })

  const merged = mergeASSback(parseSRT(translatedSrt), parsed)
  return merged
}
