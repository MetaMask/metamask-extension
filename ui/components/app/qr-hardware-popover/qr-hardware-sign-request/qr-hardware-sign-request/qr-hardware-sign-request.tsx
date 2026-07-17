import React, { useCallback, useState, useEffect } from 'react';
import type { SerializedUR } from '@metamask/eth-qr-keyring';
import { completeQrCodeScan } from '../../../../../store/actions';
import QrPlayer from '../qr-player';
import QrReader from '../qr-reader';
import { useDispatch } from '../../../../../store/hooks';

import {
  FlowStatus,
  type FlowStatusValue,
  type QRHardwareSignRequestProps,
} from './qr-hardware-sign-request.types';

/**
 * Orchestrates the two-phase QR signing flow.
 *
 * In the "play" phase, an animated QR code is displayed via QrPlayer so the
 * user can scan the unsigned transaction with their hardware wallet. In the
 * "read" phase, the camera scanner (QrReader) lets the user scan the signed
 * response back. Resets to "play" when the request ID changes.
 *
 * @param props - Component props.
 * @param props.request - The pending QR signing request.
 * @param props.handleCancel - Called when the user cancels.
 * @param props.setErrorTitle - Sets the popover error heading.
 * @param props.setErrorActive - Signals the parent that the scanner is showing error content.
 */
const QRHardwareSignRequest = ({
  request,
  handleCancel,
  setErrorTitle,
  setErrorActive,
}: QRHardwareSignRequestProps) => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState<FlowStatusValue>(FlowStatus.Play);

  useEffect(() => {
    setStatus(FlowStatus.Play);
  }, [request.requestId]);

  const toRead = useCallback(() => setStatus(FlowStatus.Read), []);

  const handleSuccess = useCallback(
    async (response: SerializedUR) => {
      return dispatch(completeQrCodeScan(response));
    },
    [dispatch],
  );

  if (status === FlowStatus.Play) {
    return (
      <QrPlayer
        type={request.payload.type}
        cbor={request.payload.cbor}
        cancelQRHardwareSignRequest={handleCancel}
        toRead={toRead}
      />
    );
  }

  return (
    <QrReader
      cancelQRHardwareSignRequest={handleCancel}
      submitQRHardwareSignature={handleSuccess}
      requestId={request.requestId}
      setErrorTitle={setErrorTitle}
      setErrorActive={setErrorActive}
    />
  );
};

export default QRHardwareSignRequest;
