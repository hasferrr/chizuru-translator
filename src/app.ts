import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { z, ZodError } from 'zod'
import type { ChatCompletionChunk } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'
import { extractContext } from './lib/context-extraction/extraction'
import { translateSubtitles } from './lib/translation/translator'
import { contextExtractionBodySchema, translationBodySchema } from './schema/request-schema'

const app = express()

app.use(cors())
app.use(express.json())

app.post('/api/stream/translate', async (req: Request<{}, {}, z.infer<typeof translationBodySchema>>, res: Response) => {
  try {
    console.log('Handling translation...')

    // Validate and parse the request body
    const validatedRequest = translationBodySchema.parse(req.body)
    const {
      subtitles,
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey,
      baseURL,
      model,
      temperature,
      maxTokens,
      contextMessage,
    } = validatedRequest

    // Initiate the translation stream
    const stream = await translateSubtitles({
      subtitles: subtitles.map(({ index, content }) => ({ index, content })),
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey,
      baseURL,
      model,
      temperature,
      maxTokens,
      contextMessage: contextMessage.map((message) => ({
        role: message.role,
        content: JSON.stringify(message.content),
      })),
    })

    await handleStreaming(stream, req, res)
    res.end()

  } catch (error) {
    console.error('Error:', error)

    // Handle specific error types
    if (error instanceof ZodError) {
      res.status(400).send({ error: 'Validation failed', details: error.errors })
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.log('OpenAI stream aborted')
    } else if (error instanceof Error) {
      res.status(500).send({ error: error.message || 'Internal server error' })
    } else {
      res.status(500).send({ error: 'Internal server error' })
    }

    res.end()
  }
})

app.post('/api/stream/extract-context', async (req: Request<{}, {}, z.infer<typeof contextExtractionBodySchema>>, res: Response) => {
  try {
    console.log('Handling context extraction...')

    // Validate and parse the request body
    const validatedRequest = contextExtractionBodySchema.parse(req.body)
    const {
      input,
      apiKey,
      baseURL,
      model,
      maxTokens,
    } = validatedRequest

    // Initiate the extraction stream
    const stream = await extractContext({
      input,
      apiKey,
      baseURL,
      model,
      maxTokens,
    })

    await handleStreaming(stream, req, res)
    res.end()

  } catch (error) {
    console.error('Error:', error)

    // Handle specific error types
    if (error instanceof ZodError) {
      res.status(400).send({ error: 'Validation failed', details: error.errors })
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.log('OpenAI stream aborted')
    } else if (error instanceof Error) {
      res.status(500).send({ error: error.message || 'Internal server error' })
    } else {
      res.status(500).send({ error: 'Internal server error' })
    }

    res.end()
  }
})

async function handleStreaming(
  stream: Stream<ChatCompletionChunk> & {
    _request_id?: string | null;
  },
  req: Request,
  res: Response
) {
  // Set streaming headers
  res.setHeader('Content-Type', 'text/plain charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Handle client disconnection
  let isClientConnected = true
  req.on('close', () => {
    isClientConnected = false
    console.log('Client disconnected - aborting stream')
    stream.controller.abort()
  })

  // Stream chunks to the client
  for await (const chunk of stream) {
    if (!isClientConnected) break

    const content = chunk.choices[0]?.delta?.content || ''
    res.write(content)
    process.stdout.write(content)
  }

  // Finalize the stream
  res.write('\n')
  process.stdout.write('\n')
}

export default app
