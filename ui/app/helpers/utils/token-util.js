const log = require('loglevel')
const util = require('./util')
const BigNumber = require('bignumber.js')
import contractMap from 'eth-contract-metadata'

const casedContractMap = Object.keys(contractMap).reduce((acc, base) => {
  return {
    ...acc,
    [base.toLowerCase()]: contractMap[base],
  }
}, {})

const DEFAULT_SYMBOL = ''
const DEFAULT_DECIMALS = '0'

async function getSymbolFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.symbol()
    return result[0]
  } catch (error) {
    log.warn(`symbol() call for token at address ${tokenAddress} resulted in error:`, error)
  }
}

async function getDecimalsFromContract (tokenAddress) {
  const token = util.getContractAtAddress(tokenAddress)

  try {
    const result = await token.decimals()
    const decimalsBN = result[0]
    return decimalsBN && decimalsBN.toString()
  } catch (error) {
    log.warn(`decimals() call for token at address ${tokenAddress} resulted in error:`, error)
  }
}

function getContractMetadata (tokenAddress) {
  return tokenAddress && casedContractMap[tokenAddress.toLowerCase()]
}

async function getSymbol (tokenAddress) {
  let symbol = await getSymbolFromContract(tokenAddress)

  if (!symbol) {
    const contractMetadataInfo = getContractMetadata(tokenAddress)

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol
    }
  }

  return symbol
}

async function getDecimals (tokenAddress) {
  let decimals = await getDecimalsFromContract(tokenAddress)

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getContractMetadata(tokenAddress)

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals
    }
  }

  return decimals
}

export async function fetchSymbolAndDecimals (tokenAddress) {
  let symbol, decimals

  try {
    symbol = await getSymbol(tokenAddress)
    decimals = await getDecimals(tokenAddress)
  } catch (error) {
    log.warn(`symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`, error)
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export async function getSymbolAndDecimals (tokenAddress, existingTokens = []) {
  const existingToken = existingTokens.find(({ address }) => tokenAddress === address)

  if (existingToken) {
    return {
      symbol: existingToken.symbol,
      decimals: existingToken.decimals,
    }
  }

  let symbol, decimals

  try {
    symbol = await getSymbol(tokenAddress)
    decimals = await getDecimals(tokenAddress)
  } catch (error) {
    log.warn(`symbol() and decimal() calls for token at address ${tokenAddress} resulted in error:`, error)
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export function tokenInfoGetter () {
  const tokens = {}

  return async (address) => {
    if (tokens[address]) {
      return tokens[address]
    }

    tokens[address] = await getSymbolAndDecimals(address)

    return tokens[address]
  }
}

export function calcTokenAmount (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).div(multiplier)
}

export function getTokenValue (tokenParams = []) {
  const valueData = tokenParams.find(param => param.name === '_value')
  return valueData && valueData.value
}

export function getTokenToAddress (tokenParams = []) {
  const toAddressData = tokenParams.find(param => param.name === '_to')
  return toAddressData ? toAddressData.value : tokenParams[0].value
}
