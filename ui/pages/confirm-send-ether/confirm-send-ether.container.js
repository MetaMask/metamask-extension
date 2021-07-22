import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { ASSET_TYPES, editTransaction } from '../../ducks/send';
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
    editTransaction: async (txData) => {
      const { id } = txData;
      await dispatch(editTransaction(ASSET_TYPES.NATIVE, id.toString()));
      dispatch(clearConfirmTransaction());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmSendEther);
