import type { TranslateContentOptions } from "../types/types"
import { translateAssContent } from "./direct-translate-ass"
import { translateSrtContent } from "./direct-translate-srt"

export async function translateContent(format: 'ass' | 'srt', options: TranslateContentOptions): Promise<string> {
  const { contentRaw } = options

  // Validate content format
  if (format === 'ass' && !isASS(contentRaw)) {
    throw new Error('Content does not match ASS format')
  } else if (format === 'srt' && !isSRT(contentRaw)) {
    throw new Error('Content does not match SRT format')
  }

  // Delegate to the appropriate translation function
  if (format === 'ass') {
    return translateAssContent(options)
  } else if (format === 'srt') {
    return translateSrtContent(options)
  } else {
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
