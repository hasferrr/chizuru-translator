import type { BatchExtractionOutput, ContextDocument } from "./context-schema"

export class ContextManager {
  private context: ContextDocument

  constructor() {
    this.context = {
      characterList: [],
      glossary: [],
      plotSummary: "",
      setting: [],
    }
  }

  public getContext(): ContextDocument {
    return this.context
  }
  public getContextString(): string {
    return this.convertContextToString(this.context)
  }

  // update context
  public updateContext(extractedData: BatchExtractionOutput): void {
    // --- Characters ---
    for (const char of extractedData.new_characters) {
      // Check if the character already exists (by name)
      const existingCharIndex = this.context.characterList.findIndex(c => c.name === char.name)
      if (existingCharIndex === -1) {
        // Add the new character
        this.context.characterList.push(char)
      } else {
        // could update the existing character if needed.
        console.warn(`Character "${char.name}" already exists. Consider refining the description.`)
      }
    }

    // --- Terminology ---
    for (const term of extractedData.new_terminology) {
      // Check if the term already exists (by term name)
      const existingTermIndex = this.context.glossary.findIndex(t => t.term === term.term)

      if (existingTermIndex === -1) {
        // Add the new term
        this.context.glossary.push(term)
      } else {
        // Handle "Related to Glossary" logic (simplified)
        // In a real application, you might compare definitions and update if needed
        console.warn(`Term "${term.term}" already exists. Consider refining the definition.`)
      }
    }

    // --- Plot Summary ---
    this.context.plotSummary += `Episode ${extractedData.episode}: ${extractedData.plot_summary}\n`

    // --- Setting ---
    for (const detail of extractedData.new_setting_details) {
      // Check if the setting detail already exists (by name)
      const existingDetailIndex = this.context.setting.findIndex(s => s.name === detail.name)
      if (existingDetailIndex === -1) {
        this.context.setting.push(detail)
      } else {
        console.warn(`Setting "${detail.name}" already exists. Consider refining the setting.`)
      }
    }
  }

  // convert context to string
  private convertContextToString(context: ContextDocument): string {
    let contextString = "Character List:\n"
    for (const char of context.characterList) {
      contextString += `- ${char.name}: ${char.description} - ${char.speech_patterns} - ${char.relationships}\n`
    }

    contextString += "\nGlossary:\n"
    for (const term of context.glossary) {
      contextString += `- ${term.term}: ${term.tentative_translation} - ${term.definition}\n`
    }

    contextString += "\nPlot Summary:\n"
    contextString += context.plotSummary

    contextString += "\nSetting:\n"
    for (const detail of context.setting) {
      contextString += `- ${detail.name}: ${detail.tentative_translation} - ${detail.significance}\n`
    }

    return contextString
  }
}
