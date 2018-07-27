// next version number
const version = 28

/*

normalizes txParams on unconfirmed txs

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

  if (newState.PreferencesController) {
    if (newState.PreferencesController.tokens) {
      const tokens = newState.TransactionController.tokens
      const selectedAddress = newState.PreferencesController.selectedAddress
      newState.PreferencesController.tokens = []
      newState.PreferencesController.accountTokens = {selectedAddress: {'mainnet': tokens}}
    }
  }

  return newState
}
