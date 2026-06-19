import React from 'react';
import {
  Box,
  Text,
  FontWeight,
  TextColor,
  TextVariant,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useSelector } from 'react-redux';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Skeleton } from '../../../../components/component-library/skeleton';
import { QRCodeImage } from '../../../../components/app/deeplink-qr-code/deeplink-qr-code';
import { selectQrSyncQrPayload } from '../../../../selectors/qr-sync/qr-sync';

const QrCodeScan = () => {
  const t = useI18nContext();
  const qrPayload = useSelector(selectQrSyncQrPayload);

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
        {qrPayload ? (
          <QRCodeImage data={qrPayload} />
        ) : (
          <Skeleton width={240} height={240} />
        )}
      </Box>
    </Box>
  );
};

export default QrCodeScan;
