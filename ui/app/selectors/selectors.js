import { flatten, forOwn } from 'lodash'
import { NETWORK_TYPES } from '../helpers/constants/common'
import { stripHexPrefix, addHexPrefix } from 'ethereumjs-util'
import { createSelector } from 'reselect'

import abi from 'human-standard-token-abi'
import { multiplyCurrencies } from '../helpers/utils/conversion-util'
import {
  addressSlicer,
  checksumAddress,
  getOriginFromUrl,
  getAccountByAddress,
} from '../helpers/utils/util'

import { getPermittedAccountsMap } from './permissions'

export { getPermittedAccounts } from './permissions'

export function getNetworkIdentifier (state) {
  const { metamask: { provider: { type, nickname, rpcTarget } } } = state

  return nickname || rpcTarget || type
}

export function getCurrentKeyring (state) {
  const identity = getSelectedIdentity(state)

  if (!identity) {
    return null
  }

  const simpleAddress = stripHexPrefix(identity.address).toLowerCase()

  const keyring = state.metamask.keyrings.find((kr) => {
    return kr.accounts.includes(simpleAddress) ||
      kr.accounts.includes(identity.address)
  })

  return keyring
}

export function getAccountType (state) {
  const currentKeyring = getCurrentKeyring(state)
  const type = currentKeyring && currentKeyring.type

  switch (type) {
    case 'Trezor Hardware':
    case 'Ledger Hardware':
      return 'hardware'
    case 'Simple Key Pair':
      return 'imported'
    default:
      return 'default'
  }
}

export function getSelectedAsset (state) {
  const selectedToken = getSelectedToken(state)
  return (selectedToken && selectedToken.symbol) || 'ETH'
}

export function getCurrentNetworkId (state) {
  return state.metamask.network
}

export const getMetaMaskAccounts = createSelector(
  getMetaMaskAccountsRaw,
  getMetaMaskCachedBalances,
  (currentAccounts, cachedBalances) => Object.entries(currentAccounts).reduce((selectedAccounts, [accountID, account]) => {
    if (account.balance === null || account.balance === undefined) {
      return {
        ...selectedAccounts,
        [accountID]: {
          ...account,
          balance: cachedBalances && cachedBalances[accountID],
        },

      }
    } else {
      return {
        ...selectedAccounts,
        [accountID]: account,
      }
    }
  }, {})
)

export function getSelectedAddress (state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(getMetaMaskAccounts(state))[0]

  return selectedAddress
}

export function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

export function getNumberOfAccounts (state) {
  return Object.keys(state.metamask.accounts).length
}

export function getNumberOfTokens (state) {
  const tokens = state.metamask.tokens
  return tokens ? tokens.length : 0
}

export function getMetaMaskKeyrings (state) {
  return state.metamask.keyrings
}

export function getMetaMaskIdentities (state) {
  return state.metamask.identities
}

export function getMetaMaskAccountsRaw (state) {
  return state.metamask.accounts
}

export function getMetaMaskCachedBalances (state) {
  const network = getCurrentNetworkId(state)

  return state.metamask.cachedBalances[network]
}

/**
 * Get ordered (by keyrings) accounts with identity and balance
 */
export const getMetaMaskAccountsOrdered = createSelector(
  getMetaMaskKeyrings,
  getMetaMaskIdentities,
  getMetaMaskAccounts,
  (keyrings, identities, accounts) => keyrings
    .reduce((list, keyring) => list.concat(keyring.accounts), [])
    .filter((address) => !!identities[address])
    .map((address) => ({ ...identities[address], ...accounts[address] }))
)

export function isBalanceCached (state) {
  const selectedAccountBalance = state.metamask.accounts[getSelectedAddress(state)].balance
  const cachedBalance = getSelectedAccountCachedBalance(state)

  return Boolean(!selectedAccountBalance && cachedBalance)
}

export function getSelectedAccountCachedBalance (state) {
  const cachedBalances = state.metamask.cachedBalances[state.metamask.network]
  const selectedAddress = getSelectedAddress(state)

  return cachedBalances && cachedBalances[selectedAddress]
}

export function getSelectedAccount (state) {
  const accounts = getMetaMaskAccounts(state)
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}

export function getTargetAccount (state, targetAddress) {
  const accounts = getMetaMaskAccounts(state)
  return accounts[targetAddress]
}

export function getSelectedToken (state) {
  const tokens = state.metamask.tokens || []
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.metamask.send && state.metamask.send.token

  return selectedToken || sendToken || null
}

export function getSelectedTokenExchangeRate (state) {
  const contractExchangeRates = state.metamask.contractExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return contractExchangeRates[address] || 0
}

export function getSelectedTokenAssetImage (state) {
  const assetImages = state.metamask.assetImages || {}
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return assetImages[address]
}

export function getAssetImages (state) {
  const assetImages = state.metamask.assetImages || {}
  return assetImages
}

export function getTokenExchangeRate (state, address) {
  const contractExchangeRates = state.metamask.contractExchangeRates
  return contractExchangeRates[address] || 0
}

export function conversionRateSelector (state) {
  return state.metamask.conversionRate
}

export function getAddressBook (state) {
  const network = state.metamask.network
  if (!state.metamask.addressBook[network]) {
    return []
  }
  return Object.values(state.metamask.addressBook[network])
}

export function getAddressBookEntry (state, address) {
  const addressBook = getAddressBook(state)
  const entry = addressBook.find((contact) => contact.address === checksumAddress(address))
  return entry
}

export function getAddressBookEntryName (state, address) {
  const entry = getAddressBookEntry(state, address) || state.metamask.identities[address]
  return entry && entry.name !== '' ? entry.name : addressSlicer(address)
}

export function getDaiV1Token (state) {
  const OLD_DAI_CONTRACT_ADDRESS = '0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359'
  const tokens = state.metamask.tokens || []
  return tokens.find(({ address }) => checksumAddress(address) === OLD_DAI_CONTRACT_ADDRESS)
}

export function accountsWithSendEtherInfoSelector (state) {
  const accounts = getMetaMaskAccounts(state)
  const { identities } = state.metamask

  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

export function getAccountsWithLabels (state) {
  return accountsWithSendEtherInfoSelector(state).map(({ address, name, balance }) => ({
    address,
    addressLabel: `${name} (...${address.slice(address.length - 4)})`,
    label: name,
    balance,
  }))
}

export function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return getAccountByAddress(accounts, currentAddress)
}

export function getTargetAccountWithSendEtherInfo (state, targetAddress) {
  const accounts = accountsWithSendEtherInfoSelector(state)
  return getAccountByAddress(accounts, targetAddress)
}

export function getCurrentEthBalance (state) {
  return getCurrentAccountWithSendEtherInfo(state).balance
}

export function getGasIsLoading (state) {
  return state.appState.gasIsLoading
}

export function getForceGasMin (state) {
  return state.metamask.send.forceGasMin
}

export function getSendAmount (state) {
  return state.metamask.send.amount
}

export function getSendMaxModeState (state) {
  return state.metamask.send.maxModeOn
}

export function getCurrentCurrency (state) {
  return state.metamask.currentCurrency
}

export function getNativeCurrency (state) {
  return state.metamask.nativeCurrency
}

export function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = conversionRateSelector(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' }
  )

  return tokenToFiatRate
}

export function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

export function getTotalUnapprovedCount (state) {
  const {
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedDecryptMsgCount = 0,
    unapprovedEncryptionPublicKeyMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
  } = state.metamask

  return unapprovedMsgCount + unapprovedPersonalMsgCount + unapprovedDecryptMsgCount +
    unapprovedEncryptionPublicKeyMsgCount + unapprovedTypedMessagesCount +
    getUnapprovedTxCount(state) + getPermissionsRequestCount(state) + getSuggestedTokenCount(state)
}

function getUnapprovedTxCount (state) {
  const { unapprovedTxs = {} } = state.metamask
  return Object.keys(unapprovedTxs).length
}

function getSuggestedTokenCount (state) {
  const { suggestedTokens = {} } = state.metamask
  return Object.keys(suggestedTokens).length
}

export function getIsMainnet (state) {
  const networkType = getNetworkIdentifier(state)
  return networkType === NETWORK_TYPES.MAINNET
}

export function isEthereumNetwork (state) {
  const networkType = getNetworkIdentifier(state)
  const {
    KOVAN,
    MAINNET,
    RINKEBY,
    ROPSTEN,
    GOERLI,
  } = NETWORK_TYPES

  return [ KOVAN, MAINNET, RINKEBY, ROPSTEN, GOERLI].includes(networkType)
}

export function preferencesSelector ({ metamask }) {
  return metamask.preferences
}

export function getAdvancedInlineGasShown (state) {
  return Boolean(state.metamask.featureFlags.advancedInlineGas)
}

export function getUseNonceField (state) {
  return Boolean(state.metamask.useNonceField)
}

export function getUsePhishDetect (state) {
  return Boolean(state.metamask.usePhishDetect)
}

export function getCustomNonceValue (state) {
  return String(state.metamask.customNonceValue)
}

export function getPermissionsDescriptions (state) {
  return state.metamask.permissionsDescriptions
}

export function getPermissionsRequests (state) {
  return state.metamask.permissionsRequests || []
}

export function getPermissionsRequestCount (state) {
  const permissionsRequests = getPermissionsRequests(state)
  return permissionsRequests.length
}

export function getDomainMetadata (state) {
  return state.metamask.domainMetadata
}

export function getTargetDomainMetadata (state, request, defaultOrigin) {
  const domainMetadata = getDomainMetadata(state)

  const { metadata: requestMetadata = {} } = request || {}
  const origin = requestMetadata.origin || defaultOrigin
  const targetDomainMetadata = (domainMetadata[origin] || { name: origin, icon: null })
  targetDomainMetadata.origin = origin

  return targetDomainMetadata
}

export function getMetaMetricState (state) {
  return {
    network: getCurrentNetworkId(state),
    activeCurrency: getSelectedAsset(state),
    accountType: getAccountType(state),
    metaMetricsId: state.metamask.metaMetricsId,
    numberOfTokens: getNumberOfTokens(state),
    numberOfAccounts: getNumberOfAccounts(state),
    participateInMetaMetrics: state.metamask.participateInMetaMetrics,
  }
}

export function getRpcPrefsForCurrentProvider (state) {
  const { frequentRpcListDetail, provider } = state.metamask
  const selectRpcInfo = frequentRpcListDetail.find((rpcInfo) => rpcInfo.rpcUrl === provider.rpcTarget)
  const { rpcPrefs = {} } = selectRpcInfo || {}
  return rpcPrefs
}

export function getKnownMethodData (state, data) {
  if (!data) {
    return null
  }
  const prefixedData = addHexPrefix(data)
  const fourBytePrefix = prefixedData.slice(0, 10)
  const { knownMethodData } = state.metamask

  return knownMethodData && knownMethodData[fourBytePrefix]
}

export function getFeatureFlags (state) {
  return state.metamask.featureFlags
}

export function getFirstPermissionRequest (state) {
  const requests = getPermissionsRequests(state)
  return requests && requests[0] ? requests[0] : null
}

export function hasPermissionRequests (state) {
  return Boolean(getFirstPermissionRequest(state))
}

export function getPermissionsDomains (state) {
  return state.metamask.domains
}

export function getAddressConnectedDomainMap (state) {
  const {
    domainMetadata,
  } = state.metamask

  const accountsMap = getPermittedAccountsMap(state)
  const addressConnectedIconMap = {}

  Object.keys(accountsMap).forEach((domainKey) => {
    const { icon, name } = domainMetadata[domainKey] || {}
    accountsMap[domainKey].forEach((address) => {
      const nameToRender = name || domainKey
      addressConnectedIconMap[address] = addressConnectedIconMap[address]
        ? { ...addressConnectedIconMap[address], [domainKey]: { icon, name: nameToRender } }
        : { [domainKey]: { icon, name: nameToRender } }
    })
  })

  return addressConnectedIconMap
}

export function getPermittedAccountsForCurrentTab (state) {
  const permittedAccountsMap = getPermittedAccountsMap(state)
  const originOfCurrentTab = getOriginOfCurrentTab(state)
  return permittedAccountsMap[originOfCurrentTab] || []
}

export function getOriginOfCurrentTab (state) {
  const { activeTab } = state
  return activeTab && activeTab.url && getOriginFromUrl(activeTab.url)
}

export function getLastConnectedInfo (state) {
  const { permissionsHistory = {} } = state.metamask
  const lastConnectedInfoData = Object.keys(permissionsHistory).reduce((acc, origin) => {
    const ethAccountsHistory = JSON.parse(JSON.stringify(permissionsHistory[origin]['eth_accounts']))
    return {
      ...acc,
      [origin]: ethAccountsHistory.accounts,
    }
  }, {})
  return lastConnectedInfoData
}

export function getIpfsGateway (state) {
  return state.metamask.ipfsGateway
}

export function getConnectedDomainsForSelectedAddress (state) {
  const {
    domains = {},
    domainMetadata,
    selectedAddress,
  } = state.metamask

  const connectedDomains = []

  forOwn(domains, (value, domain) => {
    const exposedAccounts = flatten(value.permissions.map(
      (p) => p.caveats?.find(({ name }) => name === 'exposedAccounts').value || []
    ))
    if (!exposedAccounts.includes(selectedAddress)) {
      return
    }

    const {
      extensionId,
      name,
      icon,
    } = domainMetadata[domain] || {}

    connectedDomains.push({
      extensionId,
      key: domain,
      name,
      icon,
    })
  })

  return connectedDomains
}
