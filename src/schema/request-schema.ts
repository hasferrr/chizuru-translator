import { z } from "zod"

const subtitleSchema = z.object({
  index: z.number(),
  content: z.string(),
})

const contentItemSchema = z.object({
  index: z.number(),
  content: z.string(),
})

const messageSchema = z.object({
  role: z.union([z.literal('user'), z.literal('assistant')]),
  content: z.array(contentItemSchema),
})

export const reqBodySchema = z.object({
  subtitles: z.array(subtitleSchema),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  contextDocument: z.string(),
  apiKey: z.string(),
  baseURL: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxTokens: z.number(),
  contextMessage: z.array(messageSchema),
})
