import { systemMessageContextExtraction } from './system-message'
import { openai } from '../openai'
import type { ContextExtractionInput, StreamChatCompletion } from '../../types/types'

interface ExtractContextParams {
  input: ContextExtractionInput
  apiKey?: string
  baseURL: string
  model: string
  maxCompletionTokens?: number
}

export async function extractContext({
  input,
  apiKey,
  baseURL,
  model,
  maxCompletionTokens,
}: ExtractContextParams): Promise<StreamChatCompletion> {
  const inputJsonString = JSON.stringify(input)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessageContextExtraction() },
      { role: 'user', content: inputJsonString },
    ],
    stream: true,
    temperature: 0.2,
    max_completion_tokens: maxCompletionTokens ? Math.max(maxCompletionTokens, 1) : undefined,
  })

  return stream
}
