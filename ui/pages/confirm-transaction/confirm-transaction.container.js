import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  setTransactionToConfirm,
  clearConfirmTransaction,
} from '../../ducks/confirm-transaction/confirm-transaction.duck';

import {
  getContractMethodData,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import ConfirmTransaction from './confirm-transaction.component';

const mapDispatchToProps = (dispatch) => {
  return {
    setTransactionToConfirm: (transactionId) => {
      dispatch(setTransactionToConfirm(transactionId));
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    getContractMethodData: (data) => dispatch(getContractMethodData(data)),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
  };
};

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
)(ConfirmTransaction);
