export function capitalizeWords(inputString: string): string {
  const words: string[] = inputString.split(' ')
  const modifiedWords: string[] = []
  for (const word of words) {
    if (word) {
      const modifiedWord: string = word.charAt(0).toUpperCase() + word.slice(1)
      modifiedWords.push(modifiedWord)
    } else {
      modifiedWords.push('')
    }
  }
  return modifiedWords.join(' ')
}
