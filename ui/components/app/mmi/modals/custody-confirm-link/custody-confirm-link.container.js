import { connect } from 'react-redux';
import { compose } from 'redux';
import { toChecksumHexAddress } from '../../../../../../shared/modules/hexstring-utils';
import {
  getMMIActions,
  showAccountDetail,
  hideModal,
} from '../../../../../store/actions';
import withModalProps from '../../../../../helpers/higher-order-components/with-modal-props';
import CustodyConfirmLink from './custody-confirm-link.component';

function mapDispatchToProps(dispatch) {
  const MMIActions = getMMIActions();
  return {
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(MMIActions.setWaitForConfirmDeepLinkDialog(wait)),
    showAccountDetail: (address) => dispatch(showAccountDetail(address)),
    hideModal: () => dispatch(hideModal()),
  };
}

const mapStateToProps = (state) => {
  const address =
    state.appState.modal.modalState.props.address ||
    state.metamask.selectedAddress;
  const custodyAccountDetails =
    state.metamask.custodyAccountDetails[toChecksumHexAddress(address)];

  const { custodians } = state.metamask.mmiConfiguration;

  const mmiAccounts = state.metamask.accounts;

  return {
    link: state.appState.modal.modalState.props.link,
    closeNotification: state.appState.modal.modalState.props.closeNotification,
    custodianName: custodyAccountDetails.custodianName,
    custodians,
    mmiAccounts,
  };
};

export default compose(
  withModalProps,
  connect(mapStateToProps, mapDispatchToProps, null),
)(CustodyConfirmLink);
