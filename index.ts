import fs from "fs"
import { translateContent } from "./src/script/direct-translate"

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.fireworks.ai/inference/v1"
const MODEL = "accounts/fireworks/models/deepseek-r1"

const main = async () => {
  const translated = await translateContent("ass", {
    contentRaw: fs.readFileSync("sample.ass", "utf-8"),
    sourceLanguage: "Japanese",
    targetLanguage: "Indonesian",
    contextDocument: "",
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    split: 500,
    temperature: 1,
    maxTokens: 100000,
  })
  fs.writeFileSync("translated.ass", translated)
}

main()
