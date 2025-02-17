import { type NextFunction, type Request, type Response } from 'express'
import { ZodError } from 'zod'

export function extractTokens(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || ''
  const apiKey = authHeader.replace('Bearer ', '')
  if (!apiKey) {
    res.status(401).json({ error: 'Missing credentials in authorization header' })
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
  } else if (error instanceof Error) {
    res.status(500).json({ error: error.message || 'Internal server error' })
  } else {
    res.status(500).json({ error: 'Internal server error' })
  }

  res.end()
}
