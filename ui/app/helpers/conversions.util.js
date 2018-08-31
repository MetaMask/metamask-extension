import { conversionUtil } from '../conversion-util'
import { ETH, GWEI, WEI } from '../constants/common'

export function hexToDecimal (hexValue) {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })
}

export function getEthConversionFromWeiHex ({ value, conversionRate, numberOfDecimals = 6 }) {
  const denominations = [ETH, GWEI]

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
