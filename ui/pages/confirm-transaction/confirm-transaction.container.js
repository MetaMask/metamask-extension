import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import {
  getContractMethodData,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import ConfirmTransaction from './confirm-transaction.component';

const mapDispatchToProps = (dispatch) => {
  return {
    getContractMethodData: (data) => dispatch(getContractMethodData(data)),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
  };
};

export default compose(
  withRouter,
  connect(null, mapDispatchToProps),
)(ConfirmTransaction);
