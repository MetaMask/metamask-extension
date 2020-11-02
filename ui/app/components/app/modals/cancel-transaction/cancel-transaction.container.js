import { connect } from 'react-redux'
import { compose } from 'redux'
import ethUtil from 'ethereumjs-util'
import { multiplyCurrencies } from '../../../../helpers/utils/conversion-util'
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props'
import { showModal, createCancelTransaction } from '../../../../store/actions'
import { getHexGasTotal } from '../../../../helpers/utils/confirm-tx.util'
import CancelTransaction from './cancel-transaction.component'

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state
  const { transactionId, originalGasPrice } = ownProps
  const { currentNetworkTxList } = metamask
  const transaction = currentNetworkTxList.find(
    ({ id }) => id === transactionId,
  )
  const transactionStatus = transaction ? transaction.status : ''

  const defaultNewGasPrice = ethUtil.addHexPrefix(
    multiplyCurrencies(originalGasPrice, 1.1, {
      toNumericBase: 'hex',
      multiplicandBase: 16,
      multiplierBase: 10,
    }),
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

const mapDispatchToProps = (dispatch) => {
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
  // eslint-disable-next-line no-shadow
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
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(CancelTransaction)
