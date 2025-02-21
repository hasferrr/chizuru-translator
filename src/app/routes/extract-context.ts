import express, { type NextFunction, type Request, type Response } from 'express'
import { handleStreaming } from '../streaming-handler'
import { extractContext } from '../../lib/context-extraction/extraction'
import { extractContextPartialJson } from '../../lib/context-extraction-partial/extraction-partial'
import { contextExtractionBodySchema } from '../schema'
import { logger } from '../logger'
import { modelMap } from '../model-map'
import { extractTokens } from '../middlewares/middleware'
import { rateLimitExtractContextFree, rateLimitApiKeyExtractContext } from '../middlewares/rate-limiters'

const router = express.Router()

async function handleExtractContextRequest(req: Request, res: Response, next: NextFunction, apiKey?: string) {
  try {
    const logMessage = apiKey ? 'Handling context extraction request' : 'Free context extraction request'
    logger.info(logMessage, { ip: req.ip })

    // Bypass validation if apiKey is not provided (free request)
    if (!apiKey) {
      req.body.baseURL = "http://127.0.0.1"
    }

    // Validate and parse the request body
    const validatedRequest = contextExtractionBodySchema.parse(req.body)
    const {
      input,
      baseURL,
      model,
      maxCompletionTokens,
      partial,
    } = validatedRequest

    let usedModel = model
    let usedApiKey = apiKey
    let usedBaseURL = baseURL

    if (!apiKey) {
      // Check request model name for free requests
      if (!modelMap.has(model)) {
        res.status(400).json({ message: "Invalid model name" })
        return
      }
      const modelData = modelMap.get(model)!
      usedModel = modelData.model
      usedApiKey = modelData.apiKey
      usedBaseURL = modelData.baseURL
    }

    const extractContextFn = partial ? extractContextPartialJson : extractContext

    // Initiate the extraction stream
    const stream = await extractContextFn({
      input: {
        episode: String(input.episode).trim(),
        subtitles: input.subtitles,
        previous_context: input.previous_context,
      },
      apiKey: usedApiKey,
      baseURL: usedBaseURL,
      model: usedModel,
      maxCompletionTokens,
    })

    await handleStreaming(stream, req, res)
    res.end()

  } catch (error) {
    const errorMessage = apiKey ? 'Context extraction request failed' : 'Free context extraction request failed'
    if (error instanceof Error) {
      logger.error(errorMessage, { ip: req.ip, error: error.message, stack: error.stack })
    } else {
      logger.error(errorMessage, { ip: req.ip, error: String(error) })
    }
    next(error)
  }
}

router.post(
  '/stream/extract-context',
  extractTokens,
  rateLimitApiKeyExtractContext,
  (req: Request, res: Response, next: NextFunction) => {
    handleExtractContextRequest(req, res, next, req.apiKey)
  },
)

router.post(
  '/stream/extract-context-free',
  rateLimitExtractContextFree,
  (req: Request, res: Response, next: NextFunction) => {
    handleExtractContextRequest(req, res, next)
  },
)

export default router
