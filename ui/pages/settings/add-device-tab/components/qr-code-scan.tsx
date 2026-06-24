import React, { useCallback, useEffect, useState } from 'react';
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
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AddDeviceSettingsStep } from '../constant';
import { QRCodeImage } from '../../../../components/app/deeplink-qr-code/deeplink-qr-code';

// TODO: source this from the controller
const QR_CODE_EXPIRY_SECONDS = 15;

type QrCodeScanProps = {
  onScanSuccess: (type: AddDeviceSettingsStep) => void;
};

const QrCodeScan = ({ onScanSuccess }: QrCodeScanProps) => {
  const t = useI18nContext();
  const [secondsLeft, setSecondsLeft] = useState(QR_CODE_EXPIRY_SECONDS);
  // TODO: source scan errors from the controller
  const [hasError, setHasError] = useState(false);
  const isExpired = secondsLeft <= 0;
  const shouldDimQr = isExpired || hasError;

  useEffect(() => {
    if (shouldDimQr) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [shouldDimQr]);

  const handleReset = useCallback(() => {
    // TODO: regenerate the QR code via the controller
    setHasError(false);
    setSecondsLeft(QR_CODE_EXPIRY_SECONDS);
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
  if (hasError) {
    statusContent = renderResetBlock(t('qrCodeScanError'));
  } else if (isExpired) {
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
        <Box style={{ opacity: shouldDimQr ? 0.3 : 1 }}>
          <QRCodeImage data="metamask-device-sync" />
        </Box>
        {statusContent}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
