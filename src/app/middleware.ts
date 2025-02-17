import { type NextFunction, type Request, type Response } from 'express'
import { ZodError } from 'zod'

export function extractTokens(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization || ''
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Format: "Bearer YOUR_TOKEN, OpenAIKey YOUR_OPENAI_KEY"
  const parts = authHeader.split(',').map(p => p.trim())

  if (parts.length !== 2) {
    res.status(401).json({
      error: 'Invalid authorization format. Expected: "Bearer <token>, OpenAIKey <key>"'
    })
    return
  }

  try {
    const token = parts[0].replace('Bearer ', '')
    const apiKey = parts[1].replace('OpenAIKey ', '')

    if (!token || !apiKey) {
      res.status(401).json({ error: 'Missing credentials in authorization header' })
      return
    }

    req.token = token
    req.apiKey = apiKey
    next()

  } catch (error) {
    res.status(401).json({ error: 'Malformed authorization header' })
    return
  }
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
