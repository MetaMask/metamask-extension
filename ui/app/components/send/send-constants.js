const Identicon = require('../identicon')
const { multiplyCurrencies } = require('../../conversion-util')

const MIN_GAS_PRICE_GWEI = '1'
const GWEI_FACTOR = '1e9'
const MIN_GAS_PRICE = multiplyCurrencies(GWEI_FACTOR, MIN_GAS_PRICE_GWEI, {
	multiplicandBase: 16,
	multiplierBase: 16,
})
const MIN_GAS_LIMIT = (21000).toString(16)
const MIN_GAS_TOTAL = multiplyCurrencies(MIN_GAS_LIMIT, MIN_GAS_PRICE, {
  toNumericBase: 'hex',
  multiplicandBase: 16,
  multiplierBase: 16,
})

module.exports = {
  MIN_GAS_PRICE_GWEI,
  GWEI_FACTOR,
  MIN_GAS_PRICE,
  MIN_GAS_LIMIT,
  MIN_GAS_TOTAL,
}
