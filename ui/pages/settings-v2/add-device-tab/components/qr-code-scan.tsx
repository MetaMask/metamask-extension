import React, { useEffect } from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { AddDeviceSettingsStep } from '../constant';
import QrCodeView from '../../../../components/ui/qr-code-view';

type QrCodeScanProps = {
  onScanSuccess: (type: AddDeviceSettingsStep) => void;
};

const QrCodeScan = ({ onScanSuccess }: QrCodeScanProps) => {
  const t = useI18nContext();

  useEffect(() => {
    setTimeout(() => {
      onScanSuccess(AddDeviceSettingsStep.EnterVerificationCode);
    }, 2000);
  }, [onScanSuccess]);

  return (
    <Box className="p-4 flex flex-1 flex-col gap-4">
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.TextDefault}
        fontWeight={FontWeight.Bold}
      >
        {t('scan_qr_code')}
      </Text>
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('scan_qr_code_desc')}
      </Text>
      <Box className="flex items-center justify-center flex-row mt-4">
        <QrCodeView Qr={{ data: 'metamask-device-sync' }} />
      </Box>
    </Box>
  );
};

export default QrCodeScan;
