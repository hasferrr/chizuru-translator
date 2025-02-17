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
  maxTokens: number
}

export async function extractContextPartialJson({
  input,
  apiKey,
  baseURL,
  model,
  maxTokens,
}: ExtractContextParams): Promise<StreamChatCompletion> {
  const inputJsonString = JSON.stringify(input)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: contextExtractionPartialSystemMessage() },
      { role: 'user', content: inputJsonString },
    ],
    stream: true,
    response_format: zodResponseFormat(BatchExtractionOutputSchema, 'batch_extraction_output'),
    temperature: 0.2,
    max_tokens: Math.max(maxTokens || 0, 8000),
  })

  return stream
}
