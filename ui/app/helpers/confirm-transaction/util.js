import currencyFormatter from 'currency-formatter'
import currencies from 'currency-formatter/currencies'
import abi from 'human-standard-token-abi'
import abiDecoder from 'abi-decoder'
import ethUtil from 'ethereumjs-util'

abiDecoder.addABI(abi)

import MethodRegistry from 'eth-method-registry'
const registry = new MethodRegistry({ provider: global.ethereumProvider })

import {
  conversionUtil,
  addCurrencies,
  multiplyCurrencies,
  conversionGreaterThan,
} from '../../conversion-util'

export function getTokenData (data = {}) {
  return abiDecoder.decodeMethod(data)
}

export async function getMethodData (data = {}) {
  const prefixedData = ethUtil.addHexPrefix(data)
  const fourBytePrefix = prefixedData.slice(0, 10)
  const sig = await registry.lookup(fourBytePrefix)
  const parsedResult = registry.parse(sig)

  return {
    name: parsedResult.name,
    params: parsedResult.args,
  }
}

export function increaseLastGasPrice (lastGasPrice) {
  return ethUtil.addHexPrefix(multiplyCurrencies(lastGasPrice, 1.1, {
    multiplicandBase: 16,
    multiplierBase: 10,
    toNumericBase: 'hex',
  }))
}

export function hexGreaterThan (a, b) {
  return conversionGreaterThan(
    { value: a, fromNumericBase: 'hex' },
    { value: b, fromNumericBase: 'hex' },
  )
}

export function getHexGasTotal ({ gasLimit, gasPrice }) {
  return ethUtil.addHexPrefix(multiplyCurrencies(gasLimit, gasPrice, {
    toNumericBase: 'hex',
    multiplicandBase: 16,
    multiplierBase: 16,
  }))
}

export function addEth (...args) {
  return args.reduce((acc, base) => {
    return addCurrencies(acc, base, {
      toNumericBase: 'dec',
      numberOfDecimals: 6,
    })
  })
}

export function addFiat (...args) {
  return args.reduce((acc, base) => {
    return addCurrencies(acc, base, {
      toNumericBase: 'dec',
      numberOfDecimals: 2,
    })
  })
}

export function getTransactionAmount ({
  value,
  toCurrency,
  conversionRate,
  numberOfDecimals,
}) {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency,
    numberOfDecimals,
    fromDenomination: 'WEI',
    conversionRate,
  })
}

export function getTransactionFee ({
  value,
  toCurrency,
  conversionRate,
  numberOfDecimals,
}) {
  return conversionUtil(value, {
    fromNumericBase: 'BN',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    fromCurrency: 'ETH',
    toCurrency,
    numberOfDecimals,
    conversionRate,
  })
}

export function formatCurrency (value, currencyCode) {
  const upperCaseCurrencyCode = currencyCode.toUpperCase()

  return currencies.find(currency => currency.code === upperCaseCurrencyCode)
    ? currencyFormatter.format(Number(value), { code: upperCaseCurrencyCode })
    : value
}
