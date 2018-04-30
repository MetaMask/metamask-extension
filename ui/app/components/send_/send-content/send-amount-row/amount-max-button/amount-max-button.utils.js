const {
  multiplyCurrencies,
  subtractCurrencies,
} = require('../../../../../conversion-util')
const ethUtil = require('ethereumjs-util')

function calcMaxAmount ({ balance, gasTotal, selectedToken, tokenBalance }) {
    const { decimals } = selectedToken || {}
    const multiplier = Math.pow(10, Number(decimals || 0))

    return selectedToken
      ? multiplyCurrencies(tokenBalance, multiplier, {toNumericBase: 'hex'})
      : subtractCurrencies(
        ethUtil.addHexPrefix(balance),
        ethUtil.addHexPrefix(gasTotal),
        { toNumericBase: 'hex' }
      )
}

module.exports = {
  calcMaxAmount,
}
