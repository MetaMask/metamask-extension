import { createSelector } from 'reselect'
import txHelper from '../../lib/tx-helper'
import { calcTokenAmount } from '../helpers/utils/token-util'
import {
  roundExponential,
  getValueFromWeiHex,
  getHexGasTotal,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util'
import {
  sumHexes,
} from '../helpers/utils/transactions.util'

const unapprovedTxsSelector = state => state.metamask.unapprovedTxs
const unapprovedMsgsSelector = state => state.metamask.unapprovedMsgs
const unapprovedPersonalMsgsSelector = state => state.metamask.unapprovedPersonalMsgs
const unapprovedTypedMessagesSelector = state => state.metamask.unapprovedTypedMessages
const networkSelector = state => state.metamask.network

export const unconfirmedTransactionsListSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedTypedMessages = {},
    network
  ) => txHelper(
    unapprovedTxs,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    network
  ) || []
)

export const unconfirmedTransactionsHashSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedTypedMessagesSelector,
  networkSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedTypedMessages = {},
    network
  ) => {
    const filteredUnapprovedTxs = Object.keys(unapprovedTxs).reduce((acc, address) => {
      const { metamaskNetworkId } = unapprovedTxs[address]
      const transactions = { ...acc }

      if (metamaskNetworkId === network) {
        transactions[address] = unapprovedTxs[address]
      }

      return transactions
    }, {})

    return {
      ...filteredUnapprovedTxs,
      ...unapprovedMsgs,
      ...unapprovedPersonalMsgs,
      ...unapprovedTypedMessages,
    }
  }
)

const unapprovedMsgCountSelector = state => state.metamask.unapprovedMsgCount
const unapprovedPersonalMsgCountSelector = state => state.metamask.unapprovedPersonalMsgCount
const unapprovedTypedMessagesCountSelector = state => state.metamask.unapprovedTypedMessagesCount

export const unconfirmedTransactionsCountSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgCountSelector,
  unapprovedPersonalMsgCountSelector,
  unapprovedTypedMessagesCountSelector,
  networkSelector,
  (
    unapprovedTxs = {},
    unapprovedMsgCount = 0,
    unapprovedPersonalMsgCount = 0,
    unapprovedTypedMessagesCount = 0,
    network
  ) => {
    const filteredUnapprovedTxIds = Object.keys(unapprovedTxs).filter(txId => {
      const { metamaskNetworkId } = unapprovedTxs[txId]
      return metamaskNetworkId === network
    })

    return filteredUnapprovedTxIds.length + unapprovedTypedMessagesCount + unapprovedMsgCount +
      unapprovedPersonalMsgCount
  }
)


export const currentCurrencySelector = state => state.metamask.currentCurrency
export const conversionRateSelector = state => state.metamask.conversionRate
export const getNativeCurrency = state => state.metamask.nativeCurrency

export const txDataSelector = state => state.confirmTransaction.txData
const tokenDataSelector = state => state.confirmTransaction.tokenData
const tokenPropsSelector = state => state.confirmTransaction.tokenProps

const contractExchangeRatesSelector = state => state.metamask.contractExchangeRates

const tokenDecimalsSelector = createSelector(
  tokenPropsSelector,
  tokenProps => tokenProps && tokenProps.tokenDecimals
)

const tokenDataParamsSelector = createSelector(
  tokenDataSelector,
  tokenData => tokenData && tokenData.params || []
)

const txParamsSelector = createSelector(
  txDataSelector,
  txData => txData && txData.txParams || {}
)

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  txParams => txParams && txParams.to
)

const TOKEN_PARAM_SPENDER = '_spender'
const TOKEN_PARAM_TO = '_to'
const TOKEN_PARAM_VALUE = '_value'

export const tokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = ''
    let tokenAmount = 0

    if (params && params.length) {
      const toParam = params.find(param => param.name === TOKEN_PARAM_TO)
      const valueParam = params.find(param => param.name === TOKEN_PARAM_VALUE)
      toAddress = toParam ? toParam.value : params[0].value
      const value = valueParam ? Number(valueParam.value) : Number(params[1].value)

      if (tokenDecimals) {
        tokenAmount = calcTokenAmount(value, tokenDecimals).toNumber()
      }

      tokenAmount = roundExponential(tokenAmount)
    }

    return {
      toAddress,
      tokenAmount,
    }
  }
)

export const approveTokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = ''
    let tokenAmount = 0

    if (params && params.length) {
      toAddress = params.find(param => param.name === TOKEN_PARAM_SPENDER).value
      const value = Number(params.find(param => param.name === TOKEN_PARAM_VALUE).value)

      if (tokenDecimals) {
        tokenAmount = calcTokenAmount(value, tokenDecimals).toNumber()
      }

      tokenAmount = roundExponential(tokenAmount)
    }

    return {
      toAddress,
      tokenAmount,
    }
  }
)

export const sendTokenTokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  tokenDecimalsSelector,
  (params, tokenDecimals) => {
    let toAddress = ''
    let tokenAmount = 0

    if (params && params.length) {
      toAddress = params.find(param => param.name === TOKEN_PARAM_TO).value
      let value = Number(params.find(param => param.name === TOKEN_PARAM_VALUE).value)

      if (tokenDecimals) {
        value = calcTokenAmount(value, tokenDecimals).toNumber()
      }

      tokenAmount = roundExponential(value)
    }

    return {
      toAddress,
      tokenAmount,
    }
  }
)

export const contractExchangeRateSelector = createSelector(
  contractExchangeRatesSelector,
  tokenAddressSelector,
  (contractExchangeRates, tokenAddress) => contractExchangeRates[tokenAddress]
)

export const transactionFeeSelector = function (state, txData) {
  const currentCurrency = currentCurrencySelector(state)
  const conversionRate = conversionRateSelector(state)
  const nativeCurrency = getNativeCurrency(state)

  const { txParams: { value = '0x0', gas: gasLimit = '0x0', gasPrice = '0x0' } = {} } = txData

  const fiatTransactionAmount = getValueFromWeiHex({
    value, fromCurrency: nativeCurrency, toCurrency: currentCurrency, conversionRate, numberOfDecimals: 2,
  })
  const ethTransactionAmount = getValueFromWeiHex({
    value, fromCurrency: nativeCurrency, toCurrency: nativeCurrency, conversionRate, numberOfDecimals: 6,
  })

  const hexTransactionFee = getHexGasTotal({ gasLimit, gasPrice })

  const fiatTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })
  const ethTransactionFee = getTransactionFee({
    value: hexTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  })

  const fiatTransactionTotal = addFiat(fiatTransactionFee, fiatTransactionAmount)
  const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount)
  const hexTransactionTotal = sumHexes(value, hexTransactionFee)

  return {
    hexTransactionAmount: value,
    fiatTransactionAmount,
    ethTransactionAmount,
    hexTransactionFee,
    fiatTransactionFee,
    ethTransactionFee,
    fiatTransactionTotal,
    ethTransactionTotal,
    hexTransactionTotal,
  }
}
