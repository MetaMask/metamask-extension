import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions'
import {
  getFeatureFlags,
} from '../../../selectors/selectors'
import * as actions from '../../../ducks/gas/gas.duck'
import { useI18nContext } from '../../../hooks/useI18nContext'
import TransactionListItem from '../transaction-list-item'
import Button from '../../ui/button'

const PAGE_INCREMENT = 10

const getTransactionGroupRecipientAddressFilter = (recipientAddress) => {
  return ({ initialTransaction: { txParams } }) => txParams && txParams.to === recipientAddress
}

export default function TransactionList ({ tokenAddress }) {
  const [limit, setLimit] = useState(PAGE_INCREMENT)
  const t = useI18nContext()

  const dispatch = useDispatch()
  const unfilteredPendingTransactions = useSelector(nonceSortedPendingTransactionsSelector)
  const unfilteredCompletedTransactions = useSelector(nonceSortedCompletedTransactionsSelector)
  const { transactionTime: transactionTimeFeatureActive } = useSelector(getFeatureFlags)

  const pendingTransactions = useMemo(
    () => (
      tokenAddress && tokenAddress.startsWith('0x')
        ? unfilteredPendingTransactions
          .filter(getTransactionGroupRecipientAddressFilter(tokenAddress))
        : unfilteredPendingTransactions
    ),
    [unfilteredPendingTransactions, tokenAddress]
  )
  const completedTransactions = useMemo(
    () => (
      tokenAddress && tokenAddress.startsWith('0x')
        ? unfilteredCompletedTransactions
          .filter(getTransactionGroupRecipientAddressFilter(tokenAddress))
        : unfilteredCompletedTransactions
    ),
    [unfilteredCompletedTransactions, tokenAddress]
  )

  const { fetchGasEstimates, fetchBasicGasAndTimeEstimates } = useMemo(() => ({
    fetchGasEstimates: (blockTime) => dispatch(actions.fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(actions.fetchBasicGasAndTimeEstimates()),
  }), [dispatch])

  // keep track of previous values from state.
  // loaded is used here to determine if our effect has ran at least once.
  const prevState = useRef({ loaded: false, pendingTransactions, transactionTimeFeatureActive })

  useEffect(() => {
    const { loaded } = prevState.current
    const pendingTransactionAdded = pendingTransactions.length > 0 && prevState.current.pendingTransactions.length === 0
    const transactionTimeFeatureWasActivated = !prevState.current.transactionTimeFeatureActive && transactionTimeFeatureActive
    if (transactionTimeFeatureActive && pendingTransactions.length > 0 && (loaded === false || transactionTimeFeatureWasActivated || pendingTransactionAdded)) {
      fetchBasicGasAndTimeEstimates()
        .then(({ blockTime }) => fetchGasEstimates(blockTime))
    }
    prevState.current = { loaded: true, pendingTransactions, transactionTimeFeatureActive }
  }, [fetchGasEstimates, fetchBasicGasAndTimeEstimates, transactionTimeFeatureActive, pendingTransactions ])

  const viewMore = useCallback(() => setLimit((prev) => prev + PAGE_INCREMENT), [])


  const pendingLength = pendingTransactions.length

  return (
    <div className="transaction-list">
      <div className="transaction-list__transactions">
        {
          pendingLength > 0 && (
            <div className="transaction-list__pending-transactions">
              <div className="transaction-list__header">
                { `${t('queue')} (${pendingTransactions.length})` }
              </div>
              {
                pendingTransactions.map((transactionGroup, index) => (
                  <TransactionListItem isEarliestNonce={index === 0} transactionGroup={transactionGroup} key={`${transactionGroup.nonce}:${index}`} />
                ))
              }
            </div>
          )
        }
        <div className="transaction-list__completed-transactions">
          {
            pendingLength > 0
              ? (
                <div className="transaction-list__header">
                  { t('history') }
                </div>
              )
              : null
          }
          {
            completedTransactions.length > 0
              ? completedTransactions.slice(0, limit).map((transactionGroup, index) => (
                <TransactionListItem transactionGroup={transactionGroup} key={`${transactionGroup.nonce}:${limit + index - 10}`} />
              ))
              : (
                <div className="transaction-list__empty">
                  <div className="transaction-list__empty-text">
                    { t('noTransactions') }
                  </div>
                </div>
              )
          }
          {(completedTransactions.length - limit + PAGE_INCREMENT) > 0 && (
            <Button className="transaction-list__view-more" type="secondary" rounded onClick={viewMore}>View More</Button>
          )}
        </div>
      </div>
    </div>
  )
}

TransactionList.propTypes = {
  tokenAddress: PropTypes.string,
}

TransactionList.defaultProps = {
  tokenAddress: undefined,
}
