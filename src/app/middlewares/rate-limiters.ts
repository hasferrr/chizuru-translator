import { type NextFunction, type Request, type Response } from 'express'
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit'
import { logger } from '../logger'

interface RateLimitOptions {
  windowMs: number
  max: number
  message: string
}

const apiKeyLimiters = new Map<string, RateLimitRequestHandler>()

// Function definition
function perApiKeyRateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      res.status(500).json({ error: 'Internal Server Error: API key not available for rate limiting.' })
      return
    }
    let limiter = apiKeyLimiters.get(req.apiKey)
    if (!limiter) {
      limiter = rateLimit({
        ...options,
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => req.apiKey || 'default',
      })
      apiKeyLimiters.set(req.apiKey, limiter)
    }
    limiter(req, res, next)
  }
}

const rateLimitObjectData = {
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 15, // 15 requests
  message: 'Too many free translation requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    return req.ips.length > 0 ? req.ips[req.ips.length - 1] : req.ip ?? '127.0.0.1'
  },
  handler: (req: Request, res: Response, next: NextFunction) => {
    logger.warn(`Rate limit exceeded`, { ip: req.ip, url: req.originalUrl })
    res.status(429).send({ message: 'Too many requests, please try again later' })
  },
}

export const rateLimitTranslateFree = rateLimit(rateLimitObjectData)
export const rateLimitExtractContextFree = rateLimit(rateLimitObjectData)

export const rateLimitApiKeyTranslate = perApiKeyRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 50,
  message: 'Too many translation requests from this OpenAI API key, please try again after 5 minutes',
})

export const rateLimitApiKeyExtractContext = perApiKeyRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: 'Too many context extraction requests from this OpenAI API key, please try again after 5 minutes',
})

