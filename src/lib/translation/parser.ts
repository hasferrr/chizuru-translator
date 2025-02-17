import type { SubtitleMinimal, SubtitleNoTime, SubtitleNoTimeTranslated } from "../../types/types"
import { cleanUpJsonResponse } from "../../utils/response-utils"

export function parseTranslationJson(response: string): SubtitleMinimal[] {
  const subtitles = JSON.parse(cleanUpJsonResponse(response)) as SubtitleNoTimeTranslated[]
  return subtitles.map((sub) => ({
    index: sub.index,
    content: sub.translated || '',
  }))
}
