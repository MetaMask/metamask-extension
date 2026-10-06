import React, { Suspense, useEffect, useRef } from 'react';
import { AnyAction, Dispatch } from 'redux';

import { connect } from 'react-redux';
import isMobileView from '../../../helpers/utils/is-mobile-view';
import * as actions from '../../../store/actions';

import { HARDWARE_WALLET_ERROR_MODAL_NAME } from '../../../contexts/hardware-wallets/constants';
import { mmLazy } from '../../../helpers/utils/mm-lazy';
import Spinner from '../../ui/spinner/spinner.component';
import {
  CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
  ConfirmTurnOnBackupAndSyncModal,
} from './identity/confirm-turn-on-backup-and-sync-modal/confirm-turn-on-backup-and-sync-modal';
import {
  TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
  TurnOnBackupAndSyncModal,
} from './identity/turn-on-backup-and-sync-modal/turn-on-backup-and-sync-modal';
import { HardwareWalletErrorModal } from './hardware-wallet-error-modal/hardware-wallet-error-modal';

import ConfirmDeleteNetwork from './confirm-delete-network/confirm-delete-network.container';
import ConvertTokenToNftModal from './convert-token-to-nft-modal/convert-token-to-nft-modal';
import CustomizeNonceModal from './customize-nonce/customize-nonce.component';
import FadeModal, { type FadeModalRef } from './fade-modal';
import RampsInfoModal from './ramps/ramps-info-modal';

const QRScanner = mmLazy(() => import('./qr-scanner/qr-scanner.container'));

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

type CustomOnHideOpts = {
  action?: (...args: unknown[]) => unknown;
  args?: unknown[];
};

type ModalConfig = {
  contents: React.ReactNode;
  mobileModalStyle: React.CSSProperties;
  laptopModalStyle: React.CSSProperties;
  contentStyle?: React.CSSProperties;
  testId?: string;
  disableBackdropClick?: boolean;
  onHide?: () => void;
  customOnHideOpts?: CustomOnHideOpts;
};

const MODALS: Record<string, ModalConfig> = {
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

  RAMPS_UNSUPPORTED: {
    contents: (
      <RampsInfoModal
        testId="ramps-unsupported-modal"
        titleKey="rampsUnsupportedTitle"
        bodyKey="rampsUnsupportedDescription"
      />
    ),
    testId: 'ramps-unsupported-modal',
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

  RAMPS_ELIGIBILITY_FAILED: {
    contents: (
      <RampsInfoModal
        testId="ramp-eligibility-failed-modal"
        titleKey="rampsEligibilityFailedTitle"
        bodyKey="rampsEligibilityFailedDescription"
      />
    ),
    testId: 'ramp-eligibility-failed-modal',
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

  RAMPS_SERVICE_DISRUPTION: {
    contents: (
      <RampsInfoModal
        testId="ramps-service-disruption-modal"
        titleKey="rampsServiceDisruptionTitle"
        bodyKey="rampsServiceDisruptionDescription"
      />
    ),
    testId: 'ramps-service-disruption-modal',
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

  QR_SCANNER: {
    contents: (
      <Suspense fallback={<Spinner />}>
        <QRScanner />
      </Suspense>
    ),
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

  [HARDWARE_WALLET_ERROR_MODAL_NAME]: {
    contents: <HardwareWalletErrorModal />,
    testId: 'hardware-wallet-error-modal',
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

  DEFAULT: {
    contents: [],
    mobileModalStyle: {},
    laptopModalStyle: {},
  },
};

const BACKDROPSTYLE = {
  backgroundColor: 'var(--color-overlay-default)',
};

function mapStateToProps(state: {
  appState: { modal: { open: boolean; modalState: { name?: string } } };
}) {
  return {
    active: state.appState.modal.open,
    modalState: state.appState.modal.modalState,
  };
}

function mapDispatchToProps(dispatch: Dispatch) {
  return {
    hideModal: (customOnHideOpts?: {
      action?: (...args: unknown[]) => unknown;
      args?: unknown[];
    }) => {
      dispatch(actions.hideModal());
      if (customOnHideOpts && customOnHideOpts.action) {
        dispatch(
          customOnHideOpts.action(
            ...(customOnHideOpts.args ?? []),
          ) as AnyAction,
        );
      }
    },
  };
}

type ModalProps = {
  active: boolean;
  hideModal: (opts?: CustomOnHideOpts) => void;
  modalState: { name?: string };
};

/**
 * @param options0
 * @param options0.active
 * @param options0.hideModal
 * @param options0.modalState
 * @deprecated The `<Modal />` and the dispatch method of displaying modals has been deprecated in favor of local state and the `<Modal>` component from the component-library.
 * Please update your code to use the new `<Modal>` component instead, which can be found at ui/components/component-library/modal/modal.tsx.
 * You can find documentation for the new Modal component in the MetaMask Storybook:
 * {@link https://metamask.github.io/metamask-storybook/?path=/docs/components-componentlibrary-modal--docs}
 * If you would like to help with the replacement of the old Modal component, please submit a pull request
 */
export function Modal({ active, hideModal, modalState }: ModalProps) {
  const modalRef = useRef<FadeModalRef | null>(null);

  useEffect(() => {
    if (active) {
      modalRef.current?.show();
    } else {
      modalRef.current?.hide();
    }
  }, [active]);

  const modal = MODALS[modalState.name ?? 'DEFAULT'];
  const { contents: children, disableBackdropClick = false, testId } = modal;
  const modalStyle = {
    ...modal[isMobileView() ? 'mobileModalStyle' : 'laptopModalStyle'],
    backgroundColor: 'var(--color-background-elevated1)',
    border: '1px solid var(--color-border-alternative)',
  };
  const contentStyle = modal.contentStyle ?? {};

  return (
    <FadeModal
      keyboard={false}
      onHide={() => {
        if (modal.onHide) {
          modal.onHide();
        }
        hideModal(modal.customOnHideOpts);
      }}
      ref={modalRef}
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

export default connect(mapStateToProps, mapDispatchToProps)(Modal);
