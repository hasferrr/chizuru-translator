import type { ChatCompletionChunk } from 'openai/resources/index.mjs'
import type { Stream } from 'openai/streaming.mjs'

export interface Timestamp {
  h: number
  m: number
  s: number
  ms: number
}

export interface Subtitle {
  index: number
  timestamp: {
    start: Timestamp
    end: Timestamp
  }
  actor: string
  content: string
}

export type SubtitleNoTime = Omit<Subtitle, 'timestamp'>

export type SubtitleTranslated = Subtitle & {
  translated: string
}

export type SubtitleNoTimeTranslated = Omit<SubtitleTranslated, 'timestamp'>

export type SubtitleNoTimeNoActorTranslated = Omit<SubtitleNoTimeTranslated, 'actor'>

export interface SubtitleMinimal {
  index: number
  content: string
}

export interface ASSParseOutput {
  subtitles: Subtitle[]
  header: string
  events: SubtitleEvent[]
  footer: string
}

export enum DialogueType {
  Dialogue,
  Comment,
}

export interface SubtitleEvent {
  format: 'Dialogue' | 'Comment'
  layer: number
  start: string
  end: string
  style: string
  name: string
  marginL: string
  marginR: string
  marginV: string
  effect: string
  text: string
}

export interface TranslateSubtitleOption {
  subtitles: Subtitle[]
  sourceLanguage: string
  targetLanguage: string
  contextDocument: string
  split: number
  apiKey?: string
  baseURL: string
  model: string
  temperature: number
  structuredOutput: boolean
  maxCompletionTokens: number
}

export type TranslateRawContentOptions = Omit<TranslateSubtitleOption, "subtitles"> & {
  contentRaw: string
}

export interface ContextExtractionInput {
  episode: string
  subtitles: SubtitleNoTime[]
  previous_context: string
}

export type StreamChatCompletion = Stream<ChatCompletionChunk> & {
  _request_id?: string | null;
}
