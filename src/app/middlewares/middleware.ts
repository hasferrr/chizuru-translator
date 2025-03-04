import { type NextFunction, type Request, type Response } from 'express'
import { APIError } from 'openai'
import { ZodError } from 'zod'
import { logger } from '../logger'

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
  res.setHeader('Content-Type', 'application/json')

  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: error.errors })
  } else if (error instanceof Error && error.name === 'AbortError') {
    logger.info('Stream aborted')
    res.status(200).end()
  } else if (error instanceof APIError) {
    res.status(Number(error.code) || 500).json({ error: error.message })
  } else if (error instanceof Error) {
    res.status(500).json({ error: error.message })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }
}
