import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import CancelTransactionGasFee from './cancel-transaction-gas-fee'
import { SUBMITTED_STATUS } from '../../../constants/transactions'

export default class CancelTransaction extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    createCancelTransaction: PropTypes.func,
    hideModal: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    transactionStatus: PropTypes.string,
    newGasFee: PropTypes.string,
  }

  componentDidUpdate () {
    const { transactionStatus, showTransactionConfirmedModal } = this.props

    if (transactionStatus !== SUBMITTED_STATUS) {
      showTransactionConfirmedModal()
      return
    }
  }

  handleSubmit = async () => {
    const { createCancelTransaction, hideModal } = this.props

    await createCancelTransaction()
    hideModal()
  }

  handleCancel = () => {
    this.props.hideModal()
  }

  render () {
    const { t } = this.context
    const { newGasFee } = this.props

    return (
      <Modal
        headerText={t('attemptToCancel')}
        onClose={this.handleCancel}
        onSubmit={this.handleSubmit}
        onCancel={this.handleCancel}
        submitText={t('yesLetsTry')}
        cancelText={t('nevermind')}
        submitType="secondary"
      >
        <div>
          <div className="cancel-transaction__title">
            { t('cancellationGasFee') }
          </div>
          <div className="cancel-transaction__cancel-transaction-gas-fee-container">
            <CancelTransactionGasFee value={newGasFee} />
          </div>
          <div className="cancel-transaction__description">
            { t('attemptToCancelDescription') }
          </div>
        </div>
      </Modal>
    )
  }
}
