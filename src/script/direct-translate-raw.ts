import type { TranslateRawContentOptions } from "../types/types"
import { translateASS } from "./direct-translate-ass"
import { translateSRT } from "./direct-translate-srt"

export async function translateRawContent(format: 'ass' | 'srt', options: TranslateRawContentOptions): Promise<string> {
  const { contentRaw } = options

  switch (format) {
    case 'ass':
      if (!isASS(contentRaw)) {
        throw new Error('Content does not match ASS format')
      }
      return translateASS(options)
    case 'srt':
      if (!isSRT(contentRaw)) {
        throw new Error('Content does not match SRT format')
      }
      return translateSRT(options)
    default:
      throw new Error('Unsupported format')
  }
}

function isASS(content: string): boolean {
  return content.trim().startsWith('[Script Info]')
}

function isSRT(content: string): boolean {
  const lines = content.trim().split('\n', 2)
  const firstLine = lines[0]
  const secondLine = lines[1]
  return !isNaN(Number(firstLine)) && secondLine.includes(' --> ')
}
