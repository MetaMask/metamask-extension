import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';

import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import { getHardwareWalletType } from '../../../selectors/selectors';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import {
  cancelQrCodeScan,
  cancelTx,
  completeQrCodeScan,
  rejectPendingApproval,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures-state-machine';
import { isQrHardwareSignRequest } from '../../../pages/bridge/hardware-wallets/hardware-wallet-signatures.utils';

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

  const currentQrRequestId = qrSignRequest?.request.requestId;

  useEffect(() => {
    setIsReadingQrSignature(false);
  }, [currentQrRequestId]);

  const showInlineQrSigning =
    Boolean(qrSignRequest) &&
    (signatureState.status ===
      HardwareWalletSignatureStatus.AwaitingFirstSignature ||
      signatureState.status ===
        HardwareWalletSignatureStatus.AwaitingFinalSignature);

  const activeQrStep =
    showInlineQrSigning && !isReadingQrSignature
      ? signatureState.status
      : undefined;

  const handleQrScanSuccess = useCallback(
    (response: SerializedUR) => dispatch(completeQrCodeScan(response)),
    [dispatch],
  );

  const handleQrSignatureCancel = useCallback(() => {
    if (confirmationTxData?.id) {
      dispatch(
        rejectPendingApproval(
          confirmationTxData.id,
          serializeError(providerErrors.userRejectedRequest()),
        ),
      );
      dispatch(cancelTx(confirmationTxData as Parameters<typeof cancelTx>[0]));
    }

    if (qrSignRequest) {
      dispatch(cancelQrCodeScan());
    }
  }, [dispatch, qrSignRequest, confirmationTxData]);

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
