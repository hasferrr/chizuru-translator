import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'
import type { ChatCompletionChunk } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'
import { openai } from '../openai'
import { BatchExtractionInputSchema, BatchExtractionOutputSchema, type BatchExtractionOutput } from './context-schema'
import { contextExtractionPartialSystemMessage } from './system-message'

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
}: ExtractContextParams): Promise<Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}> {
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
    fs.appendFileSync(path.join('log', 'response.log'), content)
    fullResponse += content
  }
  process.stdout.write('\n')
  fs.appendFileSync(path.join('log', 'response.log'), '\n')

  return fullResponse
}

export function parseContextExtractionJSON(response: string): BatchExtractionOutput {
  try {
    const parsedData = BatchExtractionOutputSchema.parse(JSON.parse(response))
    return parsedData
  } catch (error) {
    console.error("Error parsing JSON output:", error)
    console.log("Raw output:", response)
    throw new Error("Invalid JSON output from API call.")
  }
}
