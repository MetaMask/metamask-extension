import { NETWORK_TYPES } from '../helpers/constants/common'
import { stripHexPrefix, addHexPrefix } from 'ethereumjs-util'


const abi = require('human-standard-token-abi')
import {
  transactionsSelector,
} from './transactions'
const {
  multiplyCurrencies,
} = require('../helpers/utils/conversion-util')
import {
  addressSlicer,
  checksumAddress,
} from '../helpers/utils/util'

const selectors = {
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedAccount,
  getSelectedToken,
  getSelectedTokenExchangeRate,
  getSelectedTokenAssetImage,
  getAssetImages,
  getTokenExchangeRate,
  conversionRateSelector,
  transactionsSelector,
  accountsWithSendEtherInfoSelector,
  getCurrentAccountWithSendEtherInfo,
  getGasIsLoading,
  getForceGasMin,
  getAddressBook,
  getSendFrom,
  getCurrentCurrency,
  getNativeCurrency,
  getSendAmount,
  getSelectedTokenToFiatRate,
  getSelectedTokenContract,
  getSendMaxModeState,
  getCurrentViewContext,
  getTotalUnapprovedCount,
  preferencesSelector,
  getMetaMaskAccounts,
  getCurrentEthBalance,
  getNetworkIdentifier,
  isBalanceCached,
  getAdvancedInlineGasShown,
  getUseNonceField,
  getCustomNonceValue,
  getIsMainnet,
  getCurrentNetworkId,
  getSelectedAsset,
  getCurrentKeyring,
  getAccountType,
  getNumberOfAccounts,
  getNumberOfTokens,
  isEthereumNetwork,
  getMetaMetricState,
  getRpcPrefsForCurrentProvider,
  getKnownMethodData,
  getAddressBookEntry,
  getAddressBookEntryName,
  getFeatureFlags,
}

module.exports = selectors

function getNetworkIdentifier (state) {
  const { metamask: { provider: { type, nickname, rpcTarget } } } = state

  return nickname || rpcTarget || type
}

function getCurrentKeyring (state) {
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

function getAccountType (state) {
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

function getSelectedAsset (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken && selectedToken.symbol || 'ETH'
}

function getCurrentNetworkId (state) {
  return state.metamask.network
}

function getSelectedAddress (state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(getMetaMaskAccounts(state))[0]

  return selectedAddress
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getNumberOfAccounts (state) {
  return Object.keys(state.metamask.accounts).length
}

function getNumberOfTokens (state) {
  const tokens = state.metamask.tokens
  return tokens ? tokens.length : 0
}

function getMetaMaskAccounts (state) {
  const currentAccounts = state.metamask.accounts
  const cachedBalances = state.metamask.cachedBalances[state.metamask.network]
  const selectedAccounts = {}

  Object.keys(currentAccounts).forEach(accountID => {
    const account = currentAccounts[accountID]
    if (account && account.balance === null || account.balance === undefined) {
      selectedAccounts[accountID] = {
        ...account,
        balance: cachedBalances && cachedBalances[accountID],
      }
    } else {
      selectedAccounts[accountID] = account
    }
  })
  return selectedAccounts
}

function isBalanceCached (state) {
  const selectedAccountBalance = state.metamask.accounts[getSelectedAddress(state)].balance
  const cachedBalance = getSelectedAccountCachedBalance(state)

  return Boolean(!selectedAccountBalance && cachedBalance)
}

function getSelectedAccountCachedBalance (state) {
  const cachedBalances = state.metamask.cachedBalances[state.metamask.network]
  const selectedAddress = getSelectedAddress(state)

  return cachedBalances && cachedBalances[selectedAddress]
}

function getSelectedAccount (state) {
  const accounts = getMetaMaskAccounts(state)
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}

function getSelectedToken (state) {
  const tokens = state.metamask.tokens || []
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.metamask.send && state.metamask.send.token

  return selectedToken || sendToken || null
}

function getSelectedTokenExchangeRate (state) {
  const contractExchangeRates = state.metamask.contractExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return contractExchangeRates[address] || 0
}

function getSelectedTokenAssetImage (state) {
  const assetImages = state.metamask.assetImages || {}
  const selectedToken = getSelectedToken(state) || {}
  const { address } = selectedToken
  return assetImages[address]
}

function getAssetImages (state) {
  const assetImages = state.metamask.assetImages || {}
  return assetImages
}

function getTokenExchangeRate (state, address) {
  const contractExchangeRates = state.metamask.contractExchangeRates
  return contractExchangeRates[address] || 0
}

function conversionRateSelector (state) {
  return state.metamask.conversionRate
}

function getAddressBook (state) {
  const network = state.metamask.network
  if (!state.metamask.addressBook[network]) {
    return []
  }
  return Object.values(state.metamask.addressBook[network])
}

function getAddressBookEntry (state, address) {
  const addressBook = getAddressBook(state)
  const entry = addressBook.find(contact => contact.address === checksumAddress(address))
  return entry
}

function getAddressBookEntryName (state, address) {
  const entry = getAddressBookEntry(state, address) || state.metamask.identities[address]
  return entry && entry.name !== '' ? entry.name : addressSlicer(address)
}

function accountsWithSendEtherInfoSelector (state) {
  const accounts = getMetaMaskAccounts(state)
  const { identities } = state.metamask

  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function getCurrentEthBalance (state) {
  return getCurrentAccountWithSendEtherInfo(state).balance
}

function getGasIsLoading (state) {
  return state.appState.gasIsLoading
}

function getForceGasMin (state) {
  return state.metamask.send.forceGasMin
}

function getSendFrom (state) {
  return state.metamask.send.from
}

function getSendAmount (state) {
  return state.metamask.send.amount
}

function getSendMaxModeState (state) {
  return state.metamask.send.maxModeOn
}

function getCurrentCurrency (state) {
  return state.metamask.currentCurrency
}

function getNativeCurrency (state) {
  return state.metamask.nativeCurrency
}

function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = conversionRateSelector(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' }
  )

  return tokenToFiatRate
}

function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

function getCurrentViewContext (state) {
  const { currentView = {} } = state.appState
  return currentView.context
}

function getTotalUnapprovedCount ({ metamask }) {
  const {
    unapprovedTxs = {},
    unapprovedMsgCount,
    unapprovedPersonalMsgCount,
    unapprovedTypedMessagesCount,
  } = metamask

  return Object.keys(unapprovedTxs).length + unapprovedMsgCount + unapprovedPersonalMsgCount +
    unapprovedTypedMessagesCount
}

function getIsMainnet (state) {
  const networkType = getNetworkIdentifier(state)
  return networkType === NETWORK_TYPES.MAINNET
}

function isEthereumNetwork (state) {
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

function preferencesSelector ({ metamask }) {
  return metamask.preferences
}

function getAdvancedInlineGasShown (state) {
  return Boolean(state.metamask.featureFlags.advancedInlineGas)
}

function getUseNonceField (state) {
  return Boolean(state.metamask.useNonceField)
}

function getCustomNonceValue (state) {
  return String(state.metamask.customNonceValue)
}

function getMetaMetricState (state) {
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

function getRpcPrefsForCurrentProvider (state) {
  const { frequentRpcListDetail, provider } = state.metamask
  const selectRpcInfo = frequentRpcListDetail.find(rpcInfo => rpcInfo.rpcUrl === provider.rpcTarget)
  const { rpcPrefs = {} } = selectRpcInfo || {}
  return rpcPrefs
}

function getKnownMethodData (state, data) {
  if (!data) {
    return null
  }
  const prefixedData = addHexPrefix(data)
  const fourBytePrefix = prefixedData.slice(0, 10)
  const { knownMethodData } = state.metamask

  return knownMethodData && knownMethodData[fourBytePrefix]
}

function getFeatureFlags (state) {
  return state.metamask.featureFlags
}
