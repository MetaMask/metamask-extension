export function selectSeedWord (word, shuffledIndex) {
  return function update (state) {
    const { selectedSeedWords, selectedSeedWordsHash } = state
    const nextSelectedIndex = selectedSeedWords.length

    return {
      selectedSeedWords: [ ...selectedSeedWords, word ],
      selectedSeedWordsHash: { ...selectedSeedWordsHash, [shuffledIndex]: nextSelectedIndex },
    }
  }
}

export function deselectSeedWord (shuffledIndex) {
  return function update (state) {
    const {
      selectedSeedWords: prevSelectedSeedWords,
      selectedSeedWordsHash: prevSelectedSeedWordsHash,
    } = state

    const selectedSeedWords = [...prevSelectedSeedWords]
    const indexToRemove = prevSelectedSeedWordsHash[shuffledIndex]
    selectedSeedWords.splice(indexToRemove, 1)
    const selectedSeedWordsHash = Object.keys(prevSelectedSeedWordsHash).reduce((acc, index) => {
      const output = { ...acc }
      const selectedSeedWordIndex = prevSelectedSeedWordsHash[index]

      if (selectedSeedWordIndex < indexToRemove) {
        output[index] = selectedSeedWordIndex
      } else if (selectedSeedWordIndex > indexToRemove) {
        output[index] = selectedSeedWordIndex - 1
      }

      return output
    }, {})

    return {
      selectedSeedWords,
      selectedSeedWordsHash,
    }
  }
}
