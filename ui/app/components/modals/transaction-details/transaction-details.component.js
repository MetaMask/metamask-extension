import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import TransactionListItemDetails from '../../transaction-list-item-details'
import { hexToDecimal } from '../../../helpers/conversions.util'

export default class TransactionConfirmed extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    hideModal: PropTypes.func,
    transaction: PropTypes.object,
    onRetry: PropTypes.func,
    showRetry: PropTypes.bool,
    onCancel: PropTypes.func,
    showCancel: PropTypes.bool,
  }

  handleSubmit = () => {
    this.props.hideModal()
  }

  handleRetry = () => {
    const { onRetry, hideModal } = this.props

    Promise.resolve(onRetry()).then(() => hideModal())
  }

  render () {
    const { t } = this.context
    const { transaction, showRetry, onCancel, showCancel } = this.props
    const { txParams: { nonce } = {} } = transaction
    const decimalNonce = nonce && hexToDecimal(nonce)

    return (
      <Modal
        onSubmit={this.handleSubmit}
        onClose={this.handleSubmit}
        submitText={t('ok')}
        headerText={t('transactionWithNonce', [`#${decimalNonce}`])}
      >
        <TransactionListItemDetails
          transaction={transaction}
          onRetry={this.handleRetry}
          showRetry={showRetry}
          onCancel={() => onCancel()}
          showCancel={showCancel}
        />
      </Modal>
    )
  }
}
