import express, { type NextFunction, type Request, type Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { delayRequests, errorHandler, extractTokens, perApiKeyRateLimit } from './middleware'
import { handleStreaming } from './streaming-handler'
import { extractContext } from '../lib/context-extraction/extraction'
import { extractContextPartialJson } from '../lib/context-extraction-partial/extraction-partial'
import { translateSubtitles } from '../lib/translation/translator'
import { contextExtractionBodySchema, translationBodySchema } from './schema'
import { logger } from './logger'

const app = express()

app.set('trust proxy', true)

// --- Middleware ---

// Request Logging Middleware (using the imported logger)
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, { ip: req.ip }) // Log IP as metadata
  })
  next()
})

app.use(helmet())

const allowedOrigin = process.env.ALLOWED_ORIGIN?.split(',') || []
app.use(cors({
  origin: allowedOrigin,
  methods: ['POST'],
  allowedHeaders: ['Authorization', 'Content-Type']
}))

app.use(express.json())

// --- Rate Limiting ---

const rateLimitTranslateFree = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 15, // 15 requests
  message: 'Too many free translation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ips.length > 0 ? req.ips[req.ips.length - 1] : req.ip ?? '127.0.0.1'
  },
  handler: (req, res, next) => {
    logger.warn(`Rate limit exceeded`, { ip: req.ip, url: req.originalUrl })
    res.status(429).send({ message: 'Too many requests, please try again later' })
  },
})

const rateLimitApiKeyTranslate = perApiKeyRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Too many translation requests from this OpenAI API key, please try again after 5 minutes',
})

const rateLimitApiKeyExtractContext = perApiKeyRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many context extraction requests from this OpenAI API key, please try again after 5 minutes',
})

// --- Routes ---

app.post(
  '/api/test',
  extractTokens,
  rateLimitApiKeyTranslate,
  async (req: Request, res: Response, next: NextFunction) => {
    logger.info(`Test endpoint hit`, { ip: req.ip })
    res.json({ message: 'Hello, world!' })
  })

app.post(
  '/api/stream/translate-free',
  rateLimitTranslateFree,
  delayRequests(1000),
  async (req: Request, res: Response, next: NextFunction) => {
    // TODO: Implement free translation
    logger.info(`Free translation request`, { ip: req.ip })
    res.json({ message: 'Free' })
  })

app.post(
  '/api/stream/translate',
  extractTokens,
  rateLimitApiKeyTranslate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(`Handling translation request`, { ip: req.ip })

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
      if (error instanceof Error) {
        logger.error(`Translation request failed`, { ip: req.ip, error: error.message, stack: error.stack }) // Log stack trace
      } else {
        logger.error(`Translation request failed`, { ip: req.ip, error: String(error) }) // Log unknown error
      }
      next(error)
    }
  })

app.post(
  '/api/stream/extract-context',
  extractTokens,
  rateLimitApiKeyExtractContext,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info(`Handling context extraction request`, { ip: req.ip })

      // Validate and parse the request body
      const validatedRequest = contextExtractionBodySchema.parse(req.body)
      const {
        input,
        baseURL,
        model,
        maxCompletionTokens,
        partial,
      } = validatedRequest

      const extractContextFn = partial ? extractContextPartialJson : extractContext

      // Initiate the extraction stream
      const stream = await extractContextFn({
        input: {
          episode: String(input.episode).trim(),
          subtitles: input.subtitles,
          previous_context: input.previous_context,
        },
        apiKey: req.apiKey,
        baseURL,
        model,
        maxCompletionTokens,
      })

      await handleStreaming(stream, req, res)
      res.end()

    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Context extraction request failed`, { ip: req.ip, error: error.message, stack: error.stack }) // Log stack trace
      } else {
        logger.error(`Context extraction request failed`, { ip: req.ip, error: String(error) }) // Log unknown error
      }
      next(error)
    }
  })

app.use(errorHandler)

export default app
