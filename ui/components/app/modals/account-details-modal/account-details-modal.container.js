import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  showModal,
  setAccountLabel,
  hideModal,
} from '../../../../store/actions';
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
  getMetaMaskAccountsOrdered,
  getBlockExplorerLinkText,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getAccountType,
  getCustodyAccountDetails,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../selectors';
import AccountDetailsModal from './account-details-modal.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    selectedIdentity: getSelectedIdentity(state),
    keyrings: state.metamask.keyrings,
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
