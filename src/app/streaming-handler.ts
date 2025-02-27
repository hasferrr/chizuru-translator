import { type Request, type Response } from 'express'
import type { StreamChatCompletion } from '../types/types'
import { logger } from './logger'

export async function handleStreaming(stream: StreamChatCompletion, req: Request, res: Response) {
  // Set streaming headers
  res.setHeader('Content-Type', 'text/plain charset=utf-8')
  res.setHeader('Transfer-Encoding', 'chunked')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  // Handle client disconnection
  let isClientConnected = true
  req.on('close', () => {
    isClientConnected = false
    logger.info('Client disconnected - aborting stream')
    stream.controller.abort()
  })

  const isDevelopment = process.env.NODE_ENV !== 'production'

  // Stream chunks to the client
  for await (const chunk of stream) {
    if (!isClientConnected) break

    const content = chunk.choices[0]?.delta?.content || ''
    res.write(content)
    if (isDevelopment) {
      process.stdout.write(content)
    }
  }

  // Finalize the stream
  res.write('\n')
  if (isDevelopment) {
    process.stdout.write('\n')
  }
}
