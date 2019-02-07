// next version number
const version = 30

/*

removes invalid chaids from preferences and networkController for custom rpcs

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
  if (state.PreferencesController) {
    const frequentRpcListDetail = newState.PreferencesController.frequentRpcListDetail
    if (frequentRpcListDetail) {
      frequentRpcListDetail.forEach((rpc, index) => {
        if (!!rpc.chainId && Number.isNaN(parseInt(rpc.chainId))) {
          delete frequentRpcListDetail[index].chainId
        }
      })
      newState.PreferencesController.frequentRpcListDetail = frequentRpcListDetail
    }
  }
  if (state.NetworkController) {
    if (newState.NetworkController.network && Number.isNaN(parseInt(newState.NetworkController.network))) {
      delete newState.NetworkController.network
    }

    if (newState.NetworkController.provider && newState.NetworkController.provider.chainId && Number.isNaN(parseInt(newState.NetworkController.provider.chainId))) {
      delete newState.NetworkController.provider.chainId
    }
  }

  return newState
}
