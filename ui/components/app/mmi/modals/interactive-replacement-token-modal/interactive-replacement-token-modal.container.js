import { connect } from 'react-redux';
import { toChecksumHexAddress } from '../../../../../shared/modules/hexstring-utils';
import { hideModal } from '../../../../store/actions';
import InteractiveReplacementTokenModal from './interactive-replacement-token-modal.component';

function mapDispatchToProps(dispatch) {
  return {
    hideModal: () => {
      dispatch(hideModal());
    },
  };
}

const mapStateToProps = (state) => {
  const address =
    state.appState.modal.modalState.props.address ||
    state.metamask.selectedAddress;
  const custodyAccountDetails =
    state.metamask.custodyAccountDetails[toChecksumHexAddress(address)];

  const { custodians } = state.metamask.mmiConfiguration;
  const { url } = state.metamask.interactiveReplacementToken || {};
  const custodianName = custodyAccountDetails?.custodianName;
  const custodian =
    custodians.find((item) => item.name === custodianName) || {};

  return {
    custodian,
    url,
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(InteractiveReplacementTokenModal);
