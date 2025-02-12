import fs from "fs"
import { translateSrtContent } from "./src/script/direct-translate-srt"
import { translateAssContent } from "./src/script/direct-translate-ass"

const apiKey = process.env.OPENAI_API_KEY
const baseURL = "https://api.fireworks.ai/inference/v1"
const model = "accounts/fireworks/models/deepseek-r1"

const srt = async () => {
  const translated = await translateSrtContent({
    contentRaw: fs.readFileSync("sample.srt", "utf-8"),
    sourceLanguage: "Japanese",
    targetLanguage: "Indonesian",
    apiKey,
    baseURL,
    model,
    split: 100,
    temperature: 1,
    maxTokens: 16380,
  })
  fs.writeFileSync("translated.srt", translated)
}

const ass = async () => {
  const translated = await translateAssContent({
    contentRaw: fs.readFileSync("sample.ass", "utf-8"),
    sourceLanguage: "Japanese",
    targetLanguage: "Indonesian",
    apiKey,
    baseURL,
    model,
    split: 100,
    temperature: 1,
    maxTokens: 16380,
  })
  fs.writeFileSync("translated.ass", translated)
}

// await srt()
// await ass()
