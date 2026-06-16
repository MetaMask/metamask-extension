import React from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  Button,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Skeleton } from '../../../../components/component-library/skeleton';
import { AddDeviceSettingsStep } from '../constant';
import { QRCodeImage } from '../../../../components/app/deeplink-qr-code/deeplink-qr-code';

type QrCodeScanProps = {
  onScanSuccess: (type: AddDeviceSettingsStep) => void;
};

type QrSyncState = {
  metamask: {
    qrPayload?: string | null;
  };
};

const QrCodeScan = ({ onScanSuccess }: QrCodeScanProps) => {
  const t = useI18nContext();
  const qrPayload = useSelector(
    (state: QrSyncState) => state.metamask.qrPayload ?? null,
  );

  return (
    <Box className="p-4 flex flex-1 flex-col gap-4">
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
        {qrPayload ? (
          <QRCodeImage data={qrPayload} />
        ) : (
          <Skeleton width={240} height={240} />
        )}
      </Box>
      <Button
        className="w-full"
        disabled={!qrPayload}
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
