import log from 'loglevel'
import * as util from './util'
import BigNumber from 'bignumber.js'

const DEFAULT_SYMBOL = ''
const DEFAULT_DECIMALS = '0'

async function getSymbolFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.symbol()
    return result[0]
  } catch (error) {
    log.warn(
      `symbol() call for token at address ${tokenAddress} resulted in error:`,
      error
    )
  }
}

async function getDecimalsFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.decimals()
    const decimalsBN = result[0]
    return decimalsBN && decimalsBN.toString()
  } catch (error) {
    log.warn(
      `decimals() call for token at address ${tokenAddress} resulted in error:`,
      error
    )
  }
}

function getContractMetadata (tokenAddress, casedContractMap) {
  return tokenAddress && casedContractMap[tokenAddress.toLowerCase()]
}

async function getSymbol (tokenAddress, contractMap) {
  let symbol = await getSymbolFromContract(tokenAddress)

  if (!symbol) {
    const contractMetadataInfo = getContractMetadata(tokenAddress, contractMap)

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol
    }
  }

  return symbol
}

async function getDecimals (tokenAddress, contractMap) {
  let decimals = await getDecimalsFromContract(tokenAddress)

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getContractMetadata(tokenAddress, contractMap)

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals
    }
  }

  return decimals
}

export async function fetchSymbolAndDecimals (tokenAddress, contractMap) {
  let symbol, decimals

  try {
    symbol = await getSymbol(tokenAddress, contractMap)
    decimals = await getDecimals(tokenAddress, contractMap)
  } catch (error) {
    log.warn(
      `symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`,
      error
    )
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export async function getSymbolAndDecimals (tokenAddress, contractMap, existingTokens = []) {
  const existingToken = existingTokens.find(
    ({ address }) => tokenAddress === address
  )

  if (existingToken) {
    return {
      symbol: existingToken.symbol,
      decimals: existingToken.decimals,
    }
  }

  let symbol, decimals

  try {
    symbol = await getSymbol(tokenAddress, contractMap)
    decimals = await getDecimals(tokenAddress, contractMap)
  } catch (error) {
    log.warn(
      `symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`,
      error
    )
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export function tokenInfoGetter (contractMap) {
  const tokens = {}

  return async (address) => {
    if (tokens[address]) {
      return tokens[address]
    }

    tokens[address] = await getSymbolAndDecimals(address, contractMap)

    return tokens[address]
  }
}

export function calcTokenAmount (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).div(multiplier)
}

export function calcTokenValue (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).times(multiplier)
}

export function getTokenValue (tokenParams = []) {
  const valueData = tokenParams.find((param) => param.name === '_value')
  return valueData && valueData.value
}

export function getTokenToAddress (tokenParams = []) {
  const toAddressData = tokenParams.find((param) => param.name === '_to')
  return toAddressData ? toAddressData.value : tokenParams[0].value
}
