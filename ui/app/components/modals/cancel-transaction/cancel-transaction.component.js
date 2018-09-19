import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import Modal from '../../modal'
import CancelTransactionGasFee from './cancel-transaction-gas-fee'
import { SUBMITTED_STATUS } from '../../../constants/transactions'
import { decimalToHex } from '../../../helpers/conversions.util'
import { getHexGasTotal } from '../../../helpers/confirm-transaction/util'

export default class CancelTransaction extends PureComponent {
  static contextTypes = {
    t: PropTypes.func,
  }

  static propTypes = {
    createCancelTransaction: PropTypes.func,
    hideModal: PropTypes.func,
    showTransactionConfirmedModal: PropTypes.func,
    transactionStatus: PropTypes.string,
    defaultNewGasPrice: PropTypes.string,
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
    const { defaultNewGasPrice: gasPrice } = this.props
    const newGasFee = getHexGasTotal({ gasPrice, gasLimit: decimalToHex(21000) })

    return (
      <Modal
        headerText={t('attemptToCancel')}
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
