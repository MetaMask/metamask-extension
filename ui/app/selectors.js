import abi from 'human-standard-token-abi'
import { pipe } from 'ramda'
import {
  transactionsSelector,
} from './selectors/transactions'
import { addHexPrefix } from 'ethereumjs-util'
import {
  conversionUtil,
  multiplyCurrencies,
} from './conversion-util'
import {
  calcGasTotal,
} from './components/send/send.utils'

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
  getSendAmount,
  getSelectedTokenToFiatRate,
  getSelectedTokenContract,
  getSendMaxModeState,
  getCurrentViewContext,
  getTotalUnapprovedCount,
  preferencesSelector,
  getMetaMaskAccounts,
  getUsePhishDetect,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getGasPriceInHexWei,
  priceEstimateToWei,
  getCurrentEthBalance,
  getSendToken,
  getSendTokenAddress,
  getSendTokenContract,
  getTokenBalance,
  getSendFromBalance,
  getSendFromObject,
  getSendTo,
  getSendHexData,
  getTargetAccount,
}

module.exports = selectors

function getSelectedAddress (state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(getMetaMaskAccounts(state))[0]

  return selectedAddress
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getMetaMaskAccounts (state) {
  const currentAccounts = state.metamask.accounts
  const cachedBalances = state.metamask.cachedBalances
  const selectedAccounts = {}

  Object.keys(currentAccounts).forEach(accountID => {
    const account = currentAccounts[accountID]
    if (account && account.balance === null || account.balance === undefined) {
      selectedAccounts[accountID] = {
        ...account,
        balance: cachedBalances[accountID],
      }
    } else {
      selectedAccounts[accountID] = account
    }
  })
  return selectedAccounts
}

function getUsePhishDetect (state) {
  return Boolean(state.metamask.usePhishDetect)
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
  const sendToken = state.metamask.send.token

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
  return state.metamask.addressBook
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

function getGasIsLoading (state) {
  return state.appState.gasIsLoading
}

function getForceGasMin (state) {
  return state.metamask.send.forceGasMin
}

function getSendFrom (state) {
  return state.metamask.send.from
}

function getSendTo (state) {
  return state.metamask.send.to
}

function getSendAmount (state) {
  return state.metamask.send.amount
}

function getSendMaxModeState (state) {
  return state.metamask.send.maxModeOn || false
}

function getSendHexData (state) {
  return state.metamask.send.data
}

function getCurrentCurrency (state) {
  return state.metamask.currentCurrency
}

function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = conversionRateSelector(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' },
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

function preferencesSelector ({ metamask }) {
  return metamask.preferences
}

function getGasLimit (state) {
  return state.metamask.send.gasLimit || '0'
}

function getGasPrice (state) {
  return state.metamask.send.gasPrice
}

function getGasTotal (state) {
  return calcGasTotal(getGasLimit(state), getGasPrice(state))
}

function priceEstimateToWei (priceEstimate) {
  return conversionUtil(priceEstimate, {
    fromNumericBase: 'hex',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
    numberOfDecimals: 9,
  })
}

function getGasPriceInHexWei (price) {
  return pipe(
    (x) => conversionUtil(x, { fromNumericBase: 'dec', toNumericBase: 'hex' }),
    priceEstimateToWei,
    addHexPrefix,
  )(price)
}

function getCurrentEthBalance (state) {
  return getCurrentAccountWithSendEtherInfo(state).balance
}

function getSendToken (state) {
  return state.metamask.send.token
}

function getSendTokenAddress (state) {
  return getSendToken(state)?.address
}

function getSendTokenContract (state) {
  const sendTokenAddress = getSendTokenAddress(state)
  return sendTokenAddress
    ? global.eth.contract(abi).at(sendTokenAddress)
    : null
}

function getTokenBalance (state) {
  return state.metamask.send.tokenBalance
}

function getSendFromBalance (state) {
  const fromAccount = getSendFromObject(state)
  return fromAccount.balance
}

function getSendFromObject (state) {
  const fromAddress = getSendFrom(state)
  return fromAddress
    ? getTargetAccount(state, fromAddress)
    : getSelectedAccount(state)
}

function getTargetAccount (state, targetAddress) {
  const accounts = getMetaMaskAccounts(state)
  return accounts[targetAddress]
}
