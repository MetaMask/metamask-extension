import { useMemo } from 'react'
import { getTokenData } from '../helpers/utils/transactions.util'

export function useTokenData (transactionData) {
  if (!transactionData) {
    return null
  }
  const tokenData = useMemo(() => getTokenData(transactionData), [transactionData])
  return tokenData
}
