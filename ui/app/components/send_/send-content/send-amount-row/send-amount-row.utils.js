const { isValidAddress } = require('../../../../util')
const {
  conversionGreaterThan,
} = require('../../../../conversion-util')
const {
  isBalanceSufficient,
  isTokenBalanceSufficient,
} = require('../../send.utils')

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
  console.log(`#& getAmountErrorObject amount`, amount);
  console.log(`#& getAmountErrorObject balance`, balance);
  console.log(`#& getAmountErrorObject amountConversionRate`, amountConversionRate);
  console.log(`#& getAmountErrorObject conversionRate`, conversionRate);
  console.log(`#& getAmountErrorObject primaryCurrency`, primaryCurrency);
  console.log(`#& getAmountErrorObject selectedToken`, selectedToken);
  console.log(`#& getAmountErrorObject gasTotal`, gasTotal);
  console.log(`#& getAmountErrorObject tokenBalance`, tokenBalance);
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
    amountError = 'insufficientFunds'
  } else if (inSufficientTokens) {
    amountError = 'insufficientTokens'
  } else if (amountLessThanZero) {
    amountError = 'negativeETH'
  }

  return { amount: amountError }
}

module.exports = {
  getAmountErrorObject
}
