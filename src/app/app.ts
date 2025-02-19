import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import { z } from 'zod'
import { errorHandler, extractTokens } from './middleware'
import { handleStreaming } from './streaming-handler'
import { extractContext } from '../lib/context-extraction/extraction'
import { translateSubtitles } from '../lib/translation/translator'
import { contextExtractionBodySchema, translationBodySchema } from './schema'

const app = express()

app.use(cors({
  origin: '*',
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
      maxCompletionTokens,
      contextMessage,
    } = validatedRequest

    // Initiate the translation stream
    const stream = await translateSubtitles({
      subtitles: subtitles.map(({ index, actor, content }) => ({ index, actor, content })),
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey: req.apiKey,
      baseURL,
      model,
      temperature,
      maxCompletionTokens,
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
      maxCompletionTokens,
    } = validatedRequest

    // Initiate the extraction stream
    const stream = await extractContext({
      input,
      apiKey: req.apiKey,
      baseURL,
      model,
      maxCompletionTokens,
    })

    await handleStreaming(stream, req, res)
    res.end()

  } catch (error) {
    next(error)
  }
})

app.use(errorHandler)

export default app
