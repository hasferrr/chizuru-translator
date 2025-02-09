import OpenAI from 'openai'

let instance: Map<string, OpenAI> = new Map()

export const openai = (baseURL: string): OpenAI => {
  if (!instance.has(baseURL)) {
    instance.set(
      baseURL,
      new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL,
      }),
    )
  }
  return instance.get(baseURL)!
}
