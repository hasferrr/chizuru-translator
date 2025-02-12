import fs from 'fs'
import { openai } from '../lib/openai'
import { systemMessage } from './system-message'
import type { SubtitleNoTime } from '../types/types'
import type { ChatCompletionChunk, ChatCompletionMessageParam } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'

interface TranslateSubtitlesParams {
  subtitles: SubtitleNoTime[]
  sourceLanguage: string
  targetLanguage: string
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
  apiKey,
  baseURL,
  model,
  temperature,
  maxTokens,
  contextMessage = [],
}: TranslateSubtitlesParams): Promise<Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}> {
  const userMessage = JSON.stringify(subtitles)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessage(sourceLanguage, targetLanguage) },
      ...contextMessage,
      { role: 'user', content: userMessage },
    ],
    stream: true,
    response_format: {
      "type": "json_schema",
      "json_schema": {
        "name": "subtitle_format",
        "strict": true,
        "schema": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "index": { "type": "number" },
              "content": { "type": "string" },
            },
            "required": ["index", "content"],
            "additionalProperties": false
          }
        }
      }
    },
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
    fs.appendFileSync('response.log', content)
    fullResponse += content
  }
  process.stdout.write('\n')
  fs.appendFileSync('response.log', '\n')

  return fullResponse
}
