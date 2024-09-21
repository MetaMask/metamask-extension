import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { resetAccount } from '../../../../store/actions';
import ConfirmResetAccount from './confirm-reset-account.component';

const mapDispatchToProps = (dispatch) => {
  return {
    resetAccount: () => dispatch(resetAccount()),
  };
};

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps),
)(ConfirmResetAccount);
