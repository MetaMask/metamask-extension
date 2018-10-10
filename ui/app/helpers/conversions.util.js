import ethUtil from 'ethereumjs-util'
import { ETH, GWEI, WEI } from '../constants/common'
import { conversionUtil, addCurrencies } from '../conversion-util'

export function bnToHex (inputBn) {
  return ethUtil.addHexPrefix(inputBn.toString(16))
}

export function hexToDecimal (hexValue) {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })
}

export function decimalToHex (decimal) {
  return conversionUtil(decimal, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
  })
}

export function getEthConversionFromWeiHex ({ value, conversionRate, numberOfDecimals = 6 }) {
  const denominations = [ETH, GWEI, WEI]

  let nonZeroDenomination

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      toCurrency: ETH,
      numberOfDecimals,
      toDenomination: denominations[i],
    })

    if (convertedValue !== '0' || i === denominations.length - 1) {
      nonZeroDenomination = `${convertedValue} ${denominations[i]}`
      break
    }
  }

  return nonZeroDenomination
}

export function getValueFromWeiHex ({
  value,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}) {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency: ETH,
    toCurrency,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
  })
}

export function addHexWEIsToDec (aHexWEI, bHexWEI) {
  return addCurrencies(aHexWEI, bHexWEI, {
    aBase: 16,
    bBase: 16,
    fromDenomination: 'WEI',
    numberOfDecimals: 6,
  })
}

export function decEthToConvertedCurrency (ethTotal, convertedCurrency, conversionRate) {
  return conversionUtil(ethTotal, {
    fromNumericBase: 'dec',
    toNumericBase: 'dec',
    fromCurrency: 'ETH',
    toCurrency: convertedCurrency,
    numberOfDecimals: 2,
    conversionRate,
  })
}

export function decGWEIToHexWEI (decGWEI) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    fromDenomination: 'GWEI',
    toDenomination: 'WEI',
  })
}

export function hexWEIToDecGWEI (decGWEI) {
  return conversionUtil(decGWEI, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  })
}
