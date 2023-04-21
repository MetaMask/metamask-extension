import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { connect } from 'react-redux';
import * as actions from '../../../store/actions';

import Popover from '../../ui/popover';

// Modal Components
import AddNetworkModal from '../../../pages/onboarding-flow/add-network-modal';
import AccountDetailsModal from './account-details-modal';
import ExportPrivateKeyModal from './export-private-key-modal';
import HideTokenConfirmationModal from './hide-token-confirmation-modal';
import QRScanner from './qr-scanner';

import HoldToRevealModal from './hold-to-reveal-modal';
import ConfirmRemoveAccount from './confirm-remove-account';
import ConfirmResetAccount from './confirm-reset-account';
import TransactionConfirmed from './transaction-confirmed';

import RejectTransactions from './reject-transactions';
import ConfirmDeleteNetwork from './confirm-delete-network';
import EditApprovalPermission from './edit-approval-permission';
import NewAccountModal from './new-account-modal';
import CustomizeNonceModal from './customize-nonce';
import ConvertTokenToNftModal from './convert-token-to-nft-modal/convert-token-to-nft-modal';

const MODALS = {
  ONBOARDING_ADD_NETWORK: { contents: <AddNetworkModal /> },
  NEW_ACCOUNT: { contents: <NewAccountModal /> },
  ACCOUNT_DETAILS: { contents: <AccountDetailsModal /> },
  EXPORT_PRIVATE_KEY: { contents: <ExportPrivateKeyModal /> },
  HOLD_TO_REVEAL_SRP: { contents: <HoldToRevealModal /> },
  HIDE_TOKEN_CONFIRMATION: { contents: <HideTokenConfirmationModal /> },
  CONFIRM_RESET_ACCOUNT: { contents: <ConfirmResetAccount /> },
  CONFIRM_REMOVE_ACCOUNT: { contents: <ConfirmRemoveAccount /> },
  CONVERT_TOKEN_TO_NFT: { contents: <ConvertTokenToNftModal /> },
  CONFIRM_DELETE_NETWORK: { contents: <ConfirmDeleteNetwork /> },
  EDIT_APPROVAL_PERMISSION: { contents: <EditApprovalPermission /> },
  TRANSACTION_CONFIRMED: { contents: <TransactionConfirmed /> },
  QR_SCANNER: { contents: <QRScanner /> },
  REJECT_TRANSACTIONS: { contents: <RejectTransactions /> },
  CUSTOMIZE_NONCE: { contents: <CustomizeNonceModal /> },
  DEFAULT: { contents: [] },
};

function mapStateToProps(state) {
  return {
    active: state.appState.modal.open,
    modalState: state.appState.modal.modalState,
  };
}

function mapDispatchToProps(dispatch) {
  return {
    hideModal: (customOnHideOpts) => {
      dispatch(actions.hideModal());
      if (customOnHideOpts && customOnHideOpts.action) {
        dispatch(customOnHideOpts.action(...customOnHideOpts.args));
      }
    },
    hideWarning: () => {
      dispatch(actions.hideWarning());
    },
  };
}

class Modal extends Component {
  static propTypes = {
    modalState: PropTypes.object.isRequired,
  };

  render() {
    const modal = MODALS[this.props.modalState.name || 'DEFAULT'];
    const { contents: children } = modal;

    if (this.props.modalState.name === null) {
      return null;
    }

    return <Popover onClose={modal.onHide}>{children}</Popover>;
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
