import ethUtil from 'ethereumjs-util'
import { conversionUtil } from '../conversion-util'
import { ETH, GWEI, WEI } from '../constants/common'

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

export function getEthConversionFromWeiHex ({ value, fromCurrency = ETH, conversionRate, numberOfDecimals = 6 }) {
  const denominations = [fromCurrency, GWEI, WEI]

  let nonZeroDenomination

  for (let i = 0; i < denominations.length; i++) {
    const convertedValue = getValueFromWeiHex({
      value,
      conversionRate,
      fromCurrency,
      toCurrency: fromCurrency,
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
  fromCurrency = ETH,
  toCurrency,
  conversionRate,
  numberOfDecimals,
  toDenomination,
}) {
  return conversionUtil(value, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromCurrency,
    toCurrency,
    numberOfDecimals,
    fromDenomination: WEI,
    toDenomination,
    conversionRate,
  })
}

export function getWeiHexFromDecimalValue ({
  value,
  fromCurrency,
  conversionRate,
  fromDenomination,
  invertConversionRate,
}) {
  return conversionUtil(value, {
    fromNumericBase: 'dec',
    toNumericBase: 'hex',
    toCurrency: ETH,
    fromCurrency,
    conversionRate,
    invertConversionRate,
    fromDenomination,
    toDenomination: WEI,
  })
}
