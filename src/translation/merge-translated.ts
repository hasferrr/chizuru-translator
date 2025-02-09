import type { Subtitle, SubtitleNoTime } from "../types/types"

export function mergeTranslated(originals: Subtitle[], translatedList: SubtitleNoTime[]): Subtitle[] {
  const merged: Subtitle[] = []
  for (let i = 0; i < originals.length; i++) {
    merged.push({
      ...originals[i],
      content: translatedList[i].content || '',
    })
  }
  return merged
}
