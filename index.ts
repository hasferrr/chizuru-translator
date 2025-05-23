import fs from "fs"
import { translateRawContent } from "./src/script/direct-translate-raw"

const API_KEY = process.env.OPENAI_API_KEY
const BASE_URL = "https://api.deepseek.com"
const MODEL = "deepseek-reasoner"

const main = async () => {
  const translated = await translateRawContent("ass", {
    contentRaw: fs.readFileSync("sample.ass", "utf-8"),
    sourceLanguage: "Japanese",
    targetLanguage: "Indonesian",
    contextDocument: "",
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    split: 150 * 8,
    temperature: 0.6,
    maxCompletionTokens: 8000 * 8,
    structuredOutput: true,
  })
  fs.writeFileSync("translated.ass", translated)
}

main()
