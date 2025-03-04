import { z } from "zod"

const modelDataSchema = z.object({
  name: z.string(),
  model: z.string(),
  baseURL: z.string(),
  apiKey: z.string(),
})

type ModelData = z.infer<typeof modelDataSchema>

let modelArray: ModelData[] = []
try {
  if (process.env.FREE_MODEL_JSON === undefined) {
    console.log("FREE_MODEL_JSON is not defined")
  }
  const json = JSON.parse(process.env.FREE_MODEL_JSON ?? "[]")
  modelArray = z.array(modelDataSchema).parse(json)
} catch (e) {
  console.error(e)
}

export const modelMap = new Map<string, ModelData>()

for (const model of modelArray) {
  modelMap.set(model.name, model)
}
