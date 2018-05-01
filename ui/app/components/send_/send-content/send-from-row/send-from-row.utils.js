const {
  calcTokenAmount,
} = require('../../../../token-util')

function calcTokenUpdateAmount (usersToken, selectedToken) {
  const { decimals } = selectedToken || {}
  return calcTokenAmount(usersToken.balance.toString(), decimals)
}

module.exports = {
  calcTokenUpdateAmount,
}
