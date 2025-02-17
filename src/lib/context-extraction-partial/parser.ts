import { cleanUpJsonResponse } from "../../utils/response-utils"
import { type BatchExtractionOutput, BatchExtractionOutputSchema } from "./context-schema"

export function parseContextExtractionJson(response: string): BatchExtractionOutput {
  try {
    const parsedData = BatchExtractionOutputSchema.parse(JSON.parse(cleanUpJsonResponse(response)))
    return parsedData
  } catch (error) {
    console.error("Error parsing JSON output:", error)
    console.log("Raw output:", response)
    throw new Error("Invalid JSON output from API call.")
  }
}
