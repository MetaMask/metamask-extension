import { cloneDeep } from 'lodash'

const version = 45

/**
 * Replaces {@code PreferencesController.ipfsGateway} with 'dweb.link' if set
 */
export default {
  version,
  async migrate(originalVersionedData) {
    const versionedData = cloneDeep(originalVersionedData)
    versionedData.meta.version = version
    const state = versionedData.data
    versionedData.data = transformState(state)
    return versionedData
  },
}

const outdatedGateways = ['ipfs.io', 'ipfs.dweb.link']

function transformState(state) {
  if (outdatedGateways.includes(state?.PreferencesController?.ipfsGateway)) {
    state.PreferencesController.ipfsGateway = 'dweb.link'
  }
  return state
}
