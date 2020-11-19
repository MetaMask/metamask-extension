import { connect } from 'react-redux'
import { compose } from 'recompose'
import * as ethUtil from 'cfx-util'
import { addCurrencies } from '../../../../helpers/utils/conversion-util'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import CancelTransaction from './cancel-transaction.component'
import { showModal, createCancelTransaction } from '../../../../store/actions'
import { getHexGasTotal } from '../../../../helpers/utils/confirm-tx.util'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { transactionId, originalGasPrice } = ownProps
  const { selectedAddressTxList } = metamask
  const transaction = selectedAddressTxList.find(
    ({ id }) => id === transactionId
  )
  const transactionStatus = transaction ? transaction.status : ''

  const defaultNewGasPrice = ethUtil.addHexPrefix(
    addCurrencies(originalGasPrice, '0x1', {
      aBase: 16,
      bBase: 16,
      toNumericBase: 'hex',
    })
  )

  const newGasFee = getHexGasTotal({
    gasPrice: defaultNewGasPrice,
    gasLimit: '0x5208',
  })

  return {
    transactionId,
    transactionStatus,
    originalGasPrice,
    defaultNewGasPrice,
    newGasFee,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    createCancelTransaction: (txId, customGasPrice) => {
      return dispatch(createCancelTransaction(txId, customGasPrice))
    },
    showTransactionConfirmedModal: () =>
      dispatch(showModal({ name: 'TRANSACTION_CONFIRMED' })),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionId, defaultNewGasPrice, ...restStateProps } = stateProps
  const { createCancelTransaction, ...restDispatchProps } = dispatchProps

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    createCancelTransaction: () =>
      createCancelTransaction(transactionId, defaultNewGasPrice),
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps)
)(CancelTransaction)
