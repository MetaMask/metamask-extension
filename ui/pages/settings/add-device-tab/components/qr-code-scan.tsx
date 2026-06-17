import React from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  Button,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
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
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        marginTop={4}
      >
        <QRCodeImage data="metamask-device-sync" />
      </Box>
      <Button
        className="w-full"
        onClick={() =>
          onScanSuccess(AddDeviceSettingsStep.EnterVerificationCode)
        }
      >
        {t('continue')} (remove later)
      </Button>
    </Box>
  );
};

export default QrCodeScan;
