import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { QRCodeImage } from '../../../../components/app/deeplink-qr-code/deeplink-qr-code';
import { submitRequestToBackground } from '../../../../store/background-connection';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';
import { QR_SYNC_TIMEOUT_MS } from '../../../../../shared/constants/qr-sync';

const MWP_SESSION_REQUEST_EXPIRY_SECONDS =
  QR_SYNC_TIMEOUT_MS.MWP_SESSION_TIMEOUT / 1000;

const QrCodeScan = () => {
  const t = useI18nContext();
  const qrPayload = useSelector(selectQrSyncQrPayload);
  const lastQrPayloadRef = useRef<string | null>(null);
  if (qrPayload) {
    lastQrPayloadRef.current = qrPayload;
  }
  const displayedPayload = qrPayload ?? lastQrPayloadRef.current;
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
      >
        <Box
          style={{
            opacity: shouldDimQr ? 0.3 : 1,
            filter: shouldDimQr ? 'blur(4px)' : 'none',
          }}
        >
          {displayedPayload ? (
            <QRCodeImage data={displayedPayload} />
          ) : (
            <Skeleton width={240} height={240} />
          )}
        </Box>
        {statusContent}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
