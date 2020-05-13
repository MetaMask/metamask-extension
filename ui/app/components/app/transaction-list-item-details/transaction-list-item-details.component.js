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
import Copy from '../../ui/icon/copy-icon.component'
import Popover from '../../ui/popover'

export default class TransactionListItemDetails extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
    metricsEvent: PropTypes.func,
  }

  static defaultProps = {
    recipientEns: null,
  }

  static propTypes = {
    onCancel: PropTypes.func,
    onRetry: PropTypes.func,
    showCancel: PropTypes.bool,
    showSpeedUp: PropTypes.bool,
    showRetry: PropTypes.bool,
    isEarliestNonce: PropTypes.bool,
    cancelDisabled: PropTypes.bool,
    transactionGroup: PropTypes.object,
    title: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    recipientEns: PropTypes.string,
    recipientAddress: PropTypes.string.isRequired,
    rpcPrefs: PropTypes.object,
    senderAddress: PropTypes.string.isRequired,
    tryReverseResolveAddress: PropTypes.func.isRequired,
    senderNickname: PropTypes.string.isRequired,
    recipientNickname: PropTypes.string.isRequired,
  }

  state = {
    justCopied: false,
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

    global.platform.openTab({ url: getBlockExplorerUrlForTx(metamaskNetworkId, hash, rpcPrefs) })
  }

  handleCancel = (event) => {
    const { transactionGroup: { initialTransaction: { id } = {} } = {}, onCancel } = this.props

    event.stopPropagation()
    onCancel(id)
  }

  handleRetry = (event) => {
    const { transactionGroup: { initialTransaction: { id } = {} } = {}, onRetry } = this.props

    event.stopPropagation()
    onRetry(id)
  }

  handleCopyTxId = () => {
    const { transactionGroup } = this.props
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

  async componentDidMount () {
    const { recipientAddress, tryReverseResolveAddress } = this.props

    tryReverseResolveAddress(recipientAddress)
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
      showSpeedUp,
      showRetry,
      onCancel,
      onRetry,
      recipientEns,
      recipientAddress,
      rpcPrefs: { blockExplorerUrl } = {},
      senderAddress,
      isEarliestNonce,
      senderNickname,
      title,
      onClose,
      recipientNickname,
    } = this.props
    const { primaryTransaction: transaction } = transactionGroup
    const { hash } = transaction

    return (
      <Popover title={title} onClose={onClose}>
        <div className="transaction-list-item-details">
          <div className="transaction-list-item-details__header">
            <div>{ t('details') }</div>
            <div className="transaction-list-item-details__header-buttons">
              {
                showSpeedUp && (
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
                  disabled={!hash}
                >
                  <Copy size={10} color="#3098DC" />
                </Button>
              </Tooltip>
              <Tooltip title={blockExplorerUrl ? t('viewOnCustomBlockExplorer', [blockExplorerUrl]) : t('viewOnEtherscan')}>
                <Button
                  type="raised"
                  onClick={this.handleEtherscanClick}
                  className="transaction-list-item-details__header-button"
                  disabled={!hash}
                >
                  <img src="/images/arrow-popout.svg" />
                </Button>
              </Tooltip>
              {
                showRetry && (
                  <Tooltip title={blockExplorerUrl ? t('viewOnCustomBlockExplorer', [blockExplorerUrl]) : t('retryTransaction')}>
                    <Button
                      type="raised"
                      onClick={this.handleRetry}
                      className="transaction-list-item-details__header-button"
                    >
                      <i className="fa fa-sync"></i>
                    </Button>
                  </Tooltip>
                )
              }
            </div>
          </div>
          <div className="transaction-list-item-details__body">
            <div className="transaction-list-item-details__sender-to-recipient-container">
              <SenderToRecipient
                variant={FLAT_VARIANT}
                addressOnly
                recipientEns={recipientEns}
                recipientAddress={recipientAddress}
                recipientNickname={recipientNickname}
                senderName={senderNickname}
                senderAddress={senderAddress}
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
                isEarliestNonce={isEarliestNonce}
              />
            </div>
          </div>
        </div>
      </Popover>
    )
  }
}
