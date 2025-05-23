import fs from 'fs'
import path from 'path'
import type { StreamChatCompletion } from "../types/types"

export async function getFullResponse(stream: StreamChatCompletion, logFile: string = 'response.log'): Promise<string> {
  console.log('='.repeat(80))
  console.log('Getting full response...')
  console.log('='.repeat(80))

  let fullResponse = ''
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    process.stdout.write(content)
    fs.appendFileSync(path.join('log', logFile), content)
    fullResponse += content
  }
  process.stdout.write('\n')
  fs.appendFileSync(path.join('log', logFile), '\n')

  return fullResponse
}
