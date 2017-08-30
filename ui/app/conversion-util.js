const {
  numericBalance,
  parseBalance,
  formatBalance,
  normalizeToWei,
  valueTable,
} = require('./util')
const hexToBn = require('../../app/scripts/lib/hex-to-bn')
const { BN } = require('ethereumjs-util')
const GWEI_MULTIPLIER = normalizeToWei(hexToBn(valueTable.gwei.toString(16)), 'gwei');

const conversionUtil = (value, {
  fromCurrency,
  toCurrency,
  fromFormat,
  toFormat,
  precision = 2,
  conversionRate,
}) => {
  let result;
  
  if (fromFormat === 'BN') {
    if (fromCurrency !== 'GWEI') {
      result = normalizeToWei(value, 'gwei')
    }
    else {
      result = value
    }

    result = result.toString(16)
    result = formatBalance(result, 9)
    result = result.split(' ')
    result = Number(result[0]) * 1000000000
  }

  if (fromCurrency === 'GWEI') {
    result = result / 1000000000
  }

  if (toCurrency === 'USD') {
    result = result * conversionRate
    result = result.toFixed(precision)
  }

  return result
};

module.exports = {
  conversionUtil,
}