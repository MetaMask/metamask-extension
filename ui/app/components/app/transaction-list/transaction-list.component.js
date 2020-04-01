import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TransactionListItem from '../transaction-list-item'
import ShapeShiftTransactionListItem from '../shift-list-item'
import { TRANSACTION_TYPE_SHAPESHIFT } from '../../../helpers/constants/transactions'

export default class TransactionList extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    pendingTransactions: [],
    completedTransactions: [],
  }

  static propTypes = {
    pendingTransactions: PropTypes.array,
    completedTransactions: PropTypes.array,
    selectedToken: PropTypes.object,
    updateNetworkNonce: PropTypes.func,
    assetImages: PropTypes.object,
    fetchBasicGasAndTimeEstimates: PropTypes.func,
    fetchGasEstimates: PropTypes.func,
    transactionTimeFeatureActive: PropTypes.bool,
    firstPendingTransactionId: PropTypes.number,
  }

  componentDidMount () {
    const {
      pendingTransactions,
      updateNetworkNonce,
      fetchBasicGasAndTimeEstimates,
      fetchGasEstimates,
      transactionTimeFeatureActive,
    } = this.props

    updateNetworkNonce()

    if (transactionTimeFeatureActive && pendingTransactions.length) {
      fetchBasicGasAndTimeEstimates()
        .then(({ blockTime }) => fetchGasEstimates(blockTime))
    }
  }

  componentDidUpdate (prevProps) {
    const { pendingTransactions: prevPendingTransactions = [] } = prevProps
    const {
      pendingTransactions = [],
      updateNetworkNonce,
      fetchBasicGasAndTimeEstimates,
      fetchGasEstimates,
      transactionTimeFeatureActive,
    } = this.props

    if (pendingTransactions.length > prevPendingTransactions.length) {
      updateNetworkNonce()
    }

    const transactionTimeFeatureWasActivated = !prevProps.transactionTimeFeatureActive && transactionTimeFeatureActive
    const pendingTransactionAdded = pendingTransactions.length > 0 && prevPendingTransactions.length === 0

    if (transactionTimeFeatureActive && pendingTransactions.length > 0 && (transactionTimeFeatureWasActivated || pendingTransactionAdded)) {
      fetchBasicGasAndTimeEstimates()
        .then(({ blockTime }) => fetchGasEstimates(blockTime))
    }
  }

  shouldShowSpeedUp = (transactionGroup, isEarliestNonce) => {
    const { transactions = [], hasRetried } = transactionGroup
    const [earliestTransaction = {}] = transactions
    const { submittedTime } = earliestTransaction
    return Date.now() - submittedTime > 5000 && isEarliestNonce && !hasRetried
  }

  shouldShowCancel (transactionGroup) {
    const { hasCancelled } = transactionGroup
    return !hasCancelled
  }

  renderTransactions () {
    const { t } = this.context
    const { pendingTransactions = [], completedTransactions = [] } = this.props
    const pendingLength = pendingTransactions.length

    return (
      <div className="transaction-list__transactions">
        {
          pendingLength > 0 && (
            <div className="transaction-list__pending-transactions">
              <div className="transaction-list__header">
                { `${t('queue')} (${pendingTransactions.length})` }
              </div>
              {
                pendingTransactions.map((transactionGroup, index) => (
                  this.renderTransaction(transactionGroup, index, true)
                ))
              }
            </div>
          )
        }
        <div className="transaction-list__completed-transactions">
          <div className="transaction-list__header">
            { t('history') }
          </div>
          {
            completedTransactions.length > 0
              ? completedTransactions.map((transactionGroup, index) => (
                this.renderTransaction(transactionGroup, index)
              ))
              : this.renderEmpty()
          }
        </div>
      </div>
    )
  }

  renderTransaction (transactionGroup, index, isPendingTx = false) {
    const { selectedToken, assetImages, firstPendingTransactionId } = this.props
    const { transactions = [] } = transactionGroup

    return transactions[0].key === TRANSACTION_TYPE_SHAPESHIFT
      ? (
        <ShapeShiftTransactionListItem
          { ...transactions[0] }
          key={`shapeshift${index}`}
        />
      ) : (
        <TransactionListItem
          transactionGroup={transactionGroup}
          key={`${transactionGroup.nonce}:${index}`}
          showSpeedUp={isPendingTx && this.shouldShowSpeedUp(transactionGroup, index === 0)}
          showCancel={isPendingTx && this.shouldShowCancel(transactionGroup)}
          isEarliestNonce={isPendingTx && index === 0}
          token={selectedToken}
          assetImages={assetImages}
          firstPendingTransactionId={firstPendingTransactionId}
        />
      )
  }

  renderEmpty () {
    return (
      <div className="transaction-list__empty">
        <div className="transaction-list__empty-text">
          { this.context.t('noTransactions') }
        </div>
      </div>
    )
  }

  render () {
    return (
      <div className="transaction-list">
        { this.renderTransactions() }
      </div>
    )
  }
}
