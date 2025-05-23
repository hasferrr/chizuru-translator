import { z } from "zod"

const subtitleSchema = z.object({
  index: z.number(),
  actor: z.string(),
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

export const translationBodySchema = z.object({
  subtitles: z.array(subtitleSchema),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  contextDocument: z.string(),
  baseURL: z.string(),
  model: z.string(),
  temperature: z.number(),
  maxCompletionTokens: z.number().int().positive().optional(),
  structuredOutput: z.boolean(),
  contextMessage: z.array(messageSchema),
})

export const contextExtractionBodySchema = z.object({
  input: z.object({
    episode: z.string().or(z.number()),
    subtitles: z.array(subtitleSchema),
    previous_context: z.string(),
  }),
  baseURL: z.string().url(),
  model: z.string(),
  maxCompletionTokens: z.number().int().positive().optional(),
  partial: z.boolean().optional(),
})
