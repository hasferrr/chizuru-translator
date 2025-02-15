import fs from 'fs'
import path from 'path'
import { openai } from '../openai'
import { systemMessageTranslation } from './system-message'
import type { SubtitleNoTime } from '../../types/types'
import type { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'
import { z } from 'zod'
import { zodResponseFormat } from "openai/helpers/zod"

const SubtitleSchema = z.array(
  z.object({
    index: z.number(),
    content: z.string(),
    translated: z.string(),
  })
)

interface TranslateSubtitlesParams {
  subtitles: SubtitleNoTime[]
  sourceLanguage: string
  targetLanguage: string
  contextDocument: string
  apiKey?: string
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
  contextMessage?: ChatCompletionMessageParam[]
}

export async function translateSubtitles({
  subtitles,
  sourceLanguage,
  targetLanguage,
  contextDocument,
  apiKey,
  baseURL,
  model,
  temperature,
  maxTokens,
  contextMessage = [],
}: TranslateSubtitlesParams): Promise<Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}> {
  const systemMessage = systemMessageTranslation(sourceLanguage, targetLanguage, contextDocument)
  const userMessage = JSON.stringify(subtitles)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessage },
      ...contextMessage,
      { role: 'user', content: userMessage },
    ],
    stream: true,
    response_format: zodResponseFormat(SubtitleSchema, 'subtitle_schema'),
    temperature: Math.min(Math.max(temperature, 0), 1.3),
    max_tokens: Math.max(maxTokens, 1),
  })

  return stream
}

export async function getFullResponse(stream: Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}): Promise<string> {
  console.log('='.repeat(80))
  console.log('Getting full response...')
  console.log('='.repeat(80))

  let fullResponse = ''
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    process.stdout.write(content)
    fs.appendFileSync(path.join('log', 'response.log'), content)
    fullResponse += content
  }
  process.stdout.write('\n')
  fs.appendFileSync(path.join('log', 'response.log'), '\n')

  return fullResponse
}
