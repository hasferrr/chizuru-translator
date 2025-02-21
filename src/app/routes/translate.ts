import express, { type NextFunction, type Request, type Response } from 'express'
import { handleStreaming } from '../streaming-handler'
import { translateSubtitles } from '../../lib/translation/translator'
import { translationBodySchema } from '../schema'
import { logger } from '../logger'
import { modelMap } from '../model-map'
import { extractTokens } from '../middlewares/middleware'
import { rateLimitTranslateFree, rateLimitApiKeyTranslate } from '../middlewares/rate-limiters'

const router = express.Router()

async function handleTranslateRequest(req: Request, res: Response, next: NextFunction, apiKey?: string) {
  try {
    const logMessage = apiKey ? 'Handling translation request' : 'Free translation request'
    logger.info(logMessage, { ip: req.ip })

    // Bypass validation if apiKey is not provided (free request)
    if (!apiKey) {
      req.body.baseURL = "http://127.0.0.1"
    }

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

    let usedApiKey = apiKey
    let usedBaseURL = baseURL

    // Check request model name for free requests
    if (!apiKey) {
      if (!modelMap.has(model)) {
        res.status(400).json({ message: "Invalid model name" })
        return
      }
      const modelData = modelMap.get(model)!
      usedApiKey = modelData.apiKey
      usedBaseURL = modelData.baseURL
    }

    // Initiate the translation stream
    const stream = await translateSubtitles({
      subtitles: subtitles.map(({ index, actor, content }) => ({ index, actor, content })),
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey: usedApiKey,
      baseURL: usedBaseURL,
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
    const errorMessage = apiKey ? 'Translation request failed' : 'Free translation request failed'
    if (error instanceof Error) {
      logger.error(errorMessage, { ip: req.ip, error: error.message, stack: error.stack }) // Log stack trace
    } else {
      logger.error(errorMessage, { ip: req.ip, error: String(error) }) // Log unknown error
    }
    next(error)
  }
}

router.post(
  '/stream/translate-free',
  rateLimitTranslateFree,
  (req: Request, res: Response, next: NextFunction) => {
    handleTranslateRequest(req, res, next)
  },
)

router.post(
  '/stream/translate',
  extractTokens,
  rateLimitApiKeyTranslate,
  (req: Request, res: Response, next: NextFunction) => {
    handleTranslateRequest(req, res, next, req.apiKey)
  },
)

export default router
