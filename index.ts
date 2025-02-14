import fs from "fs"
import { translateContent } from "./src/script/direct-translate"

const apiKey = process.env.OPENAI_API_KEY
const baseURL = "https://api.fireworks.ai/inference/v1"
const model = "accounts/fireworks/models/deepseek-r1"

const main = async () => {
  const translated = await translateContent("ass", {
    contentRaw: fs.readFileSync("sample.ass", "utf-8"),
    sourceLanguage: "Japanese",
    targetLanguage: "Indonesian",
    apiKey,
    baseURL,
    model,
    split: 500,
    temperature: 1,
    maxTokens: 100000,
  })
  fs.writeFileSync("translated.ass", translated)
}

main()
