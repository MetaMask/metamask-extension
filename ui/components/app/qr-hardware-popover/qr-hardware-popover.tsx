import React, { useCallback, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { providerErrors, serializeError } from '@metamask/rpc-errors';
import { QrScanRequestType } from '@metamask/eth-qr-keyring';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import { AlignItems } from '../../../helpers/constants/design-system';
import {
  cancelTx,
  rejectPendingApproval,
  cancelQrCodeScan,
} from '../../../store/actions';
import { getEnvironmentType } from '../../../../shared/lib/environment-type';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../shared/constants/app';
import {
  CROSS_CHAIN_SWAP_ROUTE,
  HARDWARE_WALLET_SIGNATURES_ROUTE,
} from '../../../helpers/constants/routes';
import { useDispatch } from '../../../store/hooks';
import type { ConfirmTransactionSlice } from './qr-hardware-popover.types';
import QRHardwareWalletImporter from './qr-hardware-wallet-importer';
import QRHardwareSignRequest from './qr-hardware-sign-request';

// Keeps the ModalHeader children slot rendered so the close button stays on the right.
const EMPTY_HEADER_PLACEHOLDER = '\u00A0';

/**
 * Top-level popover that hosts QR-based hardware wallet flows.
 *
 * Renders one of two child components depending on the active scan request:
 * - PAIR: QRHardwareWalletImporter (camera scanner for wallet import)
 * - SIGN: QRHardwareSignRequest (animated QR display then camera scanner)
 *
 * In restricted environments (popup, side panel), PAIR requests are suppressed
 * because they are always handled in a fullscreen tab.
 */
const QRHardwarePopover = () => {
  const t = useI18nContext();
  const activeScanRequest = useSelector(getActiveQrCodeScanRequest);
  const { pathname } = useLocation();
  const isBridgeHardwareWalletSigningPage =
    pathname === `${CROSS_CHAIN_SWAP_ROUTE}${HARDWARE_WALLET_SIGNATURES_ROUTE}`;

  const environmentType = getEnvironmentType();
  const isRestrictedEnv =
    environmentType === ENVIRONMENT_TYPE_POPUP ||
    environmentType === ENVIRONMENT_TYPE_SIDEPANEL;
  const [errorTitle, setErrorTitle] = useState('');
  const [errorActive, setErrorActive] = useState(false);

  const { txData } = useSelector(
    (state: { confirmTransaction: ConfirmTransactionSlice }) => {
      return state.confirmTransaction;
    },
  );

  // The confirmTransaction lifecycle is not consistent with QR hardware wallet;
  // confirmTransaction changes after the previous tx is confirmed or cancelled.
  // Snapshot txData when requestId changes so the cancel callback always
  // references the correct transaction for the active signing flow.
  const txDataRef = useRef(txData);
  const prevRequestIdRef = useRef(activeScanRequest?.requestId);

  if (prevRequestIdRef.current !== activeScanRequest?.requestId) {
    prevRequestIdRef.current = activeScanRequest?.requestId;
    txDataRef.current = txData;
  }

  const dispatch = useDispatch();
  const walletImporterCancel = useCallback(
    () => dispatch(cancelQrCodeScan()),
    [dispatch],
  );

  const signRequestCancel = useCallback(() => {
    // txData may not be populated yet if the user cancels before Redux
    // finishes loading the pending transaction.
    if (txDataRef.current) {
      dispatch(
        rejectPendingApproval(
          txDataRef.current.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
      dispatch(cancelTx(txDataRef.current));
    }
    dispatch(cancelQrCodeScan());
  }, [dispatch]);

  // Error-specific title takes priority. When the child is showing error
  // content (errorActive) without a specific title, suppress the flow heading
  // so it does not overlap the error UI. Otherwise show a flow-specific heading.
  const getTitle = (): string => {
    if (errorTitle) {
      return errorTitle;
    }
    if (errorActive) {
      return '';
    }
    if (activeScanRequest?.type === QrScanRequestType.SIGN) {
      return t('QRHardwareSignRequestTitle') as string;
    }
    if (activeScanRequest?.type === QrScanRequestType.PAIR) {
      return t('QRHardwareWalletImporterTitle') as string;
    }
    return '';
  };
  const title = getTitle();

  // PAIR requests are always handled in a fullscreen tab opened by the
  // add-wallet-modal. Rendering in sidepanel/popup would cause BaseQrReader's
  // checkEnvironment() to open a duplicate fullscreen tab, stealing focus
  // from the tab that shows the "Select an account" list after scanning.
  if (isRestrictedEnv && activeScanRequest?.type === QrScanRequestType.PAIR) {
    return null;
  }

  if (
    isBridgeHardwareWalletSigningPage &&
    activeScanRequest?.type === QrScanRequestType.SIGN
  ) {
    return null;
  }

  if (!activeScanRequest) {
    return null;
  }

  const onClose =
    activeScanRequest.type === QrScanRequestType.PAIR
      ? walletImporterCancel
      : signRequestCancel;

  return (
    <Modal isOpen onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        alignItems={AlignItems.center}
        paddingTop={0}
        paddingBottom={0}
        modalDialogProps={{
          paddingBottom: 0,
          style: { maxHeight: '94vh', overflowY: 'auto' },
        }}
      >
        <ModalHeader onClose={onClose}>
          {title || EMPTY_HEADER_PLACEHOLDER}
        </ModalHeader>
        {activeScanRequest.type === QrScanRequestType.PAIR && (
          <QRHardwareWalletImporter
            handleCancel={walletImporterCancel}
            setErrorTitle={setErrorTitle}
            setErrorActive={setErrorActive}
          />
        )}
        {activeScanRequest.type === QrScanRequestType.SIGN && (
          <QRHardwareSignRequest
            setErrorTitle={setErrorTitle}
            setErrorActive={setErrorActive}
            handleCancel={signRequestCancel}
            request={activeScanRequest.request}
          />
        )}
      </ModalContent>
    </Modal>
  );
};

export default QRHardwarePopover;
