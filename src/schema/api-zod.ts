import { z } from "zod"

export const subtitlesSchema = z.array(
  z.object({
    index: z.number(),
    content: z.string(),
  })
)

const contentItemSchema = z.object({
  index: z.number(),
  content: z.string(),
})

export const messageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.array(contentItemSchema),
})

export const reqBodySchema = z.object({
  subtitles: subtitlesSchema,
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  contextDocument: z.string(),
  apiKey: z.string(),
  baseURL: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number(),
  // contextMessage: messageSchema.optional(), // TODO
})
