import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import TransactionListItem from '../transaction-list-item'
import ShapeShiftTransactionListItem from '../shift-list-item'
import { TRANSACTION_TYPE_SHAPESHIFT } from '../../../helpers/constants/transactions'

export default class TransactionList extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static defaultProps = {
    children: null,
    pendingTransactions: [],
    completedTransactions: [],
  }

  static propTypes = {
    children: PropTypes.node,
    pendingTransactions: PropTypes.array,
    completedTransactions: PropTypes.array,
    selectedToken: PropTypes.object,
    updateNetworkNonce: PropTypes.func,
    assetImages: PropTypes.object,
    incomingTransactions: PropTypes.array,
  }

  state = {
    selectedTab: 'history',
  }

  componentDidMount () {
    this.props.updateNetworkNonce()
  }

  componentDidUpdate (prevProps) {
    const { pendingTransactions: prevPendingTransactions = [] } = prevProps
    const { pendingTransactions = [], updateNetworkNonce } = this.props

    if (pendingTransactions.length > prevPendingTransactions.length) {
      updateNetworkNonce()
    }
  }

  shouldShowRetry = (transactionGroup, isEarliestNonce) => {
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
    const { selectedTab } = this.state
    const { pendingTransactions = [], completedTransactions = [], incomingTransactions = [] } = this.props
    const pendingLength = pendingTransactions.length

    const selectedTabIsIncoming = selectedTab === 'incoming'
    const primaryTransactionsToRender = selectedTabIsIncoming ? incomingTransactions : completedTransactions

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
            <div className="transaction-list__header__tabs">
              <div
                onClick={() => this.setState({ selectedTab: 'history' })}
                className={classnames({
                  'transaction-list__header__tab--selected': selectedTab === 'history',
                  'transaction-list__header__tab': selectedTab !== 'history',
                })}>
                { t('history') }
              </div>
              <div className="transaction-list__header__tab">|</div>
              <div
                onClick={() => this.setState({ selectedTab: 'incoming' })}
                className={classnames({
                  'transaction-list__header__tab--selected': selectedTabIsIncoming,
                  'transaction-list__header__tab': selectedTab !== 'incoming',
                })}>
                { t('received') }
              </div>
            </div>
          </div>
          {
            primaryTransactionsToRender.length > 0
              ? primaryTransactionsToRender.map((transactionGroup, index) => (
                this.renderTransaction(transactionGroup, index)
              ))
              : this.renderEmpty()
          }
        </div>
      </div>
    )
  }

  renderTransaction (transactionGroup, index, isPendingTx = false) {
    const { selectedToken, assetImages } = this.props
    const { transactions = [] } = transactionGroup

    return transactions[0] && transactions[0].key === TRANSACTION_TYPE_SHAPESHIFT
      ? (
        <ShapeShiftTransactionListItem
          { ...transactions[0] }
          key={`shapeshift${index}`}
        />
      ) : (
        <TransactionListItem
          transactionGroup={transactionGroup}
          key={`${transactionGroup.nonce}:${index}`}
          showRetry={isPendingTx && this.shouldShowRetry(transactionGroup, index === 0)}
          showCancel={isPendingTx && this.shouldShowCancel(transactionGroup)}
          token={selectedToken}
          assetImages={assetImages}
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
        { this.props.children }
      </div>
    )
  }
}
