// next version number
const version = 26

/*

description of migration and what it does

*/

const clone = require('clone')

module.exports = {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = clone(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    const newState = transformState(state)
    versionedData.data = newState
    return versionedData
  },
}

function transformState (state) {
  const newState = state
  const { forgottenPassword, seedWords } = state
  newState.Config = {}

  if (forgottenPassword) {
    newState.Config.forgottenPassword = forgottenPassword
  }

  if (seedWords) {
    newState.Config.seedWords = seedWords
  }

  return newState
}
