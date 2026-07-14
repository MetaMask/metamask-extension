import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import qrCode from 'qrcode-generator';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
  TextButton,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Skeleton } from '../../../../components/component-library/skeleton';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';

const MWP_SESSION_REQUEST_EXPIRY_SECONDS =
  QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT / 1000;

/** Minimal type for qrcode-generator instance (no @types package) */
type QRCodeInstance = {
  addData: (data: string) => void;
  make: () => void;
  createDataURL: (cellSize?: number, margin?: number) => string;
};

const QR_CODE_CELL_SIZE = 5;
const QR_CODE_MARGIN = 16;
const QR_CODE_SIZE = 340;

const QrCodeScan = () => {
  const t = useI18nContext();
  const qrPayload = useSelector(selectQrSyncQrPayload);
  const lastQrPayloadRef = useRef<string | null>(null);
  if (qrPayload) {
    lastQrPayloadRef.current = qrPayload;
  }
  const displayedPayload = qrPayload ?? lastQrPayloadRef.current;
  const qrDataUrl = useMemo(() => {
    if (!displayedPayload) {
      return null;
    }
    const qrImage = qrCode(0, 'M') as QRCodeInstance;
    qrImage.addData(displayedPayload);
    qrImage.make();
    return qrImage.createDataURL(QR_CODE_CELL_SIZE, QR_CODE_MARGIN);
  }, [displayedPayload]);
  const [secondsLeft, setSecondsLeft] = useState(
    MWP_SESSION_REQUEST_EXPIRY_SECONDS,
  );
  const isExpired = secondsLeft <= 0;
  const shouldDimQr = isExpired;

  useEffect(() => {
    if (shouldDimQr) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [shouldDimQr]);

  const handleReset = useCallback(async () => {
    setSecondsLeft(MWP_SESSION_REQUEST_EXPIRY_SECONDS);
    await submitRequestToBackground<void>('messengerCall', [
      'QrSyncController:createSession',
      [],
    ]).catch(() => undefined);
  }, []);

  const renderResetBlock = (message: string) => (
    <Box
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      gap={1}
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.ErrorDefault}>
        {message}
      </Text>
      <TextButton onClick={handleReset}>{t('generateNewQrCode')}</TextButton>
    </Box>
  );

  let statusContent;
  if (isExpired) {
    statusContent = renderResetBlock(t('qrCodeExpired'));
  } else {
    statusContent = (
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('qrCodeExpiresIn', [secondsLeft])}
      </Text>
    );
  }

  return (
    <Box flexDirection={BoxFlexDirection.Column} gap={4} className="flex-1">
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('scanQrCode')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('scan_qr_code_desc')}
      </Text>
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        marginTop={4}
        gap={4}
      >
        <Box
          className="relative inline-flex"
          justifyContent={BoxJustifyContent.Center}
          alignItems={BoxAlignItems.Center}
          style={{
            opacity: shouldDimQr ? 0.3 : 1,
            filter: shouldDimQr ? 'blur(4px)' : 'none',
          }}
        >
          {qrDataUrl ? (
            <>
              <img
                data-testid="qr-code-image"
                src={qrDataUrl}
                alt={t('scanQrCode')}
                width={QR_CODE_SIZE}
                height={QR_CODE_SIZE}
                className="rounded-2xl"
              />
              <Box
                // Background must remain white regardless of theme
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg flex overflow-hidden"
                justifyContent={BoxJustifyContent.Center}
                alignItems={BoxAlignItems.Center}
                style={{ height: 40, width: 45 }}
              >
                <img
                  src="images/logo/metamask-fox.svg"
                  alt="Logo"
                  width={35}
                  height={35}
                />
              </Box>
            </>
          ) : (
            <Skeleton width={QR_CODE_SIZE} height={QR_CODE_SIZE} />
          )}
        </Box>
        {statusContent}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
