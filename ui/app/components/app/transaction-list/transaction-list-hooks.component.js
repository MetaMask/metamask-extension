import React, { useCallback, useMemo, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { useSelector, useDispatch } from 'react-redux'
import {
  nonceSortedCompletedTransactionsSelector,
  nonceSortedPendingTransactionsSelector,
} from '../../../selectors/transactions'
import {
  getSelectedAddress,
  getAssetImages,
  getFeatureFlags,
} from '../../../selectors/selectors'
import { selectedTokenSelector } from '../../../selectors/tokens'
import * as actions from '../../../ducks/gas/gas.duck'
import { useI18nContext } from '../../../hooks/useI18nContext'
import TransactionListItem from '../transaction-list-item'


const mapStateToProps = (state) => {
  const pendingTransactions = nonceSortedPendingTransactionsSelector(state)
  const firstPendingTransactionId =
    pendingTransactions[0] && pendingTransactions[0].primaryTransaction.id
  return {
    completedTransactions: nonceSortedCompletedTransactionsSelector(state),
    pendingTransactions,
    firstPendingTransactionId,
    selectedToken: selectedTokenSelector(state),
    selectedAddress: getSelectedAddress(state),
    assetImages: getAssetImages(state),
    transactionTimeFeatureActive: getFeatureFlags(state).transactionTime,
  }
}

function useTransactionListState () {
  const dispatch = useDispatch()
  const {
    completedTransactions,
    firstPendingTransactionId,
    transactionTimeFeatureActive,
    assetImages,
    pendingTransactions,
    // selectedAddress,
    selectedToken,
  } = useSelector(mapStateToProps)
  const { fetchGasEstimates, fetchBasicGasAndTimeEstimates } = useMemo(() => ({
    fetchGasEstimates: (blockTime) => dispatch(actions.fetchGasEstimates(blockTime)),
    fetchBasicGasAndTimeEstimates: () => dispatch(actions.fetchBasicGasAndTimeEstimates()),
  }), [dispatch])
  const prevState = useRef({ loaded: false, pendingTransactions, transactionTimeFeatureActive })
  const { loaded } = prevState.current
  const pendingTransactionAdded = pendingTransactions.length > 0 && prevState.current.pendingTransactions.length === 0
  const transactionTimeFeatureWasActivated = !prevState.current.transactionTimeFeatureActive && transactionTimeFeatureActive
  useEffect(() => {
    if (transactionTimeFeatureActive && pendingTransactions.length > 0 && (loaded === false || transactionTimeFeatureWasActivated || pendingTransactionAdded)) {
      fetchBasicGasAndTimeEstimates()
        .then(({ blockTime }) => fetchGasEstimates(blockTime))
    }
    prevState.current = { loaded: true, pendingTransactions, transactionTimeFeatureActive }
  }, [fetchGasEstimates, fetchBasicGasAndTimeEstimates, transactionTimeFeatureWasActivated, transactionTimeFeatureActive, pendingTransactionAdded, pendingTransactions ])
  return {
    completedTransactions,
    firstPendingTransactionId,
    assetImages,
    pendingTransactions,
    selectedToken,
  }
}


export default function TransactionList ({ isWideViewport = false } = {}) {
  const {
    pendingTransactions,
    completedTransactions,
    firstPendingTransactionId,
    selectedToken,
    assetImages,
  } = useTransactionListState()

  const t = useI18nContext()

  const pendingLength = pendingTransactions.length

  const shouldShowCancel = useCallback((transactionGroup) => {
    const { hasCancelled } = transactionGroup
    return !hasCancelled
  }, [])

  const shouldShowSpeedUp = useCallback((transactionGroup, isEarliestNonce) => {
    const { transactions = [], hasRetried } = transactionGroup
    const [earliestTransaction = {}] = transactions
    const { submittedTime } = earliestTransaction
    return Date.now() - submittedTime > 5000 && isEarliestNonce && !hasRetried
  }, [])

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
                  <TransactionListItem
                    transactionGroup={transactionGroup}
                    key={`${transactionGroup.nonce}:${index}`}
                    showSpeedUp={shouldShowSpeedUp(transactionGroup, index === 0)}
                    showCancel={shouldShowCancel(transactionGroup)}
                    isEarliestNonce={index === 0}
                    token={selectedToken}
                    assetImages={assetImages}
                    firstPendingTransactionId={firstPendingTransactionId}
                  />
                ))
              }
            </div>
          )
        }
        <div className="transaction-list__completed-transactions">
          {
            isWideViewport || pendingLength > 0
              ? (
                <div className="transaction-list__header">
                  { t('history') }
                </div>
              )
              : null
          }
          {
            completedTransactions.length > 0
              ? completedTransactions.map((transactionGroup, index) => (
                <TransactionListItem
                  transactionGroup={transactionGroup}
                  key={`${transactionGroup.nonce}:${index}`}
                  showSpeedUp={false}
                  showCancel={false}
                  isEarliestNonce={false}
                  token={selectedToken}
                  assetImages={assetImages}
                  firstPendingTransactionId={firstPendingTransactionId}
                />
              ))
              : (
                <div className="transaction-list__empty">
                  <div className="transaction-list__empty-text">
                    { t('noTransactions') }
                  </div>
                </div>
              )
          }
        </div>
      </div>
    </div>
  )
}

TransactionList.propTypes = {
  isWideViewport: PropTypes.bool.isRequired,
}
