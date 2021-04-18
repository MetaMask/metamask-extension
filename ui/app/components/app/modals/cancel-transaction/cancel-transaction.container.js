import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { showModal, createCancelTransaction } from '../../../../store/actions';
import CancelTransaction from './cancel-transaction.component';

const mapStateToProps = (state, ownProps) => {
  const { metamask } = state;
  const {
    transactionId,
    originalGasPrice,
    newGasFee,
    defaultNewGasPrice,
    gasLimit,
  } = ownProps;
  const { currentNetworkTxList } = metamask;
  const transaction = currentNetworkTxList.find(
    ({ id }) => id === transactionId,
  );
  const transactionStatus = transaction ? transaction.status : '';

  return {
    transactionId,
    transactionStatus,
    originalGasPrice,
    defaultNewGasPrice,
    newGasFee,
    gasLimit,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createCancelTransaction: (txId, customGasPrice, customGasLimit) => {
      return dispatch(
        createCancelTransaction(txId, customGasPrice, customGasLimit),
      );
    },
    showTransactionConfirmedModal: () =>
      dispatch(showModal({ name: 'TRANSACTION_CONFIRMED' })),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const {
    transactionId,
    defaultNewGasPrice,
    gasLimit,
    ...restStateProps
  } = stateProps;
  // eslint-disable-next-line no-shadow
  const { createCancelTransaction, ...restDispatchProps } = dispatchProps;

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    createCancelTransaction: () =>
      createCancelTransaction(transactionId, defaultNewGasPrice, gasLimit),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(CancelTransaction);
