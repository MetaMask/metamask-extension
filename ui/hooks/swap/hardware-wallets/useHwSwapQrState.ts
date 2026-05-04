import { useCallback, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { providerErrors, serializeError } from '@metamask/rpc-errors';

import { HardwareKeyringType } from '../../../../shared/constants/hardware-wallets';
import {
  isHardwareWallet,
  getHardwareWalletType,
} from '../../../selectors/selectors';
import { getActiveQrCodeScanRequest } from '../../../selectors';
import {
  cancelQrCodeScan,
  cancelTx,
  completeQrCodeScan,
  rejectPendingApproval,
} from '../../../store/actions';
import type { MetaMaskReduxDispatch } from '../../../store/store';
import { HardwareWalletSignatureStatus } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import type { HardwareWalletSignaturesState } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures-state-machine';
import { isQrHardwareSignRequest } from '../../../pages/bridge/hardware-wallet-signatures/hardware-wallet-signatures.utils';
import type {
  BridgeStatusState,
  QrHardwareSignRequest,
} from '../../../pages/bridge/hardware-wallet-signatures/types';

type UseHardwareWalletQrStateOptions = {
  signatureState: HardwareWalletSignaturesState;
  confirmationTxData: ({ id?: string } & Record<string, unknown>) | undefined;
};

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
