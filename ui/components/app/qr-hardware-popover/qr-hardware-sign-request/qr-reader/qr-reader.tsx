import React, { useCallback } from 'react';
import { ETHSignature } from '@keystonehq/bc-ur-registry-eth';
import * as uuid from 'uuid';
import type { UR } from '@ngraveio/bc-ur';
import BaseQrReader, {
  CBOR_ENCODING,
  SIGNING_EXPECTED_UR_TYPES,
} from '../../base-qr-reader';
import { QrMismatchedTransactionError } from '../../qr-utils/qr-utils';
import type { QrReaderProps } from './qr-reader.types';

/**
 * Camera-scanner component for the QR signing flow.
 *
 * Wraps BaseQrReader in signing mode and validates the scanned QR code by
 * decoding the ETH signature, verifying the request ID matches the pending
 * transaction, and dispatching the serialized response on success.
 *
 * @param props - Component props.
 * @param props.submitQRHardwareSignature - Callback for the serialized signature.
 * @param props.cancelQRHardwareSignRequest - Cancel callback.
 * @param props.requestId - Expected signing request ID.
 * @param props.setErrorTitle - Sets the popover error heading.
 * @param props.setErrorActive - Signals the parent that the scanner is showing error content.
 * @param props.setCameraPermissionDenied - Signals the parent that camera permission was denied.
 */
const QrReader = ({
  submitQRHardwareSignature,
  cancelQRHardwareSignRequest,
  requestId,
  setErrorTitle,
  setErrorActive,
  setCameraPermissionDenied,
}: QrReaderProps) => {
  const handleSuccess = useCallback(
    async (ur: UR) => {
      const ethSignature = ETHSignature.fromCBOR(ur.cbor);
      const buffer = ethSignature.getRequestId();
      const signId = uuid.stringify(buffer as Uint8Array);

      if (signId !== requestId) {
        throw new QrMismatchedTransactionError();
      }

      return await submitQRHardwareSignature({
        type: ur.type,
        cbor: ur.cbor.toString(CBOR_ENCODING),
      });
    },
    [submitQRHardwareSignature, requestId],
  );

  return (
    <BaseQrReader
      isReadingWallet={false}
      expectedUrTypes={SIGNING_EXPECTED_UR_TYPES}
      handleCancel={cancelQRHardwareSignRequest}
      handleSuccess={handleSuccess}
      setErrorTitle={setErrorTitle}
      setErrorActive={setErrorActive}
      setCameraPermissionDenied={setCameraPermissionDenied}
    />
  );
};

export default QrReader;
