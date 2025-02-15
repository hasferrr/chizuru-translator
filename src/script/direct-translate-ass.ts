import type { TranslateRawContentOptions } from "../types/types"
import { mergeASSback } from "../utils/ass/merge"
import { parseASS } from "../utils/ass/parse"
import { parseSRT } from "../utils/srt/parse"
import { translateSRT } from "./direct-translate-srt"

export async function translateASS(options: TranslateRawContentOptions): Promise<string> {
  const parsed = parseASS(options.contentRaw)

  const translatedSrt = await translateSRT({
    ...options,
    contentRaw: parsed.output.join('\n'),
  })

  const merged = mergeASSback(parseSRT(translatedSrt), parsed)
  return merged
}
