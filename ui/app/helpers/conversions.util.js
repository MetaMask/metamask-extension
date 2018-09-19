import { conversionUtil, addCurrencies } from '../conversion-util'

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
