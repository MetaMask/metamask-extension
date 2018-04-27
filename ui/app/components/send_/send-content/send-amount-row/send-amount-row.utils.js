const {
  conversionGreaterThan,
} = require('../../../../conversion-util')
const {
  isBalanceSufficient,
  isTokenBalanceSufficient,
} = require('../../send.utils')

function getAmountErrorObject ({
  amount,
  amountConversionRate,
  balance,
  conversionRate,
  gasTotal,
  primaryCurrency,
  selectedToken,
  tokenBalance,
}) {
  let insufficientFunds = false
  if (gasTotal && conversionRate) {
    insufficientFunds = !isBalanceSufficient({
      amount: selectedToken ? '0x0' : amount,
      amountConversionRate,
      balance,
      conversionRate,
      gasTotal,
      primaryCurrency,
    })
  }

  let inSufficientTokens = false
  if (selectedToken && tokenBalance !== null) {
    const { decimals } = selectedToken
    inSufficientTokens = !isTokenBalanceSufficient({
      tokenBalance,
      amount,
      decimals,
    })
  }

  const amountLessThanZero = conversionGreaterThan(
    { value: 0, fromNumericBase: 'dec' },
    { value: amount, fromNumericBase: 'hex' },
  )

  let amountError = null

  if (insufficientFunds) {
    amountError = 'insufficientFunds'
  } else if (inSufficientTokens) {
    amountError = 'insufficientTokens'
  } else if (amountLessThanZero) {
    amountError = 'negativeETH'
  }

  return { amount: amountError }
}

module.exports = {
  getAmountErrorObject,
}
