import express, { type NextFunction, type Request, type Response } from 'express'
import { handleStreaming } from '../streaming-handler'
import { translateSubtitles } from '../../lib/translation/translator'
import { translationBodySchema } from '../schema'
import { logger } from '../logger'
import { modelMap } from '../model-map'
import { extractTokens } from '../middlewares/middleware'
import { rateLimitTranslateFree, rateLimitApiKeyTranslate } from '../middlewares/rate-limiters'
import { capitalizeWords } from '../../utils/utils'

const router = express.Router()

async function handleTranslateRequest(req: Request, res: Response, next: NextFunction, apiKey?: string) {
  try {
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
      structuredOutput,
      contextMessage,
    } = validatedRequest

    let usedModel = model
    let usedApiKey = apiKey
    let usedBaseURL = baseURL

    // Check request model name for free requests
    if (!apiKey) {
      if (!modelMap.has(model)) {
        res.status(400).json({ message: "Invalid model name" })
        return
      }
      const modelData = modelMap.get(model)!
      usedModel = modelData.model
      usedApiKey = modelData.apiKey
      usedBaseURL = modelData.baseURL
    }

    // Initiate the translation stream
    const stream = await translateSubtitles({
      subtitles: subtitles.map(({ index, actor, content }) => ({ index, actor, content })),
      sourceLanguage: capitalizeWords(sourceLanguage),
      targetLanguage: capitalizeWords(targetLanguage),
      contextDocument,
      apiKey: usedApiKey,
      baseURL: usedBaseURL,
      model: usedModel,
      temperature,
      maxCompletionTokens,
      structuredOutput,
      contextMessage: contextMessage.map((message) => ({
        role: message.role,
        content: JSON.stringify(message.content),
      })),
    })


    logger.info(apiKey
      ? "Handling translation request model details"
      : "Free translation request model details", {
      ip: req.ip,
      model: usedModel,
      baseURL: usedBaseURL,
      sourceLanguage,
      targetLanguage,
      isFreeRequest: !apiKey,
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
