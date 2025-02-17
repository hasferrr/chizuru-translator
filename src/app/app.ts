import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { errorHandler, extractTokens } from './middleware'
import { extractContext } from '../lib/context-extraction/extraction'
import { translateSubtitles } from '../lib/translation/translator'
import { contextExtractionBodySchema, translationBodySchema } from './schema'
import type { StreamChatCompletion } from '../types/types'

const app = express()

app.use(cors({
  origin: ['*'],
  methods: ['POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
}))
app.use(express.json())

app.post('/api/stream/translate', extractTokens, async (req: Request<{}, {}, z.infer<typeof translationBodySchema>>, res: Response, next: NextFunction) => {
  try {
    console.log('Handling translation...')

    // Validate and parse the request body
    const validatedRequest = translationBodySchema.parse(req.body)
    const {
      subtitles,
      sourceLanguage,
      targetLanguage,
      contextDocument,
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
      apiKey: req.apiKey,
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
    next(error)
  }
})

app.post('/api/stream/extract-context', extractTokens, async (req: Request<{}, {}, z.infer<typeof contextExtractionBodySchema>>, res: Response, next: NextFunction) => {
  try {
    console.log('Handling context extraction...')

    // Validate and parse the request body
    const validatedRequest = contextExtractionBodySchema.parse(req.body)
    const {
      input,
      baseURL,
      model,
      maxTokens,
    } = validatedRequest

    // Initiate the extraction stream
    const stream = await extractContext({
      input,
      apiKey: req.apiKey,
      baseURL,
      model,
      maxTokens,
    })

    await handleStreaming(stream, req, res)
    res.end()

  } catch (error) {
    next(error)
  }
})

app.use(errorHandler)

async function handleStreaming(
  stream: StreamChatCompletion,
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
