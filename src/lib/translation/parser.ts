import type { SubtitleMinimal, SubtitleNoTimeNoActorTranslated } from "../../types/types"
import { cleanUpJsonResponse } from "../../utils/response-utils"

export function parseTranslationJson(response: string): SubtitleMinimal[] {
  const subtitles = JSON.parse(cleanUpJsonResponse(response)) as SubtitleNoTimeNoActorTranslated[]
  return subtitles.map((sub) => ({
    index: sub.index,
    content: sub.translated || '',
  }))
}
