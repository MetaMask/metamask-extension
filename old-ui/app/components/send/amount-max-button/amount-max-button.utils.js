import { multiplyCurrencies, subtractCurrencies, BIG_NUMBER_WEI_MULTIPLIER } from '../../../../../ui/app/conversion-util'
import ethUtil from 'ethereumjs-util'
import BigNumber from 'bignumber.js'

export function calcMaxAmount ({ balance, gasTotal, sendToken, tokenBalance }) {
  const { decimals } = sendToken || {}
  const multiplier = Math.pow(10, Number(decimals || 0))


  let maxBalance
  if (sendToken) {
    maxBalance = multiplyCurrencies(
      tokenBalance,
      multiplier,
      {
        toNumericBase: 'hex',
        multiplicandBase: 16,
      },
    )
  } else {
    const maxBalanceInWei =
    subtractCurrencies(
      ethUtil.addHexPrefix(balance),
      ethUtil.addHexPrefix(gasTotal),
      { toNumericBase: 'dec' },
    )
    const maxBalanceInWeiBN = new BigNumber(maxBalanceInWei.toString())
    maxBalance = maxBalanceInWeiBN.div(BIG_NUMBER_WEI_MULTIPLIER).toString()
  }

  return maxBalance
}
