import { conversionUtil } from '../conversion-util'

export function hexToDecimal (hexValue) {
  return conversionUtil(hexValue, {
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
  })
}

export function getEthFromWeiHex ({
  value,
  conversionRate,
}) {
  return getValueFromWeiHex({
    value,
    conversionRate,
    toCurrency: 'ETH',
    numberOfDecimals: 6,
  })
}

export function getValueFromWeiHex ({
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
