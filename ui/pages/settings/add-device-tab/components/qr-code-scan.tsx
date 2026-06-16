import React, { useEffect } from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  Button,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AddDeviceSettingsStep } from '../constant';
import { QRCodeImage } from '../../../../components/app/deeplink-qr-code/deeplink-qr-code';

type QrCodeScanProps = {
  onScanSuccess: (type: AddDeviceSettingsStep) => void;
};

const QrCodeScan = ({ onScanSuccess }: QrCodeScanProps) => {
  const t = useI18nContext();

  return (
    <Box className="flex flex-1 flex-col gap-4">
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
      <Box className="flex items-center justify-center flex-row mt-4">
        <QRCodeImage data="metamask-device-sync" />
      </Box>
      <Button
        className="w-full"
        onClick={() =>
          onScanSuccess(AddDeviceSettingsStep.EnterVerificationCode)
        }
      >
        {t('continue')}
      </Button>
    </Box>
  );
};

export default QrCodeScan;
