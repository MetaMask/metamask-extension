import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { delRpcTarget } from '../../../../store/actions';
import ConfirmDeleteNetwork from './confirm-delete-network.component';

const mapDispatchToProps = (dispatch) => {
  return {
    delRpcTarget: (target) => dispatch(delRpcTarget(target)),
  };
};

export default compose(
  withModalProps,
  connect(null, mapDispatchToProps),
)(ConfirmDeleteNetwork);
