import { useMemo } from 'react'
import { getTokenData } from '../helpers/utils/transactions.util'

export function useTokenData (transactionData) {
  if (!transactionData) {
    return null
  }
  return useMemo(() => getTokenData(transactionData), [transactionData])
}
