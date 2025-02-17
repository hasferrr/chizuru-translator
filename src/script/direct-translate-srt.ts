import type { TranslateRawContentOptions } from "../types/types"
import { generateSRT } from "../utils/srt/generate"
import { parseSRT } from "../utils/srt/parse"
import { directTranslate } from "./direct-translate"

export async function translateSRT(options: TranslateRawContentOptions): Promise<string> {
  const subtitles = parseSRT(options.contentRaw)

  const translated = await directTranslate({
    ...options,
    subtitles,
  })

  const srt = generateSRT(translated)
  return srt
}
