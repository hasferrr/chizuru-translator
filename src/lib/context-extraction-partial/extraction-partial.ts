import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import { openai } from '../openai'
import { BatchExtractionInputSchema, BatchExtractionOutputSchema } from './context-schema'
import { contextExtractionPartialSystemMessage } from './system-message'
import type { StreamChatCompletion } from '../../types/types'

interface ExtractContextParams {
  input: z.infer<typeof BatchExtractionInputSchema>
  apiKey?: string
  baseURL: string
  model: string
  maxCompletionTokens: number
  structuredOutput: boolean
}

export async function extractContextPartialJson({
  input,
  apiKey,
  baseURL,
  model,
  maxCompletionTokens,
  structuredOutput,
}: ExtractContextParams): Promise<StreamChatCompletion> {
  const inputJsonString = JSON.stringify(input)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: contextExtractionPartialSystemMessage() },
      { role: 'user', content: inputJsonString },
    ],
    stream: true,
    response_format: structuredOutput
      ? zodResponseFormat(BatchExtractionOutputSchema, 'batch_extraction_output')
      : undefined,
    temperature: 0.2,
    max_completion_tokens: Math.max(maxCompletionTokens || 0, 8000),
  })

  return stream
}
