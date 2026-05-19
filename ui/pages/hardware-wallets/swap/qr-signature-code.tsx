import React, { useEffect, useMemo, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UR, UREncoder } from '@ngraveio/bc-ur';
import {
  Box,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

import type { QrHardwareSignRequest } from './types';

const QR_FRAGMENT_SIZE = 200;
const QR_REFRESH_RATE = 200;
const QR_CODE_SIZE = 240;

const QrSignatureCode = ({
  payload,
}: {
  payload: QrHardwareSignRequest['request']['payload'];
}) => {
  const urEncoder = useMemo(
    () =>
      new UREncoder(
        new UR(Buffer.from(payload.cbor, 'hex'), payload.type),
        QR_FRAGMENT_SIZE,
      ),
    [payload.cbor, payload.type],
  );
  const [currentQrCode, setCurrentQrCode] = useState(() =>
    urEncoder.nextPart(),
  );

  useEffect(() => {
    setCurrentQrCode(urEncoder.nextPart());
    const intervalId = setInterval(() => {
      setCurrentQrCode(urEncoder.nextPart());
    }, QR_REFRESH_RATE);

    return () => clearInterval(intervalId);
  }, [urEncoder]);

  return (
    <Box
      className="hardware-wallet-signatures__qr-code"
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      marginTop={4}
      style={{ width: QR_CODE_SIZE, height: QR_CODE_SIZE }}
    >
      <QRCodeSVG value={currentQrCode.toUpperCase()} size={QR_CODE_SIZE} />
    </Box>
  );
};

export default QrSignatureCode;
