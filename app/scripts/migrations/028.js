// next version number
const version = 28

/*

normalizes txParams on unconfirmed txs

*/
import { cloneDeep } from 'lodash'

export default {
  version,

  migrate: async function (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
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
    if (newState.PreferencesController.tokens && newState.PreferencesController.identities) {
      const identities = newState.PreferencesController.identities
      const tokens = newState.PreferencesController.tokens
      newState.PreferencesController.accountTokens = {}
      for (const identity in identities) {
        newState.PreferencesController.accountTokens[identity] = { 'mainnet': tokens }
      }
      newState.PreferencesController.tokens = []
    }
  }

  return newState
}
