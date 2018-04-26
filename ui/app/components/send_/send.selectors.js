import { valuesFor } from '../../util'
import abi from 'human-standard-token-abi'
import {
  multiplyCurrencies,
} from '../../conversion-util'

const selectors = {
  accountsWithSendEtherInfoSelector,
  autoAddToBetaUI,
  getAddressBook,
  getConversionRate,
  getConvertedCurrency,
  getCurrentAccountWithSendEtherInfo,
  getCurrentCurrency,
  getCurrentNetwork,
  getCurrentViewContext,
  getForceGasMin,
  getGasLimit,
  getGasPrice,
  getGasTotal,
  getSelectedAccount,
  getSelectedAddress,
  getSelectedIdentity,
  getSelectedToken,
  getSelectedTokenContract,
  getSelectedTokenExchangeRate,
  getSelectedTokenToFiatRate,
  getSendAmount,
  getSendEditingTransactionId,
  getSendErrors,
  getSendFrom,
  getSendFromObject,
  getSendFromBalance,
  getSendMaxModeState,
  getSendTo,
  getSendToAccounts,
  getTokenBalance,
  getTokenExchangeRate,
  getUnapprovedTxs,
  isSendFormInError,
  transactionsSelector,
}

module.exports = selectors

function getSelectedAddress (state) {
  const selectedAddress = state.metamask.selectedAddress || Object.keys(state.metamask.accounts)[0]

  return selectedAddress
}

function getSelectedIdentity (state) {
  const selectedAddress = getSelectedAddress(state)
  const identities = state.metamask.identities

  return identities[selectedAddress]
}

function getSelectedAccount (state) {
  const accounts = state.metamask.accounts
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
  const tokenExchangeRates = state.metamask.tokenExchangeRates
  const selectedToken = getSelectedToken(state) || {}
  const { symbol = '' } = selectedToken

  const pair = `${symbol.toLowerCase()}_eth`
  const { rate: tokenExchangeRate = 0 } = tokenExchangeRates[pair] || {}

  return tokenExchangeRate
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

function getConversionRate (state) {
  return state.metamask.conversionRate
}

function getConvertedCurrency (state) {
  return state.metamask.currentCurrency
}

function getAddressBook (state) {
  return state.metamask.addressBook
}

function accountsWithSendEtherInfoSelector (state) {
  const {
    accounts,
    identities,
  } = state.metamask
  console.log(`accountsWithSendEtherInfoSelector accounts`, accounts);
  console.log(`accountsWithSendEtherInfoSelector identities`, identities);
  const accountsWithSendEtherInfo = Object.entries(accounts).map(([key, account]) => {
    return Object.assign({}, account, identities[key])
  })

  console.log(`accountsWithSendEtherInfoSelector accountsWithSendEtherInfo`, accountsWithSendEtherInfo);
  return accountsWithSendEtherInfo
}

function getCurrentAccountWithSendEtherInfo (state) {
  const currentAddress = getSelectedAddress(state)
  const accounts = accountsWithSendEtherInfoSelector(state)

  return accounts.find(({ address }) => address === currentAddress)
}

function transactionsSelector (state) {
  const { network, selectedTokenAddress } = state.metamask
  const unapprovedMsgs = valuesFor(state.metamask.unapprovedMsgs)
  const shapeShiftTxList = (network === '1') ? state.metamask.shapeShiftTxList : undefined
  const transactions = state.metamask.selectedAddressTxList || []
  const txsToRender = !shapeShiftTxList ? transactions.concat(unapprovedMsgs) : transactions.concat(unapprovedMsgs, shapeShiftTxList)

  // console.log({txsToRender, selectedTokenAddress})
  return selectedTokenAddress
    ? txsToRender
      .filter(({ txParams }) => txParams && txParams.to === selectedTokenAddress)
      .sort((a, b) => b.time - a.time)
    : txsToRender
      .sort((a, b) => b.time - a.time)
}

function getGasPrice (state) {
  return state.metamask.send.gasPrice
}

function getGasTotal (state) {
  return state.metamask.send.gasTotal
}

function getGasLimit (state) {
  return state.metamask.send.gasLimit
}

function getForceGasMin (state) {
  return state.metamask.send.forceGasMin
}

function getSendFrom (state) {
  return state.metamask.send.from
}

function getSendFromObject (state) {
  return getSendFrom(state) || getCurrentAccountWithSendEtherInfo(state)
}

function getSendFromBalance (state) {
  const from = getSendFrom(state) || getSelectedAccount(state)
  return from.balance
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

function getSelectedTokenContract (state) {
  const selectedToken = getSelectedToken(state)
  return selectedToken
    ? global.eth.contract(abi).at(selectedToken.address)
    : null
}

function autoAddToBetaUI (state) {
  const autoAddTransactionThreshold = 12
  const autoAddAccountsThreshold = 2
  const autoAddTokensThreshold = 1

  const numberOfTransactions = state.metamask.selectedAddressTxList.length
  const numberOfAccounts = Object.keys(state.metamask.accounts).length
  const numberOfTokensAdded = state.metamask.tokens.length

  const userPassesThreshold = (numberOfTransactions > autoAddTransactionThreshold) &&
    (numberOfAccounts > autoAddAccountsThreshold) &&
    (numberOfTokensAdded > autoAddTokensThreshold)
  const userIsNotInBeta = !state.metamask.featureFlags.betaUI

  return userIsNotInBeta && userPassesThreshold
}

function getCurrentViewContext (state) {
  const { currentView = {} } = state.appState
  return currentView.context
}

function getSendEditingTransactionId (state) {
  return state.metamask.send.editingTransactionId
}

function getSendErrors (state) {
  return state.metamask.send.errors
}

function getSendTo (state) {
  return state.metamask.send.to
}

function getTokenBalance (state) {
  return state.metamask.send.tokenBalance
}

function getSendToAccounts (state) {
  const fromAccounts = accountsWithSendEtherInfoSelector(state)
  const addressBookAccounts = getAddressBook(state)
  const allAccounts = [...fromAccounts, ...addressBookAccounts]
  // TODO: figure out exactly what the below returns and put a descriptive variable name on it
  return Object.entries(allAccounts).map(([key, account]) => account)
}

function getCurrentNetwork (state) {
  return state.metamask.network
}

function isSendFormInError (state) {
  const { amount, to } = getSendErrors(state)
  return Boolean(amount || toError !== null)
}