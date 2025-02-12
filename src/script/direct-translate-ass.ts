import type { TranslateContentOptions } from "../types/types"
import { mergeASSback } from "../utils/ass/merge"
import { parseASS } from "../utils/ass/parse"
import { parseSRT } from "../utils/srt/parse"
import { translateSrtContent } from "./direct-translate-srt"

export async function translateAssContent(options: TranslateContentOptions): Promise<string> {
  const parsed = parseASS(options.contentRaw)

  const translatedSrt = await translateSrtContent({
    ...options,
    contentRaw: parsed.output.join('\n'),
  })

  const merged = mergeASSback(parseSRT(translatedSrt), parsed)
  return merged
}
