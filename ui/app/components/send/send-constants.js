const Identicon = require('../identicon')
const { multiplyCurrencies } = require('../../conversion-util')

const MIN_GAS_PRICE_GWEI = '1'
const GWEI_FACTOR = '1e9'
const MIN_GAS_PRICE_HEX = multiplyCurrencies(GWEI_FACTOR, MIN_GAS_PRICE_GWEI, {
	multiplicandBase: 16,
	multiplierBase: 16,
  toNumericBase: 'hex',
})
const MIN_GAS_PRICE_DEC = multiplyCurrencies(GWEI_FACTOR, MIN_GAS_PRICE_GWEI, {
  multiplicandBase: 16,
  multiplierBase: 16,
  toNumericBase: 'dec',
})
const MIN_GAS_LIMIT_HEX = (21000).toString(16)
const MIN_GAS_LIMIT_DEC = 21000
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
