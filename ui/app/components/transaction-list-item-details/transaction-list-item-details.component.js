import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import SenderToRecipient from '../sender-to-recipient'
import { CARDS_VARIANT } from '../sender-to-recipient/sender-to-recipient.constants'
import TransactionActivityLog from '../transaction-activity-log'
import TransactionBreakdown from '../transaction-breakdown'
import Button from '../button'
import prefixForNetwork from '../../../lib/etherscan-prefix-for-network'

export default class TransactionListItemDetails extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    transaction: PropTypes.object,
    showRetry: PropTypes.bool,
  }

  handleEtherscanClick = () => {
    const { hash, metamaskNetworkId } = this.props.transaction

    const prefix = prefixForNetwork(metamaskNetworkId)
    const etherscanUrl = `https://${prefix}etherscan.io/tx/${hash}`
    global.platform.openWindow({ url: etherscanUrl })
    this.setState({ showTransactionDetails: true })
  }

  render () {
    const { t } = this.context
    const { transaction, showRetry } = this.props
    const { txParams: { to, from } = {} } = transaction

    return (
      <div className="transaction-list-item-details">
        <div className="transaction-list-item-details__header">
          <div>Details</div>
          <div className="transaction-list-item-details__header-buttons">
            {
              showRetry && (
                <Button
                  type="raised"
                  onClick={this.handleEtherscanClick}
                  className="transaction-list-item-details__header-button"
                >
                  { t('speedUp') }
                </Button>
              )
            }
            <Button
              type="raised"
              onClick={this.handleEtherscanClick}
              className="transaction-list-item-details__header-button"
            >
              <img src="/images/arrow-popout.svg" />
            </Button>
          </div>
        </div>
        <div className="transaction-list-item-details__sender-to-recipient-container">
          <SenderToRecipient
            variant={CARDS_VARIANT}
            addressOnly
            recipientAddress={to}
            senderAddress={from}
          />
        </div>
        <div className="transaction-list-item-details__cards-container">
          <TransactionBreakdown
            transaction={transaction}
            className="transaction-list-item-details__transaction-breakdown"
          />
          <TransactionActivityLog
            transaction={transaction}
            className="transaction-list-item-details__transaction-activity-log"
          />
        </div>
      </div>
    )
  }
}
