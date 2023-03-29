import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import { editExistingTransaction } from '../../ducks/send';
import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { AssetType } from '../../../shared/constants/transaction';
import ConfirmSendEther from './confirm-send-ether.component';

const mapDispatchToProps = (dispatch) => {
  return {
    editTransaction: async (txData) => {
      const { id } = txData;
      await dispatch(editExistingTransaction(AssetType.native, id.toString()));
      dispatch(clearConfirmTransaction());
    },
  };
};

export default compose(
  withRouter,
  connect(undefined, mapDispatchToProps),
)(ConfirmSendEther);
