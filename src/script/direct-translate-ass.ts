import type { TranslateRawContentOptions } from "../types/types"
import { mergeASSback } from "../utils/ass/merge"
import { parseASS } from "../utils/ass/parse"
import { translateSubtitle } from "./direct-translate"

export async function translateASS(options: TranslateRawContentOptions): Promise<string> {
  const parsed = parseASS(options.contentRaw)

  const translated = await translateSubtitle({
    ...options,
    subtitles: parsed.subtitles,
  })

  const merged = mergeASSback(translated, parsed)
  return merged
}
