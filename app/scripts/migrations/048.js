import { cloneDeep } from 'lodash'

const version = 48

/**
 * 1.  Delete NetworkController.settings
 * 2a. Delete NetworkController.provider if set to type 'rpc'.
 *     It will be re-set to Mainnet on background initialization.
 * 2b. Re-key provider.rpcTarget to provider.rpcUrl
 */
export default {
  version,
  async migrate (originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

function transformState (state = {}) {
  // 1. Delete NetworkController.settings
  delete state.NetworkController?.settings

  // 2. Delete NetworkController.provider or rename rpcTarget key
  if (state.NetworkController?.provider?.type === 'rpc') {
    delete state.NetworkController.provider
  } else if (state.NetworkController?.provider) {
    if ('rpcTarget' in state.NetworkController.provider) {
      const rpcUrl = state.NetworkController.provider.rpcTarget
      state.NetworkController.provider.rpcUrl = rpcUrl
    }
    delete state.NetworkController?.provider?.rpcTarget
  }

  return state
}
