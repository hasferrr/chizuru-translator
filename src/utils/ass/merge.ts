import { DialogueType, type ASSParseOutput, type Subtitle } from "../../types/types"

export function mergeASSback(subtitles: Subtitle[], parsed: ASSParseOutput): string {
  let output = ''

  const dialogue: string[] = []
  for (let i = 0; i < parsed.styleOnly.length; i++) {
    const formattedLine = `${parsed.styleOnly[i]},${subtitles[i].content.replace('\\n', '\\N')}`
    dialogue.push(formattedLine)
  }

  output += parsed.header.join('\n')
  output += '\n'

  let di = 0
  let ci = 0
  for (const type of parsed.order) {
    if (type === DialogueType.Dialogue) {
      output += dialogue[di] + '\n'
      di++
    } else {
      output += parsed.commentsOnly[ci] + '\n'
      ci++
    }
  }

  output += parsed.footer.join('')

  return output
}
