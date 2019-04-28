import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import copyToClipboard from 'copy-to-clipboard'
import {
  getBlockExplorerUrlForTx,
} from '../../../helpers/utils/transactions.util'
import SenderToRecipient from '../../ui/sender-to-recipient'
import { FLAT_VARIANT } from '../../ui/sender-to-recipient/sender-to-recipient.constants'
import TransactionActivityLog from '../transaction-activity-log'
import TransactionBreakdown from '../transaction-breakdown'
import Button from '../../ui/button'
import Tooltip from '../../ui/tooltip'

export default class TransactionListItemDetails extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static propTypes = {
    onCancel: PropTypes.func,
    onRetry: PropTypes.func,
    showCancel: PropTypes.bool,
    showRetry: PropTypes.bool,
    cancelDisabled: PropTypes.bool,
    transactionGroup: PropTypes.object,
    rpcPrefs: PropTypes.object,
  }

  state = {
    justCopied: false,
    cancelDisabled: false,
  }

  handleEtherscanClick = () => {
    const { transactionGroup: { primaryTransaction }, rpcPrefs } = this.props
    const { hash, metamaskNetworkId } = primaryTransaction

    this.context.metricsEvent({
      eventOpts: {
        category: 'Navigation',
        action: 'Activity Log',
        name: 'Clicked "View on Etherscan"',
      },
    })

    global.platform.openWindow({ url: getBlockExplorerUrlForTx(metamaskNetworkId, hash, rpcPrefs) })
  }

  handleCancel = event => {
    const { transactionGroup: { initialTransaction: { id } = {} } = {}, onCancel } = this.props

    event.stopPropagation()
    onCancel(id)
  }

  handleRetry = event => {
    const { transactionGroup: { initialTransaction: { id } = {} } = {}, onRetry } = this.props

    event.stopPropagation()
    onRetry(id)
  }

  handleCopyTxId = () => {
    const { transactionGroup} = this.props
    const { primaryTransaction: transaction } = transactionGroup
    const { hash } = transaction

    this.context.metricsEvent({
      eventOpts: {
        category: 'Navigation',
        action: 'Activity Log',
        name: 'Copied Transaction ID',
      },
    })

    this.setState({ justCopied: true }, () => {
      copyToClipboard(hash)
      setTimeout(() => this.setState({ justCopied: false }), 1000)
    })
  }

  renderCancel () {
    const { t } = this.context
    const {
      showCancel,
      cancelDisabled,
    } = this.props

    if (!showCancel) {
      return null
    }

    return cancelDisabled
      ? (
        <Tooltip title={t('notEnoughGas')}>
          <div>
            <Button
              type="raised"
              onClick={this.handleCancel}
              className="transaction-list-item-details__header-button"
              disabled
            >
              { t('cancel') }
            </Button>
          </div>
        </Tooltip>
      )
      : (
        <Button
          type="raised"
          onClick={this.handleCancel}
          className="transaction-list-item-details__header-button"
        >
          { t('cancel') }
        </Button>
      )
  }

  render () {
    const { t } = this.context
    const { justCopied } = this.state
    const {
      transactionGroup,
      showRetry,
      onCancel,
      onRetry,
      rpcPrefs: { blockExplorerUrl } = {},
    } = this.props
    const { primaryTransaction: transaction } = transactionGroup
    const { txParams: { to, from } = {} } = transaction

    return (
      <div className="transaction-list-item-details">
        <div className="transaction-list-item-details__header">
          <div>{ t('details') }</div>
          <div className="transaction-list-item-details__header-buttons">
            {
              showRetry && (
                <Button
                  type="raised"
                  onClick={this.handleRetry}
                  className="transaction-list-item-details__header-button"
                >
                  { t('speedUp') }
                </Button>
              )
            }
            { this.renderCancel() }
            <Tooltip title={justCopied ? t('copiedTransactionId') : t('copyTransactionId')}>
              <Button
                type="raised"
                onClick={this.handleCopyTxId}
                className="transaction-list-item-details__header-button"
              >
                <img
                  className="transaction-list-item-details__header-button__copy-icon"
                  src="/images/copy-to-clipboard.svg"
                />
              </Button>
            </Tooltip>
            <Tooltip title={blockExplorerUrl ? t('viewOnCustomBlockExplorer', [blockExplorerUrl]) : t('viewOnEtherscan')}>
              <Button
                type="raised"
                onClick={this.handleEtherscanClick}
                className="transaction-list-item-details__header-button"
                >
                <img src="/images/arrow-popout.svg" />
              </Button>
            </Tooltip>
          </div>
        </div>
        <div className="transaction-list-item-details__body">
          <div className="transaction-list-item-details__sender-to-recipient-container">
            <SenderToRecipient
              variant={FLAT_VARIANT}
              addressOnly
              recipientAddress={to}
              senderAddress={from}
              onRecipientClick={() => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Navigation',
                    action: 'Activity Log',
                    name: 'Copied "To" Address',
                  },
                })
              }}
              onSenderClick={() => {
                this.context.metricsEvent({
                  eventOpts: {
                    category: 'Navigation',
                    action: 'Activity Log',
                    name: 'Copied "From" Address',
                  },
                })
              }}
            />
          </div>
          <div className="transaction-list-item-details__cards-container">
            <TransactionBreakdown
              transaction={transaction}
              className="transaction-list-item-details__transaction-breakdown"
            />
            <TransactionActivityLog
              transactionGroup={transactionGroup}
              className="transaction-list-item-details__transaction-activity-log"
              onCancel={onCancel}
              onRetry={onRetry}
            />
          </div>
        </div>
      </div>
    )
  }
}
