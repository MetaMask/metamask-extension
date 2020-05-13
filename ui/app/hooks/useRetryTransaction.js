import { useDispatch } from 'react-redux'
import { useMemo, useCallback, useEffect, useState } from 'react'
import * as actions from '../store/actions'
import {
  fetchBasicGasAndTimeEstimates as fetchBasicGasAndTimeEstimatesAction,
  fetchGasEstimates as fetchGasEstimatesAction,
  setCustomGasPriceForRetry as setCustomGasPriceForRetryAction,
  setCustomGasLimit as setCustomGasLimitAction,
} from '../ducks/gas/gas.duck'
import { TOKEN_METHOD_TRANSFER } from '../helpers/constants/transactions'
import { increaseLastGasPrice } from '../helpers/utils/confirm-tx.util'
import { useMetricEvent } from './useMetricEvent'
import { useMethodData } from './useMethodData'


/**
 * useRetryTransaction
 *
 * Provides a reusable hook that, given a transactionGroup, will return
 * whether or not the transaction meets the criteria to be retried with
 * higher gas (sped up), and a method for beginning the retry process
 * @param {Object} transactionGroup - the transaction group
 * @param {boolean} isEarliestNonce - indicates if this transaction is the earliest in history
 * @return {[boolean, Function]}
 */
export function useRetryTransaction (transactionGroup, isEarliestNonce = false) {
  const { primaryTransaction, transactions, initialTransaction, hasRetried } = transactionGroup
  const [earliestTransaction = {}] = transactions
  const { submittedTime } = earliestTransaction
  const gasPrice = primaryTransaction.txParams?.gasPrice
  const methodData = useMethodData(primaryTransaction.txParams?.data)
  const trackMetricsEvent = useMetricEvent(({
    eventOpts: {
      category: 'Navigation',
      action: 'Activity Log',
      name: 'Clicked "Speed Up"',
    },
  }))
  const dispatch = useDispatch()
  const { fetchBasicGasAndTimeEstimates, fetchGasEstimates, setSelectedToken, retryTransaction } = useMemo(() => ({
    fetchBasicGasAndTimeEstimates: () => dispatch(fetchBasicGasAndTimeEstimatesAction()),
    fetchGasEstimates: (blockTime) => dispatch(fetchGasEstimatesAction(blockTime)),
    setSelectedToken: (tokenAddress) => dispatch(actions.setSelectedToken(tokenAddress)),
    retryTransaction: () => {
      const transaction = initialTransaction
      const increasedGasPrice = increaseLastGasPrice(gasPrice)
      dispatch(setCustomGasPriceForRetryAction(increasedGasPrice || transaction.txParams?.gasPrice))
      dispatch(setCustomGasLimitAction(transaction.txParams?.gas))
      dispatch(actions.showSidebar({
        transitionName: 'sidebar-left',
        type: 'customize-gas',
        props: { transaction },
      }))
    },
  }), [dispatch, initialTransaction, gasPrice])
  const [retryEnabled, setRetryEnabled] = useState(() => {
    return Date.now() - submittedTime > 5000 && isEarliestNonce && !hasRetried
  })

  if (methodData?.name === TOKEN_METHOD_TRANSFER && initialTransaction.txParams?.to) {
    setSelectedToken(initialTransaction.txParams.to)
  }

  useEffect(() => {
    // because this hook is optimized to only run on changes we have to
    // key into the changing time delta between submittedTime and now()
    // and if the status of the transaction changes based on that difference
    // trigger a setState call to tell react to re-render. This effect will
    // also immediately set retryEnabled and not create an interval if the
    // condition is already met. This effect will run anytime the variables
    // for determining enabled status change
    let intervalId
    if (!hasRetried && isEarliestNonce && !retryEnabled) {
      if (Date.now() - submittedTime > 5000) {
        setRetryEnabled(true)
      } else {
        intervalId = setInterval(() => {
          if (Date.now() - submittedTime > 5000) {
            setRetryEnabled(true)
            clearInterval(intervalId)
          }
        }, 500)
      }
    }
    // Anytime the effect is re-ran, make sure to remove a previously set interval
    // so as to avoid multiple intervals potentially overlapping
    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [submittedTime, hasRetried, isEarliestNonce])


  const showRetryTransactionDialog = useCallback((event) => {
    event.preventDefault()
    event.stopPropagation()

    if (!retryEnabled) {
      // Eject here because the function was called erroneously
      return
    }

    trackMetricsEvent()
    return fetchBasicGasAndTimeEstimates()
      .then((basicEstimates) => fetchGasEstimates(basicEstimates.blockTime))
      .then(retryTransaction)
  }, [fetchBasicGasAndTimeEstimates, retryEnabled, fetchGasEstimates, retryTransaction, trackMetricsEvent])
  return [retryEnabled, showRetryTransactionDialog]
}
