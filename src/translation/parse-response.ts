import type { SubtitleNoTime, SubtitleNoTimeTranslated } from "../types/types"

function keepOnlyWrapped(text: string, a: string, b: string): string {
  const startA = text.indexOf(a)
  if (startA === -1) return ''
  const startB = text.indexOf(b, startA + a.length)
  if (startB === -1) return ''
  return text.substring(startA, startB + b.length)
}

function removeWrapped(text: string, a: string, b: string): string {
  const startA = text.indexOf(a)
  if (startA === -1) return text
  const startB = text.indexOf(b, startA + a.length)
  if (startB === -1) return text
  return text.substring(0, startA) + text.substring(startB + b.length)
}

export function getThink(response: string): string {
  return keepOnlyWrapped(response, '<think>', '</think>')
}

export function getJson(response: string): SubtitleNoTime[] {
  const a = '```json'
  const b = '```'
  const removedThink = removeWrapped(response, '<think>', '</think>')
  const jsonString = keepOnlyWrapped(removedThink, a, b).replace(a, '').replace(b, '')
    || keepOnlyWrapped(removedThink, b, b).replaceAll(b, '')
    || removedThink.replaceAll(a, '').replaceAll(b, '')
    || '[]'
  const subtitles = JSON.parse(jsonString) as SubtitleNoTimeTranslated[]
  return subtitles.map((sub) => ({
    index: sub.index,
    content: sub.translated || '',
  }))
}
