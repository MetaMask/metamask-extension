import { useCallback, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';

import { HardwareKeyringType } from '../../../shared/constants/hardware-wallets';
import { getHardwareWalletType } from '../../../shared/lib/selectors/keyring';
import { getActiveQrCodeScanRequest } from '../../selectors';
import {
  cancelQrCodeScan,
  cancelTx,
  completeQrCodeScan,
  rejectPendingApproval,
} from '../../store/actions';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { HardwareWalletSignatureStatus } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures-state-machine';
import { isQrHardwareSignRequest } from '../../pages/hardware-wallets/swap/hardware-wallet-signatures.utils';

type UseHardwareWalletQrStateOptions = {
  signatureState: HardwareWalletSignaturesState;
  confirmationTxData: ({ id?: string } & Record<string, unknown>) | undefined;
  stepTrackingResetKey?: string | number;
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
 * @param options.stepTrackingResetKey - Changes when a new signing attempt starts.
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
  stepTrackingResetKey,
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

  // Keep cancellation callbacks stable while still using the latest request data.
  const qrSignRequestRef = useRef(qrSignRequest);
  qrSignRequestRef.current = qrSignRequest;
  const confirmationTxDataRef = useRef(confirmationTxData);
  confirmationTxDataRef.current = confirmationTxData;

  const currentQrRequestId = qrSignRequest?.request.requestId;
  const firstStepRequestIdRef = useRef<string | undefined>(undefined);
  const stepTrackingResetKeyRef = useRef(stepTrackingResetKey);

  useEffect(() => {
    setIsReadingQrSignature(false);
  }, [currentQrRequestId]);

  if (stepTrackingResetKeyRef.current !== stepTrackingResetKey) {
    stepTrackingResetKeyRef.current = stepTrackingResetKey;
    firstStepRequestIdRef.current = undefined;
  }

  const isAwaitingSignature =
    signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature ||
    signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFinalSignature;

  if (!isAwaitingSignature) {
    firstStepRequestIdRef.current = undefined;
  }

  if (
    signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature &&
    currentQrRequestId &&
    !firstStepRequestIdRef.current
  ) {
    firstStepRequestIdRef.current = currentQrRequestId;
  }

  const isFinalStepRequest =
    Boolean(firstStepRequestIdRef.current) &&
    currentQrRequestId !== firstStepRequestIdRef.current;

  const showInlineQrSigning =
    Boolean(qrSignRequest) && isAwaitingSignature;

  const activeQrStep = (() => {
    if (!showInlineQrSigning) {
      return undefined;
    }

    if (isFinalStepRequest) {
      return HardwareWalletSignatureStatus.AwaitingFinalSignature;
    }

    return signatureState.status;
  })();

  const handleQrScanSuccess = useCallback(
    async (response: SerializedUR) => dispatch(completeQrCodeScan(response)),
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
