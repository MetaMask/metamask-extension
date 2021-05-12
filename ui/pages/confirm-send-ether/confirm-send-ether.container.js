import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { editTransaction } from '../../ducks/send';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import ConfirmSendEther from './confirm-send-ether.component';

const mapStateToProps = (state) => {
  const {
    confirmTransaction: { txData: { txParams } = {} },
  } = state;

  return {
    txParams,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: (txData) => {
      const { id, txParams } = txData;
      const {
        from,
        gas: gasLimit,
        gasPrice,
        to: address,
        value: amount,
      } = txParams;
      dispatch(
        editTransaction({
          id: id?.toString(),
          gasLimit,
          gasPrice,
          from,
          amount,
          address,
        }),
      );
      dispatch(clearConfirmTransaction());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmSendEther);
