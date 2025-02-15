import { type NextFunction, type Request, type Response } from 'express'

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
