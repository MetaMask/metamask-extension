const ethUtil = require('ethereumjs-util')
const { conversionUtil, multiplyCurrencies } = require('../../conversion-util')

const MIN_GAS_PRICE_HEX = (100000000).toString(16)
const MIN_GAS_PRICE_DEC = '100000000'
const MIN_GAS_LIMIT_HEX = (21000).toString(16)
const MIN_GAS_LIMIT_DEC = 21000

const MIN_GAS_PRICE_GWEI = ethUtil.addHexPrefix(conversionUtil(MIN_GAS_PRICE_HEX, {
  fromDenomination: 'WEI',
  toDenomination: 'GWEI',
  fromNumericBase: 'hex',
  toNumericBase: 'hex',
  numberOfDecimals: 1,
}))

const MIN_GAS_TOTAL = multiplyCurrencies(MIN_GAS_LIMIT_HEX, MIN_GAS_PRICE_HEX, {
  toNumericBase: 'hex',
  multiplicandBase: 16,
  multiplierBase: 16,
})

module.exports = {
  MIN_GAS_PRICE_GWEI,
  MIN_GAS_PRICE_HEX,
  MIN_GAS_PRICE_DEC,
  MIN_GAS_LIMIT_HEX,
  MIN_GAS_LIMIT_DEC,
  MIN_GAS_TOTAL,
}
