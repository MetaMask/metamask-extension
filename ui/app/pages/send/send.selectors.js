const { valuesFor } = require('../../helpers/utils/util')
const abi = require('human-standard-token-abi')
const {
  multiplyCurrencies,
} = require('../../helpers/utils/conversion-util')
const {
  getMetaMaskAccounts,
  getSelectedAddress,
  getAddressBook,
} = require('../../selectors/selectors')
const {
  estimateGasPriceFromRecentBlocks,
  calcGasTotal,
} = require('./send.utils')
import {
  getAveragePriceEstimateInHexWEI,
} from '../../selectors/custom-gas'

const selectors = {
  accountsWithSendEtherInfoSelector,
  getAmountConversionRate,
  getBlockGasLimit,
  getConversionRate,
  getCurrentAccountWithSendEtherInfo,
  getCurrentCurrency,
  getCurrentNetwork,
  getCurrentViewContext,
  getForceGasMin,
  getNativeCurrency,
  getGasLimit,
  getGasPrice,
  getGasPriceFromRecentBlocks,
  getGasTotal,
  getPrimaryCurrency,
  getRecentBlocks,
  getSelectedAccount,
  getSelectedIdentity,
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenExchangeRate,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendHexData,
  getSendHexDataFeatureFlagState,
  getSendEditingTransactionId,
  getSendEnsResolution,
  getSendEnsResolutionError,
  getSendErrors,
  getSendFrom,
  getSendFromBalance,
  getSendFromObject,
  getSendMaxModeState,
  getSendTo,
  getSendToAccounts,
  getSendToNickname,
  getTokenBalance,
  getTokenExchangeRate,
  getUnapprovedTxs,
  transactionsSelector,
  getQrCodeData,
}

module.exports = selectors

function accountsWithSendEtherInfoSelector (state) {
  const accounts = getMetaMaskAccounts(state)
  const { identities } = state.metamask
  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  return accountsWithSendEtherInfo
}

function getAmountConversionRate (state) {
  return getSelectedToken(state)
    ? getSelectedTokenToFiatRate(state)
    : getConversionRate(state)
}

function getBlockGasLimit (state) {
  return state.metamask.currentBlockGasLimit
}

function getConversionRate (state) {
  return state.metamask.conversionRate
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function getCurrentCurrency (state) {
  return state.metamask.currentCurrency
}

function getNativeCurrency (state) {
  return state.metamask.nativeCurrency
}

function getCurrentNetwork (state) {
  return state.metamask.network
}

function getCurrentViewContext (state) {
  const { currentView = {} } = state.appState
  return currentView.context
}

function getForceGasMin (state) {
  return state.metamask.send.forceGasMin
}

function getGasLimit (state) {
  return state.metamask.send.gasLimit || '0'
}

function getGasPrice (state) {
  return state.metamask.send.gasPrice || getAveragePriceEstimateInHexWEI(state)
}

function getGasPriceFromRecentBlocks (state) {
  return estimateGasPriceFromRecentBlocks(state.metamask.recentBlocks)
}

function getGasTotal (state) {
  return calcGasTotal(getGasLimit(state), getGasPrice(state))
}

function getPrimaryCurrency (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken && selectedToken.symbol
}

function getRecentBlocks (state) {
  return state.metamask.recentBlocks
}

function getSelectedAccount (state) {
  const accounts = getMetaMaskAccounts(state)
  const selectedAddress = getSelectedAddress(state)

  return accounts[selectedAddress]
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getSelectedToken (state) {
  const tokens = state.metamask.tokens || []
  const selectedTokenAddress = state.metamask.selectedTokenAddress
  const selectedToken = tokens.filter(({ address }) => address === selectedTokenAddress)[0]
  const sendToken = state.metamask.send.token

  return selectedToken || sendToken || null
}

function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)

  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

function getSelectedTokenExchangeRate (state) {
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { symbol = '' } = selectedToken
  const pair = `${symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates && tokenExchangeRates[pair] || {}

  return tokenExchangeRate
}

function getSelectedTokenToFiatRate (state) {
  const selectedTokenExchangeRate = getSelectedTokenExchangeRate(state)
  const conversionRate = getConversionRate(state)

  const tokenToFiatRate = multiplyCurrencies(
    conversionRate,
    selectedTokenExchangeRate,
    { toNumericBase: 'dec' }
  )

  return tokenToFiatRate
}

function getSendAmount (state) {
  return state.metamask.send.amount
}

function getSendHexData (state) {
  return state.metamask.send.data
}

function getSendHexDataFeatureFlagState (state) {
  return state.metamask.featureFlags.sendHexData
}

function getSendEditingTransactionId (state) {
  return state.metamask.send.editingTransactionId
}

function getSendErrors (state) {
  return state.send.errors
}

function getSendFrom (state) {
  return state.metamask.send.from
}

function getSendFromBalance (state) {
  const from = getSendFrom(state) || getSelectedAccount(state)
  return from.balance
}

function getSendFromObject (state) {
  return getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state)
}

function getSendMaxModeState (state) {
  return state.metamask.send.maxModeOn
}

function getSendTo (state) {
  return state.metamask.send.to
}

function getSendToNickname (state) {
  return state.metamask.send.toNickname
}

function getSendToAccounts (state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state)
  const addressBookAccounts = getAddressBook(state)
  return [...fromAccounts, ...addressBookAccounts]
}
function getTokenBalance (state) {
  return state.metamask.send.tokenBalance
}

function getSendEnsResolution (state) {
  return state.metamask.send.ensResolution
}

function getSendEnsResolutionError (state) {
  return state.metamask.send.ensResolutionError
}

function getTokenExchangeRate (state, tokenSymbol) {
  const pair = `${tokenSymbol.toLowerCase()}_eth`
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return tokenExchangeRate
}

function getUnapprovedTxs (state) {
  return state.metamask.unapprovedTxs
}

function transactionsSelector (state) {
  const { network, selectedTokenAddress } = state.metamask
  const unapprovedMsgs = valuesFor(state.metamask.unapprovedMsgs)
  const shapeShiftTxList = (network === '1') ? state.metamask.shapeShiftTxList : undefined
  const transactions = state.metamask.selectedAddressTxList || []
  const txsToRender = !shapeShiftTxList ? transactions.concat(unapprovedMsgs) : transactions.concat(unapprovedMsgs, shapeShiftTxList)

  return selectedTokenAddress
    ? txsToRender
      .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
      .sort((a, b) => b.time - a.time)
    : txsToRender
      .sort((a, b) => b.time - a.time)
}

function getQrCodeData (state) {
  return state.appState.qrCodeData
}
