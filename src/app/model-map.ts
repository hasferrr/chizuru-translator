const modelList = process.env.FREE_MODEL_NAME?.split(',') || []
const baseUrlList = process.env.FREE_MODEL_BASE_URL?.split(',') || []
const apiKeyList = process.env.FREE_API_KEY?.split(',') || []

interface ModelData {
  baseURL: string
  apiKey: string
}

export const modelMap = new Map<string, ModelData>()

for (let i = 0; i < modelList.length; i++) {
  modelMap.set(modelList[i], {
    baseURL: baseUrlList[i],
    apiKey: apiKeyList[i],
  })
}
