const { addCurrencies, conversionGreaterThan } = require('../../conversion-util')

function isBalanceSufficient ({
  amount,
  gasTotal,
  balance,
  primaryCurrency,
  selectedToken,
  amountConversionRate,
  conversionRate,
}) {
  const totalAmount = addCurrencies(amount, gasTotal, {
    aBase: 16,
    bBase: 16,
    toNumericBase: 'hex',
  })

  const balanceIsSufficient = conversionGreaterThan(
    {
      value: balance,
      fromNumericBase: 'hex',
      fromCurrency: primaryCurrency,
      conversionRate,
    },
    {
      value: totalAmount,
      fromNumericBase: 'hex',
      conversionRate: amountConversionRate,
      fromCurrency: selectedToken || primaryCurrency,
    },
  )

  return balanceIsSufficient
}

module.exports = {
  isBalanceSufficient,
}
