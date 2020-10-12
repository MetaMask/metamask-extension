import { cloneDeep } from 'lodash'

const version = 48

/**
 * 1.  Delete NetworkController.settings
 * 2a. Migrate NetworkController.provider to Rinkeby if set to type 'rpc' or
 *     'localhost'.
 * 2b. Re-key provider.rpcTarget to provider.rpcUrl
 * 3.  Add localhost network to frequentRpcListDetail.
 * 4.  Delete CachedBalancesController.cachedBalances
 * 5.  Convert transactions metamaskNetworkId to decimal if they are hex
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

const hexRegEx = (/^0x[0-9a-f]+$/ui)
const chainIdRegEx = (/^0x[1-9a-f]+[0-9a-f]*$/ui)

function transformState (state = {}) {
  // 1. Delete NetworkController.settings
  delete state.NetworkController?.settings

  // 2. Migrate NetworkController.provider to Rinkeby or rename rpcTarget key
  const provider = state.NetworkController?.provider || {}
  const isCustomRpcWithInvalidChainId = (
    provider.type === 'rpc' && (
      typeof provider.chainId !== 'string' ||
      !chainIdRegEx.test(provider.chainId)
    )
  )
  if (isCustomRpcWithInvalidChainId || provider.type === 'localhost') {
    state.NetworkController.provider = {
      type: 'rinkeby',
      rpcUrl: '',
      chainId: '0x4',
      nickname: '',
      rpcPrefs: {},
      ticker: 'ETH',
    }
  } else if (state.NetworkController?.provider) {
    if ('rpcTarget' in state.NetworkController.provider) {
      const rpcUrl = state.NetworkController.provider.rpcTarget
      state.NetworkController.provider.rpcUrl = rpcUrl
    }
    delete state.NetworkController?.provider?.rpcTarget
  }

  // 3.  Add localhost network to frequentRpcListDetail.
  if (!state.PreferencesController) {
    state.PreferencesController = {}
  }
  if (!state.PreferencesController.frequentRpcListDetail) {
    state.PreferencesController.frequentRpcListDetail = []
  }
  state.PreferencesController.frequentRpcListDetail.unshift({
    rpcUrl: 'http://localhost:8545',
    chainId: '0x539',
    ticker: 'ETH',
    nickname: 'Localhost 8545',
    rpcPrefs: {},
  })

  // 4.  Delete CachedBalancesController.cachedBalances
  delete state.CachedBalancesController?.cachedBalances

  // 5.  Convert transactions metamaskNetworkId to decimal if they are hex
  const transactions = state.TransactionController?.transactions
  if (Array.isArray(transactions)) {
    transactions.forEach((transaction) => {
      const metamaskNetworkId = transaction?.metamaskNetworkId
      if (
        typeof metamaskNetworkId === 'string' &&
        hexRegEx.test(metamaskNetworkId)
      ) {
        transaction.metamaskNetworkId = parseInt(metamaskNetworkId, 16)
          .toString(10)
      }
    })
  }

  return state
}
