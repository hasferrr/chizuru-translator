import OpenAI from 'openai'

let instance: OpenAI | null = null

export const openai = (baseURL: string) => {
  if (!instance) {
    instance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL,
    })
  }
  return instance
}
