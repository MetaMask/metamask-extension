import { connect } from 'react-redux';
import {
  showModal,
  setAccountLabel,
  tryReverseResolveAddress,
} from '../../../../store/actions';

import {
  getSelectedIdentity,
  getRpcPrefsForCurrentProvider,
  getCurrentChainId,
} from '../../../../selectors';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import AccountDetailsModal from './account-details-modal.component';

const mapStateToProps = (state) => {
  const { metamask } = state;
  const { ensResolutionsByAddress } = metamask;
  const selectedIdentity = getSelectedIdentity(state);
  const { address } = selectedIdentity;
  let ensName;
  if (address) {
    const checksummedAddress = toChecksumHexAddress(address);
    ensName = ensResolutionsByAddress[checksummedAddress] || '';
  }
  return {
    chainId: getCurrentChainId(state),
    selectedIdentity,
    keyrings: state.metamask.keyrings,
    rpcPrefs: getRpcPrefsForCurrentProvider(state),
    ensName,
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showExportPrivateKeyModal: () =>
      dispatch(showModal({ name: 'EXPORT_PRIVATE_KEY' })),
    setAccountLabel: (address, label) =>
      dispatch(setAccountLabel(address, label)),
    tryReverseResolveAddress: (address) =>
      dispatch(tryReverseResolveAddress(address)),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(AccountDetailsModal);
