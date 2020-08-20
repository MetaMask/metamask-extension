import { calcTokenValue } from '../../helpers/utils/token-util'
import { constructTxParams } from '../../helpers/utils/util'
import { decimalToHex } from '../../helpers/utils/conversions.util'
import { estimateGasFromTxParams } from '../../store/actions'

// A default value that should work for most metaswap trades, in case our api is missing this value
const METASWAP_GAS_DEFAULT = 800000

const TRADES_BASE_URL = 'https://metaswap-api.airswap-dev.codefi.network/trades?'
const TOKENS_BASE_URL = 'https://metaswap-api.airswap-dev.codefi.network/tokens'

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
    .filter((response) => response.trade && !response.error)
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
    const approveGasEstimate = await estimateGasFromTxParams(approveTxParams)

    approveTxParams.gas = approveGasEstimate
  }
  return { tradeTxParams, approveTxParams }
}

export async function fetchTokens () {
  const response = await window.fetch(TOKENS_BASE_URL, { method: 'GET' })
  const tokens = await response.json()
  return tokens
}
