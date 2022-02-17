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
    customGasSettings,
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
    customGasSettings,
    newGasFee,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    createCancelTransaction: (txId, customGasSettings) => {
      return dispatch(createCancelTransaction(txId, customGasSettings));
    },
    showTransactionConfirmedModal: () =>
      dispatch(showModal({ name: 'TRANSACTION_CONFIRMED' })),
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { transactionId, customGasSettings, ...restStateProps } = stateProps;
  // eslint-disable-next-line no-shadow
  const { createCancelTransaction, ...restDispatchProps } = dispatchProps;

  return {
    ...restStateProps,
    ...restDispatchProps,
    ...ownProps,
    createCancelTransaction: () =>
      createCancelTransaction(transactionId, customGasSettings),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(CancelTransaction);
