import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import classnames from 'classnames'
import Identicon from '../../ui/identicon'
import TransactionStatus from '../transaction-status'
import TransactionAction from '../transaction-action'
import UserPreferencedCurrencyDisplay from '../user-preferenced-currency-display'
import TokenCurrencyDisplay from '../../ui/token-currency-display'
import TransactionListItemDetails from '../transaction-list-item-details'
import { CONFIRM_TRANSACTION_ROUTE } from '../../../helpers/constants/routes'
import { UNAPPROVED_STATUS, TOKEN_METHOD_TRANSFER } from '../../../helpers/constants/transactions'
import { PRIMARY, SECONDARY } from '../../../helpers/constants/common'
import { getStatusKey } from '../../../helpers/utils/transactions.util'

export default class TransactionListItem extends PureComponent {
  static propTypes = {
    assetImages: PropTypes.object,
    history: PropTypes.object,
    methodData: PropTypes.object,
    nonceAndDate: PropTypes.string,
    primaryTransaction: PropTypes.object,
    retryTransaction: PropTypes.func,
    setSelectedToken: PropTypes.func,
    showCancelModal: PropTypes.func,
    showCancel: PropTypes.bool,
    hasEnoughCancelGas: PropTypes.bool,
    showRetry: PropTypes.bool,
    showFiat: PropTypes.bool,
    token: PropTypes.object,
    tokenData: PropTypes.object,
    transaction: PropTypes.object,
    transactionGroup: PropTypes.object,
    value: PropTypes.string,
    fetchBasicGasAndTimeEstimates: PropTypes.func,
    fetchGasEstimates: PropTypes.func,
    rpcPrefs: PropTypes.object,
  }

  static defaultProps = {
    showFiat: true,
  }

  static contextTypes = {
    metricsEvent: PropTypes.func,
  }

  state = {
    showTransactionDetails: false,
  }

  handleClick = () => {
    const {
      transaction,
      history,
    } = this.props
    const { id, status } = transaction
    const { showTransactionDetails } = this.state

    if (status === UNAPPROVED_STATUS) {
      history.push(`${CONFIRM_TRANSACTION_ROUTE}/${id}`)
      return
    }

    if (!showTransactionDetails) {
      this.context.metricsEvent({
        eventOpts: {
          category: 'Navigation',
          action: 'Home',
          name: 'Expand Transaction',
        },
      })
    }

    this.setState({ showTransactionDetails: !showTransactionDetails })
  }

  handleCancel = id => {
    const {
      primaryTransaction: { txParams: { gasPrice } } = {},
      transaction: { id: initialTransactionId },
      showCancelModal,
    } = this.props

    const cancelId = id || initialTransactionId
    showCancelModal(cancelId, gasPrice)
  }

  /**
   * @name handleRetry
   * @description Resubmits a transaction. Retrying a transaction within a list of transactions with
   * the same nonce requires keeping the original value while increasing the gas price of the latest
   * transaction.
   * @param {number} id - Transaction id
   */
  handleRetry = id => {
    const {
      primaryTransaction: { txParams: { gasPrice } } = {},
      transaction: { txParams: { to } = {}, id: initialTransactionId },
      methodData: { name } = {},
      setSelectedToken,
      retryTransaction,
      fetchBasicGasAndTimeEstimates,
      fetchGasEstimates,
    } = this.props

    if (name === TOKEN_METHOD_TRANSFER) {
      setSelectedToken(to)
    }

    const retryId = id || initialTransactionId

    return fetchBasicGasAndTimeEstimates()
      .then(basicEstimates => fetchGasEstimates(basicEstimates.blockTime))
      .then(retryTransaction(retryId, gasPrice))
  }

  renderPrimaryCurrency () {
    const { token, primaryTransaction: { txParams: { data } = {} } = {}, value } = this.props

    return token
      ? (
        <TokenCurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--primary"
          token={token}
          transactionData={data}
          prefix="-"
        />
      ) : (
        <UserPreferencedCurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--primary"
          value={value}
          type={PRIMARY}
          prefix="-"
        />
      )
  }

  renderSecondaryCurrency () {
    const { token, value, showFiat } = this.props

    return token || !showFiat
      ? null
      : (
        <UserPreferencedCurrencyDisplay
          className="transaction-list-item__amount transaction-list-item__amount--secondary"
          value={value}
          prefix="-"
          type={SECONDARY}
        />
      )
  }

  render () {
    const {
      assetImages,
      transaction,
      methodData,
      nonceAndDate,
      primaryTransaction,
      showCancel,
      hasEnoughCancelGas,
      showRetry,
      tokenData,
      transactionGroup,
      rpcPrefs,
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
            statusKey={getStatusKey(primaryTransaction)}
            title={(
              (primaryTransaction.err && primaryTransaction.err.rpc)
                ? primaryTransaction.err.rpc.message
                : primaryTransaction.err && primaryTransaction.err.message
            )}
          />
          { this.renderPrimaryCurrency() }
          { this.renderSecondaryCurrency() }
        </div>
        <div className={classnames('transaction-list-item__expander', {
          'transaction-list-item__expander--show': showTransactionDetails,
        })}>
          {
            showTransactionDetails && (
              <div className="transaction-list-item__details-container">
                <TransactionListItemDetails
                  transactionGroup={transactionGroup}
                  onRetry={this.handleRetry}
                  showRetry={showRetry && methodData.done}
                  onCancel={this.handleCancel}
                  showCancel={showCancel}
                  cancelDisabled={!hasEnoughCancelGas}
                  rpcPrefs={rpcPrefs}
                />
              </div>
            )
          }
        </div>
      </div>
    )
  }
}
