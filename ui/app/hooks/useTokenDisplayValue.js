import { getTokenValue, calcTokenAmount } from '../helpers/utils/token-util'
import { getTokenData } from '../helpers/utils/transactions.util'
import { useMemo } from 'react'

/**
 * Defines the shape for the Token input parameter for useTokenDisplayValue
 * @typedef {Object} Token
 * @property {string} symbol   - The string to use as a suffix for the token (eg. DAI)
 * @property {number} decimals - The number of decimals to show when displaying this type of token
 */

/**
 * useTokenDisplayValue
 * Given the data string from txParams and a token object with symbol and decimals, return
 * a displayValue that represents a string representing that token amount as a string. Also
 * return a tokenData object for downstream usage and the suffix for the token to use as props
 * for other hooks and/or components
 * @param {string} transactionData
 * @param {Token} token
 * @return {string} - The computed displayValue of the provided transactionData and token
 */
export function useTokenDisplayValue (transactionData, token) {
  if (!transactionData || !token) {
    return null
  }
  const tokenData = useMemo(() => getTokenData(transactionData), [transactionData])
  if (!tokenData?.params?.length) {
    return null
  }
  const { decimals } = token

  const displayValue = useMemo(() => {
    const tokenValue = getTokenValue(tokenData.params)
    return calcTokenAmount(tokenValue, decimals).toString()
  }, [tokenData, decimals])

  return displayValue
}
