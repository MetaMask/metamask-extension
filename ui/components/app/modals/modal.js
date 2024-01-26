import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { connect } from 'react-redux';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../../shared/constants/app';
import isMobileView from '../../../helpers/utils/is-mobile-view';
import * as actions from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
///: END:ONLY_INCLUDE_IF

// Modal Components
import AddNetworkModal from '../../../pages/onboarding-flow/add-network-modal';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import ConfirmRemoveJWT from '../../institutional/confirm-remove-jwt-modal';
import CustodyConfirmLink from '../../institutional/custody-confirm-link-modal';
import InteractiveReplacementTokenModal from '../../institutional/interactive-replacement-token-modal';
import TransactionFailed from '../../institutional/transaction-failed-modal';
///: END:ONLY_INCLUDE_IF
import HideTokenConfirmationModal from './hide-token-confirmation-modal';
import QRScanner from './qr-scanner';

import ConfirmRemoveAccount from './confirm-remove-account';
import ConfirmResetAccount from './confirm-reset-account';
import TransactionConfirmed from './transaction-confirmed';

import ConfirmDeleteNetwork from './confirm-delete-network';
import ConvertTokenToNftModal from './convert-token-to-nft-modal/convert-token-to-nft-modal';
import CustomizeNonceModal from './customize-nonce';
import EditApprovalPermission from './edit-approval-permission';
import EthSignModal from './eth-sign-modal/eth-sign-modal';
import FadeModal from './fade-modal';
import NewAccountModal from './new-account-modal';
import RejectTransactions from './reject-transactions';

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

const accountModalStyle = {
  mobileModalStyle: {
    width: '95%',
    // top: isPopupOrNotification() === 'popup' ? '52vh' : '36.5vh',
    boxShadow: 'var(--shadow-size-xs) var(--color-shadow-default)',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  laptopModalStyle: {
    width: '335px',
    // top: 'calc(33% + 45px)',
    boxShadow: 'var(--shadow-size-xs) var(--color-shadow-default)',
    borderRadius: '4px',
    top: '10%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  contentStyle: {
    borderRadius: '4px',
  },
};

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
const custodyConfirmModalStyle = {
  mobileModalStyle: {
    width: '95%',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '30%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  laptopModalStyle: {
    width: '360px',
    boxShadow: 'rgba(0, 0, 0, 0.15) 0px 2px 2px 2px',
    borderRadius: '4px',
    top: '30%',
    transform: 'none',
    left: '0',
    right: '0',
    margin: '0 auto',
  },
  contentStyle: {
    borderRadius: '4px',
  },
};
///: END:ONLY_INCLUDE_IF

const MODALS = {
  ONBOARDING_ADD_NETWORK: {
    contents: <AddNetworkModal />,
    ...accountModalStyle,
  },
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
    mobileModalStyle: {
      width: '95%',
      top: getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '52vh' : '36.5vh',
    },
    laptopModalStyle: {
      width:
        getEnvironmentType() === ENVIRONMENT_TYPE_POPUP ? '357px' : '449px',
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

  ETH_SIGN: {
    contents: <EthSignModal />,
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

  QR_SCANNER: {
    contents: <QRScanner />,
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

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  CONFIRM_REMOVE_JWT: {
    contents: <ConfirmRemoveJWT />,
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

  TRANSACTION_FAILED: {
    disableBackdropClick: true,
    contents: <TransactionFailed />,
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

  CUSTODY_CONFIRM_LINK: {
    contents: <CustodyConfirmLink />,
    ...custodyConfirmModalStyle,
  },

  INTERACTIVE_REPLACEMENT_TOKEN_MODAL: {
    contents: <InteractiveReplacementTokenModal />,
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
  ///: END:ONLY_INCLUDE_IF

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
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    ///: END:ONLY_INCLUDE_IF
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
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    setWaitForConfirmDeepLinkDialog: PropTypes.func,
    ///: END:ONLY_INCLUDE_IF
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
    const { contents: children, disableBackdropClick = false } = modal;
    const modalStyle =
      modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle'];
    const contentStyle = modal.contentStyle || {};

    return (
      <FadeModal
        keyboard={false}
        onHide={() => {
          if (modal.onHide) {
            ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
            if (this.props.modalState.name === 'CUSTODY_CONFIRM_LINK') {
              this.props.setWaitForConfirmDeepLinkDialog(false);
            }
            ///: END:ONLY_INCLUDE_IF
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
      >
        {children}
      </FadeModal>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
