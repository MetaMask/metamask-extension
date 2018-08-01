import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import TransactionListItem from '../transaction-list-item'

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
  }

  renderTransactions () {
    const { t } = this.context
    const { pendingTransactions, completedTransactions } = this.props

    return (
      <div className="transaction-list__transactions">
        {
          pendingTransactions.length > 0 && (
            <div className="transaction-list__pending-transactions">
              <div className="transaction-list__header">
                { `${t('queue')} (${pendingTransactions.length})` }
              </div>
              {
                pendingTransactions.map(transaction => {
                  return (
                    <TransactionListItem
                      transaction={transaction}
                      key={transaction.id}
                    />
                  )
                })
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
              ? (
                completedTransactions.map(transaction => {
                  return (
                    <TransactionListItem
                      transaction={transaction}
                      key={transaction.id}
                    />
                  )
                })
              )
              : this.renderEmpty()
          }
        </div>
      </div>
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
        {
          this.renderTransactions()
          // pendingTransactions.length + completedTransactions.length > 0
          //   ? this.renderTransactions()
          //   : this.renderEmpty()
        }
      </div>
    )
  }
}
