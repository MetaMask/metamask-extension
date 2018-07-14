import { createSelector } from 'reselect'
import txHelper from '../../lib/tx-helper'
import { calcTokenAmount } from '../token-util'

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

export const currentCurrencySelector = state => state.metamask.currentCurrency
export const conversionRateSelector = state => state.metamask.conversionRate

const txDataSelector = state => state.confirmTransaction.txData
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
  params => {
    let toAddress = ''
    let tokenAmount = 0

    if (params && params.length) {
      const toParam = params.find(param => param.name === TOKEN_PARAM_TO)
      const valueParam = params.find(param => param.name === TOKEN_PARAM_VALUE)
      toAddress = toParam ? toParam.value : params[0].value
      tokenAmount = valueParam ? +valueParam.value : +params[1].value
    }

    return {
      toAddress,
      tokenAmount,
    }
  }
)

export const approveTokenAmountAndToAddressSelector = createSelector(
  tokenDataParamsSelector,
  params => {
    let toAddress = ''
    let tokenAmount = 0

    if (params && params.length) {
      toAddress = params.find(param => param.name === TOKEN_PARAM_SPENDER).value
      tokenAmount = +params.find(param => param.name === TOKEN_PARAM_VALUE).value
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
      tokenAmount = +params.find(param => param.name === TOKEN_PARAM_VALUE).value

      if (tokenDecimals) {
        tokenAmount = calcTokenAmount(tokenAmount, tokenDecimals)
      }
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
