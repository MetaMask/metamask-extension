import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Identicon from '../identicon'
import TransactionStatus from '../transaction-status'
import TransactionAction from '../transaction-action'
import CurrencyDisplay from '../currency-display'
import TokenCurrencyDisplay from '../token-currency-display'
import prefixForNetwork from '../../../lib/etherscan-prefix-for-network'
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
  }

  handleClick = () => {
    const { transaction, history } = this.props
    const { id, status, hash, metamaskNetworkId } = transaction

    if (status === UNAPPROVED_STATUS) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`)
    } else if (hash) {
      const prefix = prefixForNetwork(metamaskNetworkId)
      const etherscanUrl = `https://${prefix}etherscan.io/tx/${hash}`
      global.platform.openWindow({ url: etherscanUrl })
    }
  }

  handleRetryClick = event => {
    event.stopPropagation()

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
          numberOfDecimals={2}
          currency={ETH}
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
    } = this.props
    const { txParams = {} } = transaction

    return (
      <div
        className="transaction-list-item"
        onClick={this.handleClick}
      >
        <div className="transaction-list-item__grid">
          <Identicon
            className="transaction-list-item__identicon"
            address={txParams.to}
            diameter={34}
            image={assetImages[txParams.to]}
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
                : null
            )}
          />
          { this.renderPrimaryCurrency() }
          { this.renderSecondaryCurrency() }
        </div>
        {
          showRetry && methodData.done && (
            <div
              className="transaction-list-item__retry"
              onClick={this.handleRetryClick}
            >
              <span>Taking too long? Increase the gas price on your transaction</span>
            </div>
          )
        }
      </div>
    )
  }
}
