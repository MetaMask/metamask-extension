import log from 'loglevel'
import BigNumber from 'bignumber.js'
import contractMap from 'eth-contract-metadata'
import { TOKEN_TRANSFER_LOG_TOPIC_HASH } from '../constants/contracts'
import * as util from './util'
import { conversionUtil, multiplyCurrencies } from './conversion-util'
import { formatCurrency } from './confirm-tx.util'

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
    return undefined
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
    return undefined
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

export function calcTokenValue (value, decimals) {
  const multiplier = Math.pow(10, Number(decimals || 0))
  return new BigNumber(String(value)).times(multiplier)
}

/**
 * Attempts to get the address parameter of the given token transaction data
 * (i.e. function call) per the Human Standard Token ABI, in the following
 * order:
 *   - The '_to' parameter, if present
 *   - The first parameter, if present
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A lowercase address string.
 */
export function getTokenAddressParam (tokenData = {}) {
  const value = tokenData?.args?.['_to'] || tokenData?.args?.[0]
  return value?.toString().toLowerCase()
}

/**
 * Gets the '_value' parameter of the given token transaction data
 * (i.e function call) per the Human Standard Token ABI, if present.
 *
 * @param {Object} tokenData - ethers Interface token data.
 * @returns {string | undefined} A decimal string value.
 */
export function getTokenValueParam (tokenData = {}) {
  return tokenData?.args?.['_value']?.toString()
}

/**
 * Get the token balance converted to fiat and formatted for display
 *
 * @param {number} [contractExchangeRate] - The exchange rate between the current token and the native currency
 * @param {number} conversionRate - The exchange rate between the current fiat currency and the native currency
 * @param {string} currentCurrency - The currency code for the user's chosen fiat currency
 * @param {string} [tokenAmount] - The current token balance
 * @param {string} [tokenSymbol] - The token symbol
 * @returns {string|undefined} The formatted token amount in the user's chosen fiat currency
 */
export function getFormattedTokenFiatAmount (
  contractExchangeRate,
  conversionRate,
  currentCurrency,
  tokenAmount,
  tokenSymbol,
) {
  // If the conversionRate is 0 (i.e. unknown) or the contract exchange rate
  // is currently unknown, the fiat amount cannot be calculated so it is not
  // shown to the user
  if (conversionRate <= 0 || !contractExchangeRate || tokenAmount === undefined) {
    return undefined
  }

  const currentTokenToFiatRate = multiplyCurrencies(
    contractExchangeRate,
    conversionRate,
  )
  const currentTokenInFiat = conversionUtil(tokenAmount, {
    fromNumericBase: 'dec',
    fromCurrency: tokenSymbol,
    toCurrency: currentCurrency.toUpperCase(),
    numberOfDecimals: 2,
    conversionRate: currentTokenToFiatRate,
  })
  return `${formatCurrency(currentTokenInFiat, currentCurrency)} ${currentCurrency.toUpperCase()}`
}

/**
 * Given a transaction receipt for a contract transaction that involves a token transfer to a given account,
 * returns the amount of tokens transferred.
 *
 * @param {object} [txReceipt] - The transaction receipt object, as can be found in any standard MetaMask txMeta object
 * @param {string} tokenAddres - The hex address of the token being transferred
 * @param {string} receiverAddress - The address of the account being transferred to
 * @param {number} [tokenDecimals] - The decimals of the token being transfered
 * @returns {string|null} The amount of tokens transferred as a decimal number
 */
export function getTokensRecivedFromTxReceipt (txReceipt, tokenAddress, receiverAddress, tokenDecimals) {
  const txReceiptLogs = txReceipt?.logs
  if (txReceiptLogs && txReceipt?.status !== '0x0') {
    const tokenTransferLog = txReceiptLogs.find((txReceiptLog) => {
      const isTokenTransfer = txReceiptLog.topics && txReceiptLog.topics[0] === TOKEN_TRANSFER_LOG_TOPIC_HASH
      const isTransferFromGivenToken = txReceiptLog.address === tokenAddress
      const isTransferToReceiverAddress = txReceiptLog?.topics[2]?.match(receiverAddress.slice(2))
      return isTokenTransfer && isTransferFromGivenToken && isTransferToReceiverAddress
    })
    return tokenTransferLog
      ? calcTokenAmount(tokenTransferLog.data, tokenDecimals).toString(10)
      : null
  }
  return null
}

