import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Media from 'react-media'
import Identicon from '../identicon'
import TransactionStatus from '../transaction-status'
import TransactionAction from '../transaction-action'
import { formatDate } from '../../util'
import prefixForNetwork from '../../../lib/etherscan-prefix-for-network'
import { CONFIRM_TRANSACTION_ROUTE } from '../../routes'
import { UNAPPROVED_STATUS } from '../../constants/transactions'
import { hexToDecimal } from '../../helpers/conversions.util'

export default class TransactionListItem extends PureComponent {
  static propTypes = {
    history: PropTypes.object,
    methodData: PropTypes.object,
    transaction: PropTypes.object,
    ethTransactionAmount: PropTypes.string,
    fiatDisplayValue: PropTypes.string,
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

  render () {
    const {
      transaction,
      ethTransactionAmount,
      fiatDisplayValue,
    } = this.props
    const { txParams = {} } = transaction
    const nonce = hexToDecimal(txParams.nonce)

    return (
      <div
        className="transaction-list-item"
        onClick={this.handleClick}
      >
        <div className="transaction-list-item__identicon-wrapper">
          <Media query="(max-width: 575px)">
            {
              matches => (
                <Identicon
                  address={txParams.to}
                  diameter={matches ? 26 : 34}
                />
              )
            }
          </Media>
        </div>
        <div className="transaction-list-item__action-block">
          <TransactionAction
            transaction={transaction}
            className="transaction-list-item__action"
          />
          <div className="transaction-list-item__nonce">
            { `#${nonce} - ${formatDate(transaction.time)}` }
          </div>
        </div>
        <TransactionStatus status={transaction.status} />
        <div className="transaction-list-item__transaction-amounts">
          <div className="transaction-list-item__primary-transaction-amount">
            { `-${fiatDisplayValue}` }
          </div>
          <div className="transaction-list-item__secondary-transaction-amount">
            { `-${ethTransactionAmount} ETH` }
          </div>
        </div>
      </div>
    )
  }
}
