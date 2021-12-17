import { connect } from 'react-redux';
import { showModal, setAccountLabel } from '../../../../store/actions';
import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
  isWatchOnlyAddress,
} from '../../../../selectors';
import AccountDetailsModal from './account-details-modal.component';

const mapStateToProps = (state) => {
  return {
    chainId: getCurrentChainId(state),
    selectedIdentity: getSelectedIdentity(state),
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    isWatchOnly: isWatchOnlyAddress(state),
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
    showStopWatchingModal: (address) =>
      dispatch(
        showModal({
          name: 'CONFIRM_STOP_WATCHING',
          address,
        }),
      ),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AccountDetailsModal);
