const version = 43
import { cloneDeep } from 'lodash'

/**
 * reset all network if not migratedToTethys
 */
export default {
  version,
  migrate: async function(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState(state) {
  if (state.PreferencesController) {
    if (state.PreferencesController.migratedToTethys) {
      return state
    }

    if (
      state.TransactionController &&
      state.TransactionController.transactions &&
      state.TransactionController.transactions.length
    )
      state.TransactionController.transactions = []
    state.NetworkController = {}
    state.PreferencesController.migratedToTethys = true
  }
  return state
}
