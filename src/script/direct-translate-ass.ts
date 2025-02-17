import type { TranslateRawContentOptions } from "../types/types"
import { mergeASSback } from "../utils/ass/merge"
import { parseASS } from "../utils/ass/parse"
import { directTranslate } from "./direct-translate"

export async function translateASS(options: TranslateRawContentOptions): Promise<string> {
  const parsed = parseASS(options.contentRaw)

  const translated = await directTranslate({
    ...options,
    subtitles: parsed.subtitles,
  })

  const merged = mergeASSback(translated, parsed)
  return merged
}
