import { systemMessageContextExtraction } from './system-message'
import { openai } from '../openai'
import type { ChatCompletionChunk } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'

interface InputSubtitle {
  episode: number
  subtitle: string
  previousContext: string
}

interface ExtractContextParams {
  input: InputSubtitle
  apiKey?: string
  baseURL: string
  model: string
  maxTokens?: number
}

export async function extractContext({
  input,
  apiKey,
  baseURL,
  model,
  maxTokens,
}: ExtractContextParams): Promise<Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}> {
  const inputJsonString = JSON.stringify(input)

  const stream = await openai(baseURL, apiKey).chat.completions.create({
    model,
    messages: [
      { role: 'system', content: systemMessageContextExtraction() },
      { role: 'user', content: inputJsonString },
    ],
    stream: true,
    temperature: 0.2,
    max_tokens: Math.max(maxTokens || 0, 8000),
  })

  return stream
}

export async function getFullResponse(stream: Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}): Promise<string> {
  console.log('='.repeat(80))
  console.log('Extracting context...')
  console.log('='.repeat(80))

  let fullResponse = ''
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    process.stdout.write(content)
    fullResponse += content
  }
  process.stdout.write('\n')

  return fullResponse
}
