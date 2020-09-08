import log from 'loglevel'
import { isValidAddress } from 'ethereumjs-util'
import { calcTokenValue } from '../../helpers/utils/token-util'
import { constructTxParams } from '../../helpers/utils/util'
import { decimalToHex } from '../../helpers/utils/conversions.util'
import { estimateGasFromTxParams } from '../../store/actions'

import fetchWithCache from '../../helpers/utils/fetch-with-cache'

const CACHE_REFRESH_ONE_HOUR = 3600000

// A high default that should cover any ERC-20 approve implementation
const APPROVE_TX_GAS_DEFAULT = '0x1d4c0'

// A default value that should work for most metaswap trades, in case our api is missing this value
const METASWAP_GAS_DEFAULT = 800000

const getBaseApi = function (isCustomNetwork, type) {
  const environment = isCustomNetwork ? 'dev' : 'prod'

  switch (type) {
    case 'trade':
      return `https://metaswap-api.airswap-${environment}.codefi.network/trades?`
    case 'tokens':
      return `https://metaswap-api.airswap-${environment}.codefi.network/tokens`
    case 'topAssets':
      return `https://metaswap-api.airswap-${environment}.codefi.network/topAssets`
    case 'aggregatorMetadata':
      return `https://metaswap-api.airswap-${environment}.codefi.network/aggregatorMetadata`
    default:
      throw new Error('getBaseApi requires an api call type')
  }
}

const validHex = (string) => Boolean(string?.match(/^0x[a-f0-9]+$/u))
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
    validator: (error) => error === null || typeof error === 'object',
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

const TOP_ASSET_VALIDATORS = TOKEN_VALIDATORS.slice(0, 2)

const AGGREGATOR_METADATA_VALIDATORS = [
  {
    property: 'color',
    type: 'string',
    validator: (string) => Boolean(string.match(/^#[A-Fa-f0-9]+$/u)),
  },
  {
    property: 'title',
    type: 'string',
    validator: truthyString,
  },
  {
    property: 'icon',
    type: 'string',
    validator: (string) => Boolean(string.match(/^data:image/u)),
  },
]

function validateData (validators, object, urlUsed) {
  return validators.every(({ property, type, validator }) => {
    const valid = typeof object[property] === type && validator(object[property])
    if (!valid) {
      log.error(`response to GET ${urlUsed} invalid for property ${property}; value was:`, object[property])
    }
    return valid
  })
}

export async function fetchTradesInfo ({ sourceTokenInfo, destinationTokenInfo, slippage, sourceToken, sourceDecimals, destinationToken, value, fromAddress, exchangeList, isCustomNetwork }) {
  const urlParams = {
    destinationToken,
    sourceToken,
    sourceAmount: calcTokenValue(value, sourceDecimals),
    slippage,
    timeout: 10000,
    walletAddress: fromAddress,
  }

  if (exchangeList) {
    urlParams.exchangeList = exchangeList
  }

  const queryString = new URLSearchParams(urlParams).toString()
  const tradeURL = `${getBaseApi(isCustomNetwork, 'trade')}${queryString}`
  const tradesResponse = await fetchWithCache(tradeURL, { method: 'GET' }, { cacheRefreshTime: 0, timeout: 15000 })
  const newQuotes = tradesResponse
    .filter((response) => validateData(QUOTE_VALIDATORS, response, tradeURL))
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
    } catch (_error) {
      log.warning('Gas estimation for approval transaction failed, using default value instead. Error:', _error)
      approveGasEstimate = APPROVE_TX_GAS_DEFAULT
    }

    approveTxParams.gas = approveGasEstimate
  }
  return { tradeTxParams, approveTxParams }
}

export async function fetchTokens (isCustomNetwork) {
  const tokenUrl = getBaseApi(isCustomNetwork, 'tokens')
  const tokens = await fetchWithCache(tokenUrl, { method: 'GET' }, { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR })
  const filteredTokens = tokens.filter((token) => validateData(TOKEN_VALIDATORS, token, tokenUrl))
  return filteredTokens
}

export async function fetchAggregatorMetadata (isCustomNetwork) {
  const aggregatorMetadataUrl = getBaseApi(isCustomNetwork, 'aggregatorMetadata')
  const aggregators = await fetchWithCache(aggregatorMetadataUrl, { method: 'GET' }, { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR })
  const filteredAggregators = {}
  for (const aggKey in aggregators) {
    if (validateData(AGGREGATOR_METADATA_VALIDATORS, aggregators[aggKey], aggregatorMetadataUrl)) {
      filteredAggregators[aggKey] = aggregators[aggKey]
    }
  }
  return filteredAggregators
}

export async function fetchTopAssets (isCustomNetwork) {
  const topAssetsUrl = getBaseApi(isCustomNetwork, 'topAssets')
  const response = await fetchWithCache(topAssetsUrl, { method: 'GET' }, { cacheRefreshTime: CACHE_REFRESH_ONE_HOUR })
  const filteredTopAssets = response.filter((asset) => validateData(TOP_ASSET_VALIDATORS, asset, topAssetsUrl))
  return filteredTopAssets
}
