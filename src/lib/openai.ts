import OpenAI from 'openai'

let instance: Map<string, OpenAI> = new Map()

export const openai = (baseURL: string, apiKey?: string): OpenAI => {
  const resolvedApiKey = apiKey || process.env.OPENAI_API_KEY
  if (!resolvedApiKey) {
    throw new Error('API key is required. Provide it as an argument or set OPENAI_API_KEY in the environment.')
  }
  const compositeKey = `${baseURL}:${resolvedApiKey}`
  if (!instance.has(compositeKey)) {
    instance.set(
      compositeKey,
      new OpenAI({
        apiKey: resolvedApiKey,
        baseURL,
      }),
    )
  }
  return instance.get(compositeKey)!
}
