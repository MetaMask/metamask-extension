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
 * 6.  Convert address book keys from decimal to hex
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

  // 6.  Convert address book keys from decimal to hex
  const addressBook = state.AddressBookController?.addressBook || {}
  Object.keys(addressBook).forEach((networkKey) => {
    if ((/^\d+$/ui).test(networkKey)) {
      const chainId = `0x${networkKey.toString(16)}`
      updateChainIds(addressBook[networkKey], chainId)

      if (addressBook[chainId]) {
        mergeAddressBookKeys(addressBook, networkKey, chainId)
      } else {
        addressBook[chainId] = addressBook[networkKey]
      }
      delete addressBook[networkKey]
    }
  })

  return state
}

/**
 * Merges the two given keys for the given address book in place.
 *
 * @returns {void}
 */
function mergeAddressBookKeys (addressBook, networkKey, chainIdKey) {
  const networkKeyEntries = addressBook[networkKey] || {}
  // For the new entries, start by copying the existing entries for the chainId
  const newEntries = { ...addressBook[chainIdKey] }

  // For each address of the old/networkId key entries
  Object.keys(networkKeyEntries).forEach((address) => {
    if (newEntries[address] && typeof newEntries[address] === 'object') {
      const mergedEntry = {}

      // Collect all keys from both entries and merge the corresponding chainId
      // entry with the networkId entry
      new Set([
        ...Object.keys(newEntries[address]),
        ...Object.keys(networkKeyEntries[address] || {}),
      ]).forEach((key) => {
        // Use non-empty value for the current key, if any
        mergedEntry[key] = (
          newEntries[address][key] ||
          networkKeyEntries[address]?.[key] ||
          ''
        )
      })

      newEntries[address] = mergedEntry
    } else if (
      networkKeyEntries[address] &&
      typeof networkKeyEntries[address] === 'object'
    ) {
      // If there is no corresponding chainId entry, just use the networkId entry
      // directly
      newEntries[address] = networkKeyEntries[address]
    }
  })

  addressBook[chainIdKey] = newEntries
}

/**
 * Updates the chainId key values to the given chainId in place for all values
 * of the given networkEntries object.
 *
 * @returns {void}
 */
function updateChainIds (networkEntries, chainId) {
  Object.values(networkEntries).forEach((entry) => {
    if (entry && typeof entry === 'object') {
      entry.chainId = chainId
    }
  })
}
