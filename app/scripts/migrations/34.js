// next version number
const version = 30

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
  const { PreferencesController, NetworkController } = state
  const networkConfigs = require('../controllers/network/enums').DEFAULT_LIST

  if (PreferencesController) {
    const { frequentRpcListDetail } = PreferencesController
    if (frequentRpcListDetail) {
      networkConfigs.concat(frequentRpcListDetail.map((network) => {
        const {
          nickname,
          rpcUrl,
          ticker,
          chainId,
          rpcPrefs = {},
        } = network

        rpcPrefs.ticker = ticker
        rpcPrefs.name = nickname
        rpcPrefs.ticker = ticker
        rpcPrefs.chainId = chainId

        return {
          type: 'custom#eth:rpc',
          rpcUrl,
          custom: rpcPrefs,
        }
      }))
    }
  }

  if (NetworkController) {
    const { provider } = NetworkController
    if (provider) {
      const selectedNetwork = networkConfigs.find((config) => {
        if (provider.type === 'rpc') return config.rpcUrl === provider.rpcTarget
        else return config.type === provider.type
      })
      newState.NetworkController = { selectedNetwork }
    }

  } else {
    newState.NetworkController = {}
  }
  newState.NetworkController.networkConfigs = networkConfigs
  return newState
}
