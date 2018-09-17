import { connect } from 'react-redux'
import { compose } from 'recompose'
import R from 'ramda'
import { multiplyCurrencies } from '../../../conversion-util'
import { bnToHex } from '../../../helpers/conversions.util'
import withModalProps from '../../../higher-order-components/with-modal-props'
import CancelTransaction from './cancel-transaction.component'
import { showModal, hideModal, createCancelTransaction } from '../../../actions'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { transactionId, originalGasPrice } = ownProps
  const { selectedAddressTxList } = metamask
  const transaction = R.find(({ id }) => id === transactionId)(selectedAddressTxList)
  const transactionStatus = transaction ? transaction.status : ''

  const defaultNewGasPrice = bnToHex(multiplyCurrencies(originalGasPrice, 1.1))

  return {
    transactionId,
    transactionStatus,
    originalGasPrice,
    defaultNewGasPrice,
  }
}

const mapDispatchToProps = dispatch => {
  return {
    hideModal: () => dispatch(hideModal()),
    createCancelTransaction: txId => dispatch(createCancelTransaction(txId)),
    showTransactionConfirmedModal: () => dispatch(showModal({ name: 'TRANSACTION_CONFIRMED' })),
  }
}

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionId, ...restStateProps } = stateProps
  const {
    createCancelTransaction: dispatchCreateCancelTransaction,
    ...restDispatchProps
  } = dispatchProps

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    createCancelTransaction: newGasPrice => {
      return dispatchCreateCancelTransaction(transactionId, newGasPrice)
    },
  }
}

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(CancelTransaction)
