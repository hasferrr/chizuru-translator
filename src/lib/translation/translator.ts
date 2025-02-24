import { openai } from '../openai'
import { systemMessageTranslation } from './system-message'
import type { StreamChatCompletion, SubtitleNoTime } from '../../types/types'
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs'
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
  maxCompletionTokens: number
  structuredOutput: boolean
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
  maxCompletionTokens,
  structuredOutput,
  contextMessage = [],
}: TranslateSubtitlesParams): Promise<StreamChatCompletion> {
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
    response_format: structuredOutput
      ? zodResponseFormat(SubtitleSchema, 'subtitle_schema')
      : undefined,
    temperature: Math.min(Math.max(temperature, 0), 1.3),
    max_completion_tokens: Math.max(maxCompletionTokens, 1),
  })

  return stream
}
