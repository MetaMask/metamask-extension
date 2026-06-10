import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

import type { QrHardwareSignRequest } from '../types';

const QR_FRAGMENT_SIZE = 200;
const QR_REFRESH_RATE = 200;
const QR_CODE_SIZE = 240;
const QR_CODE_PADDING = 20;
const QR_CODE_CONTAINER_SIZE = QR_CODE_SIZE + QR_CODE_PADDING * 2;

/**
 * Renders an animated QR code for QR hardware wallet signing. Displays a
 * rotating sequence of UR-encoded fragments that the hardware device scans
 * to complete the signature.
 *
 * @param props - Component props.
 * @param props.payload - The UR payload containing the CBOR-encoded signing data.
 */
const QrSignatureCode = ({
  payload,
}: {
  payload: QrHardwareSignRequest['request']['payload'];
}) => {
  const { initialQrCode, urEncoder } = useMemo(() => {
    const encoder = new UREncoder(
      new UR(Buffer.from(payload.cbor, 'hex'), payload.type),
      QR_FRAGMENT_SIZE,
    );

    return {
      initialQrCode: encoder.nextPart(),
      urEncoder: encoder,
    };
  }, [payload.cbor, payload.type]);
  const [qrCodeState, setQrCodeState] = useState(() => ({
    currentQrCode: initialQrCode,
    urEncoder,
  }));
  // Payload changes create a new encoder before effects run, so render its
  // first fragment immediately instead of showing a stale QR code.
  const currentQrCode =
    qrCodeState.urEncoder === urEncoder
      ? qrCodeState.currentQrCode
      : initialQrCode;

  useEffect(() => {
    setQrCodeState({
      currentQrCode: initialQrCode,
      urEncoder,
    });
    const intervalId = setInterval(() => {
      setQrCodeState({
        currentQrCode: urEncoder.nextPart(),
        urEncoder,
      });
    }, QR_REFRESH_RATE);

    return () => clearInterval(intervalId);
  }, [initialQrCode, urEncoder]);

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      marginTop={4}
      style={{
        width: QR_CODE_CONTAINER_SIZE,
        height: QR_CODE_CONTAINER_SIZE,
        padding: QR_CODE_PADDING,
        boxSizing: 'border-box',
        backgroundColor: 'var(--qr-code-white-background)',
      }}
    >
      <QRCodeSVG value={currentQrCode.toUpperCase()} size={QR_CODE_SIZE} />
    </Box>
  );
};

export default QrSignatureCode;
