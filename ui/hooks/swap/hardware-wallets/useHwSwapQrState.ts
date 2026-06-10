import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';

import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import { getHardwareWalletType } from '../../../../shared/lib/selectors/keyring';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import {
  cancelQrCodeScan,
  cancelTx,
  completeQrCodeScan,
  rejectPendingApproval,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { HardwareWalletSignatureStatus } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { isQrHardwareSignRequest } from '../../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils';

type UseHardwareWalletQrStateOptions = {
  signatureState: HardwareWalletSignaturesState;
  confirmationTxData: ({ id?: string } & Record<string, unknown>) | undefined;
};

/**
 * Manages QR hardware wallet signing state during a swap/bridge flow.
 *
 * Determines whether the active hardware wallet is a QR-based device and, if so, surfaces the
 * current QR sign request for inline signing. Provides handlers for successful QR scans and
 * for cancelling an in-progress QR signature (which also rejects the associated pending
 * approval and cancels the transaction).
 *
 * @param options - Configuration for the QR state hook.
 * @param options.signatureState - The current hardware-wallet signature state-machine state.
 * @param options.confirmationTxData - The current confirmation transaction data (used for cancellation).
 * @returns An object containing:
 * - `isReadingQrSignature` — whether the user is currently scanning a QR signature.
 * - `setIsReadingQrSignature` — setter for the reading state.
 * - `isQrHardwareWallet` — whether the active wallet is QR-based.
 * - `qrSignRequest` — the active QR sign request, if applicable.
 * - `showInlineQrSigning` — whether the inline QR signing UI should be displayed.
 * - `activeQrStep` — the signature state step to show in the QR UI, or `undefined`.
 * - `handleQrScanSuccess` — callback to invoke when a QR scan completes successfully.
 * - `handleQrSignatureCancel` — callback to cancel the current QR signature request.
 */
export function useHwSwapQrState({
  signatureState,
  confirmationTxData,
}: UseHardwareWalletQrStateOptions) {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const hardwareWalletType = useSelector(getHardwareWalletType);
  const activeQrCodeScanRequest = useSelector(getActiveQrCodeScanRequest);

  const [isReadingQrSignature, setIsReadingQrSignature] = useState(false);

  const isQrHardwareWallet =
    hardwareWalletType === HardwareKeyringType.qr ||
    isQrHardwareSignRequest(activeQrCodeScanRequest);

  const qrSignRequest =
    isQrHardwareWallet && isQrHardwareSignRequest(activeQrCodeScanRequest)
      ? activeQrCodeScanRequest
      : undefined;

  // Use refs so the cancel callback doesn't recreate on every render due to
  // non-memoized objects changing identity.
  const qrSignRequestRef = useRef(qrSignRequest);
  qrSignRequestRef.current = qrSignRequest;
  const confirmationTxDataRef = useRef(confirmationTxData);
  confirmationTxDataRef.current = confirmationTxData;

  const currentQrRequestId = qrSignRequest?.request.requestId;

  const firstStepRequestIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setIsReadingQrSignature(false);
  }, [currentQrRequestId]);

  if (
    signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature &&
    currentQrRequestId &&
    !firstStepRequestIdRef.current
  ) {
    firstStepRequestIdRef.current = currentQrRequestId;
  }

  const isStep2Request =
    Boolean(firstStepRequestIdRef.current) &&
    currentQrRequestId !== firstStepRequestIdRef.current;

  const showInlineQrSigning =
    Boolean(qrSignRequest) &&
    (signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature ||
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature);

  const activeQrStep = (() => {
    if (!showInlineQrSigning) {
      return undefined;
    }

    if (isStep2Request) {
      return HardwareWalletSignatureStatus.AwaitingFinalSignature;
    }

    if (
      firstStepRequestIdRef.current &&
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature
    ) {
      return undefined;
    }

    return signatureState.status;
  })();

  const handleQrScanSuccess = useCallback(
    (response: SerializedUR) => dispatch(completeQrCodeScan(response)),
    [dispatch],
  );

  const handleQrSignatureCancel = useCallback(() => {
    const currentConfirmationTxData = confirmationTxDataRef.current;

    if (currentConfirmationTxData?.id) {
      dispatch(
        rejectPendingApproval(
          currentConfirmationTxData.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
      dispatch(
        cancelTx(currentConfirmationTxData as Parameters<typeof cancelTx>[0]),
      );
    }

    if (qrSignRequestRef.current) {
      dispatch(cancelQrCodeScan());
    }
  }, [dispatch]);

  return {
    isReadingQrSignature,
    setIsReadingQrSignature,
    isQrHardwareWallet,
    qrSignRequest,
    showInlineQrSigning,
    activeQrStep,
    handleQrScanSuccess,
    handleQrSignatureCancel,
  };
}
