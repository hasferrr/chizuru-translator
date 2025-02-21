import { type NextFunction, type Request, type Response } from 'express'
import { APIError } from 'openai'
import { ZodError } from 'zod'
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit'

interface RateLimitOptions {
  windowMs: number
  max: number
  message: string
}

const lastRequestTimes = new Map<string, number>()
const apiKeyLimiters = new Map<string, RateLimitRequestHandler>()

// --- Delay Middleware ---

export function delayRequests(minDelayMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ips.length > 0 ? req.ips[req.ips.length - 1] : req.ip ?? '127.0.0.1'
    const now = Date.now()
    const lastRequestTime = lastRequestTimes.get(key) || 0
    const timeSinceLastRequest = now - lastRequestTime

    if (timeSinceLastRequest < minDelayMs) {
      const timeToWait = minDelayMs - timeSinceLastRequest
      setTimeout(() => {
        lastRequestTimes.set(key, Date.now()) // Update *after* the delay
        next()
      }, timeToWait)
      return
    }

    lastRequestTimes.set(key, now)
    next()
  }
}

// --- Rate Limiting ---

export function perApiKeyRateLimit(options: RateLimitOptions) {
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

// --- Middlewares ---

export function extractTokens(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || ''
  const apiKey = authHeader.replace('Bearer ', '')
  if (!apiKey) {
    res.status(401).json({ error: 'Missing credentials in authorization header' })
    return
  }
  if (apiKey.length < 20) {
    res.status(401).json({ error: 'Invalid API key format' })
    return
  }
  req.apiKey = apiKey
  next()
}

export function errorHandler(error: unknown, req: Request, res: Response, next: NextFunction) {
  console.error('Error:', error)

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: error.errors })
  } else if (error instanceof Error && error.name === 'AbortError') {
    console.log('Stream aborted')
    res.status(200).end()
  } else if (error instanceof APIError) {
    res.status(error.status || 500).json({ error: error.message, details: error.error })
  } else if (error instanceof Error) {
    res.status(500).json({ error: error.message })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }
}
