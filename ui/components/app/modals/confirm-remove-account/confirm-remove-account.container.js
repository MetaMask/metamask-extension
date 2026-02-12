import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { removeAccount } from '../../../../store/actions';
import { getMultichainNetwork } from '../../../../selectors/multichain';
import ConfirmRemoveAccount from './confirm-remove-account.component';

const mapStateToProps = (state, ownProps) => {
  return {
    network: getMultichainNetwork(state, ownProps.account),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeAccount: (address) => dispatch(removeAccount(address)),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmRemoveAccount);
