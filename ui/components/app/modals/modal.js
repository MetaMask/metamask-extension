import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { connect } from 'react-redux';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import isMobileView from '../../../helpers/utils/is-mobile-view';
import * as actions from '../../../store/actions';

import { NetworkManager } from '../../multichain/network-manager';
import {
  CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
  ConfirmTurnOnBackupAndSyncModal,
  TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
  TurnOnBackupAndSyncModal,
} from './identity';
import HideTokenConfirmationModal from './hide-token-confirmation-modal';
import QRScanner from './qr-scanner';

import ConfirmRemoveAccount from './confirm-remove-account';
import ConfirmResetAccount from './confirm-reset-account';
import TransactionConfirmed from './transaction-confirmed';

import ConfirmDeleteNetwork from './confirm-delete-network';
import ConvertTokenToNftModal from './convert-token-to-nft-modal/convert-token-to-nft-modal';
import CustomizeNonceModal from './customize-nonce';
import EditApprovalPermission from './edit-approval-permission';
import FadeModal from './fade-modal';
import NewAccountModal from './new-account-modal';
import RejectTransactions from './reject-transactions';
import TransactionAlreadyConfirmed from './transaction-already-confirmed';

// Metamask Notifications
import TurnOnMetamaskNotifications from './turn-on-metamask-notifications/turn-on-metamask-notifications';

const modalContainerBaseStyle = {
  transform: 'translate3d(-50%, 0, 0px)',
  border: '1px solid var(--color-border-default)',
  borderRadius: '8px',
  backgroundColor: 'var(--color-background-default)',
  boxShadow: 'var(--shadow-size-sm) var(--color-shadow-default)',
};

const modalContainerLaptopStyle = {
  ...modalContainerBaseStyle,
  width: '344px',
  top: '15%',
};

const modalContainerMobileStyle = {
  ...modalContainerBaseStyle,
  width: '309px',
  top: '12.5%',
};

const MODALS = {
  NEW_ACCOUNT: {
    contents: <NewAccountModal />,
    mobileModalStyle: {
      width: '95%',
      top: '10%',
      boxShadow: 'var(--shadow-size-xs) var(--color-shadow-default)',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    laptopModalStyle: {
      width: '375px',
      top: '10%',
      boxShadow: 'var(--shadow-size-xs) var(--color-shadow-default)',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
      borderRadius: '10px',
    },
    contentStyle: {
      borderRadius: '10px',
    },
  },

  HIDE_TOKEN_CONFIRMATION: {
    contents: <HideTokenConfirmationModal />,
    testId: 'hide-token-confirmation-modal',
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width:
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '400px' : '449px',
      top: 'calc(33% + 45px)',
      paddingLeft:
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '16px' : null,
      paddingRight:
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '16px' : null,
    },
  },

  CONFIRM_RESET_ACCOUNT: {
    contents: <ConfirmResetAccount />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONFIRM_REMOVE_ACCOUNT: {
    contents: <ConfirmRemoveAccount />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONVERT_TOKEN_TO_NFT: {
    contents: <ConvertTokenToNftModal />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CONFIRM_DELETE_NETWORK: {
    contents: <ConfirmDeleteNetwork />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  EDIT_APPROVAL_PERMISSION: {
    contents: <EditApprovalPermission />,
    mobileModalStyle: {
      width: '95vw',
      height: '100vh',
      top: '50px',
      transform: 'none',
      left: '0',
      right: '0',
      margin: '0 auto',
    },
    laptopModalStyle: {
      width: 'auto',
      height: '0px',
      top: '80px',
      left: '0px',
      transform: 'none',
      margin: '0 auto',
      position: 'relative',
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  TRANSACTION_CONFIRMED: {
    disableBackdropClick: true,
    contents: <TransactionConfirmed />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  TRANSACTION_ALREADY_CONFIRMED: {
    disableBackdropClick: true,
    contents: <TransactionAlreadyConfirmed />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
  },

  QR_SCANNER: {
    contents: <QRScanner />,
    testId: 'qr-scanner-modal',
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  REJECT_TRANSACTIONS: {
    contents: <RejectTransactions />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  CUSTOMIZE_NONCE: {
    contents: <CustomizeNonceModal />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  [CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME]: {
    contents: <ConfirmTurnOnBackupAndSyncModal />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  [TURN_ON_BACKUP_AND_SYNC_MODAL_NAME]: {
    contents: <TurnOnBackupAndSyncModal />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  TURN_ON_METAMASK_NOTIFICATIONS: {
    contents: <TurnOnMetamaskNotifications />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
    contentStyle: {
      borderRadius: '8px',
    },
  },

  NETWORK_MANAGER: {
    contents: <NetworkManager />,
    mobileModalStyle: {
      ...modalContainerMobileStyle,
    },
    laptopModalStyle: {
      ...modalContainerLaptopStyle,
    },
  },

  DEFAULT: {
    contents: [],
    mobileModalStyle: {},
    laptopModalStyle: {},
  },
};

const BACKDROPSTYLE = {
  backgroundColor: 'var(--color-overlay-default)',
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

/**
 * @deprecated The `<Modal />` and the dispatch method of displaying modals has been deprecated in favor of local state and the `<Modal>` component from the component-library.
 * Please update your code to use the new `<Modal>` component instead, which can be found at ui/components/component-library/modal/modal.tsx.
 * You can find documentation for the new Modal component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-modal--docs}
 * If you would like to help with the replacement of the old Modal component, please submit a pull request
 */
class Modal extends Component {
  static propTypes = {
    active: PropTypes.bool.isRequired,
    hideModal: PropTypes.func.isRequired,
    hideWarning: PropTypes.func.isRequired,
    modalState: PropTypes.object.isRequired,
  };

  hide() {
    this.modalRef.hide();
  }

  show() {
    this.modalRef.show();
  }

  UNSAFE_componentWillReceiveProps(nextProps, _) {
    if (nextProps.active) {
      this.show();
    } else if (this.props.active) {
      this.hide();
    }
  }

  render() {
    const modal = MODALS[this.props.modalState.name || 'DEFAULT'];
    const { contents: children, disableBackdropClick = false, testId } = modal;
    const modalStyle =
      modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle'];
    const contentStyle = modal.contentStyle || {};

    return (
      <FadeModal
        keyboard={false}
        onHide={() => {
          if (modal.onHide) {
            modal.onHide({
              hideWarning: this.props.hideWarning,
            });
          }
          this.props.hideModal(modal.customOnHideOpts);
        }}
        ref={(ref) => {
          this.modalRef = ref;
        }}
        modalStyle={modalStyle}
        contentStyle={contentStyle}
        backdropStyle={BACKDROPSTYLE}
        closeOnClick={!disableBackdropClick}
        testId={testId}
      >
        {children}
      </FadeModal>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
