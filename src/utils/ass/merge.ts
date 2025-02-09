import type { ASSParseOutput, Subtitle } from "../../types/types"

export function mergeASSback(subtitles: Subtitle[], parsed: ASSParseOutput): string {
  let output = ''

  const dialogue: string[] = []
  for (let i = 0; i < parsed.styleOnly.length; i++) {
    const formattedLine = `${parsed.styleOnly[i]},${subtitles[i].content.replace('\\n', '\\N')}`
    dialogue.push(formattedLine)
  }

  output += parsed.header.join('\n')
  output += dialogue.join('\n')
  output += '\n'
  output += parsed.commentsOnly.join('\n')
  output += '\n'
  output += parsed.footer.join('')

  return output
}
