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
  content: string
  translated?: string
}

export type SubtitleNoTime = Omit<Subtitle, 'timestamp'>

export interface ASSParseOutput {
  output: string[]
  styleOnly: string[]
  textOnly: string[]
  commentsOnly: string[]
  header: string[]
  footer: string[]
  order: DialogueType[]
}

export enum DialogueType {
  Dialogue,
  Comment,
}
