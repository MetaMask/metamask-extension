import { isValidAddress } from 'ethereumjs-util'
import { calcTokenValue } from '../../helpers/utils/token-util'
import { constructTxParams } from '../../helpers/utils/util'
import { decimalToHex } from '../../helpers/utils/conversions.util'
import { estimateGasFromTxParams } from '../../store/actions'
import { validateTxParams } from '../../../../app/scripts/controllers/transactions/lib/util'

// A high default that should cover any ERC-20 approve implementation
const APPROVE_TX_GAS_DEFAULT = '0x1d4c0'

// A default value that should work for most metaswap trades, in case our api is missing this value
const METASWAP_GAS_DEFAULT = 800000

const TRADES_BASE_URL = 'https://metaswap-api.airswap-dev.codefi.network/trades?'
const TOKENS_BASE_URL = 'https://metaswap-api.airswap-dev.codefi.network/tokens'

const validHex = (string) => Boolean(string?.match(/^0x[A-Fa-f0-9]+$/u))
const truthyString = (string) => Boolean(string?.length)
const truthyDigitString = (string) => truthyString(string) && Boolean(string.match(/^\d+$/u))

const QUOTE_VALIDATORS = [
  {
    property: 'trade',
    type: 'object',
    validator: (trade) => trade && validHex(trade.data) && isValidAddress(trade.to) && isValidAddress(trade.from) && truthyString(trade.value),
  },
  {
    property: 'sourceAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'destinationAmount',
    type: 'string',
    validator: truthyDigitString,
  },
  {
    property: 'sourceToken',
    type: 'string',
    validator: isValidAddress,
  },
  {
    property: 'destinationToken',
    type: 'string',
    validator: isValidAddress,
  },
  {
    property: 'aggregator',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'aggType',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'error',
    type: 'object',
    validator: (error) => !error,
  },
]

const TOKEN_VALIDATORS = [
  {
    property: 'address',
    type: 'string',
    validator: isValidAddress,
  },
  {
    property: 'symbol',
    type: 'string',
    validator: (string) => truthyString(string) && string.length <= 12,
  },
  {
    property: 'decimals',
    type: 'number',
    validator: (number) => number >= 0 && number <= 36,
  },
]

function validateData (validators, object) {
  return validators.every(({ property, type, validator }) => typeof object[property] === type && validator(object[property]))
}

export async function fetchTradesInfo ({ tokens, slippage, sourceToken, sourceDecimals, destinationToken, value, fromAddress }) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals),
    slippage,
    timeout: 10000,
    walletAddress: fromAddress,
  }

  const queryString = new URLSearchParams(urlParams).toString()
  const tradeURL = `${TRADES_BASE_URL}${queryString}`

  const tradesResponseJSON = await window.fetch(tradeURL, { method: 'GET' })
  const tradesResponse = await tradesResponseJSON.json()

  const sourceTokenInfo = tokens.find(({ address }) => address === sourceToken)
  const destinationTokenInfo = tokens.find(({ address }) => address === destinationToken)

  const newQuotes = tradesResponse
    .filter((response) => validateData(QUOTE_VALIDATORS, response))
    .map((response) => ({
      ...response,
      slippage,
      sourceTokenInfo,
      destinationTokenInfo,
    }))

  return newQuotes
}

export async function quoteToTxParams (quote, gasPrice) {
  const { approvalNeeded: approval, trade } = quote

  const { data: tradeData, to: tradeTo, value: tradeValue, gas: tradeGas, from: tradeFrom } = trade
  const tradeTxParams = constructTxParams({
    data: tradeData,
    to: tradeTo,
    amount: decimalToHex(tradeValue),
    from: tradeFrom,
    gas: decimalToHex(tradeGas || METASWAP_GAS_DEFAULT),
    gasPrice,
  })

  let approveTxParams
  if (approval) {
    const { data: approvalData, to: approvalTo, from: approvalFrom } = approval

    approveTxParams = constructTxParams({
      data: approvalData,
      to: approvalTo,
      amount: '0x0',
      from: approvalFrom,
      gasPrice,
    })
    let approveGasEstimate
    try {
      approveGasEstimate = await estimateGasFromTxParams(approveTxParams)
    } catch (e) {
      approveGasEstimate = APPROVE_TX_GAS_DEFAULT
    }

    approveTxParams.gas = approveGasEstimate
  }
  return { tradeTxParams, approveTxParams }
}

export async function fetchTokens () {
  const response = await window.fetch(TOKENS_BASE_URL, { method: 'GET' })
  const tokens = await response.json()
  const filteredTokens = tokens.filter((token) => validateData(TOKEN_VALIDATORS, token))
  return filteredTokens
}
