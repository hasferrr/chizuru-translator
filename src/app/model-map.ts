const modelForApi = process.env.FREE_MODEL_NAME_SHOWN_FOR_API?.split(',') || []
const modelList = process.env.FREE_MODEL_NAME?.split(',') || []
const baseUrlList = process.env.FREE_MODEL_BASE_URL?.split(',') || []
const apiKeyList = process.env.FREE_API_KEY?.split(',') || []

interface ModelData {
  model: string
  baseURL: string
  apiKey: string
}

export const modelMap = new Map<string, ModelData>()

for (let i = 0; i < modelForApi.length; i++) {
  modelMap.set(modelForApi[i], {
    model: modelList[i],
    baseURL: baseUrlList[i],
    apiKey: apiKeyList[i],
  })
}
