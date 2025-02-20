import { z } from 'zod'

// Schemas for Batch Extraction Prompt
const CharacterSchema = z.object({
  name: z.string(),
  description: z.string(),
  speech_patterns: z.string(),
  relationships: z.string(),
})

const TerminologySchema = z.object({
  term: z.string(),
  tentative_translation: z.string(),
  definition: z.string(),
})

const SettingDetailSchema = z.object({
  name: z.string(),
  tentative_translation: z.string(),
  significance: z.string(),
})

// Input
const subtitleSchema = z.object({
  index: z.number(),
  actor: z.string(),
  content: z.string(),
})

export const BatchExtractionInputSchema = z.object({
  episode: z.string(),
  subtitles: z.array(subtitleSchema),
})

// Output
export const BatchExtractionOutputSchema = z.object({
  episode: z.string(),
  new_characters: z.array(CharacterSchema),
  new_terminology: z.array(TerminologySchema),
  new_setting_details: z.array(SettingDetailSchema),
  plot_summary: z.string(),
})

export type BatchExtractionOutput = z.infer<typeof BatchExtractionOutputSchema>

// --- Combined Context Document Schema ---

const ContextDocumentSchema = z.object({
  characterList: z.array(CharacterSchema),
  glossary: z.array(TerminologySchema),
  plotSummary: z.string(),
  setting: z.array(SettingDetailSchema),
})

export type ContextDocument = z.infer<typeof ContextDocumentSchema>
