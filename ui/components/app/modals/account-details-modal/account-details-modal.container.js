import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  showModal,
  setAccountLabel,
  hideModal,
} from '../../../../store/actions';
import {
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
  getMetaMaskAccountsOrdered,
  getBlockExplorerLinkText,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getAccountType,
  getSelectedInternalAccount,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../selectors';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
import { getCustodyAccountDetails } from '../../../../selectors/institutional/selectors';
///: END:ONLY_INCLUDE_IN
import AccountDetailsModal from './account-details-modal.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    selectedAccount: getSelectedInternalAccount(state),
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    accounts: getMetaMaskAccountsOrdered(state),
    blockExplorerLinkText: getBlockExplorerLinkText(state, true),
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType: getAccountType(state),
    custodyAccountDetails: getCustodyAccountDetails(state),
    ///: END:ONLY_INCLUDE_IN
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
    hideModal: () => {
      dispatch(hideModal());
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps),
)(AccountDetailsModal);
