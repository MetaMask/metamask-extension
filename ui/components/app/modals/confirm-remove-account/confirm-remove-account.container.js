import { connect } from 'react-redux';
import { compose } from 'redux';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import {
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
} from '../../../../selectors';
import { removeAccount } from '../../../../store/actions';
import ConfirmRemoveAccount from './confirm-remove-account.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    removeAccount: (accountId) => dispatch(removeAccount(accountId)),
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmRemoveAccount);
