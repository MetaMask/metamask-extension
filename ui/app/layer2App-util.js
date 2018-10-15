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

async function getSymbolFromContract (layer2AppAddress) {
  const layer2App = util.getContractAtAddress(layer2AppAddress)

  try {
    const result = await layer2App.symbol()
    return result[0]
  } catch (error) {
    log.warn(`symbol() call for layer2App at address ${layer2AppAddress} resulted in error:`, error)
  }
}

async function getDecimalsFromContract (layer2AppAddress) {
  const layer2App = util.getContractAtAddress(layer2AppAddress)

  try {
    const result = await layer2App.decimals()
    const decimalsBN = result[0]
    return decimalsBN && decimalsBN.toString()
  } catch (error) {
    log.warn(`decimals() call for layer2App at address ${layer2AppAddress} resulted in error:`, error)
  }
}

function getContractMetadata (layer2AppAddress) {
  return layer2AppAddress && casedContractMap[layer2AppAddress.toLowerCase()]
}

async function getSymbol (layer2AppAddress) {
  let symbol = await getSymbolFromContract(layer2AppAddress)

  if (!symbol) {
    const contractMetadataInfo = getContractMetadata(layer2AppAddress)

    if (contractMetadataInfo) {
      symbol = contractMetadataInfo.symbol
    }
  }

  return symbol
}

async function getDecimals (layer2AppAddress) {
  let decimals = await getDecimalsFromContract(layer2AppAddress)

  if (!decimals || decimals === '0') {
    const contractMetadataInfo = getContractMetadata(layer2AppAddress)

    if (contractMetadataInfo) {
      decimals = contractMetadataInfo.decimals
    }
  }

  return decimals
}

export async function getSymbolAndDecimals (layer2AppAddress, existingLayer2Apps = []) {
  const existingLayer2App = existingLayer2Apps.find(({ address }) => layer2AppAddress === address)

  if (existingLayer2App) {
    return {
      symbol: existingLayer2App.symbol,
      decimals: existingLayer2App.decimals,
    }
  }

  let symbol, decimals

  try {
    symbol = await getSymbol(layer2AppAddress)
    decimals = await getDecimals(layer2AppAddress)
  } catch (error) {
    log.warn(`symbol() and decimal() calls for layer2App at address ${layer2AppAddress} resulted in error:`, error)
  }

  return {
    symbol: symbol || DEFAULT_SYMBOL,
    decimals: decimals || DEFAULT_DECIMALS,
  }
}

export function layer2AppInfoGetter () {
  const layer2Apps = {}

  return async (address) => {
    if (layer2Apps[address]) {
      return layer2Apps[address]
    }

    layer2Apps[address] = await getSymbolAndDecimals(address)

    return layer2Apps[address]
  }
}

export function calcLayer2AppAmount (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).div(multiplier).toNumber()
}

export function getLayer2AppValue (layer2AppParams = []) {
  const valueData = layer2AppParams.find(param => param.name === '_value')
  return valueData && valueData.value
}
