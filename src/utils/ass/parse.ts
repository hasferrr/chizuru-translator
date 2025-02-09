import { DialogueType, type ASSParseOutput } from "../../types/types"

function formatTime(timeStr: string): string {
  // Split the time into hours, minutes, seconds, and milliseconds
  const [hours, minutes, rest] = timeStr.split(':')
  const [seconds, milliseconds] = rest.split('.')
  // Format the time into "HH:MM:SS,msmsms"
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')},${milliseconds.padEnd(3, '0')}`
}

export function parseASS(fileContent: string): ASSParseOutput {
  const lines = fileContent.split('\n')

  const output: string[] = []
  const styleOnly: string[] = []
  const textOnly: string[] = []
  const commentsOnly: string[] = []
  const header: string[] = []
  const footer: string[] = []
  const order: DialogueType[] = []

  let count = 1
  let inHeader = true
  let inFooter = false

  for (let line of lines) {
    line = line.replaceAll('\r', '')
    if (inHeader) {
      header.push(line)
      if (line.startsWith('Format: Layer,')) {
        inHeader = false
      }
    } else if (inFooter) {
      footer.push(line)
    } else if (line.startsWith('Dialogue')) {
      order.push(DialogueType.Dialogue)

      // Split only on the first 2 commas to get Start and End times
      const parts = line.split(',')
      const startTime = formatTime(parts[1].trim())
      const endTime = formatTime(parts[2].trim())

      // Extract the text after the 8th comma
      let textSection = parts.reduce((acc, part, index) => {
        if (index > 8) {
          return acc + part
        }
        return acc
      }, '')
      textSection = textSection.replace('\\N', ' \\n ')

      output.push(`${count}\n${startTime} --> ${endTime}\n${textSection}\n\n`)
      styleOnly.push(parts.slice(0, 9).join(','))
      textOnly.push(textSection)
      count += 1
    } else if (line.startsWith('Comment')) {
      order.push(DialogueType.Comment)
      commentsOnly.push(line)
    } else if (line.startsWith('[')) {
      inFooter = true
      footer.push(line)
    }
  }

  return { output, styleOnly, textOnly, commentsOnly, header, footer, order }
}
