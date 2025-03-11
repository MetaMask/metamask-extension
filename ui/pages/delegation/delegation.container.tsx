import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import {
  AppSliceState,
  getLedgerWebHidConnectedStatus,
} from '../../ducks/app/app';
import {
  AccountsState,
  getHardwareWalletType,
  getInternalAccounts,
  isHardwareWallet,
} from '../../selectors';
import Delegation from './delegation.component';

const mapStateToProps = (state: AccountsState) => {
  return {
    accounts: getInternalAccounts(state),
    isHardwareWallet: isHardwareWallet(state),
    hardwareWalletType: getHardwareWalletType(state),
    ledgerConnectionStatus: getLedgerWebHidConnectedStatus(
      state as unknown as AppSliceState,
    ),
  };
};

const mapDispatchToProps = () => {
  return {};
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(Delegation);
