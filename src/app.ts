import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { z, ZodError } from 'zod'
import { translateSubtitles } from './lib/translation/translator'
import { reqBodySchema, subtitlesSchema } from './schema/api-zod'

const app = express()

app.use(cors())
app.use(express.json())

app.post('/stream', async (req: Request<{}, {}, z.infer<typeof reqBodySchema>>, res: Response) => {
  try {
    console.log('Handling request...')

    // Validate and parse the request body
    const validatedRequest = reqBodySchema.parse(req.body)
    const {
      subtitles,
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey,
      baseURL,
      model,
      temperature,
      maxTokens,
    } = validatedRequest

    // Parse and validate the subtitles
    const parsedSubtitle = subtitlesSchema.parse(subtitles)

    // Initiate the translation stream
    const stream = await translateSubtitles({
      subtitles: parsedSubtitle.map(({ index, content }) => ({ index, content })),
      sourceLanguage,
      targetLanguage,
      contextDocument,
      apiKey,
      baseURL,
      model,
      temperature,
      maxTokens,
      contextMessage: [], // TODO
    })

    // Set streaming headers
    res.setHeader('Content-Type', 'text/plain charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    // Handle client disconnection
    let isClientConnected = true
    req.on('close', () => {
      isClientConnected = false
      console.log('Client disconnected - aborting stream')
      stream.controller.abort()
    })

    // Stream chunks to the client
    for await (const chunk of stream) {
      if (!isClientConnected) break

      const content = chunk.choices[0]?.delta?.content || ''
      res.write(content)
      process.stdout.write(content)
    }

    // Finalize the stream
    res.write('\n')
    process.stdout.write('\n')
    res.end()

  } catch (error) {
    console.error('Error:', error)

    // Handle specific error types
    if (error instanceof ZodError) {
      res.status(400).send({ error: 'Validation failed', details: error.errors })
    } else if (error instanceof Error && error.name === 'AbortError') {
      console.log('OpenAI stream aborted')
    } else if (error instanceof Error) {
      res.status(500).send({ error: error.message || 'Internal server error' })
    } else {
      res.status(500).send({ error: 'Internal server error' })
    }

    res.end()
  }
})

export default app
