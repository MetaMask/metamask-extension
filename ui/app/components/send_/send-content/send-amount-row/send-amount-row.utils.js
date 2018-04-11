const { isValidAddress } = require('../../../../util')

function getAmountErrorObject ({
  amount,
  balance,
  amountConversionRate,
  conversionRate,
  primaryCurrency,
  selectedToken,
  gasTotal,
  tokenBalance,
}) {
  let insufficientFunds = false
  if (gasTotal && conversionRate) {
    insufficientFunds = !isBalanceSufficient({
      amount: selectedToken ? '0x0' : amount,
      gasTotal,
      balance,
      primaryCurrency,
      amountConversionRate,
      conversionRate,
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
    amountError = this.context.t('insufficientFunds')
  } else if (insufficientTokens) {
    amountError = this.context.t('insufficientTokens')
  } else if (amountLessThanZero) {
    amountError = this.context.t('negativeETH')
  }

  return { amount: amountError }
}

module.exports = {
  getAmountErrorObject
}
