import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../identicon'
import TransactionStatus from '../transaction-status'
import TransactionAction from '../transaction-action'
import CurrencyDisplay from '../currency-display'
import TokenCurrencyDisplay from '../token-currency-display'
import TransactionListItemDetails from '../transaction-list-item-details'
import { CONFIRM_TRANSACTION_ROUTE } from '../../routes'
import { UNAPPROVED_STATUS, TOKEN_METHOD_TRANSFER } from '../../constants/transactions'
import { ETH } from '../../constants/common'

export default class TransactionListItem extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    transaction: PropTypes.object,
    value: PropTypes.string,
    methodData: PropTypes.object,
    showRetry: PropTypes.bool,
    retryTransaction: PropTypes.func,
    setSelectedToken: PropTypes.func,
    nonceAndDate: PropTypes.string,
    token: PropTypes.object,
    assetImages: PropTypes.object,
    tokenData: PropTypes.object,
  }

  state = {
    showTransactionDetails: false,
  }

  handleClick = () => {
    const { transaction, history } = this.props
    const { id, status } = transaction
    const { showTransactionDetails } = this.state

    if (status === UNAPPROVED_STATUS) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`)
      return
    }

    this.setState({ showTransactionDetails: !showTransactionDetails })
  }

  handleRetry = () => {
    const {
      transaction: { txParams: { to } = {} },
      methodData: { name } = {},
      setSelectedToken,
    } = this.props

    if (name === TOKEN_METHOD_TRANSFER) {
      setSelectedToken(to)
    }

    this.resubmit()
  }

  resubmit () {
    const { transaction: { id }, retryTransaction, history } = this.props
    retryTransaction(id)
      .then(id => history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`))
  }

  renderPrimaryCurrency () {
    const { token, transaction: { txParams: { data } = {} } = {}, value } = this.props

    return token
      ? (
        <TokenCurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--primary"
          token={token}
          transactionData={data}
          prefix="-"
        />
      ) : (
        <CurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--primary"
          value={value}
          prefix="-"
          numberOfDecimals={2}
          currency={ETH}
        />
      )
  }

  renderSecondaryCurrency () {
    const { token, value } = this.props

    return token
      ? null
      : (
        <CurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--secondary"
          prefix="-"
          value={value}
        />
      )
  }

  render () {
    const {
      transaction,
      methodData,
      showRetry,
      nonceAndDate,
      assetImages,
      tokenData,
    } = this.props
    const { txParams = {} } = transaction
    const { showTransactionDetails } = this.state
    const toAddress = tokenData
      ? tokenData.params && tokenData.params[0] && tokenData.params[0].value || txParams.to
      : txParams.to

    return (
      <div className="transaction-list-item">
        <div
          className="transaction-list-item__grid"
          onClick={this.handleClick}
        >
          <Identicon
            className="transaction-list-item__identicon"
            address={toAddress}
            diameter={34}
            image={assetImages[toAddress]}
          />
          <TransactionAction
            transaction={transaction}
            methodData={methodData}
            className="transaction-list-item__action"
          />
          <div
            className="transaction-list-item__nonce"
            title={nonceAndDate}
          >
            { nonceAndDate }
          </div>
          <TransactionStatus
            className="transaction-list-item__status"
            statusKey={transaction.status}
            title={(
              (transaction.err && transaction.err.rpc)
                ? transaction.err.rpc.message
                : transaction.err && transaction.err.message
            )}
          />
          { this.renderPrimaryCurrency() }
          { this.renderSecondaryCurrency() }
        </div>
        {
          showTransactionDetails && (
            <div className="transaction-list-item__details-container">
              <TransactionListItemDetails
                transaction={transaction}
                showRetry={showRetry && methodData.done}
                onRetry={this.handleRetry}
              />
            </div>
          )
        }
      </div>
    )
  }
}
